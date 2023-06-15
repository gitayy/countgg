import { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import ScrollableStepper from '../components/ScrollableStepper';

export const SeasonPage = () => {
    const location = useLocation();
    useEffect(() => {
        document.title = `XP Rewards | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);
  
    return (
        <Box sx={{ bgcolor: 'background.paper', flexGrow: 1, p: 2, color: 'text.primary'}}>
        <Typography variant="h4" component="h1" align="center">
          XP Rewards
        </Typography>

        <ScrollableStepper></ScrollableStepper>
  
      </Box>
    );
  }
