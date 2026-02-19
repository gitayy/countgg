import {
  TableRow,
  TableCell,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  Typography,
  Link,
  TablePagination,
  Avatar,
  CardHeader,
  Box,
  Paper,
  Tooltip as MuiTooltip,
  Autocomplete,
  TextField,
  Button,
} from '@mui/material'
import { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cachedCounters, convertToTimestamp, isParsable } from '../utils/helpers'
import { Counter, SpeedRecord, ThreadType } from '../utils/types'
import CounterAutocomplete from './CounterAutocomplete'

interface Props {
  speed: SpeedRecord[] | undefined
  thread: ThreadType | { name: string; uuid: string }
  isSplitTable?: boolean
  canModerateSplits?: boolean
  onToggleSplitFake?: (split: { start: string; end: string; isFake: boolean }) => Promise<void>
  canLoadMore?: boolean
  isLoadingMore?: boolean
  onEnsurePageLoaded?: (page: number, selectedUserUUIDs: string[]) => void
  totalCount?: number
  onSelectedUsersChange?: (selectedUserUUIDs: string[]) => void
  distributionStats?: Array<{
    uuid: string
    attempts: number
    min: number
    q1: number
    median: number
    q3: number
    p99?: number
    max: number
    plotMax: number
  }>
  hallOfSpeedRows?: Array<{ counter: string; obj: any; rank: number }>
}

const normalizedTime = (value: number) => Number(value.toFixed(3))
const isSameRankTime = (a: number, b: number) => normalizedTime(a) === normalizedTime(b)
const defaultChartColor = '#4f6d7a'
const distributionChartCutoffMs = 6 * 60 * 1000

