import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  Box,
  CardHeader,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import ClearIcon from '@mui/icons-material/Clear'
import moment from 'moment-timezone'
import { getThreadSpeedPercentileLeaderboard, getThreadDailyCountLeaderboard } from '../utils/api'
import { addCounterToCache, cachedCounters, discordAvatarLink, formatClockTime } from '../utils/helpers'

const STATS_TIMEZONE = 'America/New_York'

type SpeedProps = {
  kind: 'split_under_ms' | 'get_under_ms'
  threadName: string
}

type DailyCountProps = {
  kind: 'daily_counts'
  threadName: string
}

type Props = (SpeedProps | DailyCountProps) & {
  // Called whenever the admin clicks a leaderboard row's value, so the challenge
  // form can be pre-filled with that exact threshold.
  onPickThreshold?: (value: number) => void
  // When the host page already has its own date-range picker (e.g. StatsPage's
  // StatsFiltersBar), pass the resolved YYYY-MM-DD strings here instead of
  // rendering a second, redundant picker.
  externalDateRange?: { startDateStr?: string; endDateStr?: string }
}

type SpeedEntry = { uuid: string; value: number; attempts: number }
type DailyEntry = { uuid: string; bestDay: string; count: number; daysCount: number }

const CounterCell = ({ uuid, navigate }: { uuid: string; navigate: ReturnType<typeof useNavigate> }) => {
  const counter = cachedCounters[uuid]
  if (!counter) return <>{uuid.slice(0, 8)}</>
  if (counter.roles?.includes('banned')) return <>Banned User {counter.uuid}</>
  return (
    <CardHeader
      sx={{ p: 0 }}
      avatar={<Avatar component="span" sx={{ width: 24, height: 24 }} alt={counter.name} src={discordAvatarLink(counter)} />}
      title={
        <Link
          color={counter.color}
          underline="hover"
          href={`/counter/${counter.username}`}
          onClick={(e) => {
            e.preventDefault()
            navigate(`/counter/${counter.username}`)
          }}
        >
          {counter.name}
        </Link>
      }
    />
  )
}

