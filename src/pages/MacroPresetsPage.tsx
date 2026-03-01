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
  getMacroPresetSummaries,
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
  const [groupThreadUsageTotalById, setGroupThreadUsageTotalById] = useState<Record<number, number>>({})
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

  const hydrateGroupDetails = useCallback(async (presets: MacroPreset[]) => {
    const presetIds = presets.map((preset) => preset.id)
    if (presetIds.length === 0) {
      setGroupPreviewById({})
      setGroupThreadUsageById({})
      setGroupThreadUsageTotalById({})
      return
    }

    const summaryRes = await getMacroPresetSummaries(presetIds, 3)
    const previews: Record<number, { versionNumber: number | null; entries: MacroEntry[] }> = {}
    const usage: Record<
      number,
      { threadId: string; threadName: string; threadTitle?: string; appliesCount: number }[]
    > = {}
    const usageTotals: Record<number, number> = {}
    const summariesById = new Map(
      (summaryRes.data.items || []).map((item) => [item.macroPresetId, item]),
    )
    presets.forEach((preset) => {
      const summary = summariesById.get(preset.id)
      previews[preset.id] = {
        versionNumber: summary?.latestVersionNumber ?? null,
        entries: summary?.entries || [],
      }
      usage[preset.id] = (summary?.threadUsage || []).map((row) => ({
        threadId: row.threadId,
        threadName: row.threadName,
        threadTitle: row.threadTitle,
        appliesCount: row.appliesCount,
      }))
      usageTotals[preset.id] = summary?.threadUsageTotal ?? 0
    })

    setGroupPreviewById(previews)
    setGroupThreadUsageById(usage)
    setGroupThreadUsageTotalById(usageTotals)
  }, [])

  const loadMacroPresets = useCallback(async () => {
    if (!macroPresetsEnabled) return
    setLoading(true)
    setError('')
    try {
      const groupsRes = await listMacroPresets(
        page,
        PAGE_SIZE,
        searchFilters.freeText || undefined,
        false,
        searchFilters.creator || undefined,
      )
      setTotal(groupsRes.data.total || 0)
      const itemsWithPinned = groupsRes.data.items || []
      setMacroPresets(itemsWithPinned)
      setOwnedGroupIds(
        new Set(
          itemsWithPinned
            .filter((item) => item.ownerCounter?.discordId === user?.discordId)
            .map((item) => item.id),
        ),
      )
      await hydrateGroupDetails(itemsWithPinned)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load macro presets')
    } finally {
      setLoading(false)
    }
  }, [macroPresetsEnabled, page, searchFilters, hydrateGroupDetails, user?.discordId])

  useEffect(() => {
    loadMacroPresets()
  }, [loadMacroPresets])

  const sortedMacroPresets = useMemo(
    () => prioritizeOwnedMacroPresets(macroPresets, ownedGroupIds),
    [macroPresets, ownedGroupIds],
  )

  const filteredMacroPresets = useMemo(() => {
    return sortedMacroPresets.filter((preset) => {
      const entries = groupPreviewById[preset.id]?.entries || []
      const hasUsage = (groupThreadUsageById[preset.id] || []).length > 0
      const ownerName = `${preset.ownerCounter?.name || ''} ${preset.ownerCounter?.username || ''} ${preset.ownerCounter?.uuid || ''}`.toLowerCase()
      const name = (preset.name || '').toLowerCase()
      const handle = (preset.handle || '').toLowerCase()
      const threadUsageNames = (groupThreadUsageById[preset.id] || [])
        .map((row) => `${row.threadName || ''} ${row.threadTitle || ''}`.toLowerCase())
        .join(' ')
      const previewText = entries
        .map((entry) => `${entry.triggerKey} ${entry.macroType} ${JSON.stringify(entry.payloadJson || {})}`)
        .join(' ')
        .toLowerCase()
      const freeTextHaystack =
        `${name} ${handle} ${(preset.description || '').toLowerCase()} ${ownerName} ${threadUsageNames} ${previewText}`.trim()

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
    const presets: Record<string, string[]> = {
      'Character remaps': [],
      Submit: [],
      Actions: [],
      Combos: [],
      Toggle: [],
    }

    entries.forEach((entry) => {
      const payload = entry.payloadJson || {}
      if (entry.macroType === 'CHAR_INSERT') {
        presets['Character remaps'].push(`${entry.triggerKey}->${payload.char || ''}`)
        return
      }
      if (entry.macroType === 'SUBMIT') {
        presets.Submit.push(entry.triggerKey)
        return
      }
      if (entry.macroType === 'SUBMIT_ACTION') {
        presets.Submit.push(
          `${entry.triggerKey}+${String(payload.action || '').toLowerCase()} x${payload.repeat ?? 1}`,
        )
        return
      }
      if (entry.macroType === 'ACTION') {
        presets.Actions.push(
          `${entry.triggerKey}:${String(payload.action || '').toLowerCase()} x${payload.repeat ?? 1}`,
        )
        return
      }
      if (entry.macroType === 'COMBO') {
        presets.Combos.push(`${entry.triggerKey}:${String(payload.comboId || '').toLowerCase()}`)
        return
      }
      if (entry.macroType === 'TOGGLE') {
        presets.Toggle.push(entry.triggerKey)
      }
    })

    return Object.entries(presets)
      .filter(([, items]) => items.length > 0)
      .slice(0, 4)
      .map(([label, items]) => `${label}: ${items.slice(0, 4).join(', ')}${items.length > 4 ? ` +${items.length - 4}` : ''}`)
  }

  const copyToDraft = (preset: MacroPreset) => {
    if (viewMode === 'create') {
      const confirmed = window.confirm('Replace your current draft with this copied macro preset?')
      if (!confirmed) {
        return
      }
    }

    const preview = groupPreviewById[preset.id]
    setDraftSeed({
      token: Date.now(),
      name: `${preset.name} (copy)`,
      handle: '',
      description: preset.description || '',
      entries: (preview?.entries || []).map((entry) => ({
        triggerKey: entry.triggerKey,
        macroType: entry.macroType,
        payloadJson: entry.payloadJson as MacroEntryPayload,
      })),
    })
    setCopyNotice(`Copied "${preset.name}" into draft.`)
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
        Discover public presets or build and version your own.
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
          <Tab disableRipple label="Edit" value="edit" />
        </Tabs>
      </Stack>
      </Box>

      {viewMode === 'discover' && (
        <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'background.paper', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Public Presets
          </Typography>
          <TextField
            label="Search & Filter Public Presets"
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
            {filteredMacroPresets.map((preset) => (
              (() => {
                const entries = groupPreviewById[preset.id]?.entries || []
                const previewRows = buildGroupedPreviewRows(entries)
                const usageRows = groupThreadUsageById[preset.id] || []
                const topUsage = usageRows[0]
                return (
              <Box
                key={preset.id}
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
                          (preset.ownerCounter?.avatar &&
                            preset.ownerCounter.avatar.length > 5 &&
                            `https://cdn.discordapp.com/avatars/${preset.ownerCounter.discordId}/${preset.ownerCounter.avatar}`) ||
                          'https://cdn.discordapp.com/embed/avatars/0.png'
                        }
                      >
                        {preset.ownerCounter?.name?.[0]?.toUpperCase() || preset.ownerCounter?.username?.[0]?.toUpperCase() || '?'}
                      </Avatar>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {preset.ownerCounter
                          ? `${preset.ownerCounter.name || preset.ownerCounter.username || 'Unknown'}${preset.ownerCounter.username ? ` (@${preset.ownerCounter.username})` : ''}`
                          : 'Unknown creator'}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {preset.name}
                    </Typography>
                    {preset.handle && (
                      <Typography variant="caption" color="text.secondary">
                        /macros/{preset.handle}
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
                      {preset.description || 'No description'}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ mt: 0.85, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`v${groupPreviewById[preset.id]?.versionNumber ?? '-'}`}
                      />
                      <Chip size="small" variant="outlined" label={`${entries.length} mappings`} />
                      {ownedGroupIds.has(preset.id) && (
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
                    {preset.handle && (
                      <Button
                        size="small"
                        variant="outlined"
                        component={RouterLink}
                        to={`/macros/${preset.handle}`}
                      >
                        Open
                      </Button>
                    )}
                    <Button size="small" variant="contained" onClick={() => copyToDraft(preset)}>
                      Copy To Draft
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      {(groupThreadUsageTotalById[preset.id] || 0) > 0
                        ? `${groupThreadUsageTotalById[preset.id]} thread${groupThreadUsageTotalById[preset.id] > 1 ? 's' : ''} using this`
                        : 'No users set this on a thread yet'}
                    </Typography>
                  </Stack>
                </Stack>
                <Divider sx={{ my: 1.25 }} />
                <Stack spacing={0.4}>
                  {previewRows.map((row) => (
                    <Typography key={`${preset.id}-${row}`} variant="caption" color="text.primary">
                      {row}
                    </Typography>
                  ))}
                  {previewRows.length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      No mappings in latest version.
                    </Typography>
                  )}
                </Stack>
                <Box sx={{ mt: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {usageRows.slice(topUsage ? 1 : 0).map((row) =>
                    row.threadId ? (
                      <Chip
                        key={`${preset.id}-${row.threadId}`}
                        size="small"
                        variant="outlined"
                        component={RouterLink}
                        clickable
                        to={`/thread/${encodeURIComponent(row.threadName || row.threadId)}`}
                        label={`${row.threadTitle || row.threadName} (${row.appliesCount})`}
                      />
                    ) : (
                      <Chip
                        key={`${preset.id}-${row.threadName}`}
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
            refreshMacroPresets={loadMacroPresets}
            draftSeed={draftSeed}
            forcedMode="create"
          />
        </>
      )}

      {viewMode === 'edit' && (
        <MacroPresetManager
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
