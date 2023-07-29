import { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { convertToTimestamp, formatDate, formatDateExact, formatTimeDiff} from '../utils/helpers';
import { useLocation } from 'react-router-dom';

export const RPSPage = () => {
    const location = useLocation();
    useEffect(() => {
        document.title = `RPS | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);
  
    return (
        <Box sx={{ bgcolor: 'background.paper', flexGrow: 1, p: 2, color: 'text.primary'}}>
        <Typography variant="h4" component="h1" align="center">
          Rock Paper Scissors
        </Typography>

        <Button variant="contained">Play</Button>
      </Box>
    );
  }
