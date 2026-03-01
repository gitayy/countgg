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
  getMacroPresetThreadUsage,
  getMacroPresetVersion,
  getMacroPresetVersions,
  listMacroPresets,
  macroPresetsFeatureEnabled,
} from '../utils/api'
import { MacroEntry, MacroEntryDraft, MacroEntryPayload, MacroPreset } from '../utils/types'
import MacroPresetManager from '../components/MacroPresetManager'
import { prioritizeOwnedMacroPresets } from '../utils/macroPresets'

const PAGE_SIZE = 25

type MacroSearchFilters = {
  creator: string
  name: string
  handle: string
  thread: string
  threadMode: 'any' | 'used' | 'none'
  freeText: string
}

const parseMacroSearchFilters = (raw: string): MacroSearchFilters => {
  const filters: MacroSearchFilters = {
    creator: '',
    name: '',
    handle: '',
    thread: '',
    threadMode: 'any',
    freeText: '',
  }

  const tokenRegex = /\b(creator|name|handle|thread):"([^"]+)"|\b(creator|name|handle|thread):(\S+)/gi
  const tokenPairs: Array<{ key: string; value: string }> = []
  let match: RegExpExecArray | null = tokenRegex.exec(raw)
  while (match) {
    const key = (match[1] || match[3] || '').toLowerCase()
    const value = (match[2] || match[4] || '').trim()
    if (key && value) {
      tokenPairs.push({ key, value })
    }
    match = tokenRegex.exec(raw)
  }

  for (const token of tokenPairs) {
    if (token.key === 'creator') filters.creator = token.value
    if (token.key === 'name') filters.name = token.value
    if (token.key === 'handle') filters.handle = token.value
    if (token.key === 'thread') {
      const normalized = token.value.toLowerCase()
      if (normalized === 'used' || normalized === 'has') {
        filters.threadMode = 'used'
      } else if (normalized === 'none' || normalized === 'unused') {
        filters.threadMode = 'none'
      } else {
        filters.thread = token.value
      }
    }
  }

  const stripRegex = /\b(creator|name|handle|thread):"([^"]+)"|\b(creator|name|handle|thread):(\S+)/gi
  filters.freeText = raw.replace(stripRegex, ' ').replace(/\s+/g, ' ').trim()
  return filters
}

