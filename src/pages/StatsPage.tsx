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
import { StatsQuery } from '../components/StatsQuery';

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
  const [blud, setBlud] = useState(Math.random())

  const [selectedStartDate, setSelectedStartDate] = useState<any | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<any | null>(null);

  const disableDates = (date: any) => {
    const minDate = moment('2023-02-22').tz('America/New_York').startOf('day').unix()
    const maxDate = moment().tz('America/New_York').startOf('day').unix()
    return date.unix() < minDate || date.unix() >= maxDate;
  };

  let currentStats;

  const location = useLocation();
    useEffect(() => {
        document.title = `Stats | Counting!`;
        return (() => {
          document.title = 'Counting!';
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
        let startdateStr;
        let enddateStr;
        // if(selectedDate && !disableDates(selectedDate)) {dateStr = selectedDate._d.toISOString().slice(0,10);}
        if(selectedStartDate && !disableDates(selectedStartDate)) {startdateStr = selectedStartDate.toISOString().slice(0,10);}
        if(selectedEndDate && !disableDates(selectedEndDate)) {enddateStr = selectedEndDate.toISOString().slice(0,10);}
        getThreadStats(name, undefined)
        .then(({ data }) => {
          if(isMounted.current) {
            for (const counter of data.counters) {
              addCounterToCache(counter)
            }
            setAllStats(data.stats)
            // console.log("Pog? Allstats set to ");
            // console.log(data.stats);
            // console.log("Ok");
            // console.log(data.stats);
            // console.log(dateStr);
            // console.log(data.stats && data.stats[dateStr]);
            // console.log(dateStr && data && data[dateStr] ? data[dateStr] : dateStr ? {} : data['all'] ? data['all'] : {});
            setStats(getStatsBetween(startdateStr, enddateStr));
            // setStats(dateStr && data && data.stats && data.stats[dateStr] ? data.stats[dateStr] : dateStr ? {} : data.stats && data.stats['all'] ? data.stats['all'] : {})
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

  // useEffect(() => {
  //     let dateStr;
  //     if(selectedDate && !disableDates(selectedDate)) {dateStr = selectedDate._d.toISOString().slice(0,10);}
  //   setStats(dateStr && allStats &&  allStats[dateStr] ? allStats[dateStr] : dateStr ? {} : allStats && allStats['all'] ? allStats['all'] : {})
  // }, [selectedStartDate, selectedEndDate])

  function getFirstDate(stats) {
    let firstDate: string | null = null;
  
    for (const dateStr in stats) {
      if (stats.hasOwnProperty(dateStr)) {
        if (!firstDate || dateStr < firstDate) {
          firstDate = dateStr;
        }
      }
    }
  
    return firstDate;
  }
  function getNextDate(dateStr) {
    // const currentDate = new Date(dateStr);
    // currentDate.setDate(currentDate.getDate() + 1);
    const currentDate = moment(dateStr).tz('America/New_York')
    // .startOf('day').unix() * 1000
    currentDate.add(1, 'days')
    return currentDate.toISOString().slice(0, 10);
  }
  function mergeStats(stats1: any, stats2: any): any {
    if (!stats1) return stats2;
    if (!stats2) return stats1;
    // console.log("Merging stats...");
  
    // Merge the last_updated and last_updated_uuid
    const latestStats = {
      last_updated: Math.max(stats1.last_updated, stats2.last_updated),
      last_updated_uuid:
        stats1.last_updated > stats2.last_updated
          ? stats1.last_updated_uuid
          : stats2.last_updated_uuid,
    };
  
    // Merge the other objects by adding values for each key
    const keysToMerge = ['gets', 'assists', 'palindromes', 'repdigits', 'leaderboard'];
  
    keysToMerge.forEach((key) => {
      latestStats[key] = {};
  
      if (stats1[key]) {
        for (const id in stats1[key]) {
          if (stats1[key].hasOwnProperty(id)) {
            latestStats[key][id] = (latestStats[key][id] || 0) + stats1[key][id];
          }
        }
      }
  
      if (stats2[key]) {
        for (const id in stats2[key]) {
          if (stats2[key].hasOwnProperty(id)) {
            latestStats[key][id] = (latestStats[key][id] || 0) + stats2[key][id];
          }
        }
      }
    });

    latestStats['speed'] = (stats1.speed || []).concat(stats2.speed || []);
  
    return latestStats;
  }

  function getStatsBetween(startDateStr:string | undefined =undefined, endDateStr:string | undefined=undefined) {
    console.log(`Get stats between ${startDateStr} and ${endDateStr}`);
    if(!allStats) {console.error("No allStats... this is bad");console.log(allStats);return undefined;}
    if (startDateStr && endDateStr) {
      let stats = allStats[startDateStr];
      for (let date = getNextDate(startDateStr); date <= endDateStr; date = getNextDate(date)) {
        // console.log("ayo: ", date);
        stats = mergeStats(stats, allStats[date])
        // console.log(stats);
      }
      // setStats(stats);
      return stats;
    } else if (endDateStr) {
      // Only end date is defined, merge stats from the first day up to end date
      let firstDate = getFirstDate(allStats);
      if(firstDate === null) {console.error("No first date... this is bad");return undefined;}
      let stats = allStats[firstDate];
      for (let date = getNextDate(firstDate); date <= endDateStr; date = getNextDate(date)) {
        stats = mergeStats(stats, allStats[date])
      }
      // setStats(stats);
      return stats;
    } else if (startDateStr) {
      // Only start date is defined, get stats for just that start date
      // setStats(allStats[startDateStr]);
      return allStats[startDateStr];
    } else {
      // Neither start nor end date is defined, use the 'all' stats
      console.log("Setting to all");
      console.log(allStats['all']);
      // setStats(allStats['all']);
      return allStats['all']
    }
  }



  useEffect(() => {
    let startDateStr = selectedStartDate && !disableDates(selectedStartDate) ? selectedStartDate._d.toISOString().slice(0, 10) : null;
    let endDateStr = selectedEndDate && !disableDates(selectedEndDate) ? selectedEndDate._d.toISOString().slice(0, 10) : null;
  
    setStats(getStatsBetween(startDateStr, endDateStr));
    setBlud(Math.random())
  }, [selectedStartDate, selectedEndDate, allStats]); // Include selectedStartDate and selectedEndDate as dependencies
  

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

    const handleClearStartDate = () => {
      setSelectedStartDate(null);
    };

    const handleClearEndDate = () => {
      setSelectedEndDate(null);
    };

    console.log("Hmm");
    console.log(stats, !statsLoading, selectedThread);

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
            <MenuItem key={thread.uuid} value={thread.uuid}>{thread.title}</MenuItem>
          ))}
        </Select>
      </FormControl>
        <DatePicker
          label="Start Date"
          value={selectedStartDate}
          onChange={(date) => setSelectedStartDate(date)}
          minDate={new Date(moment('2023-02-23').tz('America/New_York').startOf('day').unix() * 1000 - 10000)}
          maxDate={new Date(moment().tz('America/New_York').startOf('day').unix() * 1000)}
          renderInput={(params) => (
            <TextField
              {...params}
              sx={{mr: 4}}
              InputProps={{
                endAdornment: (
                  <>
                    {params?.InputProps?.endAdornment}
                    {selectedStartDate && (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClearStartDate}>
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
        <DatePicker
          label="End Date"
          value={selectedEndDate}
          onChange={(date) => setSelectedEndDate(date)}
          minDate={new Date(moment('2023-02-23').tz('America/New_York').startOf('day').unix() * 1000 - 10000)}
          maxDate={new Date(moment().tz('America/New_York').startOf('day').unix() * 1000)}
          renderInput={(params) => (
            <TextField
              {...params}
              InputProps={{
                endAdornment: (
                  <>
                    {params?.InputProps?.endAdornment}
                    {selectedEndDate && (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClearEndDate}>
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
      {selectedThread && <>
          <TabContext value={tabValue}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <TabList onChange={handleTabChange} variant={'scrollable'} allowScrollButtonsMobile aria-label="Stats">
          <Tab label="Leaderboard" value="tab_0" />
          {stats && <Tab label="Graphs" value="tab_01" />}
          {stats && stats['gets'] && Object.keys(stats['gets']).length > 0 && <Tab label="Gets" value="tab_1" />}
          {stats && stats['assists'] && Object.keys(stats['assists']).length > 0 && <Tab label="Assists" value="tab_2" />}
          {stats && stats['palindromes'] && Object.keys(stats['palindromes']).length > 0 && <Tab label="Palindromes" value="tab_3" />}
          {stats && stats['repdigits'] && Object.keys(stats['repdigits']).length > 0 && <Tab label="Repdigits" value="tab_4" />}
          {stats && stats['speed'] && stats['speed'].length > 0 && <Tab label="Speed" value="tab_5" />}
          <Tab label="Query" value="tab_6" />
        </TabList>
      </Box>
        <Box sx={{flexGrow: 1, p: 2, bgcolor: 'background.paper', color: 'text.primary'}}>
        <TabPanel value="tab_0" sx={{}}>
          <Typography variant='h6'>Leaderboard</Typography>
          <LeaderboardTable stat={stats && stats.leaderboard} blud={blud} justLB={true}></LeaderboardTable>
        </TabPanel>
        <TabPanel value="tab_01" sx={{display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center'}}>
          <Typography variant='h6'>Graphs</Typography>
          <LeaderboardGraph stats={allStats} cum={true} />
          <LeaderboardGraph stats={allStats} cum={false} />
        </TabPanel>
        <TabPanel value="tab_1" sx={{}}>
          <Typography variant='h6'>Gets</Typography>
          <LeaderboardTable stat={stats && stats.gets} blud={blud} justLB={true}></LeaderboardTable>
        </TabPanel>
        <TabPanel value="tab_2" sx={{}}>
          <Typography variant='h6'>Assists</Typography>
          <LeaderboardTable stat={stats && stats.assists} blud={blud} justLB={true}></LeaderboardTable>
        </TabPanel>
        <TabPanel value="tab_3" sx={{}}>
          <Typography variant='h6'>Palindromes</Typography>
          <LeaderboardTable stat={stats && stats.palindromes} blud={blud} justLB={true}></LeaderboardTable>
        </TabPanel>
        <TabPanel value="tab_4" sx={{}}>
          <Typography variant='h6'>Repdigits</Typography>
          <LeaderboardTable stat={stats && stats.repdigits} blud={blud} justLB={true}></LeaderboardTable>
        </TabPanel>
        <TabPanel value="tab_5" sx={{}}>
          <Typography variant='h6'>Speed</Typography>
          <SpeedTable speed={stats && stats.speed} thread={selectedThread}></SpeedTable>
        </TabPanel>
        <TabPanel value="tab_6" sx={{}}>
          <Typography variant='h6'>Query</Typography>
          <StatsQuery thread={selectedThread}></StatsQuery>
        </TabPanel>
        {statsLoading && <Loading mini={true} />}
        </Box>
        </TabContext>        
        <Typography variant='body2' sx={{mt: 1}}>Last updated: {formatDateExact(convertToTimestamp(stats && stats.last_updated_uuid) || 0)} ({stats && stats.last_updated_uuid})</Typography>
        </>}
      </Box>
    )
  } else {
    return(<Loading />);
  }

};
