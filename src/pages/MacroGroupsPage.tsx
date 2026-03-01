import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  LinearProgress,
  Pagination,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { UserContext } from '../utils/contexts/UserContext'
import {
  getMacroGroupThreadUsage,
  getMacroGroupVersion,
  getMacroGroupVersions,
  listMacroGroups,
  macroGroupsFeatureEnabled,
} from '../utils/api'
import { MacroEntry, MacroEntryDraft, MacroEntryPayload, MacroGroup } from '../utils/types'
import MacroGroupManager from '../components/MacroGroupManager'
import { prioritizeOwnedMacroGroups } from '../utils/macroGroups'

const PAGE_SIZE = 25

export const MacroGroupsPage = () => {
  const { user } = useContext(UserContext)
  const [viewMode, setViewMode] = useState<'discover' | 'create' | 'edit'>('discover')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [macroGroups, setMacroGroups] = useState<MacroGroup[]>([])
  const [ownedMacroGroups, setOwnedMacroGroups] = useState<MacroGroup[]>([])
  const [ownedGroupIds, setOwnedGroupIds] = useState<Set<number>>(new Set())
  const [groupPreviewById, setGroupPreviewById] = useState<
    Record<number, { versionNumber: number | null; entries: MacroEntry[] }>
  >({})
  const [groupThreadUsageById, setGroupThreadUsageById] = useState<
    Record<number, { threadName: string; appliesCount: number }[]>
  >({})
  const [draftSeed, setDraftSeed] = useState<{
    token: number
    name: string
    description: string
    entries: MacroEntryDraft[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const macroGroupsEnabled = macroGroupsFeatureEnabled

  useEffect(() => {
    document.title = 'Macro Groups | Counting!'
    return () => {
      document.title = 'Counting!'
    }
  }, [])

  const hydrateGroupDetails = useCallback(async (groups: MacroGroup[]) => {
    const previews: Record<number, { versionNumber: number | null; entries: MacroEntry[] }> = {}
    const usage: Record<number, { threadName: string; appliesCount: number }[]> = {}

    await Promise.all(
      groups.map(async (group) => {
        try {
          const versionsRes = await getMacroGroupVersions(group.id)
          const latest = versionsRes.data?.[0]
          if (latest?.versionNumber) {
            const versionRes = await getMacroGroupVersion(group.id, latest.versionNumber)
            previews[group.id] = {
              versionNumber: latest.versionNumber,
              entries: versionRes.data.entries || [],
            }
          } else {
            previews[group.id] = {
              versionNumber: null,
              entries: [],
            }
          }
        } catch {
          previews[group.id] = { versionNumber: null, entries: [] }
        }

        try {
          const usageRes = await getMacroGroupThreadUsage(group.id, 3)
          usage[group.id] = (usageRes.data.items || []).map((row) => ({
            threadName: row.threadName,
            appliesCount: row.appliesCount,
          }))
        } catch {
          usage[group.id] = []
        }
      }),
    )

    setGroupPreviewById(previews)
    setGroupThreadUsageById(usage)
  }, [])

  const loadMacroGroups = useCallback(async () => {
    if (!macroGroupsEnabled) return
    setLoading(true)
    setError('')
    try {
      const [groupsRes, mineRes] = await Promise.all([
        listMacroGroups(page, PAGE_SIZE, search.trim() || undefined),
        listMacroGroups(1, 100, undefined, true),
      ])
      setTotal(groupsRes.data.total || 0)
      const publicItems = groupsRes.data.items || []
      const mineItems = mineRes.data.items || []
      setMacroGroups(publicItems)
      setOwnedMacroGroups(mineItems)
      setOwnedGroupIds(new Set(mineItems.map((item) => item.id)))
      await hydrateGroupDetails(publicItems)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load macro groups')
    } finally {
      setLoading(false)
    }
  }, [macroGroupsEnabled, page, search, hydrateGroupDetails])

  useEffect(() => {
    loadMacroGroups()
  }, [loadMacroGroups])

  const sortedMacroGroups = useMemo(
    () => prioritizeOwnedMacroGroups(macroGroups, ownedGroupIds),
    [macroGroups, ownedGroupIds],
  )

  const describeEntry = (entry: MacroEntry) => {
    const payload = entry.payloadJson || {}
    switch (entry.macroType) {
      case 'CHAR_INSERT':
        return `insert "${payload.char || ''}"`
      case 'ACTION':
        return `${String(payload.action || '').toLowerCase()} x${payload.repeat ?? 1}`
      case 'SUBMIT':
        return 'submit'
      case 'SUBMIT_ACTION':
        return `submit + ${String(payload.action || '').toLowerCase()} x${payload.repeat ?? 1}`
      case 'TOGGLE':
        return 'toggle macros'
      case 'COMBO':
        return String(payload.comboId || '').toLowerCase()
      default:
        return 'macro'
    }
  }

  const copyToDraft = (group: MacroGroup) => {
    const preview = groupPreviewById[group.id]
    setDraftSeed({
      token: Date.now(),
      name: `${group.name} (copy)`,
      description: group.description || '',
      entries: (preview?.entries || []).map((entry) => ({
        triggerKey: entry.triggerKey,
        macroType: entry.macroType,
        payloadJson: entry.payloadJson as MacroEntryPayload,
      })),
    })
    setViewMode('create')
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ p: 2 }}>
        <Alert severity="info">You must be logged in to use macro groups.</Alert>
      </Container>
    )
  }

  if (!macroGroupsEnabled) {
    return (
      <Container maxWidth="md" sx={{ p: 2 }}>
        <Alert severity="info">Macro groups are currently disabled.</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Macro Groups
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Discover public groups or build and version your own.
      </Typography>

      {error && (
        <Alert sx={{ mb: 2 }} severity="error">
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <Button
          variant={viewMode === 'discover' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('discover')}
        >
          Discover
        </Button>
        <Button
          variant={viewMode === 'create' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('create')}
        >
          Create
        </Button>
        <Button
          variant={viewMode === 'edit' ? 'contained' : 'outlined'}
          onClick={() => setViewMode('edit')}
        >
          Edit Mine
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="text" component={RouterLink} to="/prefs">
          Back To Prefs
        </Button>
      </Stack>

      {viewMode === 'discover' && (
        <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'background.paper', mb: 2 }}>
          <TextField
            label="Search Public Groups"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            fullWidth
          />

          {loading && <LinearProgress sx={{ mt: 1.5 }} />}
          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.25}>
            {sortedMacroGroups.map((group) => (
              <Box
                key={group.id}
                sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Box>
                    <Typography variant="subtitle2">{group.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {group.description || 'No description'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                      v{groupPreviewById[group.id]?.versionNumber ?? '-'} |{' '}
                      {(groupPreviewById[group.id]?.entries || []).length} entries
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Button size="small" variant="outlined" onClick={() => copyToDraft(group)}>
                      Copy To Draft
                    </Button>
                    {ownedGroupIds.has(group.id) && <Chip size="small" color="success" label="Mine" />}
                  </Stack>
                </Stack>
                {(groupPreviewById[group.id]?.entries || []).length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {(groupPreviewById[group.id]?.entries || []).slice(0, 6).map((entry) => (
                      <Typography
                        key={`${group.id}-${entry.id}`}
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        {entry.triggerKey}: {describeEntry(entry)}
                      </Typography>
                    ))}
                    {(groupPreviewById[group.id]?.entries || []).length > 6 && (
                      <Typography variant="caption" color="text.secondary">
                        +{(groupPreviewById[group.id]?.entries || []).length - 6} more
                      </Typography>
                    )}
                  </Box>
                )}
                <Box sx={{ mt: 0.75, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {(groupThreadUsageById[group.id] || []).map((row) => (
                    <Chip
                      key={`${group.id}-${row.threadName}`}
                      size="small"
                      variant="outlined"
                      label={`${row.threadName} (${row.appliesCount})`}
                    />
                  ))}
                  {(groupThreadUsageById[group.id] || []).length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      No thread usage tracked yet
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
            {!loading && sortedMacroGroups.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No macro groups found.
              </Typography>
            )}
          </Stack>

          {total > PAGE_SIZE && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={Math.max(1, Math.ceil(total / PAGE_SIZE))}
                page={page}
                onChange={(_, value) => setPage(value)}
              />
            </Box>
          )}
        </Box>
      )}

      {viewMode === 'create' && (
        <MacroGroupManager
          ownedMacroGroups={ownedMacroGroups}
          refreshMacroGroups={loadMacroGroups}
          draftSeed={draftSeed}
          forcedMode="create"
        />
      )}

      {viewMode === 'edit' && (
        <MacroGroupManager
          ownedMacroGroups={ownedMacroGroups}
          refreshMacroGroups={loadMacroGroups}
          draftSeed={draftSeed}
          forcedMode="edit"
        />
      )}
    </Container>
  )
}

export default MacroGroupsPage
