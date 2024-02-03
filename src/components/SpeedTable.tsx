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
} from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cachedCounters, convertToTimestamp, formatTimeDiff, isParsable } from '../utils/helpers'
import { Counter, ThreadType } from '../utils/types'
import CounterAutocomplete from './CounterAutocomplete'

interface Props {
  speed: any
  thread: ThreadType | { name: string; uuid: string }
}

export const SpeedTable = ({ speed, thread }: Props) => {
  const rowsPerPage = 50
  const [page, setPage] = useState(0)
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const navigate = useNavigate()

  if (!speed || !thread) {
    return <></>
  } else {
    speed = speed.filter((obj) => Object.keys(obj).length !== 0)

    // Create an object to store the best time of each counter
    const bestTimes: Record<string, any> = {}

    const [selectedCounters, setSelectedCounters] = useState<Counter[]>([])

    for (const obj of speed) {
      const timestamp1 = convertToTimestamp(obj.start)
      const timestamp2 = convertToTimestamp(obj.end)
      const timeDiff = timestamp1 && timestamp2 ? Math.round(Math.abs(timestamp1 - timestamp2) * 1000) / 1000 : null
      obj.time = timeDiff === null ? Infinity : timeDiff
      obj.timeFancy = formatTimeDiff(timestamp1, timestamp2)
      for (const counter of obj.qualifiedCounters) {
        const time = obj.time || Infinity
        if (cachedCounters[counter] && cachedCounters[counter].roles.includes('banned')) {
          continue
        }
        if (
          selectedCounters.length > 0 &&
          !selectedCounters.map((counter) => counter.username).includes(cachedCounters[counter].username)
        ) {
          continue
        }
        if (!bestTimes[counter] || time < bestTimes[counter]['time']) {
          bestTimes[counter] = obj
        }
      }
    }
    selectedCounters.length > 0
      ? (speed = speed.filter((obj) =>
          obj.qualifiedCounters.some((counter) => selectedCounters.map((counter) => counter.uuid).includes(counter)),
        )).sort((a, b) => a.time - b.time)
      : (speed = speed.sort((a, b) => a.time - b.time))

    // Sort the leaderboard based on the best time for each counter
    const pbLeaderboard = Object.entries(bestTimes)
      .map(([counter, obj]): { counter: string; obj: any } => ({ counter, obj }))
      .sort((a, b) => a.obj.time - b.obj.time)

    const leaderboardRows = speed.map((obj, index) => (
      <TableRow key={index}>
        <TableCell>{index + 1}</TableCell>
        <TableCell>{obj.timeFancy}</TableCell>
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
          {obj.qualifiedCounters.map((author, index) => (
            <span key={index}>
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
                        src={`${(cachedCounters[author].avatar.length > 5 && `https://cdn.discordapp.com/avatars/${cachedCounters[author].discordId}/${cachedCounters[author].avatar}`) || `https://cdn.discordapp.com/embed/avatars/0.png`}`}
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
              {/* {index < obj.qualifiedCounters.length - 1 ? ", " : ""} */}
            </span>
          ))}
        </TableCell>
      </TableRow>
    ))

    const startIdx = page * rowsPerPage
    const endIdx = startIdx + rowsPerPage
    const currentRows = leaderboardRows.slice(startIdx, endIdx)

    const pbLeaderboardRows = pbLeaderboard.map((row, index) => (
      <TableRow key={row.counter}>
        <TableCell>{index + 1}</TableCell>
        <TableCell>
          {cachedCounters[row.counter] ? (
            cachedCounters[row.counter].roles.includes('banned') ? (
              <>Banned User {cachedCounters[row.counter].uuid}</>
            ) : (
              <CardHeader
                sx={{ p: 0 }}
                avatar={
                  cachedCounters[row.counter] &&
                  cachedCounters[row.counter].name && (
                    <Avatar
                      component={'span'}
                      sx={{ width: 24, height: 24 }}
                      alt={`${cachedCounters[row.counter].name}`}
                      src={`${(cachedCounters[row.counter].avatar.length > 5 && `https://cdn.discordapp.com/avatars/${cachedCounters[row.counter].discordId}/${cachedCounters[row.counter].avatar}`) || `https://cdn.discordapp.com/embed/avatars/0.png`}`}
                    ></Avatar>
                  )
                }
                title={
                  <Link
                    color={cachedCounters[row.counter].color}
                    underline="hover"
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
        <TableCell>{formatTimeDiff(0, row.obj.time)}</TableCell>
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
            .filter((ct) => {
              return ct !== row.counter
            })
            .map((ct) => {
              return cachedCounters[ct] ? (
                <>
                  <CardHeader
                    sx={{ p: 0 }}
                    avatar={
                      cachedCounters[ct] &&
                      cachedCounters[ct].name && (
                        <Avatar
                          component={'span'}
                          sx={{ width: 24, height: 24 }}
                          alt={`${cachedCounters[ct].name}`}
                          src={`${(cachedCounters[ct].avatar.length > 5 && `https://cdn.discordapp.com/avatars/${cachedCounters[ct].discordId}/${cachedCounters[ct].avatar}`) || `https://cdn.discordapp.com/embed/avatars/0.png`}`}
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
                </>
              ) : (
                <>{ct}</>
              )
            })}
        </TableCell>
      </TableRow>
    ))

    const sumCounts = speed.length

    const handleCounterSelection = (selectedCounters: string[]) => {
      const countersFromUsername = Object.values(cachedCounters).filter((counter) => selectedCounters.includes(counter.username))
      setSelectedCounters(countersFromUsername)
    }

    return (
      <TableContainer>
        <Typography sx={{ mt: 2, mb: 2 }} variant="body2">
          Hall of Speed
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Counter</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Partners</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{pbLeaderboardRows}</TableBody>
        </Table>
        <Typography sx={{ mt: 2, mb: 2 }} variant="body2">
          Sub 6: {sumCounts.toLocaleString()} {sumCounts != 1 ? 'threads' : 'thread'}
        </Typography>
        <Box sx={{ width: '50%' }}>
          <CounterAutocomplete onCounterSelect={handleCounterSelection} />
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Qualified Counters</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{currentRows}</TableBody>
        </Table>
        <TablePagination
          component={'div'}
          rowsPerPageOptions={[rowsPerPage]}
          count={leaderboardRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
        />
      </TableContainer>
    )
  }
}
