import React, { memo, useMemo } from 'react'
import { TableRow, TableCell, TableContainer, Table, TableHead, TableBody, Typography, Link, CardHeader, Avatar, Paper } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { cachedCounters } from '../utils/helpers'

export const LeaderboardTable = memo(({ stat, justLB = false }) => {
  const navigate = useNavigate()

  const leaderboard = useMemo(() => {
    if ((!stat && !justLB) || stat === undefined) {
      return {}
    }

    if (justLB) {
      return stat
    }

    const computed: Record<string, number> = {}
    stat.forEach((data) => {
      if (data.author in computed) {
        computed[data.author] += 1
      } else {
        computed[data.author] = 1
      }
    })
    return computed
  }, [stat, justLB])

  const leaderboardRows = useMemo(
    () =>
      Object.entries(leaderboard)
        .sort((a, b) => b[1] - a[1])
        .map(([author, count]) => ({ author, count })),
    [leaderboard],
  )

  const sumCounts = useMemo(() => Object.values(leaderboard).reduce((acc, count) => acc + count, 0), [leaderboard])

  if (stat === undefined) {
    return <Typography variant="body2">Loading...</Typography>
  }

  if (leaderboardRows.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 1 }} variant="outlined">
        <Typography variant="body2">No leaderboard data for this date range.</Typography>
      </Paper>
    )
  }

  return (
    <TableContainer>
      <Typography sx={{ mb: 1 }} variant="body2">
        {sumCounts.toLocaleString()} {sumCounts !== 1 ? 'counts' : 'count'}
      </Typography>
      <Table size="small" stickyHeader sx={{ width: '100%', tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Counts</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leaderboardRows.map((row, index) => (
            <TableRow key={row.author}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                {cachedCounters[row.author] ? (
                  cachedCounters[row.author].roles.includes('banned') ? (
                    <>Banned User {cachedCounters[row.author].uuid}</>
                  ) : (
                    <CardHeader
                      sx={{ p: 0 }}
                      avatar={
                        <Avatar
                          component={'span'}
                          sx={{ width: 24, height: 24 }}
                          alt={`${cachedCounters[row.author].name}`}
                          src={`${
                            (cachedCounters[row.author].avatar.length > 5 &&
                              `https://cdn.discordapp.com/avatars/${cachedCounters[row.author].discordId}/${cachedCounters[row.author].avatar}`) ||
                            `https://cdn.discordapp.com/embed/avatars/0.png`
                          }`}
                        />
                      }
                      title={
                        <Link
                          color={cachedCounters[row.author].color}
                          underline="hover"
                          href={`/counter/${cachedCounters[row.author].username}`}
                          onClick={(e) => {
                            e.preventDefault()
                            navigate(`/counter/${cachedCounters[row.author].username}`)
                          }}
                        >
                          {cachedCounters[row.author].name}
                        </Link>
                      }
                    />
                  )
                ) : (
                  <>{row.author}</>
                )}
              </TableCell>
              <TableCell>{row.count.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
})
