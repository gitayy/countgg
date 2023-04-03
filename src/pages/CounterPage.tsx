import { useLocation, useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../utils/contexts/SocketContext';
import { useFetchLoadCounter } from '../utils/hooks/useFetchLoadCounter';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import { Box, Button, MenuItem, Select, Tab, Typography } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { useFetchAchievements } from '../utils/hooks/useFetchAchievements';
import { Achievements } from '../components/Achievements';
import { Loading } from '../components/Loading';
import { CounterCard } from '../components/CounterCard';
import { convertToTimestamp, formatDateExact } from '../utils/helpers';
import { adminToggleBan, adminToggleMute } from '../utils/api';
import { AchievementType } from '../utils/types';
import { UserContext } from '../utils/contexts/UserContext';

  export const CounterPage = () => {
    const params = useParams();
    const counterId:string = params.counterId || '';
    const { counter, loading } = useContext(UserContext);
    const newSocket = useContext(SocketContext);
    const { loadedCounter, loadedCounterStats, loadedCounterLoading } = useFetchLoadCounter(counterId);
    // const { loadedCounterStats, loadedCounterStatsLoading } = useFetchLoadCounterStats(counterId);
    const { achievements, achievementsLoading, setAchievements, allAchievements } = useFetchAchievements(counterId);
    const [unearnedAchievements, setUnearnedAchievements] = useState<AchievementType[]>([]);
    const [earnedAchievements, setEarnedAchievements] = useState<AchievementType[]>([]);
    const [unearnedAchievementsLoading, setUnearnedAchievementsLoading] = useState(true);
    const isMounted = useIsMounted();

    const [ statThread, setStatThread ] = useState('all'); 

    const location = useLocation();
    useEffect(() => {
      if(loadedCounter) {
        document.title = `${loadedCounter.name}'s Profile | countGG`;
      }
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname, loadedCounter]);

    useEffect(() => {
      if(allAchievements && allAchievements.length > 0) {
        // const publicAchievementsNotEarned = allPublicAchievements.filter(achievement => {
        //   return !achievements.some(userAchievement => userAchievement.id === achievement.id);
        // });
        const earned = allAchievements.filter(achievement => {
          return achievements.some(userAchievement => userAchievement.achievementId === achievement.id && userAchievement.isComplete);;
        });
        const publicAchievementsNotEarned = allAchievements.filter(achievement => {
          return achievement.isPublic && !achievements.some(userAchievement => userAchievement.achievementId === achievement.id && userAchievement.isComplete);;
        });
        const sortedUnearnedPublicAchievements = publicAchievementsNotEarned.sort((a, b) => {
          return b.countersEarned - a.countersEarned;
        });
        // const sortedAchievements = achievements.sort((a, b) => {
        //   return a.countersEarned - b.countersEarned;
        // });
        const sortedAchievements = achievements
        setUnearnedAchievements(sortedUnearnedPublicAchievements);
        setEarnedAchievements(earned);
        setAchievements(sortedAchievements);
        setUnearnedAchievementsLoading(false);
      }
    }, [allAchievements])

    const [tabValue, setTabValue] = useState('1');

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
      setTabValue(newValue);
    };

    const toggleBan = async () => {
      if(loadedCounter) {
        try {
        const res = await adminToggleBan(loadedCounter.uuid);
        }
        catch(err) {
          console.log("Did not work");
        }
      } else {
        console.log("Counter not loaded yet");
      }
    };

    const toggleMute = async () => {
      if(loadedCounter) {
        try {
        const res = await adminToggleMute(loadedCounter.uuid);
        }
        catch(err) {
          console.log("Did not work");
        }
      } else {
        console.log("Counter not loaded yet");
      }
    };
    
    if(loadedCounter && !loadedCounterLoading && !achievementsLoading && !unearnedAchievementsLoading && isMounted.current) {

      return (
        <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
          <CounterCard fullSize={true} maxHeight={100} maxWidth={100} boxPadding={2} counter={loadedCounter}></CounterCard>
            <TabContext value={tabValue}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList onChange={handleTabChange} sx={{bgcolor: "background.paper"}} aria-label="Counter Tabs">
                  <Tab label="Info" value="1" />
                  <Tab label="Stats" value="2" disabled={(!loadedCounterStats || Object.keys(loadedCounterStats).length === 0) ? true : false} />
                  <Tab label="Achievements" value="3" />
                </TabList>
              </Box>
              <TabPanel value="1">
                {counter && counter.roles.includes('admin') && <Button variant='contained' color='error' onClick={toggleBan}>{loadedCounter.roles.includes('banned') ? 'Unban User' : 'Ban User'}</Button>}
                {counter && counter.roles.includes('admin') && <Button variant='contained' color='error' onClick={toggleMute}>{loadedCounter.roles.includes('muted') ? 'Unmute User' : 'Mute User'}</Button>}
                <Typography variant='h5'>Info for {loadedCounter.name}</Typography>
                <Typography>{convertToTimestamp(loadedCounter.uuid) !== null ? `Joined: ${formatDateExact(convertToTimestamp(loadedCounter.uuid) as number)}` : `Error calculating join date.`}</Typography>
                <Typography>UUID: {loadedCounter.uuid}</Typography>
                <Typography>Numeric ID: {loadedCounter.id}</Typography>
                <Typography>Color: {loadedCounter.color}</Typography>
              </TabPanel>
              <TabPanel value="2">
              <Select
                value={statThread}
                onChange={(e) => setStatThread((e.target as HTMLSelectElement).value)}
              >
                {Object.keys(loadedCounterStats).map((stat) => {
                  return <MenuItem key={stat} value={stat}>{stat}</MenuItem>
                })}
                </Select>
                {loadedCounterStats && loadedCounterStats[statThread] && <>
                  <Typography sx={{mb: 2}} component={'div'}>Posts: {loadedCounterStats[statThread]['posts'].toLocaleString()}</Typography>
                  <Typography sx={{mb: 2}} component={'div'}>Counts: {loadedCounterStats[statThread]['counts'].toLocaleString()} ({(loadedCounterStats[statThread]['counts'] / loadedCounterStats[statThread]['posts']).toLocaleString(undefined, {style: 'percent'})})</Typography>
                  <Typography sx={{mb: 2}} component={'div'}>Stricken: {loadedCounterStats[statThread]['mistakes'].toLocaleString()} ({(loadedCounterStats[statThread]['mistakes'] / (loadedCounterStats[statThread]['mistakes'] + loadedCounterStats[statThread]['counts'])).toLocaleString(undefined, {style: 'percent'})})</Typography>
                  <Typography sx={{mb: 2}} component={'div'}>Parity: {loadedCounterStats[statThread]['odds'].toLocaleString()} ({(loadedCounterStats[statThread]['odds'] / loadedCounterStats[statThread]['counts']).toLocaleString(undefined, {style: 'percent'})}) odds // {loadedCounterStats[statThread]['evens'].toLocaleString()} ({(loadedCounterStats[statThread]['evens'] / loadedCounterStats[statThread]['counts']).toLocaleString(undefined, {style: 'percent'})}) evens</Typography>
                  <Typography sx={{mb: 2}} component={'div'}>Avg. time since last post: {loadedCounterStats[statThread]['avg_post_reply'].toLocaleString()}ms</Typography>
                  <Typography sx={{mb: 2}} component={'div'}>Avg. time since last count: {loadedCounterStats[statThread]['avg_count_reply'].toLocaleString()}ms</Typography>
                </>}
              </TabPanel>
              <TabPanel value="3">
                <Typography variant='h5'>Unlocked</Typography>
                <Achievements achievements={earnedAchievements} locked={false} counter={loadedCounter} counterAchievements={achievements}></Achievements>
                <Typography variant='h5'>Locked</Typography>
                <Achievements achievements={unearnedAchievements} locked={true} counter={loadedCounter} counterAchievements={achievements}></Achievements>
              </TabPanel>
            </TabContext>
            
        </Box>
        )
    } else if(loadedCounterLoading) {
      return (<Loading />
      );
    } else if(!loadedCounterLoading && !loadedCounter) {
      return (
        <>
        <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>No counter found :(</Box>
        </>
      )
    } else {
      return (
        <Loading />
      );
      }
  };

