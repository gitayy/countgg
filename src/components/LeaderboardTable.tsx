import { TableRow, TableCell, TableContainer, Table, TableHead, TableBody, Typography, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { cachedCounters } from "../utils/helpers";

export const LeaderboardTable = ({ stat, justLB=false }) => {

  const navigate = useNavigate();

    if((!stat && !justLB) || stat === undefined) return <></>;

    var leaderboard: Record<string, number> = {};
    if(!justLB) {
      stat.forEach((data) => {
        if (data.author in leaderboard) {
            leaderboard[data.author] += 1;
        } else {
            leaderboard[data.author] = 1;
        }
      });
    } else {
      leaderboard = stat;
    }
    

const leaderboardRows = Object.entries(leaderboard)
//   .sort((a, b) => b[1] - a[1])
  .map(([author, count], index) => (
    <TableRow key={index}>
      <TableCell>{index + 1}</TableCell>
      <TableCell>{cachedCounters[author] ? <Link color={cachedCounters[author].color} underline='hover' href={`/counter/${cachedCounters[author].uuid}`} onClick={(e) => {e.preventDefault();navigate(`/counter/${cachedCounters[author].uuid}`);}}>{cachedCounters[author].name}</Link> : <>{author}</>}</TableCell>
      <TableCell>{count}</TableCell>
    </TableRow>
  ));

  const sumCounts = Object.values(leaderboard).reduce((acc, count) => acc + count, 0);

return (
  <TableContainer>
    <Typography sx={{mb: 1}} variant='body2'>{sumCounts.toLocaleString()} {sumCounts != 1 ? "counts" : "count"}</Typography>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Rank</TableCell>
          <TableCell>Name</TableCell>
          <TableCell>Counts</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>{leaderboardRows}</TableBody>
    </Table>
  </TableContainer>
)

}