// Shared percentile/leaderboard viewer for split/get speed and daily count totals
// in a given thread. Speed data comes from the same qualifiedCounters-attributed
// per-user distributions already computed for the thread stats speed/split tabs;
// daily counts come from the precomputed per-day leaderboard in the thread's
// stats JSON file. Neither hits the Post table live, so both stay fast even on
// threads with millions of rows. Used both on the public thread rank page
// (context for players) and the admin challenge form (context for setting a
// fair threshold).
export const ThresholdLeaderboard = (props: Props) => {
  const { kind, threadName, onPickThreshold, externalDateRange } = props
  const isSpeed = kind === 'split_under_ms' || kind === 'get_under_ms'
  const usesExternalDateRange = externalDateRange != null
  const navigate = useNavigate()

  // User-facing percentile: 100 = best (fastest speed / most counts), 0 = worst, 50 = median.
  // Speed times are sorted ascending (lower time = better), so the raw quantile fraction the
  // speed backend expects is inverted from the user-facing value. Daily counts are sorted
  // ascending too, but higher count = better, so the daily-count backend already expects the
  // user-facing value directly (no inversion).
  const [percentile, setPercentile] = useState(100)
  const [percentileInput, setPercentileInput] = useState('100')
  // Debounced so typing a percentile doesn't fire a request (and re-parse the thread's
  // multi-MB stats JSON) on every keystroke.
  const [debouncedPercentile, setDebouncedPercentile] = useState(percentile)
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedPercentile(percentile), 400)
    return () => clearTimeout(timeout)
  }, [percentile])
  const backendPercentile = isSpeed ? 100 - debouncedPercentile : debouncedPercentile
  const [startDate, setStartDate] = useState<any | null>(null)
  const [endDate, setEndDate] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [speedEntries, setSpeedEntries] = useState<SpeedEntry[]>([])
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([])
  // Client-side filter on each row's number of attempts (speed tables) or days counted
  // (daily counts table), so callers can e.g. exclude one-off outliers.
  const [minDaysInput, setMinDaysInput] = useState('')
  const [maxDaysInput, setMaxDaysInput] = useState('')
  const minDays = minDaysInput !== '' && Number.isFinite(Number(minDaysInput)) ? Number(minDaysInput) : undefined
  const maxDays = maxDaysInput !== '' && Number.isFinite(Number(maxDaysInput)) ? Number(maxDaysInput) : undefined

  const startDateStr = usesExternalDateRange
    ? externalDateRange.startDateStr
    : startDate?.isValid?.()
      ? startDate.format('YYYY-MM-DD')
      : undefined
  const endDateStr = usesExternalDateRange
    ? externalDateRange.endDateStr
    : endDate?.isValid?.()
      ? endDate.format('YYYY-MM-DD')
      : undefined

  useEffect(() => {
    if (!threadName) return
    let stale = false
    setLoading(true)
    if (isSpeed) {
      getThreadSpeedPercentileLeaderboard(threadName, kind === 'split_under_ms' ? 'splitSpeed' : 'speed', backendPercentile, startDateStr, endDateStr)
        .then(({ data }) => {
          if (stale) return
          for (const counter of data.counters ?? []) {
            addCounterToCache(counter)
          }
          const rows = (data.distributionStats ?? [])
            .filter((r) => typeof r.custom === 'number')
            .map((r) => ({ uuid: r.uuid, value: r.custom as number, attempts: r.attempts }))
            .sort((a, b) => a.value - b.value)
          setSpeedEntries(rows)
        })
        .catch(() => {
          if (!stale) setSpeedEntries([])
        })
        .finally(() => {
          if (!stale) setLoading(false)
        })
    } else {
      getThreadDailyCountLeaderboard(threadName, startDateStr, endDateStr, backendPercentile)
        .then(({ data }) => {
          if (stale) return
          for (const counter of data.counters) {
            addCounterToCache(counter)
          }
          setDailyEntries(data.entries)
        })
        .catch(() => {
          if (!stale) setDailyEntries([])
        })
        .finally(() => {
          if (!stale) setLoading(false)
        })
    }
    return () => {
      stale = true
    }
  }, [threadName, kind, backendPercentile, startDateStr, endDateStr, isSpeed])

  const filterControls = (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 1.5 }}>
      {(isSpeed || kind === 'daily_counts') && (
        <TextField
          label="Percentile"
          type="number"
          size="small"
          value={percentileInput}
          onChange={(e) => {
            const raw = e.target.value
            setPercentileInput(raw)
            const parsed = Number(raw)
            if (raw !== '' && Number.isFinite(parsed)) {
              setPercentile(Math.min(100, Math.max(0, Math.round(parsed))))
            }
          }}
          onBlur={() => setPercentileInput(String(percentile))}
          slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }}
          helperText={
            percentile === 100 ? 'Best' : percentile === 0 ? 'Worst' : percentile === 50 ? 'Median' : undefined
          }
          sx={{ width: 140 }}
        />
      )}
      <TextField
        label={isSpeed ? 'Min Attempts' : 'Min Days'}
        type="number"
        size="small"
        value={minDaysInput}
        onChange={(e) => setMinDaysInput(e.target.value)}
        slotProps={{ htmlInput: { min: 0, step: 1 } }}
        sx={{ width: 140 }}
      />
      <TextField
        label={isSpeed ? 'Max Attempts' : 'Max Days'}
        type="number"
        size="small"
        value={maxDaysInput}
        onChange={(e) => setMaxDaysInput(e.target.value)}
        slotProps={{ htmlInput: { min: 0, step: 1 } }}
        sx={{ width: 140 }}
      />
      {!usesExternalDateRange && (
        <>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(date) => setStartDate(date)}
            maxDate={moment().tz(STATS_TIMEZONE).startOf('day')}
            renderInput={(params: any) => (
              <TextField
                {...params}
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {params?.InputProps?.endAdornment}
                      {startDate && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setStartDate(null)}>
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )}
                    </>
                  ),
                }}
              />
            )}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(date) => setEndDate(date)}
            maxDate={moment().tz(STATS_TIMEZONE).startOf('day')}
            renderInput={(params: any) => (
              <TextField
                {...params}
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {params?.InputProps?.endAdornment}
                      {endDate && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setEndDate(null)}>
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )}
                    </>
                  ),
                }}
              />
            )}
          />
        </>
      )}
    </Box>
  )

  if (loading) {
    return (
      <Box>
        {filterControls}
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      </Box>
    )
  }

  const filteredSpeedEntries = speedEntries.filter(
    (e) => (minDays === undefined || e.attempts >= minDays) && (maxDays === undefined || e.attempts <= maxDays),
  )
  const filteredDailyEntries = dailyEntries.filter(
    (e) => (minDays === undefined || e.daysCount >= minDays) && (maxDays === undefined || e.daysCount <= maxDays),
  )

  if (isSpeed) {
    return (
      <Box>
        {filterControls}
        {filteredSpeedEntries.length === 0 ? (
          <Paper sx={{ p: 2, mt: 1 }} variant="outlined">
            <Typography variant="body2">Not enough data for this date range.</Typography>
          </Paper>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Percentile {percentile}</TableCell>
                  <TableCell>Attempts</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSpeedEntries.map((e, i) => (
                  <TableRow
                    key={e.uuid}
                    hover={!!onPickThreshold}
                    onClick={() => onPickThreshold?.(Math.round(e.value))}
                    sx={onPickThreshold ? { cursor: 'pointer' } : undefined}
                  >
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <CounterCell uuid={e.uuid} navigate={navigate} />
                    </TableCell>
                    <TableCell>{formatClockTime(e.value)}</TableCell>
                    <TableCell>{e.attempts.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    )
  }

  return (
    <Box>
      {filterControls}
      {filteredDailyEntries.length === 0 ? (
        <Paper sx={{ p: 2, mt: 1 }} variant="outlined">
          <Typography variant="body2">Not enough data for this date range.</Typography>
        </Paper>
      ) : (
        <TableContainer>
          <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Counts</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDailyEntries.map((e, i) => (
                <TableRow
                  key={e.uuid}
                  hover={!!onPickThreshold}
                  onClick={() => onPickThreshold?.(e.count)}
                  sx={onPickThreshold ? { cursor: 'pointer' } : undefined}
                >
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <CounterCell uuid={e.uuid} navigate={navigate} />
                  </TableCell>
                  <TableCell>{e.count.toLocaleString()}</TableCell>
                  <TableCell>{e.daysCount.toLocaleString()}</TableCell>
                  <TableCell>{e.bestDay}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
