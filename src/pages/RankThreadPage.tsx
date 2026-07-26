import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { getRankThreadLeaderboard, getRankChallenges, getRankSpeedDistribution, getRankVolumeHistogram } from '../utils/api'
import { ThreadLeaderboardResponse, RankChallenge, SpeedDistribution, VolumeHistogramEntry } from '../utils/types'
import { getChallengeTitle } from '../utils/challengeTitle'
import { useIsMounted } from '../utils/hooks/useIsMounted'
import { RankIconBadge } from '../components/RankIconBadge'
import { Loading } from '../components/Loading'
import { ThresholdLeaderboard } from '../components/ThresholdLeaderboard'
import { formatClockTime, discordAvatarLink } from '../utils/helpers'

const RANK_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond', 'countmeister', 'grandcounter', 'peak']

export const RankThreadPage = () => {
  const { threadName } = useParams<{ threadName: string }>()
  const isMounted = useIsMounted()
  const navigate = useNavigate()
  const location = useLocation()

  const [leaderboard, setLeaderboard] = useState<ThreadLeaderboardResponse | null>(null)
  const [challenges, setChallenges] = useState<RankChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [challengesLoading, setChallengesLoading] = useState(true)
  const [challengeRankFilter, setChallengeRankFilter] = useState<string | null>(null)
  const [splitDist, setSplitDist] = useState<SpeedDistribution | null>(null)
  const [getDist, setGetDist] = useState<SpeedDistribution | null>(null)
  const [volumeHistogram, setVolumeHistogram] = useState<VolumeHistogramEntry[]>([])
  const [leaderboardKind, setLeaderboardKind] = useState<'split_under_ms' | 'get_under_ms' | 'daily_counts'>('split_under_ms')

  useEffect(() => {
    document.title = `${threadName} Rank | Counting!`
    return () => {
      document.title = 'Counting!'
    }
  }, [location.pathname, threadName])

  useEffect(() => {
    if (!threadName) return
    setLoading(true)
    getRankThreadLeaderboard(threadName)
      .then(({ data }) => {
        if (!isMounted.current) return
        setLeaderboard(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        if (isMounted.current) setLoading(false)
      })
  }, [threadName])

  useEffect(() => {
    if (!leaderboard?.thread?.uuid) return
    const threadUuid = leaderboard.thread.uuid
    setChallengesLoading(true)
    getRankChallenges({ threadUuid, limit: 500 })
      .then(({ data }) => {
        if (!isMounted.current) return
        setChallenges(data.items as any[])
        setChallengesLoading(false)
      })
      .catch((err) => {
        console.error(err)
        if (isMounted.current) setChallengesLoading(false)
      })

    // Fetch speed distributions — use default countsPerSplit=100, splitsPerGet=10
    // (these come back quickly since we're just reading from the thread config area)
    getRankSpeedDistribution(threadUuid, 'split', 100, 10)
      .then(({ data }) => {
        if (isMounted.current && data.sampleSize > 0) setSplitDist(data)
      })
      .catch(() => {})
    getRankSpeedDistribution(threadUuid, 'get', 100, 10)
      .then(({ data }) => {
        if (isMounted.current && data.sampleSize > 0) setGetDist(data)
      })
      .catch(() => {})

    // Fetch volume histogram for this thread
    getRankVolumeHistogram(threadUuid)
      .then(({ data }) => {
        if (isMounted.current) setVolumeHistogram(data)
      })
      .catch(() => {})
  }, [leaderboard?.thread?.uuid])

  const ranksPresent = Array.from(new Set(challenges.map((c) => c.rank))).sort((a, b) => RANK_ORDER.indexOf(a) - RANK_ORDER.indexOf(b))

  const filteredChallenges = challengeRankFilter ? challenges.filter((c) => c.rank === challengeRankFilter) : challenges

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', px: 2, py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          {leaderboard?.thread?.title ?? threadName}
        </Typography>
        {leaderboard?.season && (
          <Typography variant="body2" color="text.secondary">
            Season: <strong>{leaderboard.season.name}</strong>
            {leaderboard.season.endedAt == null ? ' · Active' : ''}
          </Typography>
        )}
      </Box>

      {/* Leaderboard */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Leaderboard
      </Typography>
      {loading ? (
        <Loading />
      ) : !leaderboard || leaderboard.entries.length === 0 ? (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography color="text.secondary">No ranking data for this thread yet.</Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Card} variant="outlined" sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 48 }}>#</TableCell>
                <TableCell>Counter</TableCell>
                <TableCell>Rank</TableCell>
                <TableCell align="right">GG (total)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.entries.map((entry, i) => (
                <TableRow
                  key={entry.counterUuid}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/rank/counter/${entry.username}`)}
                >
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {i + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={discordAvatarLink(entry)} sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                        {entry.name?.[0] ?? '?'}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500} sx={{ color: entry.color || 'text.primary' }}>
                        {entry.name || entry.username}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <RankIconBadge rank={entry.rank} division={entry.division} gg={entry.gg} size="mini" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {entry.ggTotal.toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Leaderboards */}
      {leaderboard?.thread?.name && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              Leaderboards
            </Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Metric</InputLabel>
              <Select
                label="Metric"
                value={leaderboardKind}
                onChange={(e) => setLeaderboardKind(e.target.value as typeof leaderboardKind)}
              >
                <MenuItem value="split_under_ms">Split speed</MenuItem>
                <MenuItem value="get_under_ms">Get speed</MenuItem>
                <MenuItem value="daily_counts">Best daily count</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Card variant="outlined">
            <CardContent>
              <ThresholdLeaderboard kind={leaderboardKind} threadName={leaderboard.thread.name} />
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Challenges */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" fontWeight={600}>
          Challenges
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip
            label="All"
            size="small"
            variant={challengeRankFilter == null ? 'filled' : 'outlined'}
            onClick={() => setChallengeRankFilter(null)}
          />
          {ranksPresent.map((r) => (
            <Chip
              key={r}
              label={r.charAt(0).toUpperCase() + r.slice(1)}
              size="small"
              variant={challengeRankFilter === r ? 'filled' : 'outlined'}
              onClick={() => setChallengeRankFilter(r)}
            />
          ))}
        </Box>
      </Box>

      {challengesLoading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : challenges.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">No challenges configured for this thread.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filteredChallenges.map((c) => {
            const isSpeed = c.type === 'split_under_ms' || c.type === 'get_under_ms'
            const speedDist = c.type === 'split_under_ms' ? splitDist : c.type === 'get_under_ms' ? getDist : null
            const thresholdMs: number | null = c.params?.maxMs ?? null
            const percentileFasterThan = speedDist && thresholdMs != null ? computePercentile(thresholdMs, speedDist) : null
            const speedVerb = c.type === 'split_under_ms' ? 'split' : 'get'

            return (
              <Card key={c.id} variant="outlined">
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RankIconBadge rank={c.rank} division={1} size="mini" />
                      {isSpeed && thresholdMs != null ? (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                          <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.1 }}>
                            {formatClockTime(thresholdMs)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Count a {speedVerb} in under
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" fontWeight={600}>
                          {getChallengeTitle(c)}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        ×{c.target}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        +{c.ggReward} GG
                      </Typography>
                    </Box>
                  </Box>
                  {percentileFasterThan != null && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Threshold faster than ~{percentileFasterThan}% of recorded {c.type === 'split_under_ms' ? 'splits' : 'gets'}
                      {speedDist && ` (n=${speedDist.sampleSize.toLocaleString()})`}
                    </Typography>
                  )}
                  {c.type === 'accuracy_rate' && c.params && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {c.params.minAccuracyPercent ?? 100}% accuracy over last {c.params.windowSize ?? 20} count attempts
                      {c.params.validationType ? ` (${c.params.validationType})` : ''}
                    </Typography>
                  )}
                  {c.type === 'thread_counts' && volumeHistogram.length > 0 && <VolumeHistogramBar data={volumeHistogram} />}
                </CardContent>
              </Card>
            )
          })}
        </Box>
      )}
    </Box>
  )
}

function computePercentile(thresholdMs: number, dist: SpeedDistribution): number {
  // Estimate what percentile is faster (lower) than the threshold using known quantile points
  const points: [number, number][] = [
    [0, dist.p10],
    [10, dist.p10],
    [25, dist.p25],
    [50, dist.p50],
    [75, dist.p75],
    [90, dist.p90],
    [100, Infinity],
  ]
  for (let i = 1; i < points.length; i++) {
    const [pLow, vLow] = points[i - 1]
    const [pHigh, vHigh] = points[i]
    if (thresholdMs <= vLow) return pLow
    if (thresholdMs <= vHigh || !isFinite(vHigh)) {
      // interpolate
      if (vHigh === vLow) return pLow
      const t = (thresholdMs - vLow) / (vHigh - vLow)
      return Math.round(pLow + t * (pHigh - pLow))
    }
  }
  return 100
}

function VolumeHistogramBar({ data }: { data: VolumeHistogramEntry[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        Challenge completion volume (7-day buckets)
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 32 }}>
        {data.map((d) => (
          <Box
            key={d.bucket}
            title={`${d.bucket}: ${d.count}`}
            sx={{
              flex: 1,
              height: `${Math.max(4, Math.round((d.count / max) * 32))}px`,
              bgcolor: 'primary.main',
              opacity: 0.7,
              borderRadius: '2px 2px 0 0',
              minWidth: 4,
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
        <Typography variant="caption" color="text.secondary">
          {data[0]?.bucket}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {data[data.length - 1]?.bucket}
        </Typography>
      </Box>
    </Box>
  )
}
