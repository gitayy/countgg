import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, FormControl, InputLabel, MenuItem, Select, Skeleton, Tab, TextField, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import moment from 'moment-timezone'
import { getThreadStats, getThreadStatsDetails, markSplitFake } from '../../utils/api'
import { addCounterToCache } from '../../utils/helpers'
import { useIsMounted } from '../../utils/hooks/useIsMounted'
import { useStatsRange } from '../../utils/hooks/useStatsRange'
import { LeaderboardTable } from '../LeaderboardTable'
import LeaderboardGraph from '../LeaderboardGraph'
import { SpeedTable } from '../SpeedTable'
import { UserContext } from '../../utils/contexts/UserContext'

interface Props {
  threadName: string
}

export const ThreadStatsPanel = ({ threadName }: Props) => {
  const defaultDetailsPageSize = 50
  const selectedUserPageSize = 50
  const selectedSplitPageSize = 100
  const statsTimezone = 'America/New_York'
  const isMounted = useIsMounted()
  const [allStats, setAllStats] = useState<any>()
  const [statsLoading, setStatsLoading] = useState(true)
  const [speedRecords, setSpeedRecords] = useState<any[]>([])
  const [splitRecords, setSplitRecords] = useState<any[]>([])
  const [speedTotal, setSpeedTotal] = useState(0)
  const [splitTotal, setSplitTotal] = useState(0)
  const [speedHasMore, setSpeedHasMore] = useState(false)
  const [splitHasMore, setSplitHasMore] = useState(false)
  const [speedLoading, setSpeedLoading] = useState(false)
  const [splitLoading, setSplitLoading] = useState(false)
  const [speedSelectedUserUUIDs, setSpeedSelectedUserUUIDs] = useState<string[]>([])
  const [splitSelectedUserUUIDs, setSplitSelectedUserUUIDs] = useState<string[]>([])
  const [speedDistributionStats, setSpeedDistributionStats] = useState<any[]>([])
  const [splitDistributionStats, setSplitDistributionStats] = useState<any[]>([])
  const [speedHallOfSpeedRows, setSpeedHallOfSpeedRows] = useState<any[]>([])
  const [speedHallOfSpeedRealRows, setSpeedHallOfSpeedRealRows] = useState<any[]>([])
  const [speedHallOfSpeedFakeRows, setSpeedHallOfSpeedFakeRows] = useState<any[]>([])
  const [speedDistributionStatsRealOnly, setSpeedDistributionStatsRealOnly] = useState<any[]>([])
  const [speedDistributionStatsFakeOnly, setSpeedDistributionStatsFakeOnly] = useState<any[]>([])
  const [splitHallOfSpeedRows, setSplitHallOfSpeedRows] = useState<any[]>([])
  const [splitHallOfSpeedRealRows, setSplitHallOfSpeedRealRows] = useState<any[]>([])
  const [splitHallOfSpeedFakeRows, setSplitHallOfSpeedFakeRows] = useState<any[]>([])
  const [splitDistributionStatsRealOnly, setSplitDistributionStatsRealOnly] = useState<any[]>([])
  const [splitDistributionStatsFakeOnly, setSplitDistributionStatsFakeOnly] = useState<any[]>([])
  const [speedQueryLoaded, setSpeedQueryLoaded] = useState(false)
  const [splitQueryLoaded, setSplitQueryLoaded] = useState(false)
  const [selectedStartDate, setSelectedStartDate] = useState<any | null>(null)
  const [selectedEndDate, setSelectedEndDate] = useState<any | null>(null)
  const [tabValue, setTabValue] = useState('stats_tab_0')
  const [accoladeType, setAccoladeType] = useState<'gets' | 'assists' | 'palindromes' | 'repdigits'>('gets')
  const [speedViewMode, setSpeedViewMode] = useState<'real_only' | 'all' | 'fake_only'>('all')
  const [splitViewMode, setSplitViewMode] = useState<'real_only' | 'all' | 'fake_only'>('real_only')
  const { counter } = useContext(UserContext)
  const statsRequestSeq = useRef(0)

  const { stats } = useStatsRange(allStats, selectedStartDate, selectedEndDate, statsTimezone)
  const canModerateSplits = Boolean(counter && (counter.roles.includes('mod') || counter.roles.includes('admin')))
  const hasSpeedStats = (stats?.speedCount ?? stats?.speed?.length ?? 0) > 0
  const hasSplitStats = (stats?.splitSpeedCount ?? stats?.splitSpeed?.length ?? 0) > 0
  const hasAccolades =
    (!!stats?.gets && Object.keys(stats.gets).length > 0) ||
    (!!stats?.assists && Object.keys(stats.assists).length > 0) ||
    (!!stats?.palindromes && Object.keys(stats.palindromes).length > 0) ||
    (!!stats?.repdigits && Object.keys(stats.repdigits).length > 0)
  const isTabAvailabilityResolved = !statsLoading && !!stats
  const availableTabs = useMemo(() => {
    const tabs = ['stats_tab_0', 'stats_tab_01']
    if (hasAccolades) tabs.push('stats_tab_2')
    if (hasSpeedStats) tabs.push('stats_tab_5')
    if (hasSplitStats) tabs.push('stats_tab_6')
    return tabs
  }, [hasAccolades, hasSpeedStats, hasSplitStats])
  const effectiveTabValue = useMemo(() => {
    if (!isTabAvailabilityResolved) return tabValue
    return availableTabs.includes(tabValue) ? tabValue : 'stats_tab_0'
  }, [isTabAvailabilityResolved, availableTabs, tabValue])

  const displayedSpeed = useMemo(() => {
    const source = speedRecords ?? []
    if (speedViewMode === 'all') return source
    if (speedViewMode === 'fake_only') return source.filter((record: any) => record?.isFake)
    return source.filter((record: any) => !record?.isFake)
  }, [speedRecords, speedViewMode])

  const displayedSplitSpeed = useMemo(() => {
    const source = splitRecords ?? []
    if (splitViewMode === 'all') return source
    if (splitViewMode === 'fake_only') return source.filter((split: any) => split?.isFake)
    return source.filter((split: any) => !split?.isFake)
  }, [splitRecords, splitViewMode])

  const dateRange = useMemo(() => {
    const toKey = (value: any) => {
      if (!value || !moment.isMoment(value) || !value.isValid()) return undefined
      return value.clone().tz(statsTimezone).format('YYYY-MM-DD')
    }
    return {
      startDateStr: toKey(selectedStartDate),
      endDateStr: toKey(selectedEndDate),
    }
  }, [selectedStartDate, selectedEndDate, statsTimezone])

  useEffect(() => {
    const requestId = ++statsRequestSeq.current
    async function fetchThreadStats() {
      setStatsLoading(true)
      try {
        const { data } = await getThreadStats(
          threadName,
          undefined,
          dateRange.startDateStr,
          dateRange.endDateStr,
        )
        if (isMounted.current && requestId === statsRequestSeq.current) {
          for (const counter of data.counters) {
            addCounterToCache(counter)
          }
          setAllStats(data.stats)
        }
      } catch (err) {
        console.log(err)
      } finally {
        if (isMounted.current && requestId === statsRequestSeq.current) {
          setStatsLoading(false)
        }
      }
    }
    fetchThreadStats()
  }, [threadName, dateRange.startDateStr, dateRange.endDateStr, isMounted])

  useEffect(() => {
    setSpeedRecords([])
    setSplitRecords([])
    setSpeedDistributionStats([])
    setSpeedDistributionStatsRealOnly([])
    setSpeedDistributionStatsFakeOnly([])
    setSplitDistributionStats([])
    setSpeedHallOfSpeedRows([])
    setSpeedHallOfSpeedRealRows([])
    setSpeedHallOfSpeedFakeRows([])
    setSplitHallOfSpeedRows([])
    setSplitHallOfSpeedRealRows([])
    setSplitHallOfSpeedFakeRows([])
    setSplitDistributionStatsRealOnly([])
    setSplitDistributionStatsFakeOnly([])
    setSpeedSelectedUserUUIDs([])
    setSplitSelectedUserUUIDs([])
    setSpeedHasMore(false)
    setSplitHasMore(false)
    setSpeedTotal(0)
    setSplitTotal(0)
    setSpeedQueryLoaded(false)
    setSplitQueryLoaded(false)
  }, [threadName, dateRange.startDateStr, dateRange.endDateStr])

  const loadStatsDetailPage = async (type: 'speed' | 'splitSpeed', append = false, selectedUserUUIDs: string[] = []) => {
    if (!isMounted.current) return
    const isSpeed = type === 'speed'
    const currentRecords = isSpeed ? speedRecords : splitRecords
    const nextOffset = append ? currentRecords.length : 0
    const hasSelectedUsers = selectedUserUUIDs.length > 0
    const limit = hasSelectedUsers
      ? isSpeed
        ? selectedUserPageSize
        : selectedSplitPageSize
      : defaultDetailsPageSize

    if (isSpeed) {
      setSpeedLoading(true)
    } else {
      setSplitLoading(true)
    }

    try {
      const { data } = await getThreadStatsDetails(
        threadName,
        type,
        nextOffset,
        limit,
        selectedUserUUIDs,
        undefined,
        dateRange.startDateStr,
        dateRange.endDateStr,
      )
      if (!isMounted.current) return
      for (const counter of data.counters) {
        addCounterToCache(counter)
      }
      if (isSpeed) {
        setSpeedRecords((prev) => (append ? [...prev, ...data.records] : data.records))
        setSpeedHasMore(data.hasMore)
        setSpeedTotal(data.total)
        setSpeedDistributionStats(data.distributionStats || [])
        setSpeedDistributionStatsRealOnly(data.distributionStatsRealOnly || [])
        setSpeedDistributionStatsFakeOnly(data.distributionStatsFakeOnly || [])
        setSpeedHallOfSpeedRows(data.hallOfSpeed || [])
        setSpeedHallOfSpeedRealRows(data.hallOfSpeedRealOnly || [])
        setSpeedHallOfSpeedFakeRows(data.hallOfSpeedFakeOnly || [])
        setSpeedQueryLoaded(true)
      } else {
        setSplitRecords((prev) => (append ? [...prev, ...data.records] : data.records))
        setSplitHasMore(data.hasMore)
        setSplitTotal(data.total)
        setSplitDistributionStats(data.distributionStats || [])
        setSplitDistributionStatsRealOnly(data.distributionStatsRealOnly || [])
        setSplitDistributionStatsFakeOnly(data.distributionStatsFakeOnly || [])
        setSplitHallOfSpeedRows(data.hallOfSpeed || [])
        setSplitHallOfSpeedRealRows(data.hallOfSpeedRealOnly || [])
        setSplitHallOfSpeedFakeRows(data.hallOfSpeedFakeOnly || [])
        setSplitQueryLoaded(true)
      }
    } catch (err) {
      console.log(err)
    } finally {
      if (isMounted.current) {
        if (isSpeed) {
          setSpeedLoading(false)
        } else {
          setSplitLoading(false)
        }
      }
    }
  }

  const dedupeRecords = (records: any[]) => {
    const seen = new Set<string>()
    const deduped: any[] = []
    for (const record of records) {
      const key = `${record?.start || ''}|${record?.end || ''}|${Number(record?.time) || 'inf'}|${record?.isFake ? '1' : '0'}`
      if (seen.has(key)) continue
      seen.add(key)
      deduped.push(record)
    }
    return deduped
  }

  const ensureDetailPageLoaded = async (type: 'speed' | 'splitSpeed', page: number, selectedUserUUIDs: string[]) => {
    if (!isMounted.current) return
    const isSpeed = type === 'speed'
    const rowsPerPage = 50
    const start = page * rowsPerPage
    const isLoading = isSpeed ? speedLoading : splitLoading
    if (isLoading) return

    if (isSpeed) setSpeedLoading(true)
    else setSplitLoading(true)

    try {
      const hasSelectedUsers = selectedUserUUIDs.length > 0
      const limit = hasSelectedUsers
        ? isSpeed
          ? selectedUserPageSize
          : selectedSplitPageSize
        : rowsPerPage
      const res = await getThreadStatsDetails(
        threadName,
        type,
        start,
        limit,
        selectedUserUUIDs,
        undefined,
        dateRange.startDateStr,
        dateRange.endDateStr,
      )
      const data = res.data

      if (!isMounted.current) return
      for (const counter of data.counters) {
        addCounterToCache(counter)
      }

      const updateRecords = (prev: any[]) => {
        const next = [...prev]
        next.splice(start, limit, ...(data.records || []))
        return dedupeRecords(next)
      }

      if (isSpeed) {
        setSpeedRecords(updateRecords)
        setSpeedHasMore(data.hasMore)
        setSpeedTotal(data.total)
        setSpeedDistributionStats(data.distributionStats || [])
        setSpeedDistributionStatsRealOnly(data.distributionStatsRealOnly || [])
        setSpeedDistributionStatsFakeOnly(data.distributionStatsFakeOnly || [])
        setSpeedHallOfSpeedRows(data.hallOfSpeed || [])
        setSpeedHallOfSpeedRealRows(data.hallOfSpeedRealOnly || [])
        setSpeedHallOfSpeedFakeRows(data.hallOfSpeedFakeOnly || [])
        setSpeedQueryLoaded(true)
      } else {
        setSplitRecords(updateRecords)
        setSplitHasMore(data.hasMore)
        setSplitTotal(data.total)
        setSplitDistributionStats(data.distributionStats || [])
        setSplitDistributionStatsRealOnly(data.distributionStatsRealOnly || [])
        setSplitDistributionStatsFakeOnly(data.distributionStatsFakeOnly || [])
        setSplitHallOfSpeedRows(data.hallOfSpeed || [])
        setSplitHallOfSpeedRealRows(data.hallOfSpeedRealOnly || [])
        setSplitHallOfSpeedFakeRows(data.hallOfSpeedFakeOnly || [])
        setSplitQueryLoaded(true)
      }
    } catch (err) {
      console.log(err)
    } finally {
      if (isMounted.current) {
        if (isSpeed) setSpeedLoading(false)
        else setSplitLoading(false)
      }
    }
  }

  useEffect(() => {
    if (effectiveTabValue === 'stats_tab_5' && hasSpeedStats && speedRecords.length === 0 && !speedLoading && !speedQueryLoaded) {
      loadStatsDetailPage('speed', false, speedSelectedUserUUIDs)
    }
    if (effectiveTabValue === 'stats_tab_6' && hasSplitStats && splitRecords.length === 0 && !splitLoading && !splitQueryLoaded) {
      loadStatsDetailPage('splitSpeed', false, splitSelectedUserUUIDs)
    }
  }, [
    effectiveTabValue,
    hasSpeedStats,
    hasSplitStats,
    speedRecords.length,
    splitRecords.length,
    speedLoading,
    splitLoading,
    speedQueryLoaded,
    splitQueryLoaded,
    speedSelectedUserUUIDs,
    splitSelectedUserUUIDs,
  ])

  const handleSpeedSelectedUsersChange = (selectedUserUUIDs: string[]) => {
    const next = [...selectedUserUUIDs].sort()
    const prev = [...speedSelectedUserUUIDs].sort()
    if (next.length === prev.length && next.every((uuid, idx) => uuid === prev[idx])) {
      return
    }
    setSpeedSelectedUserUUIDs(next)
    setSpeedRecords([])
    setSpeedHasMore(false)
    setSpeedTotal(0)
    setSpeedQueryLoaded(false)
  }

  const handleSplitSelectedUsersChange = (selectedUserUUIDs: string[]) => {
    const next = [...selectedUserUUIDs].sort()
    const prev = [...splitSelectedUserUUIDs].sort()
    if (next.length === prev.length && next.every((uuid, idx) => uuid === prev[idx])) {
      return
    }
    setSplitSelectedUserUUIDs(next)
    setSplitRecords([])
    setSplitHasMore(false)
    setSplitTotal(0)
    setSplitQueryLoaded(false)
  }

  const handleSplitFakeToggle = async ({ start, end, isFake }: { start: string; end: string; isFake: boolean }) => {
    await markSplitFake(threadName, start, end, isFake)

    setAllStats((prev: any) => {
      if (!prev || typeof prev !== 'object') return prev
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        const day = next[key]
        if (!day || typeof day !== 'object') continue

        const currentCount = typeof day.splitSpeedCount === 'number' ? day.splitSpeedCount : Array.isArray(day.splitSpeed) ? day.splitSpeed.length : 0
        next[key] = { ...day, splitSpeedCount: currentCount }
      }
      return next
    })

    setSplitRecords((prev) =>
      prev.map((split) => {
        if (split?.start === start && split?.end === end) {
          return { ...split, isFake }
        }
        return split
      }),
    )
  }

  const availableAccolades = useMemo(() => {
    const options: Array<{ key: 'gets' | 'assists' | 'palindromes' | 'repdigits'; label: string }> = []
    if (stats?.gets && Object.keys(stats.gets).length > 0) options.push({ key: 'gets', label: 'Gets' })
    if (stats?.assists && Object.keys(stats.assists).length > 0) options.push({ key: 'assists', label: 'Assists' })
    if (stats?.palindromes && Object.keys(stats.palindromes).length > 0) options.push({ key: 'palindromes', label: 'Palindromes' })
    if (stats?.repdigits && Object.keys(stats.repdigits).length > 0) options.push({ key: 'repdigits', label: 'Repdigits' })
    return options
  }, [stats])

  useEffect(() => {
    if (availableAccolades.length === 0) return
    if (!availableAccolades.some((opt) => opt.key === accoladeType)) {
      setAccoladeType(availableAccolades[0].key)
    }
  }, [availableAccolades, accoladeType])

  const tabSkeleton = (
    <Box sx={{ mt: 1 }}>
      <Skeleton variant="text" width={180} height={32} />
      <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" height={48} />
    </Box>
  )

  const scopedThread = useMemo(() => ({ name: threadName, uuid: threadName }), [threadName])

  const renderEmptyState = (title: string) => (
    <Alert sx={{ mt: 1 }} severity="info">
      No {title.toLowerCase()} data for this thread/date range.
    </Alert>
  )

  return (
    <Box sx={{ mt: 2, width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Thread Stats
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, width: '100%', maxWidth: '100%', minWidth: 0 }}>
        <DatePicker
          label="Start Date"
          value={selectedStartDate}
          onChange={(date) => setSelectedStartDate(date)}
          minDate={moment.tz('2023-02-23', 'YYYY-MM-DD', statsTimezone).startOf('day')}
          maxDate={moment().tz(statsTimezone).startOf('day').subtract(1, 'day')}
          renderInput={(params) => <TextField {...params} sx={{ width: '100%', maxWidth: 220 }} />}
        />
        <DatePicker
          label="End Date"
          value={selectedEndDate}
          onChange={(date) => setSelectedEndDate(date)}
          minDate={moment.tz('2023-02-23', 'YYYY-MM-DD', statsTimezone).startOf('day')}
          maxDate={moment().tz(statsTimezone).startOf('day').subtract(1, 'day')}
          renderInput={(params) => <TextField {...params} sx={{ width: '100%', maxWidth: 220 }} />}
        />
      </Box>

      <TabContext value={effectiveTabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', width: '100%', maxWidth: '100%', minWidth: 0 }}>
          <TabList
            onChange={(_event, newValue) => setTabValue(newValue)}
            variant={'scrollable'}
            allowScrollButtonsMobile
            scrollButtons="auto"
            sx={{ maxWidth: '100%', minWidth: 0 }}
          >
            <Tab label="Leaderboard" value="stats_tab_0" />
            <Tab label="Graphs" value="stats_tab_01" />
            {availableAccolades.length > 0 && <Tab label="Accolades" value="stats_tab_2" />}
            {hasSpeedStats && <Tab label="Speed" value="stats_tab_5" />}
            {hasSplitStats && <Tab label="Splits" value="stats_tab_6" />}
          </TabList>
        </Box>

        <Box sx={{ mt: 1, p: 2, bgcolor: 'background.paper', width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
          <TabPanel value="stats_tab_0" sx={{ p: 0, minWidth: 0, maxWidth: '100%' }}>
            {effectiveTabValue === 'stats_tab_0' &&
              (statsLoading ? tabSkeleton : stats?.leaderboard ? <LeaderboardTable stat={stats.leaderboard} justLB={true} /> : renderEmptyState('Leaderboard'))}
          </TabPanel>

          <TabPanel value="stats_tab_01" sx={{ p: 0, minWidth: 0, maxWidth: '100%' }}>
            {effectiveTabValue === 'stats_tab_01' &&
              (statsLoading ? (
                tabSkeleton
              ) : (
                <LeaderboardGraph
                  threadName={threadName}
                  startDateStr={dateRange.startDateStr}
                  endDateStr={dateRange.endDateStr}
                  cum={true}
                />
              ))}
            {effectiveTabValue === 'stats_tab_01' &&
              (statsLoading ? (
                tabSkeleton
              ) : (
                <LeaderboardGraph
                  threadName={threadName}
                  startDateStr={dateRange.startDateStr}
                  endDateStr={dateRange.endDateStr}
                  cum={false}
                />
              ))}
          </TabPanel>

          <TabPanel value="stats_tab_2" sx={{ p: 0, minWidth: 0, maxWidth: '100%' }}>
            {effectiveTabValue === 'stats_tab_2' &&
              (statsLoading ? (
                tabSkeleton
              ) : availableAccolades.length === 0 ? (
                renderEmptyState('Accolades')
              ) : (
                <>
                  <FormControl size="small" sx={{ mb: 2, minWidth: 220 }}>
                    <InputLabel id="thread-accolade-select-label">Accolade</InputLabel>
                    <Select
                      labelId="thread-accolade-select-label"
                      label="Accolade"
                      value={accoladeType}
                      onChange={(e) => setAccoladeType(e.target.value as 'gets' | 'assists' | 'palindromes' | 'repdigits')}
                    >
                      {availableAccolades.map((opt) => (
                        <MenuItem key={opt.key} value={opt.key}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <LeaderboardTable stat={stats?.[accoladeType]} justLB={true} />
                </>
              ))}
          </TabPanel>

          <TabPanel value="stats_tab_5" sx={{ p: 0, minWidth: 0, maxWidth: '100%' }}>
            {effectiveTabValue === 'stats_tab_5' &&
              (statsLoading ? (
                tabSkeleton
              ) : (
                <>
                  <FormControl size="small" sx={{ mb: 1, minWidth: 220 }}>
                    <InputLabel id="thread-speed-view-mode-label">Speed View</InputLabel>
                    <Select
                      labelId="thread-speed-view-mode-label"
                      label="Speed View"
                      value={speedViewMode}
                      onChange={(e) => setSpeedViewMode(e.target.value as 'real_only' | 'all' | 'fake_only')}
                    >
                      <MenuItem value="real_only">Real only</MenuItem>
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="fake_only">Fake only</MenuItem>
                    </Select>
                  </FormControl>
                  <SpeedTable
                    speed={displayedSpeed}
                    thread={scopedThread}
                    canLoadMore={speedHasMore}
                    isLoadingMore={speedLoading}
                    onEnsurePageLoaded={(page, selectedUserUUIDs) => ensureDetailPageLoaded('speed', page, selectedUserUUIDs)}
                    onSelectedUsersChange={handleSpeedSelectedUsersChange}
                    totalCount={speedTotal}
                    distributionStats={
                      speedViewMode === 'all'
                        ? speedDistributionStats
                        : speedViewMode === 'fake_only'
                          ? speedDistributionStatsFakeOnly
                          : speedDistributionStatsRealOnly
                    }
                    hallOfSpeedRows={
                      speedViewMode === 'all'
                        ? speedHallOfSpeedRows
                        : speedViewMode === 'fake_only'
                          ? speedHallOfSpeedFakeRows
                          : speedHallOfSpeedRealRows
                    }
                  />
                </>
              ))}
          </TabPanel>

          <TabPanel value="stats_tab_6" sx={{ p: 0, minWidth: 0, maxWidth: '100%' }}>
            {effectiveTabValue === 'stats_tab_6' &&
              (statsLoading ? (
                tabSkeleton
              ) : (
                <>
                  <FormControl size="small" sx={{ mb: 1, minWidth: 220 }}>
                    <InputLabel id="thread-split-view-mode-label">Split View</InputLabel>
                    <Select
                      labelId="thread-split-view-mode-label"
                      label="Split View"
                      value={splitViewMode}
                      onChange={(e) => setSplitViewMode(e.target.value as 'real_only' | 'all' | 'fake_only')}
                    >
                      <MenuItem value="real_only">Real only</MenuItem>
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="fake_only">Fake only</MenuItem>
                    </Select>
                  </FormControl>
                  <SpeedTable
                    speed={displayedSplitSpeed}
                    thread={scopedThread}
                    isSplitTable={true}
                    canModerateSplits={canModerateSplits}
                    onToggleSplitFake={canModerateSplits ? handleSplitFakeToggle : undefined}
                    canLoadMore={splitHasMore}
                    isLoadingMore={splitLoading}
                    onEnsurePageLoaded={(page, selectedUserUUIDs) => ensureDetailPageLoaded('splitSpeed', page, selectedUserUUIDs)}
                    onSelectedUsersChange={handleSplitSelectedUsersChange}
                    totalCount={splitTotal}
                    distributionStats={
                      splitViewMode === 'all'
                        ? splitDistributionStats
                        : splitViewMode === 'fake_only'
                          ? splitDistributionStatsFakeOnly
                          : splitDistributionStatsRealOnly
                    }
                    hallOfSpeedRows={
                      splitViewMode === 'all'
                        ? splitHallOfSpeedRows
                        : splitViewMode === 'fake_only'
                          ? splitHallOfSpeedFakeRows
                          : splitHallOfSpeedRealRows
                    }
                  />
                </>
              ))}
          </TabPanel>
        </Box>
      </TabContext>
    </Box>
  )
}
