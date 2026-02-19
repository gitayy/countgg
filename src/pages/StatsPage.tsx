import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Fab, FormControl, InputLabel, MenuItem, Select, Skeleton, Tab, Typography } from '@mui/material'
import { Theme, useMediaQuery } from '@mui/material'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { useLocation, useSearchParams } from 'react-router-dom'
import { getThreadStats, getThreadStatsDetails, markSplitFake } from '../utils/api'
import { useIsMounted } from '../utils/hooks/useIsMounted'
import { ThreadType } from '../utils/types'
import { LeaderboardTable } from '../components/LeaderboardTable'
import { addCounterToCache, convertToTimestamp, formatDateExact } from '../utils/helpers'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { useFetchAllThreads } from '../utils/hooks/useFetchAllThreads'
import { SpeedTable } from '../components/SpeedTable'
import { UserContext } from '../utils/contexts/UserContext'
import moment from 'moment-timezone'
import LeaderboardGraph from '../components/LeaderboardGraph'
import { useStatsRange } from '../utils/hooks/useStatsRange'
import { StatsFiltersBar } from '../components/stats/StatsFiltersBar'

const STATS_TABS = {
  LEADERBOARD: 'leaderboard',
  GRAPHS: 'graphs',
  ACCOLADES: 'accolades',
  SPEED: 'speed',
  SPLITS: 'splits',
} as const

const normalizeStatsTabParam = (tabParam: string | null) => {
  if (!tabParam) return null
  const legacyMap: Record<string, string> = {
    tab_0: STATS_TABS.LEADERBOARD,
    tab_01: STATS_TABS.GRAPHS,
    tab_2: STATS_TABS.ACCOLADES,
    tab_5: STATS_TABS.SPEED,
    tab_6: STATS_TABS.SPLITS,
  }
  return legacyMap[tabParam] || tabParam
}

