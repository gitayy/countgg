import { useContext } from 'react';
import { CounterContext } from '../utils/contexts/CounterContext';
import { Box } from '@mui/material';
import { Loading } from '../components/Loading';

export const StatsPage = () => {
  const { counter, loading } = useContext(CounterContext);

  if(!loading) {

    return (
      <Box sx={{ bgcolor: 'primary.light', flexGrow: 1}}>
        Coming soon
      </Box>
    )
  } else {
    return(<Loading />);
  }

};
