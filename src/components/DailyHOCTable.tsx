import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Link, CardHeader, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Counter } from '../utils/types';
import { useState } from 'react';

interface Props {
  dailyHOC: {[authorUUID: string]: { counter: Counter, counts: number }}|undefined;
  name: string;
  countName: string;
  mini: boolean;
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
      <TableCell align="center" sx={{color: color, backgroundColor: backgroundColor}}>
        {place}
      </TableCell>
    );
  };
  

export const DailyHOCTable = ({ dailyHOC, name, countName, mini }: Props) => {
    const navigate = useNavigate();

    const [expanded, setExpanded] = useState(!mini);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

    if(dailyHOC !== undefined && dailyHOC !== null) {
        const rows = Object.entries(dailyHOC).map(([authorUUID, { counter, counts }]) => ({
            counter,
            counts,
          })).sort((a, b) => b.counts - a.counts);
          const sumCounts = Object.values(dailyHOC).reduce((acc, { counts }) => acc + counts, 0);
        
          return (<>
            <Typography variant='h6'>{name}</Typography>
            {!mini && <Typography sx={{mb: 1}} variant='body2'>{sumCounts} {sumCounts != 1 ? "counts" : "count"}</Typography>}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                  <TableCell>Rank</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>{countName}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.slice(0, expanded ? rows.length : 3).map((row, index) => {
                    return row.counter ? (
                    <TableRow key={row.counter.name}>
                      <PlaceCell place={index + 1} />
                      <TableCell component="th" scope="row" sx={{color: row.counter.color}}>
                      <CardHeader sx={{p: 0}} avatar={row.counter && row.counter.name && <Avatar component={"span"} sx={{ width: 24, height: 24 }} alt={`${row.counter.name}`} src={`${row.counter.avatar.length > 5 && `https://cdn.discordapp.com/avatars/${row.counter.discordId}/${row.counter.avatar}` || `https://cdn.discordapp.com/embed/avatars/0.png`}`}></Avatar>}
                      title={<Link color={'inherit'} underline='hover' href={`/counter/${row.counter.username}`} onClick={(e) => {e.preventDefault();navigate(`/counter/${row.counter.username}`);}}>
                        {row.counter.name}
                        </Link>
                      }></CardHeader>
                      </TableCell>
                      <TableCell>{row.counts.toLocaleString()}</TableCell>
                    </TableRow>) : <></>}
                  )}
                </TableBody>
              </Table>
              {mini && rows.length > 3 && (
                <Typography variant="body2" onClick={toggleExpand} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', padding: '5px' }}>
                  {expanded ? 'Show less' : 'Show more'}
                </Typography>
              )}
            </TableContainer>
            </>
          );
    } else {
        return <>No {name} found.</>;
    }
};