import { useContext, useEffect, useState } from 'react';
import { CounterContext } from '../utils/contexts/CounterContext';
import { Box, FormControl, MenuItem, Select, SelectChangeEvent, Tab, Theme, Typography, useMediaQuery } from '@mui/material';
import { Loading } from '../components/Loading';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCountersPage, getThreadStats } from '../utils/api';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import { Counter, ThreadType } from '../utils/types';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { DailyHOCTable } from '../components/DailyHOCTable';
import { addCounterToCache, convertToTimestamp, formatDateExact } from '../utils/helpers';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { useFetchAllThreads } from '../utils/hooks/useFetchAllThreads';
import { SpeedTable } from '../components/SpeedTable';

export const StatsPage = () => {
  const { counter, loading } = useContext(CounterContext);
  // const [counters, setCounters] = useState<Counter[]>([]);
  // const [countersLoading, setCountersLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number|undefined>();
  const [count, setCount] = useState(0);
  const [urlCheck, setUrlCheck] = useState(false);
  const [stats, setStats] = useState<{gets: object[], assists: object[], palindromes: object[], repdigits: object[], speed: object[], leaderboard: object[], last_updated: string}>();
  const [statsLoading, setStatsLoading] = useState(true);
  const isMounted = useIsMounted();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'))

  const location = useLocation();
    useEffect(() => {
        document.title = `Stats | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);

  const { allThreads, allThreadsLoading } = useFetchAllThreads();
    const [selectedThread, setSelectedThread] = useState<ThreadType|{name: string, uuid: string}>();
    const [name, setName] = useState('');
    const [uuid, setUuid] = useState('');

    useEffect(() => {
      if (!selectedThread) return;
      setUuid(selectedThread.uuid);
      setName(selectedThread.name);
    }, [selectedThread]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(searchParams.get("page") || '1');
    if (!isNaN(currentPage)) {
      setUrlCheck(true);
      setPage(currentPage);
    } else {
      setUrlCheck(true);
      setPage(1);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      if(page) {
        setStatsLoading(true);
        getThreadStats(name)
        .then(({ data }) => {
          if(isMounted.current) {
            for (const counter of data.counters) {
              addCounterToCache(counter)
            }
            setStats(data.stats);
            setStatsLoading(false);
          }
          
        })
        .catch((err) => {
          console.log(err);
        })
      }
      }
    if(urlCheck && page && name) {fetchData();}
  }, [urlCheck, page, name]);

  function handleChangePage(event, value) {
    setPage(value);
  }

  const [tabValue, setTabValue] = useState('tab_0');

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
      setTabValue(newValue);
    };

    const handleThreadSelection = (event: SelectChangeEvent<string>) => {
      if(event.target.value == 'all') {
        setSelectedThread({name: 'all', uuid: 'all'});
      } else {
        const selectedThread = allThreads.find(thread => thread.uuid === event.target.value);
        setSelectedThread(selectedThread);
      }
      
    };

  if(!loading && !allThreadsLoading) {

    return (
      <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
        <FormControl variant="standard" sx={{mb: 1}}>
            {uuid.length == 0 && <Typography>Please select a thread.</Typography>}
        <Select
          value={selectedThread ? selectedThread.uuid : ''}
          onChange={handleThreadSelection}
        >
          <MenuItem key={'all'} value={'all'}>all</MenuItem>
          {allThreads.map(thread => (
            <MenuItem key={thread.uuid} value={thread.uuid}>{thread.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
        {stats && selectedThread && <>
          <TabContext value={tabValue}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <TabList onChange={handleTabChange} aria-label="Live Game Tabs">
          <Tab label="Leaderboard" value="tab_0" />
          {stats['gets'] && Object.keys(stats['gets']).length > 0 && <Tab label="Gets" value="tab_1" />}
          {stats['assists'] && Object.keys(stats['assists']).length > 0 && <Tab label="Assists" value="tab_2" />}
          {stats['palindromes'] && Object.keys(stats['palindromes']).length > 0 && <Tab label="Palindromes" value="tab_3" />}
          {stats['repdigits'] && Object.keys(stats['repdigits']).length > 0 && <Tab label="Repdigits" value="tab_4" />}
          {stats['speed'] && stats['speed'].length > 0 && <Tab label="Speed" value="tab_5" />}
        </TabList>
      </Box>
        <Box sx={{flexGrow: 1, p: 2, bgcolor: 'background.paper', color: 'text.primary'}}>
        <TabPanel value="tab_0" sx={{}}>
          <Typography variant='h6'>Leaderboard</Typography>
          <LeaderboardTable stat={stats.leaderboard} justLB={true}></LeaderboardTable>
        </TabPanel>
        <TabPanel value="tab_1" sx={{}}>
          <Typography variant='h6'>Gets</Typography>
          <LeaderboardTable stat={stats.gets} justLB={true}></LeaderboardTable>
        </TabPanel>
        <TabPanel value="tab_2" sx={{}}>
          <Typography variant='h6'>Assists</Typography>
          <LeaderboardTable stat={stats.assists} justLB={true}></LeaderboardTable>
        </TabPanel>
        <TabPanel value="tab_3" sx={{}}>
          <Typography variant='h6'>Palindromes</Typography>
          <LeaderboardTable stat={stats.palindromes} justLB={true}></LeaderboardTable>
        </TabPanel>
        <TabPanel value="tab_4" sx={{}}>
          <Typography variant='h6'>Repdigits</Typography>
          <LeaderboardTable stat={stats.repdigits} justLB={true}></LeaderboardTable>
        </TabPanel>
        <TabPanel value="tab_5" sx={{}}>
          <Typography variant='h6'>Speed</Typography>
          <SpeedTable speed={stats.speed} thread={selectedThread}></SpeedTable>
        </TabPanel>
        </Box>
        </TabContext>

        
        <Typography variant='body2' sx={{mt: 1}}>Last updated: {formatDateExact(convertToTimestamp(stats.last_updated) || 0)} ({stats.last_updated})</Typography></>}
      </Box>
    )
  } else {
    return(<Loading />);
  }

};
