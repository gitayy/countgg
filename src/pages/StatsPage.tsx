import { useContext, useEffect, useMemo, useState } from 'react'
import { Alert, Box, Fab, FormControl, InputLabel, MenuItem, Select, Skeleton, Tab, Typography } from '@mui/material'
import { Theme, useMediaQuery } from '@mui/material'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { useLocation, useSearchParams } from 'react-router-dom'
import { getThreadStats } from '../utils/api'
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

export const StatsPage = () => {
  const statsTimezone = 'America/New_York'
  const { loading } = useContext(UserContext)
  const isMounted = useIsMounted()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'))

  const initialStart = searchParams.get('start')
  const initialEnd = searchParams.get('end')

  const [allStats, setAllStats] = useState<any>()
  const [statsLoading, setStatsLoading] = useState(true)
  const [selectedStartDate, setSelectedStartDate] = useState<any | null>(
    initialStart ? moment.tz(initialStart, 'YYYY-MM-DD', statsTimezone) : null,
  )
  const [selectedEndDate, setSelectedEndDate] = useState<any | null>(
    initialEnd ? moment.tz(initialEnd, 'YYYY-MM-DD', statsTimezone) : null,
  )
  const [tabValue, setTabValue] = useState(searchParams.get('tab') || 'tab_0')
  const [accoladeType, setAccoladeType] = useState<'gets' | 'assists' | 'palindromes' | 'repdigits'>('gets')
  const [showBackToTop, setShowBackToTop] = useState(false)

  const { allThreads, allThreadsLoading } = useFetchAllThreads()
  const [selectedThread, setSelectedThread] = useState<ThreadType | { name: string; uuid: string }>({
    name: 'all',
    uuid: 'all',
  })

  useEffect(() => {
    document.title = `Stats | Counting!`
    return () => {
      document.title = 'Counting!'
    }
  }, [location.pathname])

  useEffect(() => {
    const threadParam = searchParams.get('thread')
    if (!threadParam || threadParam === 'all' || allThreadsLoading) {
      return
    }

    const thread = allThreads.find((item) => item.uuid === threadParam)
    if (thread) {
      setSelectedThread(thread)
    }
  }, [searchParams, allThreads, allThreadsLoading])

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 420)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    async function fetchData() {
      setStatsLoading(true)
      try {
        const { data } = await getThreadStats(selectedThread.name, undefined)
        if (isMounted.current) {
          for (const counter of data.counters) {
            addCounterToCache(counter)
          }
          setAllStats(data.stats)
          setStatsLoading(false)
        }
      } catch (err) {
        console.log(err)
        setStatsLoading(false)
      }
    }
    fetchData()
  }, [selectedThread.name, isMounted])

  const { stats, graphStatsSource, toStatsDayKey } = useStatsRange(allStats, selectedStartDate, selectedEndDate, statsTimezone)

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
    const params = new URLSearchParams()
    params.set('thread', selectedThread.uuid)
    params.set('tab', tabValue)

    const start = toStatsDayKey(selectedStartDate)
    const end = toStatsDayKey(selectedEndDate)
    if (start) params.set('start', start)
    if (end) params.set('end', end)

    setSearchParams(params, { replace: true })
  }, [selectedThread, tabValue, selectedStartDate, selectedEndDate, toStatsDayKey, setSearchParams])

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

  const hasStats = useMemo(() => !!stats, [stats])

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

      <TabContext value={tabValue}>
        <Box sx={{ position: 'sticky', top: 0, zIndex: 8, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <TabList onChange={(_event, newValue) => setTabValue(newValue)} variant={'scrollable'} allowScrollButtonsMobile>
            <Tab label="Leaderboard" value="tab_0" />
            {hasStats && <Tab label="Graphs" value="tab_01" />}
            {hasStats && availableAccolades.length > 0 && <Tab label="Accolades" value="tab_2" />}
            {hasStats && stats?.speed && stats.speed.length > 0 && <Tab label="Speed" value="tab_5" />}
            {hasStats && stats?.splitSpeed && stats.splitSpeed.length > 0 && <Tab label="Splits" value="tab_6" />}
          </TabList>
        </Box>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
          <TabPanel value="tab_0" sx={{ p: 0 }}>
            <Typography variant="h6">Leaderboard</Typography>
            {tabValue === 'tab_0' && (statsLoading ? tabSkeleton : stats?.leaderboard ? <LeaderboardTable stat={stats.leaderboard} justLB={true} /> : renderEmptyState('Leaderboard'))}
          </TabPanel>

          <TabPanel value="tab_01" sx={{ p: 0 }}>
            <Typography variant="h6">Graphs</Typography>
            {tabValue === 'tab_01' && (statsLoading ? tabSkeleton : graphStatsSource ? <LeaderboardGraph stats={graphStatsSource} cum={true} /> : renderEmptyState('Graphs'))}
            {tabValue === 'tab_01' && (statsLoading ? tabSkeleton : graphStatsSource ? <LeaderboardGraph stats={graphStatsSource} cum={false} /> : null)}
          </TabPanel>

          <TabPanel value="tab_2" sx={{ p: 0 }}>
            <Typography variant="h6">Accolades</Typography>
            {tabValue === 'tab_2' &&
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

          <TabPanel value="tab_5" sx={{ p: 0 }}>
            <Typography variant="h6">Speed</Typography>
            {tabValue === 'tab_5' && (statsLoading ? tabSkeleton : <SpeedTable speed={stats?.speed} thread={selectedThread} />)}
          </TabPanel>

          <TabPanel value="tab_6" sx={{ p: 0 }}>
            <Typography variant="h6">Splits</Typography>
            {tabValue === 'tab_6' && (statsLoading ? tabSkeleton : <SpeedTable speed={stats?.splitSpeed} thread={selectedThread} />)}
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
