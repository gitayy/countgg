import { Fragment, useContext, useEffect, useState } from 'react';
import { Autocomplete, Box, FormControl, IconButton, InputAdornment, MenuItem, Select, SelectChangeEvent, Tab, TextField, Theme, Typography, useMediaQuery } from '@mui/material';
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
import { UserContext } from '../utils/contexts/UserContext';
import { DatePicker } from '@mui/x-date-pickers';
import moment from 'moment-timezone';
import ClearIcon from "@mui/icons-material/Clear";
import LeaderboardGraph from '../components/LeaderboardGraph';

export const StatsPage = () => {
  const { counter, loading } = useContext(UserContext);
  const [page, setPage] = useState<number|undefined>();
  const [count, setCount] = useState(0);
  const [urlCheck, setUrlCheck] = useState(false);
  const [allStats, setAllStats] = useState<{gets: object[], assists: object[], palindromes: object[], repdigits: object[], speed: object[], leaderboard: object[], last_updated: string, last_updated_uuid: string}[]>();
  const [stats, setStats] = useState<{gets: object[], assists: object[], palindromes: object[], repdigits: object[], speed: object[], leaderboard: object[], last_updated: string, last_updated_uuid: string}>();
  const [statsLoading, setStatsLoading] = useState(true);
  const isMounted = useIsMounted();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'))

  const [selectedDate, setSelectedDate] = useState<any | null>(null);

  const disableDates = (date: any) => {
    const minDate = moment('2023-02-22').tz('America/New_York').startOf('day').unix()
    const maxDate = moment().tz('America/New_York').startOf('day').unix()
    return date.unix() < minDate || date.unix() >= maxDate;
  };

  const disableYears = (date: any) => {
    const minDate = moment('2023-01-01').tz('America/New_York').startOf('day').unix()
    const maxDate = moment().tz('America/New_York').startOf('day').unix()
    return date.unix() < minDate || date.unix() >= maxDate;
  };

  let currentStats;

  const location = useLocation();
    useEffect(() => {
        document.title = `Stats | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);

  const { allThreads, allThreadsLoading } = useFetchAllThreads();
    const [selectedThread, setSelectedThread] = useState<ThreadType|{name: string, uuid: string}|undefined>({name: 'all', uuid: 'all'});
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
        let dateStr;
        if(selectedDate && !disableDates(selectedDate)) {dateStr = selectedDate._d.toISOString().slice(0,10);}
        getThreadStats(name, undefined)
        .then(({ data }) => {
          if(isMounted.current) {
            for (const counter of data.counters) {
              addCounterToCache(counter)
            }
            setAllStats(data.stats)
            console.log("Ok");
            console.log(data.stats);
            console.log(dateStr);
            console.log(data.stats && data.stats[dateStr]);
            console.log(dateStr && data && data[dateStr] ? data[dateStr] : dateStr ? {} : data['all'] ? data['all'] : {});
            setStats(dateStr && data && data.stats && data.stats[dateStr] ? data.stats[dateStr] : dateStr ? {} : data.stats && data.stats['all'] ? data.stats['all'] : {})
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

  useEffect(() => {
      let dateStr;
      if(selectedDate && !disableDates(selectedDate)) {dateStr = selectedDate._d.toISOString().slice(0,10);}
    setStats(dateStr && allStats &&  allStats[dateStr] ? allStats[dateStr] : dateStr ? {} : allStats && allStats['all'] ? allStats['all'] : {})
  }, [selectedDate])

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

    const handleClearDate = () => {
      setSelectedDate(null);
    };

  if(!loading && !allThreadsLoading) {

    return (
      <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
        <Box sx={{mb: 1, p: 2, pl: 0}}>
        <FormControl variant="standard" sx={{mr: 4}}>
            <Typography>Please select a thread:</Typography>
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
      {/* <Autocomplete
      options={allThreads}
      getOptionLabel={(option) => option.name}
      onChange={(event, value) => {
        console.log(event.target);
        console.log(event.currentTarget);
        if(value && value.uuid) {
          if(event. == 'all') {
            setSelectedThread({name: 'all', uuid: 'all'});
          } else {
            setSelectedThread(value);
          }
        }
        // const selectedOption = allThreads.find((thread) => thread.name === value.na);
        // if (selectedOption) {
        //   console.log('Selected UUID:', selectedOption.uuid);
        // }
      }}
      renderInput={(params) => (
        <TextField {...params} label="Select an option" variant="outlined" />
      )}
    /> */}
        <DatePicker
          label="Select a Date"
          value={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          // shouldDisableDate={disableDates}
          // shouldDisableYear={disableYears}
          minDate={new Date(moment('2023-02-23').tz('America/New_York').startOf('day').unix() * 1000 - 10000)}
          maxDate={new Date(moment().tz('America/New_York').startOf('day').unix() * 1000)}
          renderInput={(params) => (
            <TextField
              {...params}
              InputProps={{
                endAdornment: (
                  <>
                    {params?.InputProps?.endAdornment}
                    {selectedDate && (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClearDate}>
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )}
                  </>
                ),
              }}
            />
          )}
        />
      </Box>
        {stats && !statsLoading && selectedThread && <>
          <TabContext value={tabValue}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <TabList onChange={handleTabChange} variant={'scrollable'} allowScrollButtonsMobile aria-label="Live Game Tabs">
          <Tab label="Leaderboard" value="tab_0" />
          <Tab label="Graphs" value="tab_01" />
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
        <TabPanel value="tab_01" sx={{display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center'}}>
          <Typography variant='h6'>Graphs</Typography>
          <LeaderboardGraph stats={allStats} cum={true} />
          <LeaderboardGraph stats={allStats} cum={false} />
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

        
        <Typography variant='body2' sx={{mt: 1}}>Last updated: {formatDateExact(convertToTimestamp(stats.last_updated_uuid) || 0)} ({stats.last_updated_uuid})</Typography></>}
        {statsLoading && <Loading />}
      </Box>
    )
  } else {
    return(<Loading />);
  }

};
