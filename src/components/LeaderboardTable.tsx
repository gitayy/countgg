import { TableRow, TableCell, TableContainer, Table, TableHead, TableBody, Typography, Link, CardHeader, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { cachedCounters } from "../utils/helpers";

export const LeaderboardTable = ({ stat, blud, justLB=false }) => {

  const navigate = useNavigate();
  console.log(stat);

    if((!stat && !justLB) || stat === undefined) return <>Can't find stats. Sorry...?</>;

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
    
    const sumCounts = Object.values(leaderboard).reduce((acc, count) => acc + count, 0);

const leaderboardRows = Object.entries(leaderboard)
  .sort((a, b) => b[1] - a[1])
  .map(([author, count], index) => (
    <TableRow key={index}>
      <TableCell>{index + 1}</TableCell>
      <TableCell>
      {cachedCounters[author] ? (
        cachedCounters[author].roles.includes('banned') ? <>Banned User {cachedCounters[author].uuid}</> :
                  <CardHeader sx={{p: 0}} avatar={cachedCounters[author] && cachedCounters[author].name && <Avatar component={"span"} sx={{ width: 24, height: 24 }} alt={`${cachedCounters[author].name}`} src={`${cachedCounters[author].avatar.length > 5 && `https://cdn.discordapp.com/avatars/${cachedCounters[author].discordId}/${cachedCounters[author].avatar}` || `https://cdn.discordapp.com/embed/avatars/0.png`}`}></Avatar>}
                  title={<Link color={cachedCounters[author].color} underline='hover' href={`/counter/${cachedCounters[author].username}`} onClick={(e) => {e.preventDefault();navigate(`/counter/${cachedCounters[author].username}`);}}>
                    {cachedCounters[author].name}
                    </Link>
                  }></CardHeader>
                ) : (
                    <>{author}</>
                )}
      </TableCell>
      <TableCell>{count.toLocaleString()}</TableCell>
    </TableRow>
  ));

return (
  <TableContainer>
    <Typography sx={{mb: 1}} variant='body2'>{sumCounts.toLocaleString()} {sumCounts !== 1 ? "counts" : "count"}</Typography>
    <Table size="small">
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