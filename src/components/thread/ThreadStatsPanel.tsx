import { useContext, useEffect, useMemo, useState } from 'react'
import { Alert, Box, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Skeleton, Switch, Tab, TextField, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import moment from 'moment-timezone'
import { getThreadStats, markSplitFake } from '../../utils/api'
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
  const statsTimezone = 'America/New_York'
  const isMounted = useIsMounted()
  const [allStats, setAllStats] = useState<any>()
  const [statsLoading, setStatsLoading] = useState(true)
  const [selectedStartDate, setSelectedStartDate] = useState<any | null>(null)
  const [selectedEndDate, setSelectedEndDate] = useState<any | null>(null)
  const [tabValue, setTabValue] = useState('stats_tab_0')
  const [accoladeType, setAccoladeType] = useState<'gets' | 'assists' | 'palindromes' | 'repdigits'>('gets')
  const [includeFakeSplits, setIncludeFakeSplits] = useState(false)
  const { counter } = useContext(UserContext)

  useEffect(() => {
    async function fetchThreadStats() {
      setStatsLoading(true)
      try {
        const { data } = await getThreadStats(threadName, undefined)
        if (isMounted.current) {
          for (const counter of data.counters) {
            addCounterToCache(counter)
          }
          setAllStats(data.stats)
        }
      } catch (err) {
        console.log(err)
      } finally {
        if (isMounted.current) {
          setStatsLoading(false)
        }
      }
    }
    fetchThreadStats()
  }, [threadName, isMounted])

  const { stats, graphStatsSource } = useStatsRange(allStats, selectedStartDate, selectedEndDate, statsTimezone)
  const canModerateSplits = Boolean(counter && (counter.roles.includes('mod') || counter.roles.includes('admin')))

  const displayedSplitSpeed = useMemo(() => {
    const source = stats?.splitSpeed ?? []
    return includeFakeSplits ? source : source.filter((split: any) => !split?.isFake)
  }, [stats?.splitSpeed, includeFakeSplits])

  const handleSplitFakeToggle = async ({ start, end, isFake }: { start: string; end: string; isFake: boolean }) => {
    await markSplitFake(threadName, start, end, isFake)

    setAllStats((prev: any) => {
      if (!prev || typeof prev !== 'object') return prev
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        const day = next[key]
        if (!day || !Array.isArray(day.splitSpeed)) continue

        let changed = false
        const updatedSplits = day.splitSpeed.map((split: any) => {
          if (split?.start === start && split?.end === end) {
            changed = true
            return { ...split, isFake }
          }
          return split
        })

        if (changed) {
          next[key] = { ...day, splitSpeed: updatedSplits }
        }
      }
      return next
    })
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

      <TabContext value={tabValue}>
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
            {stats?.speed && stats.speed.length > 0 && <Tab label="Speed" value="stats_tab_5" />}
            {stats?.splitSpeed && stats.splitSpeed.length > 0 && <Tab label="Splits" value="stats_tab_6" />}
          </TabList>
        </Box>

        <Box sx={{ mt: 1, p: 2, bgcolor: 'background.paper', width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
          <TabPanel value="stats_tab_0" sx={{ p: 0, minWidth: 0, maxWidth: '100%' }}>
            {tabValue === 'stats_tab_0' &&
              (statsLoading ? tabSkeleton : stats?.leaderboard ? <LeaderboardTable stat={stats.leaderboard} justLB={true} /> : renderEmptyState('Leaderboard'))}
          </TabPanel>

          <TabPanel value="stats_tab_01" sx={{ p: 0, minWidth: 0, maxWidth: '100%' }}>
            {tabValue === 'stats_tab_01' &&
              (statsLoading ? tabSkeleton : graphStatsSource ? <LeaderboardGraph stats={graphStatsSource} cum={true} /> : renderEmptyState('Graphs'))}
            {tabValue === 'stats_tab_01' && (statsLoading ? tabSkeleton : graphStatsSource ? <LeaderboardGraph stats={graphStatsSource} cum={false} /> : null)}
          </TabPanel>

          <TabPanel value="stats_tab_2" sx={{ p: 0, minWidth: 0, maxWidth: '100%' }}>
            {tabValue === 'stats_tab_2' &&
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
            {tabValue === 'stats_tab_5' && (statsLoading ? tabSkeleton : <SpeedTable speed={stats?.speed} thread={scopedThread} />)}
          </TabPanel>

          <TabPanel value="stats_tab_6" sx={{ p: 0, minWidth: 0, maxWidth: '100%' }}>
            {tabValue === 'stats_tab_6' &&
              (statsLoading ? (
                tabSkeleton
              ) : (
                <>
                  <FormControlLabel
                    sx={{ mb: 1 }}
                    control={<Switch checked={includeFakeSplits} onChange={(_e, checked) => setIncludeFakeSplits(checked)} />}
                    label="Include fake splits"
                  />
                  <SpeedTable
                    speed={displayedSplitSpeed}
                    thread={scopedThread}
                    isSplitTable={true}
                    canModerateSplits={canModerateSplits}
                    onToggleSplitFake={canModerateSplits ? handleSplitFakeToggle : undefined}
                  />
                </>
              ))}
          </TabPanel>
        </Box>
      </TabContext>
    </Box>
  )
}
