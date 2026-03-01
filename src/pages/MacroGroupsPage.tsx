import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Pagination,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { UserContext } from '../utils/contexts/UserContext'
import { listMacroGroups, macroGroupsFeatureEnabled } from '../utils/api'
import { MacroGroup } from '../utils/types'
import MacroGroupManager from '../components/MacroGroupManager'
import { prioritizeOwnedMacroGroups } from '../utils/macroGroups'

const PAGE_SIZE = 25

export const MacroGroupsPage = () => {
  const { user } = useContext(UserContext)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [macroGroups, setMacroGroups] = useState<MacroGroup[]>([])
  const [ownedGroupIds, setOwnedGroupIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const macroGroupsEnabled = macroGroupsFeatureEnabled

  useEffect(() => {
    document.title = 'Macro Groups | Counting!'
    return () => {
      document.title = 'Counting!'
    }
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
      setMacroGroups(groupsRes.data.items || [])
      setOwnedGroupIds(new Set((mineRes.data.items || []).map((item) => item.id)))
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load macro groups')
    } finally {
      setLoading(false)
    }
  }, [macroGroupsEnabled, page, search])

  useEffect(() => {
    loadMacroGroups()
  }, [loadMacroGroups])

  const sortedMacroGroups = useMemo(
    () => prioritizeOwnedMacroGroups(macroGroups, ownedGroupIds),
    [macroGroups, ownedGroupIds],
  )

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
        Browse public groups and manage your own macro versions.
      </Typography>

      {error && (
        <Alert sx={{ mb: 2 }} severity="error">
          {error}
        </Alert>
      )}

      <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'background.paper', mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            label="Search Public Groups"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            fullWidth
          />
          <Button variant="outlined" disabled={loading} onClick={loadMacroGroups}>
            Refresh
          </Button>
          <Button variant="text" component={RouterLink} to="/prefs">
            Back To Prefs
          </Button>
        </Stack>

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
                </Box>
                {ownedGroupIds.has(group.id) && <Chip size="small" color="success" label="Mine" />}
              </Stack>
            </Box>
          ))}
          {sortedMacroGroups.length === 0 && (
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

      <MacroGroupManager macroGroups={sortedMacroGroups} refreshMacroGroups={loadMacroGroups} />
    </Container>
  )
}

export default MacroGroupsPage

