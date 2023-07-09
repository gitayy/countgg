import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { Loading } from '../components/Loading';
import { useFetchAllThreads } from '../utils/hooks/useFetchAllThreads';
import { ThreadCard } from '../components/ThreadCard';
import { UserContext } from '../utils/contexts/UserContext';
import TabPanel from '@mui/lab/TabPanel';
import TabContext from '@mui/lab/TabContext';

export const ThreadsPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { counter, loading } = useContext(UserContext);
  const { allThreads } = useFetchAllThreads();

  const location = useLocation();
    useEffect(() => {
        document.title = `Threads | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);

      const [tabValue, setTabValue] = useState('tab_1');

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
      setTabValue(newValue);
    };

  const tabStyle = {
    minWidth: 0,
    padding: '16px',
    // textTransform: 'none',
    // fontWeight: 'bold',
    // '&:hover': {
    //   backgroundColor: '#f5f5f5',
    // },
    // '&.Mui-selected': {
    //   backgroundColor: '#1976d2',
    //   color: '#fff',
    // },
  };

  const tabsStyle = {
    // backgroundColor: '#fff',
    // backgroundColor: 'background.paper',
    borderRadius: '4px',
    boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    // '& .MuiTabs-flexContainer': {
    //   justifyContent: 'space-around',
    // },
  };

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if(!loading && allThreads ) {

    return (
        <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
            <Typography variant="h4">All Threads</Typography>
            <Box sx={{bgcolor: 'transparent'}}>
            <TabContext value={tabValue}>
            <Tabs value={tabValue} variant={'scrollable'} allowScrollButtonsMobile onChange={handleChange} sx={{bgcolor: 'background.paper'}} style={tabsStyle}>
      <Tab label="Traditional" value={"tab_1"} style={tabStyle} />
      <Tab label="Double Counting" value={"tab_2"} style={tabStyle} />
      <Tab label="No Mistakes" value={"tab_3"} style={tabStyle} />
      <Tab label="Miscellaneous" value={"tab_4"} style={tabStyle} />
    </Tabs>
    <TabPanel value="tab_1" sx={{flexGrow: 1}}>
      <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
            <ThreadCard title={"Main Thread"} description={"The simplest thread on countGG. 1, 2, 3..."} href={`/thread/main`} color1={'#9be15d'} color2={'#00e3ae'}></ThreadCard>
            <ThreadCard title={"Slow"} description={"You can only count once an hour..."} href={`/thread/slow`} color1={'#3a1c71'} color2={'#d76d77'}></ThreadCard>
            <ThreadCard title={"Bars"} description={"Be the first one to post on the hour change!"} href={`/thread/bars`} color1={'#1A2980'} color2={'#26D0CE'}></ThreadCard>
            <ThreadCard title={"Tug of War"} description={"Add or subtract... the choice is yours."} href={`/thread/tug_of_war`} color1={'#fc4a1a'} color2={'#f7b733'}></ThreadCard>
            <ThreadCard title={"Binary"} description={"1010101"} href={`/thread/binary`} color1={'#614385'} color2={'#516395'}></ThreadCard>
            <ThreadCard title={"Hexadecimal"} description={"0-9, then A-F."} href={`/thread/hexadecimal`} color1={'#cc2b5e'} color2={'#753a88'}></ThreadCard>
            <ThreadCard title={"Roman Numerals"} description={"Truly traditional counting."} href={`/thread/roman`} color1={'#b92b27'} color2={'#1565c0'}></ThreadCard>
            <ThreadCard title={"Odds"} description={"Count odd numbers only."} href={`/thread/odds`} color1={'#ffafbd'} color2={'#ffc3a0'}></ThreadCard>
            <ThreadCard title={"Evens"} description={"Count even numbers only,"} href={`/thread/evens`} color1={'#43cea2'} color2={'#185a9d'}></ThreadCard>
            <ThreadCard title={"Letters"} description={"Count by English letters! A, B, C..."} href={`/thread/letters`} color1={'#ff9966'} color2={'#ff5e62'}></ThreadCard>
            </Box>
     </TabPanel>
     <TabPanel value="tab_2" sx={{flexGrow: 1}}>
      <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
            <ThreadCard title={"Double Counting"} description={"Traditional counting... but you can count solo!"} href={`/thread/double_counting`} color1={'#6A9113'} color2={'#141517'}></ThreadCard>
            <ThreadCard title={"Odds Double"} description={"Double counting, with odd numbers only!"} href={`/thread/odds_double`} color1={'#00c6ff'} color2={'#0072ff'}></ThreadCard>
            <ThreadCard title={"Evens Double"} description={"Double counting, with even numbers only!"} href={`/thread/evens_double`} color1={'#fd746c'} color2={'#ff9068'}></ThreadCard>
            <ThreadCard title={"Letters Double"} description={"Letters double counting..."} href={`/thread/letters_double`} color1={'#4facfe'} color2={'#00f2fe'}></ThreadCard>
            <ThreadCard title={"Binary Double"} description={"Binary double counting..."} href={`/thread/binary_double`} color1={'#4facfe'} color2={'#00f2fe'}></ThreadCard>
            <ThreadCard title={"Hex Double"} description={"Hex double counting..."} href={`/thread/hex_double`} color1={'#4facfe'} color2={'#00f2fe'}></ThreadCard>
            <ThreadCard title={"Roman Double"} description={"Roman double counting..."} href={`/thread/roman_double`} color1={'#4facfe'} color2={'#00f2fe'}></ThreadCard>
            </Box>
     </TabPanel>
     <TabPanel value="tab_3" sx={{flexGrow: 1}}>
      <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
            <ThreadCard title={"No Mistakes"} description={"Traditional counting... but it resets on mistakes!"} href={`/thread/no_mistakes`} color1={'#9A0021'} color2={'#512221'}></ThreadCard>
            <ThreadCard title={"No Mistakes Double"} description={"Double counting, but resets on mistakes."} href={`/thread/no_mistakes_double`} color1={'#CC3001'} color2={'#002C31'}></ThreadCard>
            </Box>
     </TabPanel>
     <TabPanel value="tab_4" sx={{flexGrow: 1}}>
     <Box sx={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
        <ThreadCard title={"Test Thread"} description={"Test out anything here! Spam, practice, or anything."} href={`/thread/test`} color1={'#fc00ff'} color2={'#00dbde'}></ThreadCard>
        <ThreadCard title={"YOCO"} description={"You only count once. Use it wisely."} href={`/thread/yoco`} color1={'#00bf8f'} color2={'#001510'}></ThreadCard>
        <ThreadCard title={"Russian Roulette"} description={"Every count you make, you have a 0.01% chance of being permanently banned from this thread."} href={`/thread/russian_roulette`} color1={'#e0c3fc'} color2={'#8ec5fc'}></ThreadCard>
        <ThreadCard title={"Tug of War: Avoid 0"} description={"Tug of war, but if you post 0, you get permanently banned from this thread. Great sacrifices must be made."} href={`/thread/tug_of_war_avoid_0`} color1={'#20bf55'} color2={'#01baef'}></ThreadCard>
        <ThreadCard title={"Slow: TSLC"} description={"The time since the last count must be greater than the previous count's time since the last count."} href={`/thread/slow_tslc`} color1={'#ec008c'} color2={'#fc6767'}></ThreadCard>
        {/* <ThreadCard title={"No Mistakes Or Ban"} description={"No mistakes. If you make a mistake, you get banned."} href={`/thread/no_mistakes_or_ban`} color1={'#d1913c'} color2={'#ffd194'}></ThreadCard> */}
        <ThreadCard title={"Random Hour"} description={"Counts are only valid for one random hour per day. The hour is kept secret."} href={`/thread/random_hour`} color1={'#7f00ff'} color2={'#e100ff'}></ThreadCard>
        <ThreadCard title={"1/x Valid"} description={"Each count has a 1/x chance of being valid."} href={`/thread/1inx`} color1={'#fc466b'} color2={'#3f5efb'}></ThreadCard>
        <ThreadCard title={"Countdown from 1 million"} description={"Start at a million. Count down until we reach 0."} href={`/thread/countdown`} color1={'#f12711'} color2={'#f5af19'}></ThreadCard>
      </Box>
     </TabPanel>
     </TabContext>
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
