import {
  Alert,
  Autocomplete,
  Box,
  Button,
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
import { useEffect, useMemo, useState } from 'react'
import {
  createMacroPreset,
  enqueueMacroPresetUpdate,
  getMacroPresetVersion,
  getMacroPresetVersions,
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
  ownedMacroPresets: MacroPreset[]
  refreshMacroPresets: () => Promise<void>
  forcedMode?: 'create' | 'edit'
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

const MAX_ENTRIES = 64
const MAX_REPEAT = 10
const MAX_TRIGGERS_PER_CHAR = 2
const MAX_SUBMIT_MACROS = 2
const HANDLE_REGEX = /^[a-z0-9](?:[a-z0-9_-]{1,62}[a-z0-9])?$/

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
  ownedMacroPresets,
  refreshMacroPresets,
  forcedMode,
  draftSeed,
}: Props) => {
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [versions, setVersions] = useState<MacroPresetVersion[]>([])
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupHandle, setNewGroupHandle] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [entries, setEntries] = useState<MacroEntryDraft[]>([])
  const [changeNote, setChangeNote] = useState('')
  const [loadingVersion, setLoadingVersion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [activeVersionNumber, setActiveVersionNumber] = useState<number | null>(null)
  const [showAdvancedEditOptions, setShowAdvancedEditOptions] = useState(false)
  const title =
    mode === 'create' ? 'Create Macro Preset' : 'Edit Macro Preset'

  const selectedGroup = useMemo(
    () => ownedMacroPresets.find((group) => group.id === selectedGroupId),
    [ownedMacroPresets, selectedGroupId],
  )
  const validation = useMemo(() => validateEntries(entries), [entries])

  const loadGroupVersions = async (groupId: number): Promise<MacroPresetVersion[]> => {
    const versionsRes = await getMacroPresetVersions(groupId)
    return versionsRes.data || []
  }

  const loadVersion = async (groupId: number, versionNumber: number) => {
    setLoadingVersion(true)
    setError('')
    try {
      const fullVersionRes = await getMacroPresetVersion(groupId, versionNumber)
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

  const loadLatestVersion = async (groupId: number) => {
    setLoadingVersion(true)
    setError('')
    try {
      const fetchedVersions = await loadGroupVersions(groupId)
      setVersions(fetchedVersions)
      const latest = fetchedVersions[0]
      if (!latest) {
        setEntries([])
        setActiveVersionNumber(null)
        setSelectedVersionNumber(null)
        return
      }
      const fullVersionRes = await getMacroPresetVersion(groupId, latest.versionNumber)
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
    if (!selectedGroupId) return
    if (forcedMode !== 'create') {
      setMode('edit')
    }
    loadLatestVersion(selectedGroupId)
  }, [selectedGroupId, forcedMode])

  useEffect(() => {
    if (!selectedGroupId) {
      setShowAdvancedEditOptions(false)
    }
  }, [selectedGroupId])

  useEffect(() => {
    if (!draftSeed) return
    setMode('create')
    setSelectedGroupId(null)
    setVersions([])
    setSelectedVersionNumber(null)
    setActiveVersionNumber(null)
    setNewGroupName(draftSeed.name)
    setNewGroupHandle(draftSeed.handle || '')
    setNewGroupDescription(draftSeed.description)
    setEntries(draftSeed.entries)
    setChangeNote(`Draft copied from "${draftSeed.name}"`)
    setSuccess('Draft loaded from copied group.')
  }, [draftSeed?.token])

  useEffect(() => {
    if (!forcedMode) return
    setMode(forcedMode)
    if (forcedMode === 'create') {
      setSelectedGroupId(null)
    }
  }, [forcedMode])

  const onCreateGroup = async () => {
    if (entries.length < 1) {
      setError('At least one macro entry is required.')
      return
    }

    if (validation.globalErrors.length > 0 || Object.keys(validation.rowErrors).length > 0) {
      setError('Please fix macro validation errors before creating the group.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const created = await createMacroPreset(
        newGroupName.trim(),
        newGroupHandle.trim().toLowerCase(),
        newGroupDescription.trim(),
        'Initial version',
        entries,
      )
      await refreshMacroPresets()
      if (forcedMode !== 'create') {
        setSelectedGroupId(created.data.id)
        setMode('edit')
      } else {
        setSelectedGroupId(null)
      }
      setNewGroupName('')
      setNewGroupHandle('')
      setNewGroupDescription('')
      setEntries([])
      setActiveVersionNumber(1)
      setVersions([])
      setSelectedVersionNumber(1)
      setSuccess('Group created.')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create macro preset')
    } finally {
      setSaving(false)
    }
  }

  const onSaveVersion = async () => {
    if (!selectedGroupId) return
    if (entries.length < 1) {
      setError('At least one macro entry is required.')
      return
    }
    if (validation.globalErrors.length > 0 || Object.keys(validation.rowErrors).length > 0) {
      setError('Please fix macro validation errors before saving.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await enqueueMacroPresetUpdate(selectedGroupId, changeNote.trim(), entries)
      await loadLatestVersion(selectedGroupId)
      setChangeNote('')
      setSuccess('New version saved.')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save macro update')
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

  const createDisabledReason =
    saving
      ? 'Saving...'
      : newGroupName.trim().length < 3
        ? 'Group name must be at least 3 characters.'
        : !HANDLE_REGEX.test(newGroupHandle.trim().toLowerCase())
          ? 'Handle must be 3-64 chars: lowercase letters, numbers, underscores, or hyphens.'
        : validation.globalErrors[0] || Object.values(validation.rowErrors)[0]?.[0] || ''

  const saveDisabledReason =
    saving || loadingVersion
      ? 'Saving...'
      : !selectedGroupId
        ? 'Select a group first.'
        : validation.globalErrors[0] || Object.values(validation.rowErrors)[0]?.[0] || ''

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
              setSelectedGroupId(null)
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
      {success && (
        <Alert sx={{ mb: 2 }} severity="success">
          {success}
        </Alert>
      )}

      {mode === 'create' ? (
        <>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            1. Group Details
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 1.5 }}>
            <TextField
              label="Display Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              inputProps={{ maxLength: 64 }}
              fullWidth
            />
            <TextField
              label="Handle (URL Name)"
              value={newGroupHandle}
              onChange={(e) => setNewGroupHandle(e.target.value.toLowerCase())}
              inputProps={{ maxLength: 64 }}
              helperText='Used in the URL: /macros/<handle>. Permanent and unique.'
              fullWidth
            />
            <TextField
              label="Description"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              inputProps={{ maxLength: 280 }}
              fullWidth
            />
          </Stack>
        </>
      ) : (
        <>
          <Typography variant="subtitle1" sx={{ mb: 1.25 }}>
            1. Select Group
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} sx={{ mb: 1.5 }}>
            <Autocomplete
              sx={{ minWidth: 320 }}
              options={ownedMacroPresets}
              value={ownedMacroPresets.find((group) => group.id === selectedGroupId) || null}
              getOptionLabel={(option) => option.name}
              filterOptions={(options, state) => {
                const q = state.inputValue.trim().toLowerCase()
                if (!q) return options
                return options.filter(
                  (opt) =>
                    opt.name.toLowerCase().includes(q) ||
                    (opt.handle || '').toLowerCase().includes(q) ||
                    opt.description.toLowerCase().includes(q),
                )
              }}
              onChange={(_, value) => {
                setSelectedGroupId(value?.id ?? null)
              }}
              renderInput={(params) => (
                <TextField {...params} label="Your Group" placeholder="Search your groups" />
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
            {!!selectedGroupId && (
              <Button size="small" variant="text" onClick={() => setSelectedGroupId(null)}>
                Clear
              </Button>
            )}
            <Typography variant="body2" color="text.secondary">
              {selectedGroup ? `Editing ${selectedGroup.name}` : 'No group selected'}
              {activeVersionNumber ? ` (latest v${activeVersionNumber})` : ''}
            </Typography>
          </Stack>

          {!!selectedGroupId && !!selectedGroup && (
            <Alert severity="info" sx={{ mb: 1.25 }}>
              Editing <strong>{selectedGroup.name}</strong>
              {selectedVersionNumber ? ` from v${selectedVersionNumber}` : ''}
              {activeVersionNumber ? ` (latest is v${activeVersionNumber})` : ''}.
            </Alert>
          )}

          {!!selectedGroupId && (
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
          {!!selectedGroupId && showAdvancedEditOptions && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 260 }}>
                <InputLabel id="edit-version-label">Base Version</InputLabel>
                <Select
                  labelId="edit-version-label"
                  value={selectedVersionNumber ?? ''}
                  label="Base Version"
                  onChange={(e) => {
                    const next = Number((e.target as HTMLInputElement).value)
                    if (!Number.isFinite(next) || !selectedGroupId) return
                    loadVersion(selectedGroupId, next)
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
                  onClick={() => selectedGroupId && loadLatestVersion(selectedGroupId)}
                >
                  Use Latest
                </Button>
              )}
            </Stack>
          )}
        </>
      )}

      {(mode === 'create' || !!selectedGroupId) && (
        <>
          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            2. Entries ({entries.length})
          </Typography>

          <Stack spacing={1}>
            {validation.globalErrors.length > 0 && (
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
                  borderColor: 'divider',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No macro entries yet.
                </Typography>
                <Button variant="outlined" size="small" onClick={addEntry}>
                  Add First Entry
                </Button>
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
                      label="Trigger"
                      value={entry.triggerKey}
                      onChange={(e) => updateEntry(index, { ...entry, triggerKey: e.target.value.slice(0, 1) })}
                      sx={{ width: 96 }}
                    />
                    <FormControl sx={{ minWidth: 220 }}>
                      <InputLabel id={`macro-type-${index}`}>Type</InputLabel>
                      <Select
                        labelId={`macro-type-${index}`}
                        value={entry.macroType}
                        label="Type"
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
                        label="Char"
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
                  {!!validation.rowErrors[index]?.length && (
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
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
              <Button variant="outlined" size="small" onClick={addEntry}>
                Add Entry
              </Button>
            </Stack>
          )}

          {mode === 'edit' && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                3. Save New Version
              </Typography>
              <TextField
                label="Change Note"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                inputProps={{ maxLength: 280 }}
                fullWidth
              />
              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.5 }}>
                <Button size="small" variant="contained" onClick={onSaveVersion} disabled={Boolean(saveDisabledReason)}>
                  Save New Version
                </Button>
              </Stack>
              {!!saveDisabledReason && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {saveDisabledReason}
                </Typography>
              )}
            </>
          )}

          {mode === 'create' && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                3. Create Group
              </Typography>
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  size="small"
                  variant="contained"
                  onClick={onCreateGroup}
                  disabled={Boolean(createDisabledReason)}
                >
                  Create Group
                </Button>
              </Stack>
              {!!createDisabledReason && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {createDisabledReason}
                </Typography>
              )}
            </>
          )}
        </>
      )}

      {mode === 'edit' && !selectedGroupId && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Choose one of your groups to start editing.
          </Typography>
        </>
      )}
    </Box>
  )
}

export default MacroPresetManager

