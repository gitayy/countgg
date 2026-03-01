import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import type { KeyboardEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { normalizeMacroTriggerKey } from '../utils/macroRuntime'
import {
  createMacroPreset,
  enqueueMacroPresetUpdate,
  getMacroPreset,
  getMacroPresetVersion,
  getMacroPresetVersions,
  listMacroPresets,
  updateMacroPreset,
} from '../utils/api'
import {
  MacroActionType,
  MacroComboId,
  MacroEntryDraft,
  MacroEntryPayload,
  MacroEntryType,
  MacroPreset,
  MacroPresetVersion,
} from '../utils/types'

type Props = {
  refreshMacroPresets: () => Promise<void>
  forcedMode?: 'create' | 'edit'
  initialSelectedPresetId?: number | null
  hidePresetSelector?: boolean
  draftSeed?: {
    token: number
    name: string
    handle?: string
    description: string
    entries: MacroEntryDraft[]
  } | null
}

const ACTION_OPTIONS: MacroActionType[] = [
  'BACKSPACE',
  'DELETE',
  'CTRL_BACKSPACE',
  'LEFT',
  'RIGHT',
  'UP',
  'DOWN',
  'HOME',
  'END',
  'SELECT_ALL',
  'COPY',
  'PASTE',
]

const COMBO_OPTIONS: MacroComboId[] = [
  'SELECT_ALL_COPY',
  'SELECT_ALL_PASTE',
]

const MACRO_TYPE_OPTIONS: MacroEntryType[] = [
  'CHAR_INSERT',
  'ACTION',
  'SUBMIT',
  'SUBMIT_ACTION',
  'TOGGLE',
  'COMBO',
]

const MACRO_TYPE_LABEL: Record<MacroEntryType, string> = {
  CHAR_INSERT: 'Character Remap',
  ACTION: 'Action',
  SUBMIT: 'Submit',
  SUBMIT_ACTION: 'Submit + Action',
  TOGGLE: 'Toggle',
  COMBO: 'Combo',
}

const ACTION_LABEL: Record<MacroActionType, string> = {
  BACKSPACE: 'Backspace',
  DELETE: 'Delete',
  CTRL_BACKSPACE: 'Ctrl+Backspace',
  LEFT: 'Left',
  RIGHT: 'Right',
  UP: 'Up',
  DOWN: 'Down',
  HOME: 'Home',
  END: 'End',
  SELECT_ALL: 'Select All',
  COPY: 'Copy',
  PASTE: 'Paste',
}

const COMBO_LABEL: Record<MacroComboId, string> = {
  SELECT_ALL_COPY: 'Select All + Copy',
  SELECT_ALL_PASTE: 'Select All + Paste',
}

type DraftValidationResult = {
  rowErrors: Record<number, string[]>
  globalErrors: string[]
}

const MAX_ENTRIES = 100
const MAX_REPEAT = 10
const MAX_TRIGGERS_PER_CHAR = 2
const MAX_SUBMIT_MACROS = 2
const HANDLE_REGEX = /^[a-z][a-z0-9_-]{2,63}$/

const DEFAULT_ENTRY_BY_TYPE = (macroType: MacroEntryType): MacroEntryDraft => {
  switch (macroType) {
    case 'CHAR_INSERT':
      return { triggerKey: '', macroType, payloadJson: { char: '1' } }
    case 'ACTION':
      return { triggerKey: '', macroType, payloadJson: { action: 'BACKSPACE' } }
    case 'SUBMIT':
      return { triggerKey: '', macroType, payloadJson: {} }
    case 'SUBMIT_ACTION':
      return {
        triggerKey: '',
        macroType,
        payloadJson: { action: 'BACKSPACE', repeat: 1 },
      }
    case 'TOGGLE':
      return { triggerKey: '', macroType, payloadJson: {} }
    case 'COMBO':
      return { triggerKey: '', macroType, payloadJson: { comboId: 'SELECT_ALL_PASTE' } }
  }
}

const toDraftEntries = (version: MacroPresetVersion | null): MacroEntryDraft[] => {
  if (!version?.entries?.length) return []
  return version.entries.map((entry) => ({
    triggerKey: entry.triggerKey,
    macroType: entry.macroType,
    payloadJson: entry.payloadJson as MacroEntryPayload,
  }))
}

const validateEntries = (entries: MacroEntryDraft[]): DraftValidationResult => {
  const rowErrors: Record<number, string[]> = {}
  const globalErrors: string[] = []
  const seenTriggers = new Set<string>()
  const charCounts = new Map<string, number>()
  let submitCount = 0

  if (entries.length > MAX_ENTRIES) {
    globalErrors.push(`Too many entries (max ${MAX_ENTRIES}).`)
  }

  entries.forEach((entry, index) => {
    const errs: string[] = []
    const payload = (entry.payloadJson || {}) as Record<string, unknown>
    const trigger = (entry.triggerKey || '').trim()

    if (!trigger) {
      errs.push('Trigger is required.')
    } else {
      const normalized = trigger.toLowerCase()
      if (seenTriggers.has(normalized)) {
        errs.push('Trigger is duplicated.')
      }
      seenTriggers.add(normalized)
    }

    if (entry.macroType === 'CHAR_INSERT') {
      const c = typeof payload.char === 'string' ? payload.char : ''
      if (!/^\S$/u.test(c)) {
        errs.push('Character remap target must be one visible character.')
      } else {
        const next = (charCounts.get(c) || 0) + 1
        charCounts.set(c, next)
        if (next > MAX_TRIGGERS_PER_CHAR) {
          errs.push(`At most ${MAX_TRIGGERS_PER_CHAR} triggers can map to "${c}".`)
        }
      }
    }

    if (entry.macroType === 'ACTION' || entry.macroType === 'SUBMIT_ACTION') {
      if (!ACTION_OPTIONS.includes(payload.action as MacroActionType)) {
        errs.push('Action is invalid.')
      }
      const repeatValue =
        payload.repeat === undefined || payload.repeat === null
          ? 1
          : Number(payload.repeat)
      if (!Number.isInteger(repeatValue) || repeatValue < 1 || repeatValue > MAX_REPEAT) {
        errs.push(`Repeat must be an integer from 1 to ${MAX_REPEAT}.`)
      }
    }

    if (entry.macroType === 'SUBMIT' || entry.macroType === 'TOGGLE') {
      if (
        payload.action !== undefined ||
        payload.repeat !== undefined ||
        payload.submit !== undefined ||
        payload.comboId !== undefined ||
        payload.char !== undefined
      ) {
        errs.push(`${entry.macroType} cannot include payload fields.`)
      }
    }

    if (entry.macroType === 'COMBO') {
      if (!COMBO_OPTIONS.includes(payload.comboId as MacroComboId)) {
        errs.push('Combo is invalid.')
      }
    }

    if (entry.macroType === 'SUBMIT' || entry.macroType === 'SUBMIT_ACTION') {
      submitCount += 1
    }

    if (errs.length > 0) {
      rowErrors[index] = errs
    }
  })

  if (submitCount > MAX_SUBMIT_MACROS) {
    globalErrors.push(`At most ${MAX_SUBMIT_MACROS} submit-related macros are allowed.`)
  }

  return { rowErrors, globalErrors }
}

export const MacroPresetManager = ({
  refreshMacroPresets,
  forcedMode,
  initialSelectedPresetId,
  hidePresetSelector,
  draftSeed,
}: Props) => {
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null)
  const [versions, setVersions] = useState<MacroPresetVersion[]>([])
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null)
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetHandle, setNewPresetHandle] = useState('')
  const [newPresetDescription, setNewPresetDescription] = useState('')
  const [editPresetName, setEditPresetName] = useState('')
  const [editPresetDescription, setEditPresetDescription] = useState('')
  const [entries, setEntries] = useState<MacroEntryDraft[]>([])
  const [loadingVersion, setLoadingVersion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showValidationHints, setShowValidationHints] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [activeVersionNumber, setActiveVersionNumber] = useState<number | null>(null)
  const [showAdvancedEditOptions, setShowAdvancedEditOptions] = useState(false)
  const [ownedPresetSearch, setOwnedPresetSearch] = useState('')
  const [debouncedOwnedPresetSearch, setDebouncedOwnedPresetSearch] = useState('')
  const [ownedPresetOptions, setOwnedPresetOptions] = useState<MacroPreset[]>([])
  const [loadingOwnedPresetOptions, setLoadingOwnedPresetOptions] = useState(false)
  const title =
    mode === 'create' ? 'Create Macro Preset' : 'Edit Macro Preset'

  const selectedPreset = useMemo(
    () => ownedPresetOptions.find((preset) => preset.id === selectedPresetId),
    [ownedPresetOptions, selectedPresetId],
  )
  const validation = useMemo(() => validateEntries(entries), [entries])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedOwnedPresetSearch(ownedPresetSearch.trim())
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [ownedPresetSearch])

  useEffect(() => {
    if (mode !== 'edit' || hidePresetSelector) return
    let cancelled = false
    setLoadingOwnedPresetOptions(true)
    listMacroPresets(1, 100, debouncedOwnedPresetSearch || undefined, true)
      .then((res) => {
        if (cancelled) return
        setOwnedPresetOptions(res.data.items || [])
      })
      .catch(() => {
        if (cancelled) return
        setOwnedPresetOptions([])
      })
      .finally(() => {
        if (cancelled) return
        setLoadingOwnedPresetOptions(false)
      })
    return () => {
      cancelled = true
    }
  }, [mode, debouncedOwnedPresetSearch, hidePresetSelector])

  useEffect(() => {
    if (!selectedPresetId) return
    if (ownedPresetOptions.some((preset) => preset.id === selectedPresetId)) return
    getMacroPreset(selectedPresetId)
      .then((res) => {
        const preset = res.data?.preset
        if (!preset) return
        setOwnedPresetOptions((prev) =>
          prev.some((p) => p.id === preset.id) ? prev : [preset, ...prev],
        )
      })
      .catch(() => {})
  }, [selectedPresetId, ownedPresetOptions])

  useEffect(() => {
    if (!selectedPresetId || mode !== 'edit') {
      setEditPresetName('')
      setEditPresetDescription('')
      return
    }
    if (!selectedPreset) return
    setEditPresetName(selectedPreset.name || '')
    setEditPresetDescription(selectedPreset.description || '')
  }, [selectedPresetId, selectedPreset, mode])

  const loadPresetVersions = async (presetId: number): Promise<MacroPresetVersion[]> => {
    const versionsRes = await getMacroPresetVersions(presetId)
    return versionsRes.data || []
  }

  const loadVersion = async (presetId: number, versionNumber: number) => {
    setLoadingVersion(true)
    setError('')
    try {
      const fullVersionRes = await getMacroPresetVersion(presetId, versionNumber)
      setEntries(toDraftEntries(fullVersionRes.data))
      setSelectedVersionNumber(versionNumber)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load macro version')
      setEntries([])
      setSelectedVersionNumber(null)
    } finally {
      setLoadingVersion(false)
    }
  }

  const loadLatestVersion = async (presetId: number) => {
    setLoadingVersion(true)
    setError('')
    try {
      const fetchedVersions = await loadPresetVersions(presetId)
      setVersions(fetchedVersions)
      const latest = fetchedVersions[0]
      if (!latest) {
        setEntries([])
        setActiveVersionNumber(null)
        setSelectedVersionNumber(null)
        return
      }
      const fullVersionRes = await getMacroPresetVersion(presetId, latest.versionNumber)
      setEntries(toDraftEntries(fullVersionRes.data))
      setActiveVersionNumber(latest.versionNumber)
      setSelectedVersionNumber(latest.versionNumber)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load macro version')
      setEntries([])
      setActiveVersionNumber(null)
      setVersions([])
      setSelectedVersionNumber(null)
    } finally {
      setLoadingVersion(false)
    }
  }

  useEffect(() => {
    if (!selectedPresetId) return
    if (forcedMode !== 'create') {
      setMode('edit')
    }
    loadLatestVersion(selectedPresetId)
  }, [selectedPresetId, forcedMode])

  useEffect(() => {
    if (!selectedPresetId) {
      setShowAdvancedEditOptions(false)
    }
  }, [selectedPresetId])

  useEffect(() => {
    if (!draftSeed) return
    setMode('create')
    setSelectedPresetId(null)
    setVersions([])
    setSelectedVersionNumber(null)
    setActiveVersionNumber(null)
    setNewPresetName(draftSeed.name)
    setNewPresetHandle(draftSeed.handle || '')
    setNewPresetDescription(draftSeed.description)
    setEntries(draftSeed.entries)
    setSuccess('Draft loaded from copied preset.')
  }, [draftSeed?.token])

  useEffect(() => {
    if (!forcedMode) return
    setMode(forcedMode)
    if (forcedMode === 'create') {
      setSelectedPresetId(null)
    }
  }, [forcedMode])

  useEffect(() => {
    if (!initialSelectedPresetId || forcedMode !== 'edit') return
    setMode('edit')
    setSelectedPresetId(initialSelectedPresetId)
  }, [initialSelectedPresetId, forcedMode])

  const onCreatePreset = async () => {
    if (entries.length < 1) {
      setShowValidationHints(true)
      setError('At least one macro entry is required.')
      return
    }

    if (validation.globalErrors.length > 0 || Object.keys(validation.rowErrors).length > 0) {
      setShowValidationHints(true)
      setError('Please fix macro validation errors before creating the preset.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const created = await createMacroPreset(
        newPresetName.trim(),
        newPresetHandle.trim().toLowerCase(),
        newPresetDescription.trim(),
        'Initial version',
        entries,
      )
      await refreshMacroPresets()
      if (forcedMode !== 'create') {
        setSelectedPresetId(created.data.id)
        setMode('edit')
      } else {
        setSelectedPresetId(null)
      }
      setNewPresetName('')
      setNewPresetHandle('')
      setNewPresetDescription('')
      setEntries([])
      setActiveVersionNumber(1)
      setVersions([])
      setSelectedVersionNumber(1)
      setShowValidationHints(false)
      setSuccess('Preset created.')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create macro preset')
    } finally {
      setSaving(false)
    }
  }

  const onSaveVersion = async () => {
    if (!selectedPresetId) return
    if (entries.length < 1) {
      setShowValidationHints(true)
      setError('At least one macro entry is required.')
      return
    }
    if (validation.globalErrors.length > 0 || Object.keys(validation.rowErrors).length > 0) {
      setShowValidationHints(true)
      setError('Please fix macro validation errors before saving.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await enqueueMacroPresetUpdate(selectedPresetId, undefined, entries)
      await loadLatestVersion(selectedPresetId)
      setShowValidationHints(false)
      setSuccess('New version saved.')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save macro update')
    } finally {
      setSaving(false)
    }
  }

  const onSavePresetDetails = async () => {
    if (!selectedPresetId || !selectedPreset) return
    const nextName = editPresetName.trim()
    const nextDescription = editPresetDescription.trim()
    if (nextName.length < 3) {
      setError('Preset name must be at least 3 characters.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateMacroPreset(selectedPresetId, {
        name: nextName,
        description: nextDescription,
      })
      setOwnedPresetOptions((prev) =>
        prev.map((preset) =>
          preset.id === selectedPresetId
            ? { ...preset, name: nextName, description: nextDescription }
            : preset,
        ),
      )
      await refreshMacroPresets()
      setSuccess('Preset details updated.')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update preset details')
    } finally {
      setSaving(false)
    }
  }

  const addEntry = () => {
    setEntries((prev) => [...prev, DEFAULT_ENTRY_BY_TYPE('CHAR_INSERT')])
  }

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== index))
  }

  const updateEntryType = (index: number, macroType: MacroEntryType) => {
    setEntries((prev) =>
      prev.map((entry, idx) => (idx === index ? { ...DEFAULT_ENTRY_BY_TYPE(macroType), triggerKey: entry.triggerKey } : entry)),
    )
  }

  const updateEntry = (index: number, next: MacroEntryDraft) => {
    setEntries((prev) => prev.map((entry, idx) => (idx === index ? next : entry)))
  }

  const captureTriggerKey = (
    index: number,
    entry: MacroEntryDraft,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    const rawKey = String(event.key || '')
    const rawCode = String(event.code || '')
    const keyLower = rawKey.toLowerCase()
    const shouldPreferCode =
      keyLower === 'shift' ||
      keyLower === 'control' ||
      keyLower === 'alt' ||
      keyLower === 'meta' ||
      rawCode.toLowerCase().startsWith('numpad')
    const normalized = normalizeMacroTriggerKey(shouldPreferCode ? rawCode : rawKey)
    if (!normalized) return
    updateEntry(index, { ...entry, triggerKey: normalized.slice(0, 64) })
  }

  const createDisabledReason =
    saving
      ? 'Saving...'
      : newPresetName.trim().length < 3
        ? 'Preset name must be at least 3 characters.'
        : !HANDLE_REGEX.test(newPresetHandle.trim().toLowerCase())
          ? 'Handle must be 3-64 chars, start with a lowercase letter, and then use lowercase letters, numbers, underscores, or hyphens.'
          : showValidationHints
          ? validation.globalErrors[0] || Object.values(validation.rowErrors)[0]?.[0] || ''
          : ''

  const saveDisabledReason =
    saving || loadingVersion
      ? 'Saving...'
      : !selectedPresetId
        ? 'Select a preset first.'
        : showValidationHints
          ? validation.globalErrors[0] || Object.values(validation.rowErrors)[0]?.[0] || ''
          : ''

  const activeValidationReason =
    mode === 'create' ? createDisabledReason : saveDisabledReason

  const saveDetailsDisabledReason =
    saving
      ? 'Saving...'
      : !selectedPresetId || !selectedPreset
        ? 'Select a preset first.'
        : editPresetName.trim().length < 3
          ? 'Preset name must be at least 3 characters.'
          : editPresetName.trim() === (selectedPreset.name || '') &&
              editPresetDescription.trim() === (selectedPreset.description || '')
            ? 'No changes to save.'
            : ''

  return (
    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'background.paper' }}>
      <Typography variant="h6">{title}</Typography>

      {!forcedMode && (
        <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
          <Button
            size="small"
            variant={mode === 'create' ? 'contained' : 'outlined'}
            onClick={() => {
              setMode('create')
              setSelectedPresetId(null)
            }}
          >
            Create
          </Button>
          <Button
            size="small"
            variant={mode === 'edit' ? 'contained' : 'outlined'}
            onClick={() => setMode('edit')}
          >
            Edit
          </Button>
        </Stack>
      )}

      {error && (
        <Alert sx={{ mb: 2 }} severity="error">
          {error}
        </Alert>
      )}
      {showValidationHints &&
        activeValidationReason &&
        activeValidationReason !== 'Saving...' &&
        activeValidationReason !== error && (
          <Alert sx={{ mb: 2 }} severity="error">
            {activeValidationReason}
          </Alert>
        )}
      {success && (
        <Alert sx={{ mb: 2 }} severity="success">
          {success}
        </Alert>
      )}

      {mode === 'create' ? (
        <>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
            <TextField
              label="Display Name"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              inputProps={{ maxLength: 64 }}
              fullWidth
            />
            <TextField
              label="Handle (URL Name)"
              value={newPresetHandle}
              onChange={(e) => setNewPresetHandle(e.target.value.toLowerCase())}
              inputProps={{ maxLength: 64 }}
              helperText='Used in the URL: /macros/<handle>. Must start with a lowercase letter, then letters/numbers/_/-.'
              fullWidth
            />
            <TextField
              label="Description"
              value={newPresetDescription}
              onChange={(e) => setNewPresetDescription(e.target.value)}
              inputProps={{ maxLength: 280 }}
              fullWidth
            />
          </Stack>
        </>
      ) : (
        <>
          {!hidePresetSelector && (
            <>
              <Typography variant="subtitle1" sx={{ mb: 1.25 }}>
                Select Preset
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} sx={{ mb: 1.5 }}>
                <Box sx={{ minWidth: 320 }}>
                  <Autocomplete
                    options={ownedPresetOptions}
                    loading={loadingOwnedPresetOptions}
                    value={ownedPresetOptions.find((preset) => preset.id === selectedPresetId) || null}
                    getOptionLabel={(option) => option.name}
                    filterOptions={(options) => options}
                    onChange={(_, value) => {
                      setSelectedPresetId(value?.id ?? null)
                    }}
                    inputValue={ownedPresetSearch}
                    onInputChange={(_, value, reason) => {
                      if (reason === 'input' || reason === 'clear') {
                        setOwnedPresetSearch(value)
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Your Preset"
                        placeholder="Search your presets"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingOwnedPresetOptions ? (
                                <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>
                        <Box>
                          <Typography variant="body2">{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.handle ? `@${option.handle} - ` : ''}
                            {option.description || 'No description'}
                          </Typography>
                        </Box>
                      </li>
                    )}
                  />
                </Box>
                {!!selectedPresetId && (
                  <Button size="small" variant="text" onClick={() => setSelectedPresetId(null)}>
                    Clear
                  </Button>
                )}
                <Typography variant="body2" color="text.secondary">
                  {selectedPreset ? `Editing ${selectedPreset.name}` : 'No preset selected'}
                  {activeVersionNumber ? ` (latest v${activeVersionNumber})` : ''}
                </Typography>
              </Stack>
            </>
          )}

          {!!selectedPresetId && !!selectedPreset && (
            <Alert severity="info" sx={{ mb: 1.25 }}>
              Editing <strong>{selectedPreset.name}</strong>
              {selectedVersionNumber ? ` from v${selectedVersionNumber}` : ''}
              {activeVersionNumber ? ` (latest is v${activeVersionNumber})` : ''}.
            </Alert>
          )}

          {!!selectedPresetId && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
              <TextField
                label="Display Name"
                value={editPresetName}
                onChange={(e) => setEditPresetName(e.target.value)}
                inputProps={{ maxLength: 64 }}
                fullWidth
              />
              <TextField
                label="Description"
                value={editPresetDescription}
                onChange={(e) => setEditPresetDescription(e.target.value)}
                inputProps={{ maxLength: 280 }}
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={onSavePresetDetails}
                disabled={Boolean(saveDetailsDisabledReason)}
                sx={{ minWidth: 140, alignSelf: { xs: 'stretch', md: 'center' } }}
              >
                Save Details
              </Button>
            </Stack>
          )}

          {!!selectedPresetId && (
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => setShowAdvancedEditOptions((prev) => !prev)}
              >
                {showAdvancedEditOptions ? 'Hide Advanced' : 'Show Advanced'}
              </Button>
            </Stack>
          )}
          {!!selectedPresetId && showAdvancedEditOptions && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 260 }}>
                <InputLabel id="edit-version-label">Base Version</InputLabel>
                <Select
                  labelId="edit-version-label"
                  value={selectedVersionNumber ?? ''}
                  label="Base Version"
                  onChange={(e) => {
                    const next = Number((e.target as HTMLInputElement).value)
                    if (!Number.isFinite(next) || !selectedPresetId) return
                    loadVersion(selectedPresetId, next)
                  }}
                >
                  {versions.map((version) => (
                    <MenuItem key={version.id} value={version.versionNumber}>
                      v{version.versionNumber}
                      {activeVersionNumber === version.versionNumber ? ' (latest)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedVersionNumber !== activeVersionNumber && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => selectedPresetId && loadLatestVersion(selectedPresetId)}
                >
                  Use Latest
                </Button>
              )}
            </Stack>
          )}
        </>
      )}

      {(mode === 'create' || !!selectedPresetId) && (
        <>
          <Divider sx={{ my: 2 }} />

          <Stack spacing={1}>
            {showValidationHints && validation.globalErrors.length > 0 && (
              <Alert severity="error">
                {validation.globalErrors.map((msg, idx) => (
                  <Typography key={`macro-validation-global-${idx}`} variant="body2">
                    {msg}
                  </Typography>
                ))}
              </Alert>
            )}
            {entries.length === 0 && (
              <Box
                sx={{
                  p: 1.5,
                  border: '1px dashed',
                  borderColor: 'primary.main',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 1,
                  minHeight: 74,
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No mappings yet.
                </Typography>
                <Box
                  onClick={addEntry}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      addEntry()
                    }
                  }}
                  sx={{
                    width: '100%',
                    p: 1.25,
                    border: '1px dashed',
                    borderColor: 'primary.main',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'primary.main',
                    bgcolor: 'background.paper',
                    transition: 'background-color 120ms ease, border-color 120ms ease',
                    '&:hover': {
                      bgcolor: 'action.selected',
                      borderColor: 'primary.dark',
                    },
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: '2px',
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    + Add Mapping
                  </Typography>
                </Box>
              </Box>
            )}
            {entries.map((entry, index) => {
              const payload = entry.payloadJson as any
              return (
                <Box
                  key={`macro-entry-${index}`}
                  sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}
                >
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} flexWrap="wrap">
                    <IconButton color="error" size="small" onClick={() => removeEntry(index)}>
                      <DeleteIcon />
                    </IconButton>
                    <TextField
                      label="Key"
                      value={entry.triggerKey}
                      onKeyDown={(event) => captureTriggerKey(index, entry, event)}
                      onKeyUp={(event) => captureTriggerKey(index, entry, event)}
                      onChange={() => {}}
                      inputProps={{ maxLength: 64 }}
                      placeholder="Press a key..."
                      InputProps={{ readOnly: true }}
                      sx={{ width: 180 }}
                    />
                    <FormControl sx={{ minWidth: 220 }}>
                      <InputLabel id={`macro-type-${index}`}>Action Type</InputLabel>
                      <Select
                        labelId={`macro-type-${index}`}
                        value={entry.macroType}
                        label="Action Type"
                        onChange={(e) => updateEntryType(index, (e.target as HTMLInputElement).value as MacroEntryType)}
                      >
                        {MACRO_TYPE_OPTIONS.map((type) => (
                          <MenuItem key={type} value={type}>
                            {MACRO_TYPE_LABEL[type]}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {entry.macroType === 'CHAR_INSERT' && (
                      <TextField
                        label="Character"
                        value={payload.char || ''}
                        onChange={(e) =>
                          updateEntry(index, {
                            ...entry,
                            payloadJson: { char: e.target.value.slice(0, 1) },
                          })
                        }
                        sx={{ width: 96 }}
                      />
                    )}

                    {(entry.macroType === 'ACTION' ||
                      entry.macroType === 'SUBMIT_ACTION') && (
                      <FormControl sx={{ minWidth: 180 }}>
                        <InputLabel id={`macro-action-${index}`}>Action</InputLabel>
                        <Select
                          labelId={`macro-action-${index}`}
                          value={payload.action || 'BACKSPACE'}
                          label="Action"
                          onChange={(e) =>
                            updateEntry(index, {
                              ...entry,
                              payloadJson: {
                                ...payload,
                                action: (e.target as HTMLInputElement).value,
                              },
                            })
                          }
                        >
                          {ACTION_OPTIONS.map((action) => (
                            <MenuItem key={action} value={action}>
                              {ACTION_LABEL[action]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    {(entry.macroType === 'ACTION' ||
                      entry.macroType === 'SUBMIT_ACTION') && (
                      <TextField
                        label="Repeat"
                        type="number"
                        inputProps={{ min: 1, max: 10 }}
                        value={payload.repeat ?? 1}
                        onChange={(e) =>
                          updateEntry(index, {
                            ...entry,
                            payloadJson: {
                              ...payload,
                              repeat: Math.max(1, Math.min(10, parseInt(e.target.value || '1', 10))),
                            },
                          })
                        }
                        sx={{ width: 110 }}
                      />
                    )}

                    {entry.macroType === 'COMBO' && (
                      <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel id={`macro-combo-${index}`}>Combo</InputLabel>
                        <Select
                          labelId={`macro-combo-${index}`}
                          value={payload.comboId || 'SELECT_ALL_PASTE'}
                          label="Combo"
                          onChange={(e) =>
                            updateEntry(index, {
                              ...entry,
                              payloadJson: { comboId: (e.target as HTMLInputElement).value as MacroComboId },
                            })
                          }
                        >
                          {COMBO_OPTIONS.map((comboId) => (
                            <MenuItem key={comboId} value={comboId}>
                              {COMBO_LABEL[comboId]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Stack>
                  {showValidationHints && !!validation.rowErrors[index]?.length && (
                    <Box sx={{ mt: 0.75 }}>
                      {validation.rowErrors[index].map((err, errIdx) => (
                        <Typography
                          key={`macro-row-error-${index}-${errIdx}`}
                          variant="caption"
                          color="error"
                          display="block"
                        >
                          {err}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )
            })}
          </Stack>
          {entries.length > 0 && (
            <Box
              onClick={addEntry}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  addEntry()
                }
              }}
              sx={{
                mt: 1,
                p: 1.5,
                border: '1px dashed',
                borderColor: 'primary.main',
                borderRadius: '8px',
                minHeight: 74,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'primary.main',
                bgcolor: 'action.hover',
                transition: 'background-color 120ms ease, border-color 120ms ease',
                '&:hover': {
                  bgcolor: 'action.selected',
                  borderColor: 'primary.dark',
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: '2px',
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                + Add Mapping
              </Typography>
            </Box>
          )}

          {mode === 'edit' && (
            <>
              <Box
                sx={{
                  borderRadius: '8px',
                  p: 1,
                }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={onSaveVersion}
                  disabled={Boolean(saveDisabledReason)}
                  sx={{ minHeight: 48, fontWeight: 700 }}
                >
                  Save New Version
                </Button>
              </Box>
            </>
          )}

          {mode === 'create' && (
            <>
              <Box
                sx={{
                  borderRadius: '8px',
                  p: 1,
                }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={onCreatePreset}
                  disabled={Boolean(createDisabledReason)}
                  sx={{ minHeight: 48, fontWeight: 700 }}
                >
                  Create Preset
                </Button>
              </Box>
            </>
          )}
        </>
      )}

      {mode === 'edit' && !selectedPresetId && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Choose one of your presets to start editing.
          </Typography>
        </>
      )}
    </Box>
  )
}

export default MacroPresetManager
