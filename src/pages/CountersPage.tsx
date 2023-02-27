import { useContext } from 'react';
import { CounterContext } from '../utils/contexts/CounterContext';
import { Box } from '@mui/material';
import { Loading } from '../components/Loading';

export const CountersPage = () => {
  const { counter, loading } = useContext(CounterContext);

  if(!loading) {

    return (
      <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
        Counters page is coming soon. You'll be able to search for profiles here.
      </Box>
    )
  } else {
    return(<Loading />);
  }

};
