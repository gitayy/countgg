import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  LinearProgress,
  Pagination,
  Stack,
  Tab,
  Tabs,
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [creatorSearch, setCreatorSearch] = useState('')
  const [debouncedCreatorSearch, setDebouncedCreatorSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [macroGroups, setMacroGroups] = useState<MacroGroup[]>([])
  const [ownedMacroGroups, setOwnedMacroGroups] = useState<MacroGroup[]>([])
  const [ownedGroupIds, setOwnedGroupIds] = useState<Set<number>>(new Set())
  const [groupPreviewById, setGroupPreviewById] = useState<
    Record<number, { versionNumber: number | null; entries: MacroEntry[] }>
  >({})
  const [groupThreadUsageById, setGroupThreadUsageById] = useState<
    Record<number, { threadId: string; threadName: string; appliesCount: number }[]>
  >({})
  const [draftSeed, setDraftSeed] = useState<{
    token: number
    name: string
    description: string
    entries: MacroEntryDraft[]
  } | null>(null)
  const [copyNotice, setCopyNotice] = useState('')
  const [ownedOnlyFilter, setOwnedOnlyFilter] = useState(false)
  const [hasUsageFilter, setHasUsageFilter] = useState(false)
  const [hasSubmitFilter, setHasSubmitFilter] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const macroGroupsEnabled = macroGroupsFeatureEnabled

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedCreatorSearch(creatorSearch.trim())
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [creatorSearch])

  useEffect(() => {
    document.title = 'Macro Groups | Counting!'
    return () => {
      document.title = 'Counting!'
    }
  }, [])

  const hydrateGroupDetails = useCallback(async (groups: MacroGroup[]) => {
    const previews: Record<number, { versionNumber: number | null; entries: MacroEntry[] }> = {}
    const usage: Record<number, { threadId: string; threadName: string; appliesCount: number }[]> = {}

    await Promise.all(
      groups.map(async (group) => {
        const [versionsResult, usageResult] = await Promise.allSettled([
          getMacroGroupVersions(group.id),
          getMacroGroupThreadUsage(group.id, 3),
        ])

        if (versionsResult.status === 'fulfilled') {
          const latest = versionsResult.value.data?.[0]
          if (latest?.versionNumber) {
            try {
              const versionRes = await getMacroGroupVersion(group.id, latest.versionNumber)
              previews[group.id] = {
                versionNumber: latest.versionNumber,
                entries: versionRes.data.entries || [],
              }
            } catch {
              previews[group.id] = { versionNumber: null, entries: [] }
            }
          } else {
            previews[group.id] = {
              versionNumber: null,
              entries: [],
            }
          }
        } else {
          previews[group.id] = { versionNumber: null, entries: [] }
        }

        if (usageResult.status === 'fulfilled') {
          usage[group.id] = (usageResult.value.data.items || []).map((row) => ({
            threadId: row.threadId,
            threadName: row.threadName,
            appliesCount: row.appliesCount,
          }))
        } else {
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
        listMacroGroups(
          page,
          PAGE_SIZE,
          debouncedSearch || undefined,
          false,
          debouncedCreatorSearch || undefined,
        ),
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
  }, [macroGroupsEnabled, page, debouncedSearch, debouncedCreatorSearch, hydrateGroupDetails])

  useEffect(() => {
    loadMacroGroups()
  }, [loadMacroGroups])

  const sortedMacroGroups = useMemo(
    () => prioritizeOwnedMacroGroups(macroGroups, ownedGroupIds),
    [macroGroups, ownedGroupIds],
  )

  const filteredMacroGroups = useMemo(() => {
    return sortedMacroGroups.filter((group) => {
      const entries = groupPreviewById[group.id]?.entries || []
      const hasUsage = (groupThreadUsageById[group.id] || []).length > 0
      const hasSubmit = entries.some(
        (entry) => entry.macroType === 'SUBMIT' || entry.macroType === 'SUBMIT_ACTION',
      )
      if (ownedOnlyFilter && !ownedGroupIds.has(group.id)) return false
      if (hasUsageFilter && !hasUsage) return false
      if (hasSubmitFilter && !hasSubmit) return false
      return true
    })
  }, [
    sortedMacroGroups,
    groupPreviewById,
    groupThreadUsageById,
    ownedOnlyFilter,
    hasUsageFilter,
    hasSubmitFilter,
    ownedGroupIds,
  ])

  const buildGroupedPreviewRows = (entries: MacroEntry[]) => {
    const groups: Record<string, string[]> = {
      'Character remaps': [],
      Submit: [],
      Actions: [],
      Combos: [],
      Toggle: [],
    }

    entries.forEach((entry) => {
      const payload = entry.payloadJson || {}
      if (entry.macroType === 'CHAR_INSERT') {
        groups['Character remaps'].push(`${entry.triggerKey}->${payload.char || ''}`)
        return
      }
      if (entry.macroType === 'SUBMIT') {
        groups.Submit.push(entry.triggerKey)
        return
      }
      if (entry.macroType === 'SUBMIT_ACTION') {
        groups.Submit.push(
          `${entry.triggerKey}+${String(payload.action || '').toLowerCase()} x${payload.repeat ?? 1}`,
        )
        return
      }
      if (entry.macroType === 'ACTION') {
        groups.Actions.push(
          `${entry.triggerKey}:${String(payload.action || '').toLowerCase()} x${payload.repeat ?? 1}`,
        )
        return
      }
      if (entry.macroType === 'COMBO') {
        groups.Combos.push(`${entry.triggerKey}:${String(payload.comboId || '').toLowerCase()}`)
        return
      }
      if (entry.macroType === 'TOGGLE') {
        groups.Toggle.push(entry.triggerKey)
      }
    })

    return Object.entries(groups)
      .filter(([, items]) => items.length > 0)
      .slice(0, 4)
      .map(([label, items]) => `${label}: ${items.slice(0, 4).join(', ')}${items.length > 4 ? ` +${items.length - 4}` : ''}`)
  }

  const computeQualityScore = (entries: MacroEntry[], usageCount: number, hasDescription: boolean) => {
    const entryScore = Math.min(45, entries.length * 3)
    const usageScore = Math.min(40, usageCount * 8)
    const descriptionScore = hasDescription ? 15 : 0
    return Math.min(100, entryScore + usageScore + descriptionScore)
  }

  const copyToDraft = (group: MacroGroup) => {
    if (viewMode === 'create') {
      const confirmed = window.confirm('Replace your current draft with this copied macro group?')
      if (!confirmed) {
        return
      }
    }

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
    setCopyNotice(`Copied "${group.name}" into draft.`)
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
    <Box sx={{ flexGrow: 1, width: '100%', bgcolor: 'primary.light', py: 2 }}>
      <Container
        maxWidth="xl"
        sx={{
          p: 0,
        }}
      >
      <Box
        sx={{
          p: 2,
          borderRadius: '10px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          mb: 2,
        }}
      >
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

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} sx={{ mb: 0.5 }}>
        <Tabs
          value={viewMode}
          onChange={(_, value) => setViewMode(value)}
          sx={{
            minHeight: 36,
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTab-root': {
              minHeight: 36,
              px: 1.5,
              py: 0.5,
              mr: 0.75,
              borderRadius: '8px',
              border: '1px solid',
              borderColor: 'divider',
              textTransform: 'none',
              color: 'text.secondary',
              fontWeight: 600,
            },
            '& .MuiTab-root.Mui-selected': {
              color: '#fff !important',
              bgcolor: 'primary.main',
              borderColor: 'primary.main',
            },
          }}
        >
          <Tab disableRipple label="Discover" value="discover" />
          <Tab disableRipple label="Create" value="create" />
          <Tab disableRipple label="Edit Mine" value="edit" />
        </Tabs>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined" color="inherit" component={RouterLink} to="/prefs">
          Back To Prefs
        </Button>
      </Stack>
      </Box>

      {viewMode === 'discover' && (
        <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'background.paper', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Public Groups
          </Typography>
          <TextField
            label="Search Public Groups"
            helperText='Search by name, description, trigger key, or behavior (e.g. "submit", "backspace").'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            fullWidth
          />
          <TextField
            sx={{ mt: 1.25 }}
            label="Filter By Creator"
            placeholder="display name, username, or uuid"
            value={creatorSearch}
            onChange={(e) => {
              setCreatorSearch(e.target.value)
              setPage(1)
            }}
            fullWidth
          />

          {loading && <LinearProgress sx={{ mt: 1.5 }} />}
          <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, flexWrap: 'wrap' }}>
            <Chip
              size="small"
              label="Owned"
              clickable
              color={ownedOnlyFilter ? 'primary' : 'default'}
              variant={ownedOnlyFilter ? 'filled' : 'outlined'}
              onClick={() => setOwnedOnlyFilter((prev) => !prev)}
            />
            <Chip
              size="small"
              label="Has Usage"
              clickable
              color={hasUsageFilter ? 'primary' : 'default'}
              variant={hasUsageFilter ? 'filled' : 'outlined'}
              onClick={() => setHasUsageFilter((prev) => !prev)}
            />
            <Chip
              size="small"
              label="Has Submit"
              clickable
              color={hasSubmitFilter ? 'primary' : 'default'}
              variant={hasSubmitFilter ? 'filled' : 'outlined'}
              onClick={() => setHasSubmitFilter((prev) => !prev)}
            />
          </Stack>
          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.25}>
            {filteredMacroGroups.map((group) => (
              (() => {
                const entries = groupPreviewById[group.id]?.entries || []
                const previewRows = buildGroupedPreviewRows(entries)
                const usageRows = groupThreadUsageById[group.id] || []
                const topUsage = usageRows[0]
                const qualityScore = computeQualityScore(
                  entries,
                  usageRows.reduce((sum, row) => sum + row.appliesCount, 0),
                  Boolean(group.description?.trim()),
                )

                return (
              <Box
                key={group.id}
                sx={{
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '10px',
                  bgcolor: 'background.default',
                  transition: 'border-color 120ms ease, transform 120ms ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" spacing={1.5}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Avatar
                        sx={{ width: 28, height: 28, fontSize: 13 }}
                        src={
                          (group.ownerCounter?.avatar &&
                            group.ownerCounter.avatar.length > 5 &&
                            `https://cdn.discordapp.com/avatars/${group.ownerCounter.discordId}/${group.ownerCounter.avatar}`) ||
                          'https://cdn.discordapp.com/embed/avatars/0.png'
                        }
                      >
                        {group.ownerCounter?.name?.[0]?.toUpperCase() || group.ownerCounter?.username?.[0]?.toUpperCase() || '?'}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {group.ownerCounter
                          ? `${group.ownerCounter.name || group.ownerCounter.username || 'Unknown'}${group.ownerCounter.username ? ` (@${group.ownerCounter.username})` : ''}`
                          : 'Unknown creator'}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {group.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.25,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {group.description || 'No description'}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.85, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`v${groupPreviewById[group.id]?.versionNumber ?? '-'}`}
                      />
                      <Chip size="small" variant="outlined" label={`${entries.length} entries`} />
                      <Chip
                        size="small"
                        color={qualityScore >= 80 ? 'success' : qualityScore >= 55 ? 'warning' : 'default'}
                        variant="outlined"
                        label={`Quality ${qualityScore}`}
                      />
                      {ownedGroupIds.has(group.id) && (
                        <Chip size="small" color="success" variant="outlined" label="Owned" />
                      )}
                      {topUsage && (
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          component={RouterLink}
                          clickable
                          to={`/thread/${topUsage.threadId}`}
                          label={`Top thread: ${topUsage.threadName} (${topUsage.appliesCount})`}
                        />
                      )}
                    </Stack>
                  </Box>
                  <Stack direction={{ xs: 'row', lg: 'column' }} spacing={0.75} alignItems={{ xs: 'center', lg: 'flex-end' }}>
                    <Button size="small" variant="contained" onClick={() => copyToDraft(group)}>
                      Copy To Draft
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      {usageRows.length > 0
                        ? `${usageRows.length} thread${usageRows.length > 1 ? 's' : ''} using this`
                        : 'No tracked usage'}
                    </Typography>
                  </Stack>
                </Stack>
                <Divider sx={{ my: 1.25 }} />
                <Stack spacing={0.4}>
                  {previewRows.map((row) => (
                    <Typography key={`${group.id}-${row}`} variant="caption" color="text.primary">
                      {row}
                    </Typography>
                  ))}
                  {previewRows.length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      No macro entries in latest version.
                    </Typography>
                  )}
                </Stack>
                <Box sx={{ mt: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {usageRows.slice(topUsage ? 1 : 0).map((row) =>
                    row.threadId ? (
                      <Chip
                        key={`${group.id}-${row.threadId}`}
                        size="small"
                        variant="outlined"
                        component={RouterLink}
                        clickable
                        to={`/thread/${row.threadId}`}
                        label={`${row.threadName} (${row.appliesCount})`}
                      />
                    ) : (
                      <Chip
                        key={`${group.id}-${row.threadName}`}
                        size="small"
                        variant="outlined"
                        label={`${row.threadName} (${row.appliesCount})`}
                      />
                    ),
                  )}
                  {usageRows.length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      No thread usage yet
                    </Typography>
                  )}
                </Box>
              </Box>
                )
              })()
            ))}
            {!loading && filteredMacroGroups.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No macro groups found with current search/filters.
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
        <>
          {copyNotice && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setCopyNotice('')}>
              {copyNotice}
            </Alert>
          )}
          <MacroGroupManager
            ownedMacroGroups={ownedMacroGroups}
            refreshMacroGroups={loadMacroGroups}
            draftSeed={draftSeed}
            forcedMode="create"
          />
        </>
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
    </Box>
  )
}

export default MacroGroupsPage
