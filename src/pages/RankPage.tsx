import { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import {
  getRankSitewideLeaderboard,
  getRankSeasons,
  getRankChallenges,
  getRankCounterProfile,
  getRankGgProjection,
} from '../utils/api'
import { discordAvatarLink } from '../utils/helpers'
import { SitewideLeaderboardResponse, RankSeason, RankChallenge, CounterRankProfileResponse, GgProjection } from '../utils/types'
import { useIsMounted } from '../utils/hooks/useIsMounted'
import { UserContext } from '../utils/contexts/UserContext'
import { ThreadsContext } from '../utils/contexts/ThreadsContext'
import { RankIconBadge } from '../components/RankIconBadge'
import { Loading } from '../components/Loading'
import { RANK_COLORS, RANK_LABELS } from '../utils/rankColors'
import { RankName } from '../utils/types'
import { getChallengeTitle, getPrettyTypeName } from '../utils/challengeTitle'
import {
  CHALLENGE_TYPES,
  SITEWIDE_ONLY_TYPES,
  THREAD_REQUIRED_TYPES,
  RANK_OPTIONS,
  PSEUDO_THREAD_LABELS,
} from '../utils/challengeTypes'

const POSITION_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32']

// ── Challenge card ────────────────────────────────────────────────────────────

const ChallengeCard = ({
  challenge,
  threadName,
  navigate,
}: {
  challenge: RankChallenge
  threadName: string | null
  navigate: (path: string) => void
}) => {
  const [expanded, setExpanded] = useState(false)
  const completers = challenge.topCompleters ?? []
  const count = challenge.completionCount ?? 0

  return (
    <Card
      sx={{
        bgcolor: 'rgba(255,255,255,0.05)',
        border: `1px solid ${RANK_COLORS[challenge.rank] ?? 'rgba(255,255,255,0.1)'}22`,
        borderRadius: 1.5,
      }}
    >
      <Box sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <RankIconBadge rank={challenge.rank} division={1} size="mini" />
            <Typography variant="body2" fontWeight={700} sx={{ color: '#fff' }}>
              {getChallengeTitle(challenge)}
            </Typography>
            {threadName && (
              <Chip
                label={threadName}
                size="small"
                sx={{ fontSize: '0.65rem', height: 18, bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: RANK_COLORS[challenge.rank] ?? '#fff', fontWeight: 700 }}>
              +{challenge.ggReward} GG
            </Typography>
            <Chip
              label={`${count} ${count === 1 ? 'completion' : 'completions'}`}
              size="small"
              sx={{ fontSize: '0.65rem', height: 18, bgcolor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
            Target: {challenge.target.toLocaleString()}
            {challenge.params &&
              ` · ${Object.entries(challenge.params)
                .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                .join(', ')}`}
          </Typography>
        </Box>

        {completers.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Button
              size="small"
              endIcon={expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
              onClick={() => setExpanded((v) => !v)}
              sx={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.7rem',
                p: 0,
                minWidth: 0,
                textTransform: 'none',
                '&:hover': { color: 'rgba(255,255,255,0.7)', bgcolor: 'transparent' },
              }}
            >
              {expanded ? 'Hide' : 'Show'} first {completers.length} completer{completers.length !== 1 ? 's' : ''}
            </Button>
            <Collapse in={expanded}>
              <Box sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {completers.map((c, i) => (
                  <Box
                    key={c.counterUuid}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      cursor: 'pointer',
                      '&:hover .name': { textDecoration: 'underline' },
                    }}
                    onClick={() => navigate(`/counter/${c.username}`)}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: POSITION_COLORS[i] ?? 'rgba(255,255,255,0.3)', fontWeight: 700, minWidth: 16 }}
                    >
                      #{i + 1}
                    </Typography>
                    <Typography className="name" variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      {c.name || c.username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', ml: 'auto' }}>
                      {new Date(c.completedAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: RANK_COLORS[challenge.rank] ?? '#fff' }}>
                      +{c.ggAwarded} GG
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}
      </Box>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export const RankPage = () => {
  const { counter } = useContext(UserContext)
  const { allThreads } = useContext(ThreadsContext)
  const isMounted = useIsMounted()
  const navigate = useNavigate()
  const location = useLocation()

  const [pageTab, setPageTab] = useState('leaderboard')

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<SitewideLeaderboardResponse | null>(null)
  const LEADERBOARD_PAGE_SIZE = 25
  const [leaderboardPage, setLeaderboardPage] = useState(0)
  const [seasons, setSeasons] = useState<RankSeason[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | undefined>(undefined)
  const [lbLoading, setLbLoading] = useState(true)
  const [leaderboardSearch, setLeaderboardSearch] = useState('')
  const myRowRef = useRef<HTMLTableRowElement>(null)

  // Challenges state
  const [challenges, setChallenges] = useState<RankChallenge[]>([])
  const [challengesTotal, setChallengesTotal] = useState(0)
  const [challengesOffset, setChallengesOffset] = useState(0)
  const [challengesLoading, setChallengesLoading] = useState(false)
  const [challengesLoadingMore, setChallengesLoadingMore] = useState(false)
  // The primary selector: which challenge type the coverage grid + list are scoped to.
  const [challengeType, setChallengeType] = useState<string>('')
  // Which grid cell (thread/sitewide + rank) is selected, revealing that combo's challenges
  // below. null = nothing selected yet (grid shown, list hidden).
  const [selectedCell, setSelectedCell] = useState<{ threadUuid: string | null; rank: RankName } | null>(null)
  // Which thread row was clicked — shows ALL challenges for that thread across all ranks.
  // '__sitewide__' is the sentinel for the Sitewide row. null = not in thread-view mode.
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  // All challenges of the selected type (untyped-filtered, unpaginated within the type) — used
  // purely to compute the coverage grid's per-cell counts. Small enough per-type to fetch whole.
  const [typeMatrixChallenges, setTypeMatrixChallenges] = useState<RankChallenge[]>([])
  const [typeMatrixLoading, setTypeMatrixLoading] = useState(false)
  const PAGE_SIZE = 20

  // My Progress tab state
  const [myProfile, setMyProfile] = useState<CounterRankProfileResponse | null>(null)
  const [myProjection, setMyProjection] = useState<GgProjection | null>(null)
  const [myProgressLoading, setMyProgressLoading] = useState(false)
  const [myProgressLoaded, setMyProgressLoaded] = useState(false)

  useEffect(() => {
    document.title = 'Rank | Counting!'
    return () => {
      document.title = 'Counting!'
    }
  }, [location.pathname])

  useEffect(() => {
    getRankSeasons()
      .then(({ data }) => {
        if (!isMounted.current) return
        setSeasons(data)
        const active = data.find((s) => s.endedAt == null)
        if (active) setSelectedSeasonId(active.id)
        else if (data.length > 0) setSelectedSeasonId(data[0].id)
      })
      .catch(console.error)
  }, [])

  // Reset to page 1 whenever the season changes, so a page offset from a previous season
  // doesn't get carried over into a leaderboard that may have far fewer entries.
  useEffect(() => {
    setLeaderboardPage(0)
  }, [selectedSeasonId])

  useEffect(() => {
    setLbLoading(true)
    getRankSitewideLeaderboard(selectedSeasonId, LEADERBOARD_PAGE_SIZE, leaderboardPage * LEADERBOARD_PAGE_SIZE)
      .then(({ data }) => {
        if (!isMounted.current) return
        setLeaderboard(data)
        setLbLoading(false)
      })
      .catch((err) => {
        console.error(err)
        if (isMounted.current) setLbLoading(false)
      })
  }, [selectedSeasonId, leaderboardPage])

  const loadChallenges = (cell: { threadUuid: string | null; rank: RankName }, type: string, offset: number, append: boolean) => {
    const isFirst = !append
    if (isFirst) setChallengesLoading(true)
    else setChallengesLoadingMore(true)

    const params: Parameters<typeof getRankChallenges>[0] = {
      type,
      rank: cell.rank,
      context: true,
      limit: PAGE_SIZE,
      offset,
    }
    if (cell.threadUuid !== null) params.threadUuid = cell.threadUuid
    else params.sitewideOnly = true

    getRankChallenges(params)
      .then(({ data }) => {
        if (!isMounted.current) return
        setChallenges((prev) => (append ? [...prev, ...data.items] : data.items))
        setChallengesTotal(data.total)
        setChallengesOffset(offset + data.items.length)
        setChallengesLoading(false)
        setChallengesLoadingMore(false)
      })
      .catch((err) => {
        console.error(err)
        if (isMounted.current) {
          setChallengesLoading(false)
          setChallengesLoadingMore(false)
        }
      })
  }

  // Fetch every challenge of the selected type (small per-type set) to compute the coverage
  // grid's per-cell counts, whenever the type selector changes. Clears the drilled-in selection
  // since it no longer necessarily applies to the new type.
  useEffect(() => {
    setSelectedCell(null)
    setSelectedThread(null)
    setChallenges([])
    if (pageTab !== 'challenges' || !challengeType) {
      setTypeMatrixChallenges([])
      return
    }
    setTypeMatrixLoading(true)
    getRankChallenges({ type: challengeType, limit: 1000 })
      .then(({ data }) => {
        if (!isMounted.current) return
        setTypeMatrixChallenges(data.items)
        setTypeMatrixLoading(false)
      })
      .catch((err) => {
        console.error(err)
        if (isMounted.current) setTypeMatrixLoading(false)
      })
  }, [pageTab, challengeType])

  // Load the drilled-in challenge list whenever a grid cell is selected
  useEffect(() => {
    if (!selectedCell || !challengeType) return
    setChallengesOffset(0)
    loadChallenges(selectedCell, challengeType, 0, false)
  }, [selectedCell, challengeType])

  // My Progress: fetch once on first opening the tab (logged-in counters only)
  useEffect(() => {
    if (pageTab !== 'my-progress' || myProgressLoaded || !counter?.username) return
    setMyProgressLoading(true)
    Promise.all([getRankCounterProfile(counter.username, selectedSeasonId), getRankGgProjection(counter.username, selectedSeasonId)])
      .then(([profileRes, projectionRes]) => {
        if (!isMounted.current) return
        setMyProfile(profileRes.data)
        setMyProjection(projectionRes.data)
        setMyProgressLoaded(true)
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted.current) setMyProgressLoading(false)
      })
  }, [pageTab, counter?.username, myProgressLoaded, selectedSeasonId])

  const activeSeason = leaderboard?.season

  const hasMore = challenges.length < challengesTotal

  const threadNameMap = new Map(allThreads.map((t) => [t.uuid, t.title || t.name]))

  // Coverage grid rows: sitewide-only types get a single synthetic "Sitewide" row; thread-
  // required types list every thread the type's challenges actually reference; optionally-
  // thread-scoped types list those threads plus a Sitewide row.
  const matrixSitewideOnly = SITEWIDE_ONLY_TYPES.has(challengeType)
  const matrixThreadRequired = THREAD_REQUIRED_TYPES.has(challengeType)
  const matrixThreadUuids = Array.from(new Set(typeMatrixChallenges.map((c) => c.threadUuid).filter(Boolean) as string[]))
  type MatrixRow = { key: string; label: string; threadUuid: string | null }
  const matrixRows: MatrixRow[] = matrixSitewideOnly
    ? [{ key: 'sitewide', label: 'Sitewide', threadUuid: null }]
    : [
        ...(matrixThreadRequired ? [] : [{ key: 'sitewide', label: 'Sitewide', threadUuid: null }]),
        ...matrixThreadUuids.map((uuid) => ({
          key: uuid,
          label: PSEUDO_THREAD_LABELS[uuid] ?? threadNameMap.get(uuid) ?? uuid.slice(0, 8),
          threadUuid: uuid,
        })),
      ]
  const countFor = (threadUuid: string | null, rank: RankName): number =>
    typeMatrixChallenges.filter((c) => (c.threadUuid ?? null) === threadUuid && c.rank === rank).length

  // All challenges for the selected thread row, sorted by rank order then sequence.
  const threadViewChallenges: RankChallenge[] = selectedThread
    ? typeMatrixChallenges
        .filter((c) => {
          const uuid = c.threadUuid ?? null
          return selectedThread === '__sitewide__' ? uuid === null : uuid === selectedThread
        })
        .sort((a, b) => {
          const ri = RANK_OPTIONS.indexOf(a.rank) - RANK_OPTIONS.indexOf(b.rank)
          if (ri !== 0) return ri
          return (a.sequence ?? 0) - (b.sequence ?? 0)
        })
    : []

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EmojiEventsIcon sx={{ fontSize: 36, color: '#ffd700' }} />
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                Sitewide Rank
              </Typography>
              {activeSeason && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.25 }}>
                  {activeSeason.name}
                  {activeSeason.endedAt == null
                    ? ' · Active'
                    : ` · Ended ${new Date(Number(activeSeason.endedAt)).toLocaleDateString()}`}
                </Typography>
              )}
            </Box>
          </Box>
          {counter?.roles?.includes('admin') && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/rank/admin')}
              sx={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'rgba(255,255,255,0.7)',
                '&:hover': { borderColor: '#fff', color: '#fff' },
              }}
            >
              Admin
            </Button>
          )}
        </Box>

        <TabContext value={pageTab}>
          <TabList
            onChange={(_, v) => setPageTab(v)}
            sx={{
              mb: 2,
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', fontWeight: 600 },
              '& .Mui-selected': { color: '#fff' },
              '& .MuiTabs-indicator': { bgcolor: '#ffd700' },
            }}
          >
            <Tab label="Leaderboard" value="leaderboard" />
            <Tab label="Challenges" value="challenges" />
            {counter && <Tab label="My Progress" value="my-progress" />}
          </TabList>

          {/* ── Leaderboard tab ── */}
          <TabPanel value="leaderboard" sx={{ p: 0 }}>
            {/* Season selector */}
            {seasons.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {seasons.map((s) => (
                  <Chip
                    key={s.id}
                    label={s.endedAt == null ? `${s.name} (active)` : s.name}
                    variant={selectedSeasonId === s.id ? 'filled' : 'outlined'}
                    onClick={() => setSelectedSeasonId(s.id)}
                    size="small"
                    sx={
                      selectedSeasonId === s.id
                        ? { bgcolor: '#ffd700', color: '#000', fontWeight: 700, border: 'none' }
                        : { borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.6)' }
                    }
                  />
                ))}
              </Box>
            )}

            {/* Search + jump-to-me */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search this page by name or username…"
                value={leaderboardSearch}
                onChange={(e) => setLeaderboardSearch(e.target.value)}
                sx={{
                  flex: '1 1 240px',
                  '& .MuiOutlinedInput-root': { color: '#fff' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
                }}
              />
              {counter && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setLeaderboardSearch('')
                    setTimeout(() => myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
                  }}
                  sx={{ borderColor: 'rgba(255,215,0,0.5)', color: '#ffd700', whiteSpace: 'nowrap' }}
                >
                  Jump to me
                </Button>
              )}
            </Box>

            {lbLoading ? (
              <Loading />
            ) : !leaderboard || leaderboard.entries.length === 0 ? (
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>No ranking data for this season yet.</Typography>
                </Box>
              </Card>
            ) : (
              <TableContainer
                component={Card}
                sx={{ bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}
              >
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        '& th': {
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.45)',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        },
                      }}
                    >
                      <TableCell sx={{ width: 56 }}>#</TableCell>
                      <TableCell>Counter</TableCell>
                      <TableCell>Rank</TableCell>
                      <TableCell align="right">Total GG</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaderboard.entries
                      .map((entry, i) => ({ entry, i }))
                      .filter(({ entry }) => {
                        if (!leaderboardSearch.trim()) return true
                        const q = leaderboardSearch.trim().toLowerCase()
                        return entry.username.toLowerCase().includes(q) || (entry.name ?? '').toLowerCase().includes(q)
                      })
                      .map(({ entry, i }) => {
                        const position = leaderboardPage * LEADERBOARD_PAGE_SIZE + i
                        const posColor = POSITION_COLORS[position] ?? null
                        const rankColor = RANK_COLORS[entry.rank] ?? 'rgba(255,255,255,0.15)'
                        const isMe = counter?.username === entry.username
                        return (
                          <TableRow
                            key={entry.counterUuid}
                            ref={isMe ? myRowRef : undefined}
                            hover
                            sx={{
                              cursor: 'pointer',
                              borderLeft: isMe
                                ? '3px solid #ffd700'
                                : position < 3
                                  ? `3px solid ${posColor}`
                                  : '3px solid transparent',
                              outline: isMe ? '1px solid rgba(255,215,0,0.4)' : undefined,
                              '& td': { borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#fff' },
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                              '&:last-child td': { borderBottom: 'none' },
                              bgcolor: isMe
                                ? 'rgba(255,215,0,0.08)'
                                : position === 0
                                  ? 'rgba(255,215,0,0.04)'
                                  : position === 1
                                    ? 'rgba(192,192,192,0.03)'
                                    : position === 2
                                      ? 'rgba(205,127,50,0.03)'
                                      : 'transparent',
                            }}
                            onClick={() => navigate(`/counter/${entry.username}`)}
                          >
                            <TableCell>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                sx={{ color: posColor ?? 'rgba(255,255,255,0.35)', fontSize: position < 3 ? '1rem' : '0.85rem' }}
                              >
                                {position + 1}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar
                                  src={discordAvatarLink(entry)}
                                  sx={{ width: 32, height: 32, fontSize: '0.8rem', border: `2px solid ${rankColor}` }}
                                >
                                  {entry.name?.[0] ?? '?'}
                                </Avatar>
                                <Typography variant="body2" fontWeight={600} sx={{ color: entry.color || '#fff' }}>
                                  {entry.name || entry.username}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <RankIconBadge rank={entry.rank} division={entry.division} size="mini" />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700} sx={{ color: rankColor }}>
                                {entry.totalGg.toLocaleString()} GG
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {leaderboard && leaderboard.total > LEADERBOARD_PAGE_SIZE && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mt: 2 }}>
                <IconButton
                  size="small"
                  disabled={leaderboardPage === 0}
                  onClick={() => setLeaderboardPage((p) => Math.max(0, p - 1))}
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Page {leaderboardPage + 1} of {Math.ceil(leaderboard.total / LEADERBOARD_PAGE_SIZE)}
                </Typography>
                <IconButton
                  size="small"
                  disabled={(leaderboardPage + 1) * LEADERBOARD_PAGE_SIZE >= leaderboard.total}
                  onClick={() => setLeaderboardPage((p) => p + 1)}
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            )}
          </TabPanel>

          {/* ── Challenges tab ── */}
          <TabPanel value="challenges" sx={{ p: 0 }}>
            {/* Primary selector: challenge type */}
            <FormControl size="small" sx={{ minWidth: 260, mb: 2 }}>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>Challenge type</InputLabel>
              <Select
                label="Challenge type"
                value={challengeType}
                onChange={(e) => setChallengeType(e.target.value)}
                sx={{
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
                }}
              >
                <MenuItem value="">
                  <em>Select a type…</em>
                </MenuItem>
                {CHALLENGE_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {getPrettyTypeName(t)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {!challengeType ? (
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Pick a challenge type to see coverage.</Typography>
                </Box>
              </Card>
            ) : typeMatrixLoading ? (
              <Loading />
            ) : (
              <>
                {/* Coverage grid — click a cell to reveal that thread/sitewide + rank's challenges */}
                <TableContainer
                  component={Card}
                  variant="outlined"
                  sx={{
                    mb: 2,
                    maxHeight: 420,
                    overflow: 'auto',
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: '#16213e', color: 'rgba(255,255,255,0.45)' }}>Thread</TableCell>
                        {RANK_OPTIONS.map((r) => (
                          <TableCell key={r} align="center" sx={{ bgcolor: '#16213e', color: 'rgba(255,255,255,0.45)' }}>
                            {r}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {matrixRows.map((row) => {
                        const rowKey = row.threadUuid ?? '__sitewide__'
                        const isThreadSelected = selectedThread === rowKey
                        const rowTotal = RANK_OPTIONS.reduce((sum, r) => sum + countFor(row.threadUuid, r), 0)
                        return (
                          <TableRow key={row.key}>
                            <TableCell
                              onClick={() => {
                                if (rowTotal === 0) return
                                setSelectedCell(null)
                                setSelectedThread(isThreadSelected ? null : rowKey)
                              }}
                              sx={{
                                color: isThreadSelected ? '#ffd700' : '#fff',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                cursor: rowTotal > 0 ? 'pointer' : 'default',
                                fontWeight: isThreadSelected ? 700 : 400,
                                bgcolor: isThreadSelected ? 'rgba(255,215,0,0.08)' : undefined,
                                '&:hover': rowTotal > 0 ? { color: '#ffd700', bgcolor: 'rgba(255,215,0,0.06)' } : undefined,
                                userSelect: 'none',
                              }}
                            >
                              {row.label}
                            </TableCell>
                            {RANK_OPTIONS.map((r) => {
                              const count = countFor(row.threadUuid, r)
                              const isSelected = selectedCell?.threadUuid === row.threadUuid && selectedCell?.rank === r
                              return (
                                <TableCell
                                  key={r}
                                  align="center"
                                  onClick={() => {
                                    if (count === 0) return
                                    setSelectedThread(null)
                                    setSelectedCell({ threadUuid: row.threadUuid, rank: r })
                                  }}
                                  sx={{
                                    cursor: count > 0 ? 'pointer' : 'default',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    bgcolor: isSelected
                                      ? 'rgba(255,215,0,0.25)'
                                      : count === 0
                                        ? 'rgba(244,67,54,0.1)'
                                        : 'rgba(76,175,80,0.1)',
                                    color: isSelected ? '#ffd700' : count === 0 ? '#f44336' : '#66bb6a',
                                    fontWeight: 600,
                                    '&:hover': count > 0 ? { bgcolor: 'rgba(255,215,0,0.15)' } : undefined,
                                  }}
                                >
                                  {count === 0 ? '—' : count}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        )
                      })}
                      {matrixRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={RANK_OPTIONS.length + 1}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                              No challenges of this type yet.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Thread-view: all challenges for the selected thread row */}
                {selectedThread && (
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#ffd700', mb: 1 }}>
                      {selectedThread === '__sitewide__'
                        ? 'Sitewide'
                        : threadNameMap.get(selectedThread) ?? selectedThread.slice(0, 8)}{' '}
                      · All ranks
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {threadViewChallenges.map((c) => (
                        <ChallengeCard
                          key={c.id}
                          challenge={c}
                          threadName={c.threadUuid ? threadNameMap.get(c.threadUuid) ?? c.threadUuid.slice(0, 8) : null}
                          navigate={navigate}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Drilled-in challenge list for the selected cell */}
                {selectedCell && (
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: RANK_COLORS[selectedCell.rank] ?? '#fff', mb: 1 }}>
                      {selectedCell.threadUuid
                        ? threadNameMap.get(selectedCell.threadUuid) ?? selectedCell.threadUuid.slice(0, 8)
                        : 'Sitewide'}{' '}
                      · <span style={{ textTransform: 'capitalize' }}>{selectedCell.rank}</span>
                    </Typography>
                    {challengesLoading ? (
                      <Loading />
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {challenges.map((c) => (
                          <ChallengeCard
                            key={c.id}
                            challenge={c}
                            threadName={c.threadUuid ? threadNameMap.get(c.threadUuid) ?? c.threadUuid.slice(0, 8) : null}
                            navigate={navigate}
                          />
                        ))}
                      </Box>
                    )}

                    {/* Load more / counter */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, pt: 2 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                        Showing {challenges.length} of {challengesTotal}
                      </Typography>
                      {hasMore && (
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={challengesLoadingMore}
                          onClick={() => loadChallenges(selectedCell, challengeType, challengesOffset, true)}
                          sx={{
                            borderColor: 'rgba(255,255,255,0.25)',
                            color: 'rgba(255,255,255,0.7)',
                            '&:hover': { borderColor: '#fff', color: '#fff' },
                          }}
                        >
                          {challengesLoadingMore ? 'Loading…' : 'Load more'}
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}
              </>
            )}
          </TabPanel>

          {/* ── My Progress tab ── */}
          {counter && (
            <TabPanel value="my-progress" sx={{ p: 0 }}>
              {myProgressLoading && !myProgressLoaded ? (
                <Loading />
              ) : myProfile ? (
                (() => {
                  const sitewideRow = myProfile.ranks.find((r) => r.threadUuid == null) ?? null
                  const threadRows = myProfile.ranks.filter((r) => r.threadUuid != null).sort((a, b) => b.ggTotal - a.ggTotal)

                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Sitewide summary */}
                      <Card sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {sitewideRow ? (
                              <RankIconBadge rank={sitewideRow.rank} division={sitewideRow.division} gg={sitewideRow.gg} />
                            ) : (
                              <RankIconBadge rank="bronze" division={1} />
                            )}
                            <Box>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                Sitewide total
                              </Typography>
                              <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>
                                {(sitewideRow?.ggTotal ?? 0).toLocaleString()} GG
                              </Typography>
                            </Box>
                          </Box>
                          {myProjection && myProjection.dailyGgAvg > 0 && (
                            <Box sx={{ display: 'flex', gap: 3 }}>
                              <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                  7-day avg
                                </Typography>
                                <Typography variant="body1" fontWeight={700} sx={{ color: '#fff' }}>
                                  {myProjection.dailyGgAvg.toLocaleString()} GG/day
                                </Typography>
                              </Box>
                              {myProjection.targetRank && myProjection.daysToTarget != null && (
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                                    Next: {RANK_LABELS[myProjection.targetRank]}
                                  </Typography>
                                  <Typography variant="body1" fontWeight={700} sx={{ color: '#ffd700' }}>
                                    ~{myProjection.daysToTarget}d
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Card>

                      {/* Per-thread breakdown */}
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        By thread
                      </Typography>
                      {threadRows.length === 0 ? (
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          No per-thread rank progress yet — start counting in a thread to get assigned challenges.
                        </Typography>
                      ) : (
                        <TableContainer
                          component={Card}
                          sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Thread</TableCell>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Rank</TableCell>
                                <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }} align="right">
                                  GG (season total)
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {threadRows.map((row) => {
                                const threadInfo = allThreads.find((t) => t.uuid === row.threadUuid)
                                return (
                                  <TableRow
                                    key={row.id}
                                    hover
                                    sx={{ cursor: threadInfo ? 'pointer' : 'default' }}
                                    onClick={() => threadInfo && navigate(`/thread/${threadInfo.name}`)}
                                  >
                                    <TableCell sx={{ color: '#fff' }}>{threadInfo?.title ?? row.threadUuid}</TableCell>
                                    <TableCell>
                                      <RankIconBadge rank={row.rank} division={row.division} size="mini" />
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: '#fff' }}>
                                      {row.ggTotal.toLocaleString()}
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  )
                })()
              ) : (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  No rank progress yet.
                </Typography>
              )}
            </TabPanel>
          )}
        </TabContext>
      </Box>
    </Box>
  )
}
