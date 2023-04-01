import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Counter } from '../utils/types';


interface Props {
    dailyRobs: { counterUUID: string, id: number, moneyRobbed: string, postUUID: string, timestamp: string }[]|undefined;
    name: string;
    countName: string;
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
    
  
  export const DailyRobTable = ({ dailyRobs, name, countName }: Props) => {
    // export const DailyRobTable = () => {
      const navigate = useNavigate();
    //   if(dailyRobs !== undefined && dailyRobs !== null) {
    //       const rows = dailyRobs.map((rob)) => ({
    //           counter,
    //           counts,
    //         })).sort((a, b) => b.counts - a.counts);
    //         const sumCounts = Object.values(dailyHOC).reduce((acc, { counts }) => acc + counts, 0);
          
            return (<>okkkkkk
              {/* <Typography variant='h6'>{name}</Typography>
              <Typography sx={{mb: 1}} variant='body2'>{sumCounts} {sumCounts != 1 ? "counts" : "count"}</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                    <TableCell>Rank</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>{countName}</TableCell>
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
              </TableContainer> */}
              </>
            );
    //   } else {
    //       return <>No {name} found.</>;
    //   }

            }