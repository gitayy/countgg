import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import { CounterContext } from '../utils/contexts/CounterContext';
import { Box, Typography } from '@mui/material';
import { Loading } from '../components/Loading';
import { useFetchAllThreads } from '../utils/hooks/useFetchAllThreads';
import { ThreadCard } from '../components/ThreadCard';

export const ThreadsPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { counter, loading } = useContext(CounterContext);
  const { allThreads } = useFetchAllThreads();

  const location = useLocation();
    useEffect(() => {
        document.title = `Threads | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);

  if(!loading && allThreads ) {

    return (
        <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
            <Typography variant="h4">All Threads</Typography>
            <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
            <ThreadCard title={"Main Thread"} description={"The simplest, yet largest thread on countGG. 1, 2, 3..."} href={`/thread/main`} color1={'#9be15d'} color2={'#00e3ae'}></ThreadCard>
            <ThreadCard title={"Test Thread"} description={"Test out anything here! Spam, practice, or anything."} href={`/thread/test`} color1={'#fc00ff'} color2={'#00dbde'}></ThreadCard>
            <ThreadCard title={"Letters"} description={"Count by English letters!"} href={`/thread/letters`} color1={'#ff9966'} color2={'#ff5e62'}></ThreadCard>
            <ThreadCard title={"Slow"} description={"You can only count once an hour..."} href={`/thread/slow`} color1={'#3a1c71'} color2={'#d76d77'}></ThreadCard>
            <ThreadCard title={"Bars"} description={"Be the first one to post on the hour change!"} href={`/thread/bars`} color1={'#1A2980'} color2={'#26D0CE'}></ThreadCard>
            <ThreadCard title={"Double Counting"} description={"The most selfish thread on countGG... double counting is allowed!"} href={`/thread/double_counting`} color1={'#6A9113'} color2={'#141517'}></ThreadCard>
            <ThreadCard title={"Odds"} description={"Count odd numbers only!"} href={`/thread/odds`} color1={'#ffafbd'} color2={'#ffc3a0'}></ThreadCard>
            <ThreadCard title={"Evens"} description={"Count even numbers only!"} href={`/thread/evens`} color1={'#43cea2'} color2={'#185a9d'}></ThreadCard>
            <ThreadCard title={"Odds Double"} description={"Double counting, with odd numbers only!"} href={`/thread/odds_double`} color1={'#00c6ff'} color2={'#0072ff'}></ThreadCard>
            <ThreadCard title={"Evens Double"} description={"Double counting, with even numbers only!"} href={`/thread/evens_double`} color1={'#fd746c'} color2={'#ff9068'}></ThreadCard>
            </Box>
      </Box>
    )
  } else if(!loading && !allThreads) {
    return (
      <>
      <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>No threads found :(</Box>
      </>
    )
  } else {
    return(<Loading />);
  }

}
