import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Link, Avatar, CardHeader } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Counter } from '../utils/types';
import { cachedCounters } from '../utils/helpers';


interface Props {
    dailyRobs: { counterUUID: string, id: number, moneyRobbed: string, postUUID: string, timestamp: string }[]|undefined;
    // name: string;
    // countName: string;
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
    
  
  export const DailyRobTable = ({ dailyRobs }: Props) => {
    // export const DailyRobTable = () => {
      const navigate = useNavigate();
    //   if(dailyRobs !== undefined && dailyRobs !== null) {
    //       const rows = dailyRobs.map((rob)) => ({
    //           counter,
    //           counts,
    //         })).sort((a, b) => b.counts - a.counts);
    //         const sumCounts = Object.values(dailyHOC).reduce((acc, { counts }) => acc + counts, 0);
          
            return (
            <>
               <Typography variant='h6'>Robs</Typography>
              <Typography sx={{mb: 1}} variant='body2'>{dailyRobs && dailyRobs.length} {dailyRobs && dailyRobs.length != 1 ? "robs" : "rob"}</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                    <TableCell>Rank</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Money</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dailyRobs && dailyRobs.map((rob, index) => (
                      <TableRow key={cachedCounters[rob.counterUUID].name}>
                        <PlaceCell place={index + 1} />
                        <TableCell component="th" scope="row" sx={{color: cachedCounters[rob.counterUUID].name}}>
                        {cachedCounters[rob.counterUUID] ? (
                  <CardHeader sx={{p: 0}} avatar={cachedCounters[rob.counterUUID] && cachedCounters[rob.counterUUID].name && <Avatar component={"span"} sx={{ width: 24, height: 24 }} alt={`${cachedCounters[rob.counterUUID].name}`} src={`${cachedCounters[rob.counterUUID].avatar.length > 5 && `https://cdn.discordapp.com/avatars/${cachedCounters[rob.counterUUID].discordId}/${cachedCounters[rob.counterUUID].avatar}` || `https://cdn.discordapp.com/embed/avatars/0.png`}`}></Avatar>}
                  title={<Link color={cachedCounters[rob.counterUUID].color} underline='hover' href={`/counter/${cachedCounters[rob.counterUUID].uuid}`} onClick={(e) => {e.preventDefault();navigate(`/counter/${cachedCounters[rob.counterUUID].uuid}`);}}>
                    {cachedCounters[rob.counterUUID].name}
                    </Link>
                  }></CardHeader>
                ) : (
                    <>{rob.counterUUID}</>
                )}
                        </TableCell>
                        <TableCell>${parseInt(rob.moneyRobbed).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
               </>
            );
    //   } else {
    //       return <>No {name} found.</>;
    //   }

            }