export const MacroPresetsPage = () => {
  const { user } = useContext(UserContext)
  const [viewMode, setViewMode] = useState<'discover' | 'create' | 'edit'>('discover')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [macroPresets, setMacroPresets] = useState<MacroPreset[]>([])
  const [ownedMacroPresets, setOwnedMacroPresets] = useState<MacroPreset[]>([])
  const [ownedGroupIds, setOwnedGroupIds] = useState<Set<number>>(new Set())
  const [groupPreviewById, setGroupPreviewById] = useState<
    Record<number, { versionNumber: number | null; entries: MacroEntry[] }>
  >({})
  const [groupThreadUsageById, setGroupThreadUsageById] = useState<
    Record<
      number,
      { threadId: string; threadName: string; threadTitle?: string; appliesCount: number }[]
    >
  >({})
  const [draftSeed, setDraftSeed] = useState<{
    token: number
    name: string
    handle?: string
    description: string
    entries: MacroEntryDraft[]
  } | null>(null)
  const [copyNotice, setCopyNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const macroPresetsEnabled = macroPresetsFeatureEnabled

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [search])

  const searchFilters = useMemo(() => parseMacroSearchFilters(debouncedSearch), [debouncedSearch])

  useEffect(() => {
    document.title = 'Macro Presets | Counting!'
    return () => {
      document.title = 'Counting!'
    }
  }, [])

  const hydrateGroupDetails = useCallback(async (groups: MacroPreset[]) => {
    const previews: Record<number, { versionNumber: number | null; entries: MacroEntry[] }> = {}
    const usage: Record<
      number,
      { threadId: string; threadName: string; threadTitle?: string; appliesCount: number }[]
    > = {}

    await Promise.all(
      groups.map(async (group) => {
        const [versionsResult, usageResult] = await Promise.allSettled([
          getMacroPresetVersions(group.id),
          getMacroPresetThreadUsage(group.id, 3),
        ])

        if (versionsResult.status === 'fulfilled') {
          const latest = versionsResult.value.data?.[0]
          if (latest?.versionNumber) {
            try {
              const versionRes = await getMacroPresetVersion(group.id, latest.versionNumber)
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
            threadTitle: row.threadTitle,
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

  const loadMacroPresets = useCallback(async () => {
    if (!macroPresetsEnabled) return
    setLoading(true)
    setError('')
    try {
      const [groupsRes, mineRes] = await Promise.all([
        listMacroPresets(
          page,
          PAGE_SIZE,
          searchFilters.freeText || undefined,
          false,
          searchFilters.creator || undefined,
        ),
        listMacroPresets(1, 100, undefined, true),
      ])
      setTotal(groupsRes.data.total || 0)
      const itemsWithPinned = groupsRes.data.items || []
      const mineItems = mineRes.data.items || []
      setMacroPresets(itemsWithPinned)
      setOwnedMacroPresets(mineItems)
      setOwnedGroupIds(new Set(mineItems.map((item) => item.id)))
      await hydrateGroupDetails(itemsWithPinned)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load macro presets')
    } finally {
      setLoading(false)
    }
  }, [macroPresetsEnabled, page, searchFilters, hydrateGroupDetails])

  useEffect(() => {
    loadMacroPresets()
  }, [loadMacroPresets])

  const sortedMacroPresets = useMemo(
    () => prioritizeOwnedMacroPresets(macroPresets, ownedGroupIds),
    [macroPresets, ownedGroupIds],
  )

  const filteredMacroPresets = useMemo(() => {
    return sortedMacroPresets.filter((group) => {
      const entries = groupPreviewById[group.id]?.entries || []
      const hasUsage = (groupThreadUsageById[group.id] || []).length > 0
      const ownerName = `${group.ownerCounter?.name || ''} ${group.ownerCounter?.username || ''} ${group.ownerCounter?.uuid || ''}`.toLowerCase()
      const name = (group.name || '').toLowerCase()
      const handle = (group.handle || '').toLowerCase()
      const threadUsageNames = (groupThreadUsageById[group.id] || [])
        .map((row) => `${row.threadName || ''} ${row.threadTitle || ''}`.toLowerCase())
        .join(' ')
      const previewText = entries
        .map((entry) => `${entry.triggerKey} ${entry.macroType} ${JSON.stringify(entry.payloadJson || {})}`)
        .join(' ')
        .toLowerCase()
      const freeTextHaystack =
        `${name} ${handle} ${(group.description || '').toLowerCase()} ${ownerName} ${threadUsageNames} ${previewText}`.trim()

      if (searchFilters.creator && !ownerName.includes(searchFilters.creator.toLowerCase())) return false
      if (searchFilters.name && !name.includes(searchFilters.name.toLowerCase())) return false
      if (searchFilters.handle && !handle.includes(searchFilters.handle.toLowerCase())) return false
      if (searchFilters.threadMode === 'used' && !hasUsage) return false
      if (searchFilters.threadMode === 'none' && hasUsage) return false
      if (searchFilters.thread && !threadUsageNames.includes(searchFilters.thread.toLowerCase())) return false
      if (searchFilters.freeText && !freeTextHaystack.includes(searchFilters.freeText.toLowerCase())) return false
      return true
    })
  }, [
    sortedMacroPresets,
    searchFilters,
    groupPreviewById,
    groupThreadUsageById,
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

  const copyToDraft = (group: MacroPreset) => {
    if (viewMode === 'create') {
      const confirmed = window.confirm('Replace your current draft with this copied macro preset?')
      if (!confirmed) {
        return
      }
    }

    const preview = groupPreviewById[group.id]
    setDraftSeed({
      token: Date.now(),
      name: `${group.name} (copy)`,
      handle: '',
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
        <Alert severity="info">You must be logged in to use macro presets.</Alert>
      </Container>
    )
  }

  if (!macroPresetsEnabled) {
    return (
      <Container maxWidth="md" sx={{ p: 2 }}>
        <Alert severity="info">Macro presets are currently disabled.</Alert>
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
        Macro Presets
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
            label="Search & Filter Public Groups"
            helperText='Use plain text or filters: creator:pull name:test1 handle:test1 thread:used thread:"main"'
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
            {filteredMacroPresets.map((group) => (
              (() => {
                const entries = groupPreviewById[group.id]?.entries || []
                const previewRows = buildGroupedPreviewRows(entries)
                const usageRows = groupThreadUsageById[group.id] || []
                const topUsage = usageRows[0]
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
                    {group.handle && (
                      <Typography variant="caption" color="text.secondary">
                        /macros/{group.handle}
                      </Typography>
                    )}
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
                          to={`/thread/${encodeURIComponent(topUsage.threadName || topUsage.threadId)}`}
                          label={`Top thread: ${topUsage.threadTitle || topUsage.threadName} (${topUsage.appliesCount})`}
                        />
                      )}
                    </Stack>
                  </Box>
                  <Stack direction={{ xs: 'row', lg: 'column' }} spacing={0.75} alignItems={{ xs: 'center', lg: 'flex-end' }}>
                    {group.handle && (
                      <Button
                        size="small"
                        variant="outlined"
                        component={RouterLink}
                        to={`/macros/${group.handle}`}
                      >
                        Open
                      </Button>
                    )}
                    <Button size="small" variant="contained" onClick={() => copyToDraft(group)}>
                      Copy To Draft
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      {usageRows.length > 0
                        ? `${usageRows.length} thread${usageRows.length > 1 ? 's' : ''} using this`
                        : 'No users set this on a thread yet'}
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
                        to={`/thread/${encodeURIComponent(row.threadName || row.threadId)}`}
                        label={`${row.threadTitle || row.threadName} (${row.appliesCount})`}
                      />
                    ) : (
                      <Chip
                        key={`${group.id}-${row.threadName}`}
                        size="small"
                        variant="outlined"
                        label={`${row.threadTitle || row.threadName} (${row.appliesCount})`}
                      />
                    ),
                  )}
                  {usageRows.length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      No thread users yet
                    </Typography>
                  )}
                </Box>
              </Box>
                )
              })()
            ))}
            {!loading && filteredMacroPresets.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No macro presets found with current search/filters.
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
          <MacroPresetManager
            ownedMacroPresets={ownedMacroPresets}
            refreshMacroPresets={loadMacroPresets}
            draftSeed={draftSeed}
            forcedMode="create"
          />
        </>
      )}

      {viewMode === 'edit' && (
        <MacroPresetManager
          ownedMacroPresets={ownedMacroPresets}
          refreshMacroPresets={loadMacroPresets}
          draftSeed={draftSeed}
          forcedMode="edit"
        />
      )}
      </Container>
    </Box>
  )
}

export default MacroPresetsPage
