import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Link,
  CardHeader,
  Avatar,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { Counter } from '../utils/types'
import { useState, useContext } from 'react'
import { ThreadsContext } from '../utils/contexts/ThreadsContext'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'

interface Props {
  //   threadLeaderboards: {[threadUUID: string]: {[counterUUID: string]: {counter: Counter, counts: number}}}|undefined;
  sums: { [threadUUID: string]: number } | undefined
  name: string
  countName: string
  mini: boolean
}

const PlaceCell = ({ place }: { place: number }) => {
  let backgroundColor: string
  let color: string
  switch (place) {
    case 1:
      backgroundColor = 'gold'
      color = 'black'
      break
    case 2:
      backgroundColor = 'silver'
      color = 'black'
      break
    case 3:
      backgroundColor = '#CD7F32'
      color = 'black'
      break
    default:
      backgroundColor = 'transparent'
      color = 'text.primary'
      break
  }

  return (
    <TableCell align="center" sx={{ color: color, backgroundColor: backgroundColor }}>
      {place}
    </TableCell>
  )
}

export const TopThreadsTable = ({ sums, name, countName, mini }: Props) => {
  const navigate = useNavigate()

  const [expanded, setExpanded] = useState(!mini)
  const { allThreads, allThreadsLoading } = useContext(ThreadsContext)

  // Calculate the sum of counts for each thread
  const sumCountsForThreads = () => {
    // let sums: { [threadUUID: string]: number } = {};
    let sortedSums: any = []
    // Check if threadLeaderboards is defined and not empty
    if (sums) {
      //   Object.keys(threadLeaderboards).forEach((threadUUID) => {
      //     if(['all', 'last_updated', 'total_counts'].includes(threadUUID)) return;
      //     const threadData = threadLeaderboards[threadUUID];
      //     const sum = Object.values(threadData).reduce((acc, { counts }) => acc + counts, 0);
      //     sums[threadUUID] = sum;
      //   });
      sortedSums = Object.entries(sums).sort(([, countA], [, countB]) => countB - countA)
    }

    return sortedSums
  }

  // Call the function to get the sum of counts for each thread
  const sortedSums = sumCountsForThreads()

  const toggleExpand = () => {
    setExpanded(!expanded)
  }

  if (sums !== undefined && sums !== null && !allThreadsLoading && allThreads) {
    return (
      <>
        <Typography variant="h6" sx={{ textAlign: 'center' }}>
          {name}
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ textAlign: 'center' }}>Rank</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>{countName}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedSums.slice(0, expanded ? sums.length : 3).map((row, index) => {
                const thread = allThreads.find((thread) => thread.uuid === row[0])
                if (row[1] === 0) {
                  return
                }
                return row[0] && thread ? (
                  <TableRow key={row[0]}>
                    <PlaceCell place={index + 1} />
                    <TableCell component="th" scope="row" sx={{}}>
                      <Link
                        color={'inherit'}
                        underline="hover"
                        href={`/thread/${thread.name}`}
                        onClick={(e) => {
                          e.preventDefault()
                          navigate(`/thread/${thread.name}`)
                        }}
                      >
                        {thread.threadOfTheDay && <LocalFireDepartmentIcon sx={{ color: 'orangered', verticalAlign: 'bottom' }} />}{' '}
                        {thread.title}
                      </Link>
                    </TableCell>
                    <TableCell>{row[1].toLocaleString()}</TableCell>
                  </TableRow>
                ) : (
                  <>{row[0]}</>
                )
              })}
            </TableBody>
          </Table>
          {mini && sortedSums.length > 3 && (
            <Typography
              variant="body2"
              onClick={toggleExpand}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', padding: '5px' }}
            >
              {expanded ? 'Show less' : 'Show more'}
            </Typography>
          )}
        </TableContainer>
      </>
    )
  } else {
    return <>No {name} found.</>
  }
}
