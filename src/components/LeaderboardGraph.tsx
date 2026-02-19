import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { cachedCounters } from '../utils/helpers'
import { UserContext } from '../utils/contexts/UserContext'
import { Counter } from '../utils/types'
import CounterAutocomplete from './CounterAutocomplete'
import { Alert, Box, Paper, Typography } from '@mui/material'
import { getThreadGraphStats } from '../utils/api'

const linePalette = ['#0077b6', '#2a9d8f', '#e76f51', '#f4a261', '#457b9d', '#8ab17d', '#ef476f', '#118ab2']

const formatYAxis = (value: number) => value.toLocaleString()
const formatTooltipValue = (value: number) => value.toLocaleString()
const graphResponseCache = new Map<string, { allLeaderboard: Record<string, number>; points: Array<Record<string, any>> }>()
const graphInFlight = new Map<string, Promise<{ allLeaderboard: Record<string, number>; points: Array<Record<string, any>> }>>()

type Props = {
  threadName: string
  startDateStr?: string
  endDateStr?: string
  cum: boolean
}

const LeaderboardGraph = ({ threadName, startDateStr, endDateStr, cum }: Props) => {
  const { loading, counter } = useContext(UserContext)
  const [selectedCounters, setSelectedCounters] = useState<Counter[]>([])
  const [points, setPoints] = useState<Array<Record<string, any>>>([])
  const [allLeaderboard, setAllLeaderboard] = useState<Record<string, number>>({})
  const [graphLoading, setGraphLoading] = useState(false)
  const hasAutoSelectedCurrentUser = useRef(false)
  const lastAppliedRequestKeyRef = useRef<string>('')
  const dataKey = cum ? 'cumulative' : 'daily'
  const metricLabel = cum ? 'Cumulative' : 'Daily'

  useEffect(() => {
    if (!hasAutoSelectedCurrentUser.current && counter && !loading) {
      setSelectedCounters((prev) => (prev.length > 0 ? prev : [counter]))
      hasAutoSelectedCurrentUser.current = true
    }
  }, [counter, loading])

  const selectedUserUUIDs = useMemo(() => {
    return selectedCounters.map((ct) => ct.uuid).sort()
  }, [selectedCounters])

  const requestKey = useMemo(() => {
    return JSON.stringify({
      threadName,
      startDateStr: startDateStr || '',
      endDateStr: endDateStr || '',
      selectedUserUUIDs,
    })
  }, [threadName, startDateStr, endDateStr, selectedUserUUIDs])

  useEffect(() => {
    let active = true

    async function fetchGraph() {
      if (requestKey === lastAppliedRequestKeyRef.current) {
        return
      }
      setGraphLoading(true)
      try {
        let dataPromise = graphInFlight.get(requestKey)
        if (!dataPromise) {
          if (graphResponseCache.has(requestKey)) {
            dataPromise = Promise.resolve(graphResponseCache.get(requestKey)!)
          } else {
            dataPromise = getThreadGraphStats(
              threadName,
              undefined,
              startDateStr,
              endDateStr,
              selectedUserUUIDs,
            ).then((res) => {
              const payload = {
                allLeaderboard: res.data.allLeaderboard || {},
                points: Array.isArray(res.data.points) ? res.data.points : [],
              }
              graphResponseCache.set(requestKey, payload)
              return payload
            })
          }
          graphInFlight.set(requestKey, dataPromise)
        }

        const data = await dataPromise
        if (!active) return
        lastAppliedRequestKeyRef.current = requestKey
        setPoints(Array.isArray(data.points) ? data.points : [])
        setAllLeaderboard(data.allLeaderboard || {})
      } catch (err) {
        if (!active) return
        setPoints([])
        setAllLeaderboard({})
      } finally {
        graphInFlight.delete(requestKey)
        if (active) {
          setGraphLoading(false)
        }
      }
    }

    fetchGraph()
    return () => {
      active = false
    }
  }, [threadName, startDateStr, endDateStr, selectedUserUUIDs, requestKey])

  const selectedCounterSeries = useMemo(() => {
    if (selectedCounters.length === 0) {
      return []
    }
    const selectedSet = new Set(selectedCounters.map((ct) => ct.uuid))
    return points.map((row) => {
      const mappedRow: Record<string, any> = { date: row.date }
      selectedSet.forEach((uuid) => {
        mappedRow[uuid] = row[cum ? `${uuid}_cum` : uuid] ?? 0
      })
      return mappedRow
    })
  }, [points, selectedCounters, cum])

  const orderedCounterOptions = useMemo(() => {
    const ranked = Object.entries(allLeaderboard)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([uuid]) => cachedCounters[uuid]?.username)
      .filter((username): username is string => Boolean(username))

    const extras = Object.values(cachedCounters)
      .map((ct) => ct.username)
      .filter((username) => !ranked.includes(username))
      .sort((a, b) => a.localeCompare(b))

    return [...ranked, ...extras]
  }, [allLeaderboard])

  const handleCounterSelection = useCallback((selectedNames: string[]) => {
    const countersFromUsername = Object.values(cachedCounters).filter((ct) => selectedNames.includes(ct.username))
    setSelectedCounters((prev) => {
      const prevUUIDs = prev.map((ct) => ct.uuid).sort()
      const nextUUIDs = countersFromUsername.map((ct) => ct.uuid).sort()
      if (prevUUIDs.length === nextUUIDs.length && prevUUIDs.every((uuid, idx) => uuid === nextUUIDs[idx])) {
        return prev
      }
      return countersFromUsername
    })
  }, [])

  if (points.length === 0 && graphLoading) {
    return (
      <Paper sx={{ p: 2, mt: 1 }} variant="outlined">
        <Typography variant="body2">Loading graph data...</Typography>
      </Paper>
    )
  }

  if (points.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 1 }} variant="outlined">
        <Typography variant="body2">No graph data yet for this selection.</Typography>
      </Paper>
    )
  }

  return (
    <>
      <ResponsiveContainer width="100%" aspect={2.2}>
        <LineChart data={points} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
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
          label="Compare"
          options={orderedCounterOptions}
          selectedUsers={selectedCounters.map((ct) => ct.username)}
        />
      </Box>
      {graphLoading && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Updating graph...
        </Typography>
      )}

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
