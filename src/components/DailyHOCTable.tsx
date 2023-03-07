import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Counter } from '../utils/types';

interface Props {
  dailyHOC: {[authorUUID: string]: { counter: Counter, counts: number }}|undefined;
}

const PlaceCell = ({ place }: { place: number }) => {
    let backgroundColor: string;
    let color: string;
    switch (place) {
      case 1:
        backgroundColor = 'gold';
        color = 'black';
        break;
      case 2:
        backgroundColor = 'silver';
        color = 'black';
        break;
      case 3:
        backgroundColor = '#CD7F32';
        color = 'black';
        break;
      default:
        backgroundColor = 'transparent';
        color = 'text.primary';
        break;
    }
  
    return (
      <TableCell align="center" style={{ backgroundColor, color }}>
        {place}
      </TableCell>
    );
  };
  

export const DailyHOCTable = ({ dailyHOC }: Props) => {
    const navigate = useNavigate();
    console.log("lalala");
    console.log(dailyHOC);
    if(dailyHOC !== undefined && dailyHOC !== null) {
        const rows = Object.entries(dailyHOC).map(([authorUUID, { counter, counts }]) => ({
            counter,
            counts,
          })).sort((a, b) => b.counts - a.counts);
          const sumCounts = Object.values(dailyHOC).reduce((acc, { counts }) => acc + counts, 0);
        
          return (<>
            <Typography variant='h6'>Daily Leaderboard</Typography>
            <Typography sx={{mb: 1}} variant='body2'>{sumCounts} {sumCounts != 1 ? "counts" : "count"}</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                  <TableCell>Rank</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Counts</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.counter.name}>
                      <PlaceCell place={index + 1} />
                      <TableCell component="th" scope="row" sx={{color: row.counter.color}}>
                      <Link color={'inherit'} underline='hover' href={`/counter/${row.counter.uuid}`} onClick={(e) => {e.preventDefault();navigate(`/counter/${row.counter.uuid}`);}}>
                        {row.counter.name}
                        </Link>
                      </TableCell>
                      <TableCell>{row.counts}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </>
          );
    } else {
        return <>No daily leaderboard found.</>;
    }
};