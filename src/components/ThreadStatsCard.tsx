import { Grid, Card, CardContent, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";

interface ThreadStats {
    posts?: number;
    counts: number;
    mistakes: number;
    odds: number;
    evens: number;
    first_count: string;
  }
  
  interface ThreadStatsCardProps {
    threadTitle: string;
    threadData: ThreadStats;
    color?: string;
  }
  
  const ThreadStatsCard: React.FC<ThreadStatsCardProps> = ({ threadTitle, threadData, color }) => {
    return (
      <Card sx={{...color && {background: color}}}>
        <CardContent>
          <Typography variant="h5" sx={{textAlign: 'center', ...color && {color: 'black'}}}>{threadTitle === 'all' ? 'Sitewide' : threadTitle}</Typography>
          <TableContainer component={Paper}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>Posts:</TableCell>
                <TableCell>{threadData.posts?.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Counts:</TableCell>
                <TableCell>{threadData.counts?.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Stricken:</TableCell>
                <TableCell>{threadData.mistakes?.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Odds:</TableCell>
                <TableCell>{threadData.odds?.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Evens:</TableCell>
                <TableCell>{threadData.evens?.toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        </CardContent>
      </Card>
    );
  };
  
  export default ThreadStatsCard;