export const StatsPage = () => {
  const defaultDetailsPageSize = 50
  const selectedUserPageSize = 50
  const selectedSplitPageSize = 100
  const statsTimezone = 'America/New_York'
  const { loading, counter } = useContext(UserContext)
  const isMounted = useIsMounted()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'))

  const initialStart = searchParams.get('start')
  const initialEnd = searchParams.get('end')
  const initialThreadParam = searchParams.get('thread')
  const initialTabParam = normalizeStatsTabParam(searchParams.get('tab'))

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
  const [selectedStartDate, setSelectedStartDate] = useState<any | null>(
    initialStart ? moment.tz(initialStart, 'YYYY-MM-DD', statsTimezone) : null,
  )
  const [selectedEndDate, setSelectedEndDate] = useState<any | null>(
    initialEnd ? moment.tz(initialEnd, 'YYYY-MM-DD', statsTimezone) : null,
  )
  const [tabValue, setTabValue] = useState(initialTabParam || STATS_TABS.LEADERBOARD)
  const [accoladeType, setAccoladeType] = useState<'gets' | 'assists' | 'palindromes' | 'repdigits'>('gets')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [speedViewMode, setSpeedViewMode] = useState<'real_only' | 'all' | 'fake_only'>('all')
  const [splitViewMode, setSplitViewMode] = useState<'real_only' | 'all' | 'fake_only'>('real_only')
  const [hasResolvedInitialThreadParam, setHasResolvedInitialThreadParam] = useState(!initialThreadParam)

  const { allThreads, allThreadsLoading } = useFetchAllThreads()
  const [selectedThread, setSelectedThread] = useState<ThreadType | { name: string; uuid: string }>({
    name: 'all',
    uuid: 'all',
  })
  const statsRequestSeq = useRef(0)
  const statsDateRange = useMemo(() => {
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
    document.title = `Stats | Counting!`
    return () => {
      document.title = 'Counting!'
    }
  }, [location.pathname])

  useEffect(() => {
    if (allThreadsLoading) {
      return
    }

    const threadParam = searchParams.get('thread')
    if (threadParam && threadParam !== 'all') {
      const thread = allThreads.find((item) => item.uuid === threadParam)
      if (thread) {
        setSelectedThread(thread)
      }
    }
    setHasResolvedInitialThreadParam(true)
  }, [searchParams, allThreads, allThreadsLoading])

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 420)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const requestId = ++statsRequestSeq.current
    async function fetchData() {
      setStatsLoading(true)
      try {
        const { data } = await getThreadStats(
          selectedThread.name,
          undefined,
          statsDateRange.startDateStr,
          statsDateRange.endDateStr,
        )
        if (isMounted.current && requestId === statsRequestSeq.current) {
          for (const counter of data.counters) {
            addCounterToCache(counter)
          }
          setAllStats(data.stats)
          setStatsLoading(false)
        }
      } catch (err) {
        console.log(err)
        if (isMounted.current && requestId === statsRequestSeq.current) {
          setStatsLoading(false)
        }
      }
    }
    fetchData()
  }, [selectedThread.name, statsDateRange.startDateStr, statsDateRange.endDateStr, isMounted])

  const { stats, toStatsDayKey } = useStatsRange(allStats, selectedStartDate, selectedEndDate, statsTimezone)
  const canModerateSplits = Boolean(counter && (counter.roles.includes('mod') || counter.roles.includes('admin')))
  const hasStats = useMemo(() => !!stats, [stats])
  const hasSpeedStats = (stats?.speedCount ?? stats?.speed?.length ?? 0) > 0
  const hasSplitStats = (stats?.splitSpeedCount ?? stats?.splitSpeed?.length ?? 0) > 0
  const hasAccolades =
    (!!stats?.gets && Object.keys(stats.gets).length > 0) ||
    (!!stats?.assists && Object.keys(stats.assists).length > 0) ||
    (!!stats?.palindromes && Object.keys(stats.palindromes).length > 0) ||
    (!!stats?.repdigits && Object.keys(stats.repdigits).length > 0)
  const isTabAvailabilityResolved = !statsLoading && hasStats
  const availableTabs = useMemo(() => {
    const tabs = [STATS_TABS.LEADERBOARD]
    if (hasStats) tabs.push(STATS_TABS.GRAPHS)
    if (hasStats && hasAccolades) tabs.push(STATS_TABS.ACCOLADES)
    if (hasStats && hasSpeedStats) tabs.push(STATS_TABS.SPEED)
    if (hasStats && hasSplitStats) tabs.push(STATS_TABS.SPLITS)
    return tabs
  }, [hasStats, hasAccolades, hasSpeedStats, hasSplitStats])
  const effectiveTabValue = useMemo(() => {
    if (!isTabAvailabilityResolved) return tabValue
    return availableTabs.includes(tabValue) ? tabValue : STATS_TABS.LEADERBOARD
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
  }, [selectedThread.name, statsDateRange.startDateStr, statsDateRange.endDateStr])

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
        selectedThread.name,
        type,
        nextOffset,
        limit,
        selectedUserUUIDs,
        undefined,
        statsDateRange.startDateStr,
        statsDateRange.endDateStr,
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

    if (isSpeed) {
      setSpeedLoading(true)
    } else {
      setSplitLoading(true)
    }

    try {
      const hasSelectedUsers = selectedUserUUIDs.length > 0
      const limit = hasSelectedUsers
        ? isSpeed
          ? selectedUserPageSize
          : selectedSplitPageSize
        : rowsPerPage
      const res = await getThreadStatsDetails(
        selectedThread.name,
        type,
        start,
        limit,
        selectedUserUUIDs,
        undefined,
        statsDateRange.startDateStr,
        statsDateRange.endDateStr,
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
    if (effectiveTabValue === STATS_TABS.SPEED && hasSpeedStats && speedRecords.length === 0 && !speedLoading && !speedQueryLoaded) {
      loadStatsDetailPage('speed', false, speedSelectedUserUUIDs)
    }
    if (effectiveTabValue === STATS_TABS.SPLITS && hasSplitStats && splitRecords.length === 0 && !splitLoading && !splitQueryLoaded) {
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
    await markSplitFake(selectedThread.name, start, end, isFake)

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

  useEffect(() => {
    if (allThreadsLoading || !hasResolvedInitialThreadParam) {
      return
    }

    const params = new URLSearchParams()
    params.set('thread', selectedThread.uuid)
    params.set('tab', effectiveTabValue)

    const start = toStatsDayKey(selectedStartDate)
    const end = toStatsDayKey(selectedEndDate)
    if (start) params.set('start', start)
    if (end) params.set('end', end)

    setSearchParams(params, { replace: true })
  }, [
    selectedThread,
    effectiveTabValue,
    selectedStartDate,
    selectedEndDate,
    toStatsDayKey,
    setSearchParams,
    allThreadsLoading,
    hasResolvedInitialThreadParam,
  ])

  const loadingStatuses = [
    { label: 'User session', ready: !loading },
    { label: 'Threads list', ready: !allThreadsLoading },
  ]

  const tabSkeleton = (
    <Box sx={{ mt: 1 }}>
      <Skeleton variant="text" width={180} height={32} />
      <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" height={48} />
    </Box>
  )

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
  }

  const renderEmptyState = (title: string) => (
    <Alert sx={{ mt: 1 }} severity="info">
      No {title.toLowerCase()} data for this filter range.
    </Alert>
  )

  const handleThreadChange = (threadUUID: string) => {
    if (threadUUID === 'all') {
      setSelectedThread({ name: 'all', uuid: 'all' })
      return
    }
    const found = allThreads.find((thread) => thread.uuid === threadUUID)
    if (found) {
      setSelectedThread(found)
    }
  }

  if (loading || allThreadsLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2">{loadingStatuses.filter((x) => !x.ready).map((x) => x.label).join(', ')}...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: isDesktop ? 3 : 2 }}>
      <StatsFiltersBar
        allThreads={allThreads}
        selectedThread={selectedThread}
        onThreadChange={handleThreadChange}
        selectedStartDate={selectedStartDate}
        selectedEndDate={selectedEndDate}
        onStartDateChange={setSelectedStartDate}
        onEndDateChange={setSelectedEndDate}
        onCopyLink={handleCopyLink}
        statsTimezone={statsTimezone}
      />

      <TabContext value={effectiveTabValue}>
        <Box sx={{ position: 'sticky', top: 0, zIndex: 8, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <TabList onChange={(_event, newValue) => setTabValue(newValue)} variant={'scrollable'} allowScrollButtonsMobile>
            <Tab label="Leaderboard" value={STATS_TABS.LEADERBOARD} />
            {hasStats && <Tab label="Graphs" value={STATS_TABS.GRAPHS} />}
            {hasStats && availableAccolades.length > 0 && <Tab label="Accolades" value={STATS_TABS.ACCOLADES} />}
            {hasStats && hasSpeedStats && <Tab label="Speed" value={STATS_TABS.SPEED} />}
            {hasStats && hasSplitStats && <Tab label="Splits" value={STATS_TABS.SPLITS} />}
          </TabList>
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
          <TabPanel value={STATS_TABS.LEADERBOARD} sx={{ p: 0 }}>
            <Typography variant="h6">Leaderboard</Typography>
            {effectiveTabValue === STATS_TABS.LEADERBOARD && (statsLoading ? tabSkeleton : stats?.leaderboard ? <LeaderboardTable stat={stats.leaderboard} justLB={true} /> : renderEmptyState('Leaderboard'))}
          </TabPanel>

          <TabPanel value={STATS_TABS.GRAPHS} sx={{ p: 0 }}>
            <Typography variant="h6">Graphs</Typography>
            {effectiveTabValue === STATS_TABS.GRAPHS &&
              (statsLoading ? (
                tabSkeleton
              ) : (
                <LeaderboardGraph
                  threadName={selectedThread.name}
                  startDateStr={statsDateRange.startDateStr}
                  endDateStr={statsDateRange.endDateStr}
                  cum={true}
                />
              ))}
            {effectiveTabValue === STATS_TABS.GRAPHS &&
              (statsLoading ? (
                tabSkeleton
              ) : (
                <LeaderboardGraph
                  threadName={selectedThread.name}
                  startDateStr={statsDateRange.startDateStr}
                  endDateStr={statsDateRange.endDateStr}
                  cum={false}
                />
              ))}
          </TabPanel>

          <TabPanel value={STATS_TABS.ACCOLADES} sx={{ p: 0 }}>
            <Typography variant="h6">Accolades</Typography>
            {effectiveTabValue === STATS_TABS.ACCOLADES &&
              (statsLoading ? (
                tabSkeleton
              ) : availableAccolades.length === 0 ? (
                renderEmptyState('Accolades')
              ) : (
                <>
                  <FormControl size="small" sx={{ mb: 2, minWidth: 220 }}>
                    <InputLabel id="accolade-select-label">Accolade</InputLabel>
                    <Select
                      labelId="accolade-select-label"
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

          <TabPanel value={STATS_TABS.SPEED} sx={{ p: 0 }}>
            <Typography variant="h6">Speed</Typography>
            {effectiveTabValue === STATS_TABS.SPEED &&
              (statsLoading ? (
                tabSkeleton
              ) : (
                <>
                  <FormControl size="small" sx={{ mb: 1, minWidth: 220 }}>
                    <InputLabel id="speed-view-mode-label">Speed View</InputLabel>
                    <Select
                      labelId="speed-view-mode-label"
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
                    thread={selectedThread}
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

          <TabPanel value={STATS_TABS.SPLITS} sx={{ p: 0 }}>
            <Typography variant="h6">Splits</Typography>
            {effectiveTabValue === STATS_TABS.SPLITS && (
              statsLoading ? (
                tabSkeleton
              ) : (
                <>
                  <FormControl size="small" sx={{ mb: 1, minWidth: 220 }}>
                    <InputLabel id="split-view-mode-label">Split View</InputLabel>
                    <Select
                      labelId="split-view-mode-label"
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
                    thread={selectedThread}
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
              )
            )}
          </TabPanel>
        </Box>
      </TabContext>

      {stats?.last_updated_uuid && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Last updated: {formatDateExact(convertToTimestamp(stats.last_updated_uuid) || 0)} ({stats.last_updated_uuid})
        </Typography>
      )}

      {showBackToTop && (
        <Fab
          color="primary"
          size="small"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 20 }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      )}
    </Box>
  )
}
