import { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { convertToTimestamp, formatDate, formatDateExact, formatTimeDiff} from '../utils/helpers';
import { useLocation } from 'react-router-dom';
import WavyText from '../components/WavyText';

export const RPSPage = () => {
    const location = useLocation();
    useEffect(() => {
        document.title = `RPS | Counting!`;
        return (() => {
          document.title = 'Counting!';
        })
      }, [location.pathname]);
  
    return (
        <Box sx={{ bgcolor: 'background.paper', flexGrow: 1, p: 2, color: 'text.primary'}}>
        <Typography variant="h4" component="h1" align="center">
          Rock Paper Scissors
        </Typography>

        <WavyText text={"bruh"} />


        <Button variant="contained">Play</Button>
      </Box>
    );
  }
