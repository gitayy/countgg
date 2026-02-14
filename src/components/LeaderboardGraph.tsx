import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { cachedCounters } from '../utils/helpers'
import { UserContext } from '../utils/contexts/UserContext'
import moment from 'moment-timezone'
import { Counter } from '../utils/types'
import CounterAutocomplete from './CounterAutocomplete'
import { Alert, Box, Paper, Typography } from '@mui/material'

const linePalette = ['#0077b6', '#2a9d8f', '#e76f51', '#f4a261', '#457b9d', '#8ab17d', '#ef476f', '#118ab2']

const formatYAxis = (value: number) => value.toLocaleString()
const formatTooltipValue = (value: number) => value.toLocaleString()

const LeaderboardGraph = ({ stats, cum }) => {
  const { loading, counter } = useContext(UserContext)
  const [selectedCounters, setSelectedCounters] = useState<Counter[]>([])
  const hasAutoSelectedCurrentUser = useRef(false)
  const dataKey = cum ? 'cumulative' : 'daily'
  const metricLabel = cum ? 'Cumulative' : 'Daily'

  useEffect(() => {
    if (!hasAutoSelectedCurrentUser.current && counter && !loading) {
      setSelectedCounters((prev) => (prev.length > 0 ? prev : [counter]))
      hasAutoSelectedCurrentUser.current = true
    }
  }, [counter, loading])

  const { aggregateData, mergedUserSeries } = useMemo(() => {
    if (!stats || !stats['all'] || !stats['all']['leaderboard']) {
      return { aggregateData: [], mergedUserSeries: [] }
    }

    const allUserUUIDs = Object.keys(stats['all']['leaderboard'])
    const sortedDates = Object.keys(stats)
      .filter((date) => date !== 'all')
      .sort()

    if (sortedDates.length === 0) {
      return { aggregateData: [], mergedUserSeries: [] }
    }

    const firstDate = sortedDates[0]
    const lastDate = sortedDates[sortedDates.length - 1]
    const currentDate = moment(firstDate)
    const endDate = moment(lastDate)

    const userCumulative: Record<string, number> = {}
    const combinedSeries: any[] = []
    let cumulativeSum = 0

    while (currentDate <= endDate) {
      const date = currentDate.format('YYYY-MM-DD')
      const leaderboard: Record<string, number> = stats[date] ? stats[date].leaderboard : {}
      const row: Record<string, any> = { date }

      let dailyTotal = 0
      for (const userUUID of allUserUUIDs) {
        const daily = leaderboard[userUUID] ?? 0
        userCumulative[userUUID] = (userCumulative[userUUID] ?? 0) + daily
        row[userUUID] = cum ? userCumulative[userUUID] : daily
        dailyTotal += daily
      }

      cumulativeSum += dailyTotal
      row.cumulative = cumulativeSum
      row.daily = dailyTotal
      combinedSeries.push(row)
      currentDate.add(1, 'day')
    }

    const aggregate = combinedSeries.map((row) => ({
      date: row.date,
      cumulative: row.cumulative,
      daily: row.daily,
    }))

    return { aggregateData: aggregate, mergedUserSeries: combinedSeries }
  }, [stats, cum])

  const selectedCounterSeries = useMemo(() => {
    if (selectedCounters.length === 0) {
      return []
    }
    const selectedSet = new Set(selectedCounters.map((ct) => ct.uuid))
    return mergedUserSeries.map((row) => {
      const mappedRow: Record<string, any> = { date: row.date }
      selectedSet.forEach((uuid) => {
        mappedRow[uuid] = row[uuid] ?? 0
      })
      return mappedRow
    })
  }, [mergedUserSeries, selectedCounters])

  const orderedCounterOptions = useMemo(() => {
    const lb = stats?.all?.leaderboard ?? {}
    const ranked = Object.entries(lb)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([uuid]) => cachedCounters[uuid]?.username)
      .filter((username): username is string => Boolean(username))

    const extras = Object.values(cachedCounters)
      .map((ct) => ct.username)
      .filter((username) => !ranked.includes(username))
      .sort((a, b) => a.localeCompare(b))

    return [...ranked, ...extras]
  }, [stats])

  const handleCounterSelection = useCallback((selectedNames: string[]) => {
    const countersFromUsername = Object.values(cachedCounters).filter((ct) => selectedNames.includes(ct.username))
    setSelectedCounters(countersFromUsername)
  }, [])

  if (!stats || aggregateData.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 1 }} variant="outlined">
        <Typography variant="body2">No graph data yet for this selection.</Typography>
      </Paper>
    )
  }

  return (
    <>
      <ResponsiveContainer width="100%" aspect={2.2}>
        <LineChart data={aggregateData} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d9d9d9" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
          <Tooltip formatter={formatTooltipValue} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey={dataKey} stroke="#264653" strokeWidth={2} dot={false} name={`${metricLabel} Total`} />
        </LineChart>
      </ResponsiveContainer>

      <Box sx={{ width: { xs: '100%', md: '50%' }, mt: 2 }}>
        <CounterAutocomplete
          onCounterSelect={handleCounterSelection}
          label="Compare Users On Same Graph"
          options={orderedCounterOptions}
        />
      </Box>

      {selectedCounters.length === 0 ? (
        <Alert sx={{ mt: 2 }} severity="info">
          Select one or more users to overlay them on the same graph.
        </Alert>
      ) : (
        <ResponsiveContainer width="100%" aspect={2.2}>
          <LineChart data={selectedCounterSeries} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d9d9d9" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
            <Tooltip formatter={formatTooltipValue} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            {selectedCounters.map((selectedCounter, index) => {
              const fallback = linePalette[index % linePalette.length]
              const stroke = selectedCounter.color || fallback
              return (
                <Line
                  key={`${dataKey}-${selectedCounter.uuid}`}
                  type="monotone"
                  dataKey={selectedCounter.uuid}
                  stroke={stroke}
                  strokeWidth={2}
                  dot={false}
                  name={selectedCounter.username}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      )}
    </>
  )
}

export default memo(LeaderboardGraph)
