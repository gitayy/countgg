import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  getMacroPresetByHandle,
  getMacroPresetThreadUsage,
  getMacroPresetVersion,
  getMacroPresetVersions,
  macroPresetsFeatureEnabled,
} from '../utils/api'
import { MacroEntry, MacroPreset, MacroPresetVersion, MacroPresetThreadUsageRow } from '../utils/types'

const buildEntryRows = (entries: MacroEntry[]): string[] => {
  return entries.map((entry) => {
    const payload = entry.payloadJson || {}
    if (entry.macroType === 'CHAR_INSERT') {
      return `${entry.triggerKey} -> insert "${payload.char || ''}"`
    }
    if (entry.macroType === 'SUBMIT') {
      return `${entry.triggerKey} -> submit`
    }
    if (entry.macroType === 'SUBMIT_ACTION') {
      return `${entry.triggerKey} -> submit + ${String(payload.action || '').toLowerCase()} x${payload.repeat ?? 1}`
    }
    if (entry.macroType === 'ACTION') {
      return `${entry.triggerKey} -> ${String(payload.action || '').toLowerCase()} x${payload.repeat ?? 1}`
    }
    if (entry.macroType === 'COMBO') {
      return `${entry.triggerKey} -> ${String(payload.comboId || '').toLowerCase()}`
    }
    if (entry.macroType === 'TOGGLE') {
      return `${entry.triggerKey} -> toggle`
    }
    return `${entry.triggerKey} -> macro`
  })
}

export const MacroPresetViewPage = () => {
  const { handle } = useParams<{ handle: string }>()
  const [group, setGroup] = useState<MacroPreset | null>(null)
  const [versions, setVersions] = useState<MacroPresetVersion[]>([])
  const [latestEntries, setLatestEntries] = useState<MacroEntry[]>([])
  const [usageRows, setUsageRows] = useState<MacroPresetThreadUsageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const macroRows = useMemo(() => buildEntryRows(latestEntries), [latestEntries])

  useEffect(() => {
    const load = async () => {
      if (!macroPresetsFeatureEnabled) {
        setError('Macro presets are currently disabled.')
        setLoading(false)
        return
      }
      if (!handle?.trim()) {
        setError('Macro handle is missing.')
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const readRes = await getMacroPresetByHandle(handle.trim().toLowerCase())
        const loadedGroup = readRes.data.group
        setGroup(loadedGroup)

        const [versionsRes, usageRes] = await Promise.all([
          getMacroPresetVersions(loadedGroup.id),
          getMacroPresetThreadUsage(loadedGroup.id, 10),
        ])
        const loadedVersions = versionsRes.data || []
        setVersions(loadedVersions)
        setUsageRows(usageRes.data.items || [])

        const latestVersion = loadedVersions[0]
        if (latestVersion?.versionNumber) {
          const fullVersion = await getMacroPresetVersion(
            loadedGroup.id,
            latestVersion.versionNumber,
          )
          setLatestEntries(fullVersion.data.entries || [])
        } else {
          setLatestEntries([])
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load macro preset.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [handle])

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, width: '100%', bgcolor: 'primary.light', py: 2 }}>
        <Container maxWidth="lg">
          <LinearProgress />
        </Container>
      </Box>
    )
  }

  if (error || !group) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Alert severity="error">{error || 'Macro preset not found.'}</Alert>
      </Container>
    )
  }

  return (
    <Box sx={{ flexGrow: 1, width: '100%', bgcolor: 'primary.light', py: 2 }}>
      <Container maxWidth="lg" sx={{ p: 0 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: '10px',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Avatar
                  sx={{ width: 30, height: 30 }}
                  src={
                    (group.ownerCounter?.avatar &&
                      group.ownerCounter.avatar.length > 5 &&
                      `https://cdn.discordapp.com/avatars/${group.ownerCounter.discordId}/${group.ownerCounter.avatar}`) ||
                    'https://cdn.discordapp.com/embed/avatars/0.png'
                  }
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {group.ownerCounter
                    ? `${group.ownerCounter.name || group.ownerCounter.username || 'Unknown'}${group.ownerCounter.username ? ` (@${group.ownerCounter.username})` : ''}`
                    : 'Unknown creator'}
                </Typography>
              </Stack>
              <Typography variant="h5" sx={{ lineHeight: 1.1 }}>
                {group.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {group.description || 'No description'}
              </Typography>
              <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap' }}>
                <Chip size="small" variant="outlined" label={`ID ${group.id}`} />
                <Chip size="small" variant="outlined" label={`${latestEntries.length} entries`} />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Latest v${versions[0]?.versionNumber ?? '-'}`}
                />
                <Chip size="small" variant="outlined" label={`${versions.length} versions`} />
              </Stack>
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignSelf: 'flex-start' }}>
              <Button size="small" variant="outlined" component={RouterLink} to="/macros">
                Back To Macros
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Macros
          </Typography>
          <Stack spacing={0.5}>
            {macroRows.map((row) => (
              <Typography key={row} variant="body2">
                {row}
              </Typography>
            ))}
            {macroRows.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No macro entries in latest version.
              </Typography>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Thread Usage
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {usageRows.map((row) => (
              <Chip
                key={`${row.threadId}-${row.appliesCount}`}
                size="small"
                variant="outlined"
                component={RouterLink}
                clickable
                to={row.threadName ? `/thread/${encodeURIComponent(row.threadName)}` : '/threads'}
                label={`${row.threadTitle || row.threadName} (${row.appliesCount})`}
              />
            ))}
            {usageRows.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No thread users tracked yet.
                </Typography>
              )}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default MacroPresetViewPage