const formatClockTime = (timeMs: number, maxFractionDigits = 6) => {
  if (!Number.isFinite(timeMs)) return 'N/A'
  const absMs = Math.abs(timeMs)
  const totalSeconds = absMs / 1000
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secondsWhole = Math.floor(totalSeconds % 60)
  const fractionalRaw = ((totalSeconds % 1) + Number.EPSILON).toFixed(maxFractionDigits).slice(2)
  const fractional = fractionalRaw.replace(/0+$/, '')
  const fractionDisplay = (fractional.length > 0 ? fractional : '000').padEnd(3, '0')
  const mmOrHhmm = hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes}`
  const core = `${mmOrHhmm}:${secondsWhole.toString().padStart(2, '0')}.${fractionDisplay}`
  return timeMs < 0 ? `-${core}` : core
}

export const SpeedTable = memo(
  ({
    speed,
    thread,
    isSplitTable = false,
    canModerateSplits = false,
    onToggleSplitFake,
    canLoadMore = false,
    isLoadingMore = false,
    onEnsurePageLoaded,
    totalCount,
    onSelectedUsersChange,
    distributionStats,
    hallOfSpeedRows,
  }: Props) => {
  const rowsPerPage = 50
  const [page, setPage] = useState(0)
  const [selectedCounters, setSelectedCounters] = useState<Counter[]>([])
  const [selectedDistributionUserUUIDs, setSelectedDistributionUserUUIDs] = useState<string[]>([])
  const [pendingSplitKeys, setPendingSplitKeys] = useState<string[]>([])
  const navigate = useNavigate()

  const selectedCounterUUIDs = useMemo(() => new Set(selectedCounters.map((counter) => counter.uuid)), [selectedCounters])

  const quantile = (values: number[], q: number) => {
    if (values.length === 0) return 0
    const pos = (values.length - 1) * q
    const base = Math.floor(pos)
    const rest = pos - base
    if (values[base + 1] !== undefined) {
      return values[base] + rest * (values[base + 1] - values[base])
    }
    return values[base]
  }

  const preparedSpeed = useMemo(() => {
    if (!Array.isArray(speed)) return []
    return speed
      .filter((obj) => obj && Object.keys(obj).length !== 0)
      .map((obj) => {
        const timestamp1 = convertToTimestamp(obj.start)
        const timestamp2 = convertToTimestamp(obj.end)
        const computedTime =
          timestamp1 && timestamp2 ? Math.round(Math.abs(timestamp1 - timestamp2) * 1000) / 1000 : Number.POSITIVE_INFINITY

        return {
          ...obj,
          time: Number.isFinite(obj.time) ? obj.time : computedTime,
          qualifiedCounters: Array.isArray(obj.qualifiedCounters) ? obj.qualifiedCounters : [],
          isFake: Boolean(obj.isFake),
        }
      })
  }, [speed])

  const filteredSpeed = useMemo(() => {
    if (selectedCounterUUIDs.size === 0) return preparedSpeed
    return preparedSpeed.filter((obj) => obj.qualifiedCounters.some((counterUuid) => selectedCounterUUIDs.has(counterUuid)))
  }, [preparedSpeed, selectedCounterUUIDs])

  const sortedSpeed = useMemo(() => [...filteredSpeed].sort((a, b) => a.time - b.time), [filteredSpeed])

  const rankedSpeed = useMemo(() => {
    let prevTime: number | null = null
    let prevRank = 0
    return sortedSpeed.map((entry, index) => {
      const rank = prevTime !== null && isSameRankTime(entry.time, prevTime) ? prevRank : index + 1
      prevTime = entry.time
      prevRank = rank
      return { ...entry, rank }
    })
  }, [sortedSpeed])

  const pbLeaderboard = useMemo(() => {
    if (Array.isArray(hallOfSpeedRows)) {
      return hallOfSpeedRows
    }
    const bestTimes: Record<string, any> = {}

    for (const obj of sortedSpeed) {
      for (const counterUuid of obj.qualifiedCounters) {
        const existing = bestTimes[counterUuid]
        if (!existing || obj.time < existing.time) {
          bestTimes[counterUuid] = obj
        }
      }
    }

    const pbRows = Object.entries(bestTimes)
      .map(([counter, obj]) => ({ counter, obj }))
      .sort((a, b) => a.obj.time - b.obj.time)

    let prevTime: number | null = null
    let prevRank = 0
    return pbRows.map((row, index) => {
      const rank = prevTime !== null && isSameRankTime(row.obj.time, prevTime) ? prevRank : index + 1
      prevTime = row.obj.time
      prevRank = rank
      return { ...row, rank }
    })
  }, [sortedSpeed])

  const currentRows = useMemo(() => {
    const startIdx = page * rowsPerPage
    return rankedSpeed.slice(startIdx, startIdx + rowsPerPage)
  }, [page, rankedSpeed])

  const userDistributionCandidates = useMemo(() => {
    const timesByUser: Record<string, number[]> = {}

    sortedSpeed.forEach((entry) => {
      if (!Number.isFinite(entry.time)) return
      entry.qualifiedCounters.forEach((uuid) => {
        if (!timesByUser[uuid]) timesByUser[uuid] = []
        timesByUser[uuid].push(entry.time)
      })
    })

    return Object.entries(timesByUser)
      .filter(([uuid, times]) => {
        const isBanned = cachedCounters[uuid]?.roles?.includes('banned')
        return times.length >= 3 && !isBanned
      })
      .map(([uuid, times]) => {
        const sortedTimes = [...times].sort((a, b) => a - b)
        const p75Cutoff = quantile(sortedTimes, 0.75)
        return {
          uuid,
          attempts: sortedTimes.length,
          min: sortedTimes[0],
          q1: quantile(sortedTimes, 0.25),
          median: quantile(sortedTimes, 0.5),
          q3: p75Cutoff,
          max: sortedTimes[sortedTimes.length - 1],
          plotMax: p75Cutoff,
        }
      })
      .sort((a, b) => a.median - b.median)
  }, [sortedSpeed, hallOfSpeedRows])

  const distributionCandidates = useMemo(() => {
    if (distributionStats && distributionStats.length > 0) {
      return distributionStats
    }
    return userDistributionCandidates
  }, [distributionStats, userDistributionCandidates])

  useEffect(() => {
    setSelectedDistributionUserUUIDs((prev) => {
      if (distributionCandidates.length === 0) return prev.length === 0 ? prev : []

      const candidateSet = new Set(distributionCandidates.map((d) => d.uuid))
      const pruned = prev.filter((uuid) => candidateSet.has(uuid))
      if (pruned.length > 0) return pruned.length === prev.length ? prev : pruned

      const defaults = distributionCandidates.slice(0, 5).map((d) => d.uuid)
      const sameDefaults = prev.length === defaults.length && prev.every((uuid, idx) => uuid === defaults[idx])
      return sameDefaults ? prev : defaults
    })
  }, [distributionCandidates])

  const topUserDistributions = useMemo(() => {
    if (distributionCandidates.length === 0) return []
    const selectedSet = new Set(selectedDistributionUserUUIDs)
    const selectedRows = distributionCandidates.filter((row) => selectedSet.has(row.uuid))
    return selectedRows.length > 0 ? selectedRows : distributionCandidates.slice(0, 5)
  }, [selectedDistributionUserUUIDs, distributionCandidates])

  const handleChangePage = (_event, newPage) => {
    setPage(newPage)
    if (onEnsurePageLoaded) {
      onEnsurePageLoaded(newPage, selectedCounters.map((counter) => counter.uuid))
    }
  }

  const handleCounterSelection = (selectedCounterNames: string[]) => {
    const countersFromUsername = Object.values(cachedCounters).filter((counter) =>
      selectedCounterNames.includes(counter.username),
    )
    setSelectedCounters(countersFromUsername)
    if (onSelectedUsersChange) {
      onSelectedUsersChange(countersFromUsername.map((counter) => counter.uuid))
    }
    setPage(0)
  }

  const splitKey = (start: string, end: string) => `${start}_${end}`

  const handleToggleSplitFake = async (start: string, end: string, currentIsFake: boolean) => {
    if (!onToggleSplitFake) return
    const key = splitKey(start, end)
    if (pendingSplitKeys.includes(key)) return

    setPendingSplitKeys((prev) => [...prev, key])
    try {
      await onToggleSplitFake({ start, end, isFake: !currentIsFake })
    } catch (err) {
      console.log(err)
    } finally {
      setPendingSplitKeys((prev) => prev.filter((pendingKey) => pendingKey !== key))
    }
  }

  if (!thread) return <></>
  const hasNoRecordsForSelection = sortedSpeed.length === 0
  const getReplayHref = (record: any) => {
    const startCountNumber = Number(record?.startCountNumber)
    const endCountNumber = Number(record?.endCountNumber)
    if (Number.isFinite(startCountNumber) && Number.isFinite(endCountNumber)) {
      return `/thread/${thread.name}?startCountNumber=${startCountNumber}&endCountNumber=${endCountNumber}`
    }
    return `/thread/${thread.name}?startCountRaw=${record?.startCount ?? ''}&endCountRaw=${record?.endCount ?? ''}`
  }

  const leaderboardRows = currentRows.map((obj, index) => (
    <TableRow key={obj.uuid ?? `${obj.start}_${obj.end}_${index}`}>
      <TableCell>{obj.rank}</TableCell>
      <TableCell>{formatClockTime(obj.time)}</TableCell>
      <TableCell>
        <Link
          underline="hover"
          href={getReplayHref(obj)}
          onClick={(e) => {
            e.preventDefault()
            navigate(getReplayHref(obj))
          }}
        >
          Replay
        </Link>
      </TableCell>
      <TableCell>
        <Link
          underline="hover"
          href={`/thread/${thread.name}/${obj.start}`}
          onClick={(e) => {
            e.preventDefault()
            navigate(`/thread/${thread.name}/${obj.start}`)
          }}
        >
          {isParsable(obj.startCount) ? parseInt(obj.startCount).toLocaleString() : obj.startCount}
        </Link>
      </TableCell>
      <TableCell>
        <Link
          underline="hover"
          href={`/thread/${thread.name}/${obj.end}`}
          onClick={(e) => {
            e.preventDefault()
            navigate(`/thread/${thread.name}/${obj.end}`)
          }}
        >
          {isParsable(obj.endCount) ? parseInt(obj.endCount).toLocaleString() : obj.endCount}
        </Link>
      </TableCell>
      <TableCell>
        {obj.qualifiedCounters.map((author, authorIndex) => (
          <span key={`${obj.uuid ?? obj.start}_${author}_${authorIndex}`}>
            {cachedCounters[author] ? (
              <CardHeader
                sx={{ p: 0 }}
                avatar={
                  cachedCounters[author] &&
                  cachedCounters[author].name && (
                    <Avatar
                      component={'span'}
                      sx={{ width: 24, height: 24 }}
                      alt={`${cachedCounters[author].name}`}
                      src={`${
                        (cachedCounters[author].avatar.length > 5 &&
                          `https://cdn.discordapp.com/avatars/${cachedCounters[author].discordId}/${cachedCounters[author].avatar}`) ||
                        `https://cdn.discordapp.com/embed/avatars/0.png`
                      }`}
                    ></Avatar>
                  )
                }
                title={
                  <Link
                    color={cachedCounters[author].color}
                    underline="hover"
                    href={`/counter/${cachedCounters[author].username}`}
                    onClick={(e) => {
                      e.preventDefault()
                      navigate(`/counter/${cachedCounters[author].username}`)
                    }}
                  >
                    {cachedCounters[author].name}
                  </Link>
                }
              ></CardHeader>
            ) : (
              <>{author}</>
            )}
          </span>
        ))}
      </TableCell>
      {isSplitTable && (
        <TableCell>
          {obj.isFake ? 'Fake' : 'Real'}
          {canModerateSplits && onToggleSplitFake && (
            <Button
              size="small"
              sx={{ ml: 1 }}
              disabled={pendingSplitKeys.includes(splitKey(obj.start, obj.end))}
              onClick={() => handleToggleSplitFake(obj.start, obj.end, Boolean(obj.isFake))}
            >
              {pendingSplitKeys.includes(splitKey(obj.start, obj.end)) ? 'Saving...' : obj.isFake ? 'Mark real' : 'Mark fake'}
            </Button>
          )}
        </TableCell>
      )}
    </TableRow>
  ))

  const pbLeaderboardRows = pbLeaderboard.map((row) => (
    <TableRow key={row.counter}>
      <TableCell>{row.rank}</TableCell>
      <TableCell sx={{ maxWidth: 250, width: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {cachedCounters[row.counter] ? (
          cachedCounters[row.counter].roles.includes('banned') ? (
            <>Banned User {cachedCounters[row.counter].uuid}</>
          ) : (
              <CardHeader
                sx={{ p: 0, maxWidth: 250 }}
                titleTypographyProps={{ noWrap: true }}
                avatar={
                  cachedCounters[row.counter] &&
                  cachedCounters[row.counter].name && (
                  <Avatar
                    component={'span'}
                    sx={{ width: 24, height: 24 }}
                    alt={`${cachedCounters[row.counter].name}`}
                    src={`${
                      (cachedCounters[row.counter].avatar.length > 5 &&
                        `https://cdn.discordapp.com/avatars/${cachedCounters[row.counter].discordId}/${cachedCounters[row.counter].avatar}`) ||
                      `https://cdn.discordapp.com/embed/avatars/0.png`
                    }`}
                  ></Avatar>
                )
              }
                title={
                  <Link
                    color={cachedCounters[row.counter].color}
                    underline="hover"
                    sx={{ display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    href={`/counter/${cachedCounters[row.counter].username}`}
                    onClick={(e) => {
                      e.preventDefault()
                    navigate(`/counter/${cachedCounters[row.counter].username}`)
                  }}
                >
                  {cachedCounters[row.counter].name}
                </Link>
              }
            ></CardHeader>
          )
        ) : (
          <>{row.counter}</>
        )}
      </TableCell>
      <TableCell>{formatClockTime(row.obj.time)}</TableCell>
      <TableCell>
        <Link
          underline="hover"
          href={getReplayHref(row.obj)}
          onClick={(e) => {
            e.preventDefault()
            navigate(getReplayHref(row.obj))
          }}
        >
          Replay
        </Link>
      </TableCell>
      <TableCell>
        <Link
          underline="hover"
          href={`/thread/${thread.name}/${row.obj.start}`}
          onClick={(e) => {
            e.preventDefault()
            navigate(`/thread/${thread.name}/${row.obj.start}`)
          }}
        >
          {isParsable(row.obj.startCount) ? parseInt(row.obj.startCount).toLocaleString() : row.obj.startCount}
        </Link>
      </TableCell>
      <TableCell>
        <Link
          underline="hover"
          href={`/thread/${thread.name}/${row.obj.end}`}
          onClick={(e) => {
            e.preventDefault()
            navigate(`/thread/${thread.name}/${row.obj.end}`)
          }}
        >
          {isParsable(row.obj.endCount) ? parseInt(row.obj.endCount).toLocaleString() : row.obj.endCount}
        </Link>
      </TableCell>
      <TableCell>
        {row.obj.qualifiedCounters
          .filter((ct) => ct !== row.counter)
          .map((ct, partnerIndex) => {
            return cachedCounters[ct] ? (
              <span key={`${row.counter}_${ct}_${partnerIndex}`}>
                <CardHeader
                  sx={{ p: 0 }}
                  avatar={
                    cachedCounters[ct] &&
                    cachedCounters[ct].name && (
                      <Avatar
                        component={'span'}
                        sx={{ width: 24, height: 24 }}
                        alt={`${cachedCounters[ct].name}`}
                        src={`${
                          (cachedCounters[ct].avatar.length > 5 &&
                            `https://cdn.discordapp.com/avatars/${cachedCounters[ct].discordId}/${cachedCounters[ct].avatar}`) ||
                          `https://cdn.discordapp.com/embed/avatars/0.png`
                        }`}
                      ></Avatar>
                    )
                  }
                  title={
                    <Link
                      color={cachedCounters[ct].color}
                      underline="hover"
                      href={`/counter/${cachedCounters[ct].username}`}
                      onClick={(e) => {
                        e.preventDefault()
                        navigate(`/counter/${cachedCounters[ct].username}`)
                      }}
                    >
                      {cachedCounters[ct].name}
                    </Link>
                  }
                ></CardHeader>
              </span>
            ) : (
              <span key={`${row.counter}_${ct}_${partnerIndex}`}>{ct}</span>
            )
          })}
      </TableCell>
      {isSplitTable && (
        <TableCell>
          {row.obj.isFake ? 'Fake' : 'Real'}
          {canModerateSplits && onToggleSplitFake && (
            <Button
              size="small"
              sx={{ ml: 1 }}
              disabled={pendingSplitKeys.includes(splitKey(row.obj.start, row.obj.end))}
              onClick={() => handleToggleSplitFake(row.obj.start, row.obj.end, Boolean(row.obj.isFake))}
            >
              {pendingSplitKeys.includes(splitKey(row.obj.start, row.obj.end)) ? 'Saving...' : row.obj.isFake ? 'Mark real' : 'Mark fake'}
            </Button>
          )}
        </TableCell>
      )}
    </TableRow>
  ))

  const sumCounts = totalCount ?? sortedSpeed.length

  return (
    <TableContainer>
      <Box sx={{ width: '50%', mb: 2 }}>
        <CounterAutocomplete onCounterSelect={handleCounterSelection} />
      </Box>
      {hasNoRecordsForSelection && (
        <Box sx={{ mt: 1, mb: 2 }}>
          <Typography variant="body2">No speed records found for this selection.</Typography>
        </Box>
      )}
      <Box sx={{ mb: 2 }}>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Top PB User Distributions (P75 and Better)
          </Typography>
          <Autocomplete
            multiple
            size="small"
            disableCloseOnSelect
            options={distributionCandidates}
            value={distributionCandidates.filter((row) => selectedDistributionUserUUIDs.includes(row.uuid))}
            onChange={(_event, nextValue) => setSelectedDistributionUserUUIDs(nextValue.map((row) => row.uuid))}
            getOptionLabel={(option) => {
              const counter = cachedCounters[option.uuid]
              return (counter && counter.name) || option.uuid
            }}
            isOptionEqualToValue={(option, value) => option.uuid === value.uuid}
            renderInput={(params) => <TextField {...params} label="Rendered users" placeholder="Select users" />}
            sx={{ mb: 1.25 }}
          />
          {topUserDistributions.length === 0 ? (
            <Typography variant="body2">Need at least 3 attempts per user to show a distribution.</Typography>
          ) : (
            (() => {
              const plottedDistributions = topUserDistributions
              const globalMin = Math.min(...plottedDistributions.map((d) => d.min))
              const slowestMedian = Math.max(...plottedDistributions.map((d) => d.median))
              const slowestP75 = Math.max(...plottedDistributions.map((d) => d.plotMax))
              const useExtendedScale = globalMin > distributionChartCutoffMs
              const globalMax = useExtendedScale
                ? slowestMedian * 2
                : Math.min(distributionChartCutoffMs, slowestMedian * 2, slowestP75)
              const adjustedMin = useExtendedScale
                ? globalMin
                : globalMin >= globalMax
                  ? Math.max(0, globalMax - 60 * 1000)
                  : globalMin
              const range = globalMax - adjustedMin || 1
              const pct = (value: number) => {
                const normalized = ((Math.min(value, globalMax) - adjustedMin) / range) * 100
                return Math.max(2, Math.min(98, normalized))
              }
              const axisTicks = [0, 25, 50, 75, 100].map((percent) => {
                const value = adjustedMin + (range * percent) / 100
                return { percent, label: formatClockTime(value, 3) }
              })
              const rowHeight = 38
              const chartHeight = plottedDistributions.length * rowHeight + 34

              return (
                <Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '170px minmax(0, 1fr)', gap: 1.5, alignItems: 'start', width: '100%', minWidth: 0 }}>
                    <Box sx={{ pt: 0.5 }}>
                      {plottedDistributions.map((dist) => {
                        const counter = cachedCounters[dist.uuid]
                        return (
                          <Box
                            key={`label_${dist.uuid}`}
                            sx={{ height: rowHeight, display: 'flex', flexDirection: 'column', justifyContent: 'center', pr: 1 }}
                          >
                            <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 700 }}>
                              {(counter && counter.name) || dist.uuid}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.1 }}>
                              med {formatClockTime(dist.median, 3)} (n={dist.attempts})
                            </Typography>
                          </Box>
                        )
                      })}
                    </Box>

                    <Box
                      sx={{
                        position: 'relative',
                        height: chartHeight,
                        width: '100%',
                        minWidth: 0,
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        boxShadow: 1,
                        overflow: 'hidden',
                      }}
                    >
                      {axisTicks.map((tick) => (
                        <Box
                          key={`grid_${tick.percent}`}
                          sx={{
                            position: 'absolute',
                            left: `${tick.percent}%`,
                            top: 0,
                            bottom: 24,
                            width: 1,
                            bgcolor: 'divider',
                          }}
                        />
                      ))}

                      {plottedDistributions.map((dist, idx) => {
                        const counter = cachedCounters[dist.uuid]
                        const rowTop = idx * rowHeight + 8
                        const y = rowTop + 12
                        const avatarSrc =
                          counter && counter.avatar && counter.avatar.length > 5
                            ? `https://cdn.discordapp.com/avatars/${counter.discordId}/${counter.avatar}`
                            : `https://cdn.discordapp.com/embed/avatars/0.png`
                        const color = counter?.color || defaultChartColor

                        return (
                          <Box key={dist.uuid}>
                            <Box sx={{ position: 'absolute', left: `${pct(dist.min)}%`, top: y, width: `${Math.max(1, pct(dist.plotMax) - pct(dist.min))}%`, height: 2, bgcolor: color }} />
                            <MuiTooltip title={`Min: ${formatClockTime(dist.min)}`}>
                              <Box sx={{ position: 'absolute', left: `${pct(dist.min)}%`, top: y - 7, width: 2, height: 16, bgcolor: color, cursor: 'pointer' }} />
                            </MuiTooltip>
                            <MuiTooltip title={`P75: ${formatClockTime(dist.plotMax)} (Full max: ${formatClockTime(dist.max)}, chart max: ${formatClockTime(globalMax, 3)})`}>
                              <Box sx={{ position: 'absolute', left: `${pct(dist.plotMax)}%`, top: y - 7, width: 2, height: 16, bgcolor: color, cursor: 'pointer' }} />
                            </MuiTooltip>
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: `${pct(dist.q1)}%`,
                                top: y - 8,
                                width: `${Math.max(1, pct(dist.q3) - pct(dist.q1))}%`,
                                height: 18,
                                bgcolor: 'transparent',
                                border: '2px solid',
                                borderColor: color,
                                  borderRadius: 0.5,
                                }}
                              />
                              <MuiTooltip title={`P25: ${formatClockTime(dist.q1)}`}>
                                <Box sx={{ position: 'absolute', left: `${pct(dist.q1)}%`, top: y - 7, width: 2, height: 16, bgcolor: color, cursor: 'pointer' }} />
                              </MuiTooltip>
                              <MuiTooltip title={`Median: ${formatClockTime(dist.median)}`}>
                                <Box sx={{ position: 'absolute', left: `${pct(dist.median)}%`, top: y - 10, width: 3, height: 22, bgcolor: color, cursor: 'pointer' }} />
                              </MuiTooltip>
                            <Avatar
                              src={avatarSrc}
                              alt={counter?.name ?? dist.uuid}
                              sx={{
                                width: 16,
                                height: 16,
                                position: 'absolute',
                                left: `calc(${pct(dist.median)}% - 8px)`,
                                top: y - 6,
                                border: '1px solid',
                                borderColor: 'background.paper',
                                opacity: 0.92,
                              }}
                            />
                          </Box>
                        )
                      })}

                    {axisTicks.map((tick) => (
                      <Box key={`axis_bottom_${tick.percent}`} sx={{ position: 'absolute', left: `${tick.percent}%`, bottom: 15 }}>
                          <Box sx={{ width: 1, height: 5, bgcolor: 'text.primary' }} />
                          <Typography
                            variant="caption"
                            sx={{ transform: 'translateX(-50%)', whiteSpace: 'nowrap', color: 'text.secondary', fontSize: 10 }}
                          >
                            {tick.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )
            })()
          )}
        </Paper>
      </Box>
      {!hasNoRecordsForSelection && (
        <>
          <Typography sx={{ mt: 2, mb: 2 }} variant="body2">
            Hall of Speed
          </Typography>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" stickyHeader sx={{ width: '100%', minWidth: 980, tableLayout: 'auto' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Counter</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Replay</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Partners</TableCell>
                  {isSplitTable && <TableCell>Flag</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>{pbLeaderboardRows}</TableBody>
            </Table>
          </Box>
          <Typography sx={{ mt: 2, mb: 2 }} variant="body2">
            Leaderboard: {sumCounts.toLocaleString()} {sumCounts !== 1 ? 'threads' : 'thread'}
          </Typography>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table stickyHeader sx={{ width: '100%', minWidth: 920, tableLayout: 'auto' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Replay</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Qualified Counters</TableCell>
                  {isSplitTable && <TableCell>Flag</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>{leaderboardRows}</TableBody>
            </Table>
          </Box>
          <TablePagination
            component={'div'}
            rowsPerPageOptions={[rowsPerPage]}
            count={totalCount ?? rankedSpeed.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
          />
          {isLoadingMore && (
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="body2">Loading more records...</Typography>
            </Box>
          )}
        </>
      )}
    </TableContainer>
  )
  },
)
