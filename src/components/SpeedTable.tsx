import { TableRow, TableCell, TableContainer, Table, TableHead, TableBody, Typography, Link, TablePagination } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cachedCounters, convertToTimestamp, formatTimeDiff } from "../utils/helpers";
import { ThreadType } from "../utils/types";

interface Props {
    speed: any;
    thread: ThreadType|{name: string, uuid: string};
  }

export const SpeedTable = ({ speed, thread }: Props) => {

    const rowsPerPage = 50;
      const [page, setPage] = useState(0);
        const handleChangePage = (event, newPage) => {
            setPage(newPage);
        };

  const navigate = useNavigate();

    if((!speed) || (!thread) || (typeof speed[Symbol.iterator] !== 'function')) {return <></>} else {

    // Create an object to store the best time of each counter
    const bestTimes: Record<string, any> = {};

    for (const obj of speed) {
        const timestamp1 = convertToTimestamp(obj.start);
        const timestamp2 = convertToTimestamp(obj.end);
        const timeDiff = timestamp1 && timestamp2 ? Math.round(Math.abs(timestamp1 - timestamp2) * 1000) / 1000 : null;
        obj.time = (timeDiff === null ? Infinity : timeDiff);
        obj.timeFancy = formatTimeDiff(timestamp1, timestamp2)
        for (const counter of obj.qualifiedCounters) {
            const time = obj.time || Infinity;
            if (!bestTimes[counter] || time < bestTimes[counter]) {
                bestTimes[counter] = obj;
            }
        }
    }
    speed.sort((a, b) => a.time - b.time);

    // Sort the leaderboard based on the best time for each counter
    const pbLeaderboard = Object.entries(bestTimes)
    .map(([counter, obj]): { counter: string, obj: any } => ({ counter, obj }))
    .sort((a, b) => a.obj.time - b.obj.time);

    

    const leaderboardRows = speed.map((obj, index) => (
        <TableRow key={index}>
          <TableCell>{index + 1}</TableCell>
          <TableCell>{obj.timeFancy}</TableCell>
          <TableCell><Link underline="hover" href={`/thread/${thread.name}/${obj.start}`} onClick={(e) => {e.preventDefault();navigate(`/thread/${thread.name}/${obj.start}`);}}>{parseInt(obj.startCount).toLocaleString()}</Link></TableCell>
          <TableCell><Link underline="hover" href={`/thread/${thread.name}/${obj.end}`} onClick={(e) => {e.preventDefault();navigate(`/thread/${thread.name}/${obj.end}`);}}>{parseInt(obj.endCount).toLocaleString()}</Link></TableCell>
          <TableCell>
            {obj.qualifiedCounters.map((author, index) => (
                <span key={index}>
                {cachedCounters[author] ? (
                    <Link
                    color={cachedCounters[author].color}
                    underline="hover"
                    href={`/counter/${cachedCounters[author].uuid}`}
                    onClick={(e) => {
                        e.preventDefault();
                        navigate(`/counter/${cachedCounters[author].uuid}`);
                    }}
                    >
                    {cachedCounters[author].name}
                    </Link>
                ) : (
                    <>{author}</>
                )}
                {index < obj.qualifiedCounters.length - 1 ? ", " : ""}
                </span>
            ))}
        </TableCell>
        </TableRow>
      ));

        const startIdx = page * rowsPerPage;
        const endIdx = startIdx + rowsPerPage;
        const currentRows = leaderboardRows.slice(startIdx, endIdx);

      const pbLeaderboardRows = pbLeaderboard.map((row, index) => (
        <TableRow key={row.counter}>
          <TableCell>{index + 1}</TableCell>
          <TableCell>
          {cachedCounters[row.counter] ? <Link color={cachedCounters[row.counter].color} underline="hover" href={`/counter/${cachedCounters[row.counter].uuid}`} onClick={(e) => {e.preventDefault(); navigate(`/counter/${cachedCounters[row.counter].uuid}`);}}> {cachedCounters[row.counter].name}</Link> : <Link underline="hover" href={`/counter/${row.counter}`} onClick={(e) => {e.preventDefault(); navigate(`/counter/${row.counter}`);}}> {row.counter}</Link>}
          </TableCell>
          <TableCell>{formatTimeDiff(0, row.obj.time)}</TableCell>
          <TableCell><Link underline="hover" href={`/thread/${thread.name}/${row.obj.start}`} onClick={(e) => {e.preventDefault();navigate(`/thread/${thread.name}/${row.obj.start}`);}}>{parseInt(row.obj.startCount).toLocaleString()}</Link></TableCell>
          <TableCell><Link underline="hover" href={`/thread/${thread.name}/${row.obj.end}`} onClick={(e) => {e.preventDefault();navigate(`/thread/${thread.name}/${row.obj.end}`);}}>{parseInt(row.obj.endCount).toLocaleString()}</Link></TableCell>
        </TableRow>
      ));

  const sumCounts = speed.length

return (
  <TableContainer>
    <Typography sx={{mt: 2, mb: 2}} variant='body2'>Hall of Speed</Typography>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Rank</TableCell>
          <TableCell>Counter</TableCell>
          <TableCell>Time</TableCell>
          <TableCell>Start</TableCell>
          <TableCell>End</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>{pbLeaderboardRows}</TableBody>
    </Table>
    <Typography sx={{mt: 2, mb: 2}} variant='body2'>Sub 6: {sumCounts.toLocaleString()} {sumCounts != 1 ? "threads" : "thread"}</Typography>
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
)}

}