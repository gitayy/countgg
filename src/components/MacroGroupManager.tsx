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
  createMacroGroup,
  enqueueMacroGroupUpdate,
  getMacroGroupVersion,
  getMacroGroupVersions,
} from '../utils/api'
import {
  MacroActionType,
  MacroComboId,
  MacroEntryDraft,
  MacroEntryPayload,
  MacroEntryType,
  MacroGroup,
  MacroGroupVersion,
} from '../utils/types'

type Props = {
  ownedMacroGroups: MacroGroup[]
  refreshMacroGroups: () => Promise<void>
  forcedMode?: 'create' | 'edit'
  draftSeed?: {
    token: number
    name: string
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

const toDraftEntries = (version: MacroGroupVersion | null): MacroEntryDraft[] => {
  if (!version?.entries?.length) return []
  return version.entries.map((entry) => ({
    triggerKey: entry.triggerKey,
    macroType: entry.macroType,
    payloadJson: entry.payloadJson as MacroEntryPayload,
  }))
}

export const MacroGroupManager = ({
  ownedMacroGroups,
  refreshMacroGroups,
  forcedMode,
  draftSeed,
}: Props) => {
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [versions, setVersions] = useState<MacroGroupVersion[]>([])
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [entries, setEntries] = useState<MacroEntryDraft[]>([])
  const [changeNote, setChangeNote] = useState('')
  const [loadingVersion, setLoadingVersion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [activeVersionNumber, setActiveVersionNumber] = useState<number | null>(null)
  const [showAdvancedEditOptions, setShowAdvancedEditOptions] = useState(false)

  const selectedGroup = useMemo(
    () => ownedMacroGroups.find((group) => group.id === selectedGroupId),
    [ownedMacroGroups, selectedGroupId],
  )

  const loadGroupVersions = async (groupId: number): Promise<MacroGroupVersion[]> => {
    const versionsRes = await getMacroGroupVersions(groupId)
    return versionsRes.data || []
  }

  const loadVersion = async (groupId: number, versionNumber: number) => {
    setLoadingVersion(true)
    setError('')
    try {
      const fullVersionRes = await getMacroGroupVersion(groupId, versionNumber)
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
      const fullVersionRes = await getMacroGroupVersion(groupId, latest.versionNumber)
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
    setMode('edit')
    loadLatestVersion(selectedGroupId)
  }, [selectedGroupId])

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
    setNewGroupDescription(draftSeed.description)
    setEntries(draftSeed.entries)
    setChangeNote(`Draft copied from "${draftSeed.name}"`)
    setSuccess('Loaded copied macro group into draft. Edit before creating.')
  }, [draftSeed?.token])

  useEffect(() => {
    if (!forcedMode) return
    setMode(forcedMode)
    if (forcedMode === 'create') {
      setSelectedGroupId(null)
    }
  }, [forcedMode])

  const onCreateGroup = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const created = await createMacroGroup(
        newGroupName.trim(),
        newGroupDescription.trim(),
        'Initial version',
        entries,
      )
      await refreshMacroGroups()
      setSelectedGroupId(created.data.id)
      setNewGroupName('')
      setNewGroupDescription('')
      setActiveVersionNumber(1)
      setVersions([])
      setSelectedVersionNumber(1)
      setSuccess('Macro group created.')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create macro group')
    } finally {
      setSaving(false)
    }
  }

  const onSaveVersion = async () => {
    if (!selectedGroupId) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await enqueueMacroGroupUpdate(selectedGroupId, changeNote.trim(), entries)
      await loadLatestVersion(selectedGroupId)
      setChangeNote('')
      setSuccess('Saved as a new macro version.')
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

  return (
    <Box sx={{ mt: 2, p: 2, borderRadius: '10px', bgcolor: 'background.paper' }}>
      <Typography variant="h6">Macro Group Manager</Typography>

      {!forcedMode && (
        <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
          <Button
            variant={mode === 'create' ? 'contained' : 'outlined'}
            onClick={() => {
              setMode('create')
              setSelectedGroupId(null)
            }}
          >
            Create
          </Button>
          <Button
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
              label="New Group Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              inputProps={{ maxLength: 64 }}
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
              options={ownedMacroGroups}
              value={ownedMacroGroups.find((group) => group.id === selectedGroupId) || null}
              getOptionLabel={(option) => option.name}
              onChange={(_, value) => {
                setSelectedGroupId(value?.id ?? null)
              }}
              renderInput={(params) => <TextField {...params} label="Edit My Group" placeholder="Search your groups" />}
            />
            {!!selectedGroupId && (
              <Button variant="text" onClick={() => setSelectedGroupId(null)}>
                Clear
              </Button>
            )}
            <Typography variant="body2" color="text.secondary">
              {selectedGroup ? `Editing ${selectedGroup.name}` : 'No group selected'}
              {activeVersionNumber ? ` (latest v${activeVersionNumber})` : ''}
            </Typography>
          </Stack>

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
            </Stack>
          )}
        </>
      )}

      {(mode === 'create' || !!selectedGroupId) && (
        <>
          <Divider sx={{ my: 2 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">
              2. Entries ({entries.length})
            </Typography>
            <Button variant="outlined" size="small" onClick={addEntry}>
              Add Entry
            </Button>
          </Stack>

          <Stack spacing={1}>
            {entries.map((entry, index) => {
              const payload = entry.payloadJson as any
              return (
                <Box
                  key={`macro-entry-${index}`}
                  sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}
                >
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
                    <IconButton color="error" onClick={() => removeEntry(index)}>
                      <DeleteIcon />
                    </IconButton>
                    <TextField
                      label="Trigger"
                      value={entry.triggerKey}
                      onChange={(e) => updateEntry(index, { ...entry, triggerKey: e.target.value.slice(0, 1) })}
                      sx={{ width: 100 }}
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
                            {type}
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
                        sx={{ width: 100 }}
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
                              {action}
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
                              {comboId}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Stack>
                </Box>
              )
            })}
          </Stack>

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
                <Button variant="contained" onClick={onSaveVersion} disabled={saving || loadingVersion}>
                  Save New Version
                </Button>
              </Stack>
            </>
          )}

          {mode === 'create' && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                3. Create Group
              </Typography>
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={onCreateGroup}
                  disabled={saving || newGroupName.trim().length < 3}
                >
                  Create Group
                </Button>
              </Stack>
            </>
          )}
        </>
      )}

      {mode === 'edit' && !selectedGroupId && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Select one of your groups to edit entries and save a new version.
          </Typography>
        </>
      )}
    </Box>
  )
}

export default MacroGroupManager

