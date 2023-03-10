import { useLocation, useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { CounterContext } from '../utils/contexts/CounterContext';
import { SocketContext } from '../utils/contexts/SocketContext';
import { useFetchLoadCounter } from '../utils/hooks/useFetchLoadCounter';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import { Box, Button, Tab, Typography } from '@mui/material';
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

  export const CounterPage = () => {
    const params = useParams();
    const counterId:string = params.counterId || '';
    const { counter, loading } = useContext(CounterContext);
    const newSocket = useContext(SocketContext);
    const { loadedCounter, loadedCounterLoading } = useFetchLoadCounter(counterId);
    // const { loadedCounterStats, loadedCounterStatsLoading } = useFetchLoadCounterStats(counterId);
    const { achievements, achievementsLoading, setAchievements, allPublicAchievements } = useFetchAchievements(counterId);
    const [unearnedAchievements, setUnearnedAchievements] = useState<AchievementType[]>([]);
    const [unearnedAchievementsLoading, setUnearnedAchievementsLoading] = useState(true);
    const isMounted = useIsMounted();

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
      if(allPublicAchievements.length > 0) {
        const publicAchievementsNotEarned = allPublicAchievements.filter(achievement => {
          return !achievements.some(userAchievement => userAchievement.id === achievement.id);
        });
        const sortedUnearnedPublicAchievements = publicAchievementsNotEarned.sort((a, b) => {
          return b.countersEarned - a.countersEarned;
        });
        const sortedAchievements = achievements.sort((a, b) => {
          return a.countersEarned - b.countersEarned;
        });
        setUnearnedAchievements(sortedUnearnedPublicAchievements);
        setAchievements(sortedAchievements);
        setUnearnedAchievementsLoading(false);
      }
    }, [allPublicAchievements])

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
        console.log("Counter not loaded yet.");
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
        console.log("Counter not loaded yet.");
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
                  <Tab label="Stats" value="2" disabled />
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
                
              </TabPanel>
              <TabPanel value="3">
                <Typography variant='h5'>Unlocked</Typography>
                <Achievements achievements={achievements}></Achievements>
                <Typography variant='h5'>Locked</Typography>
                <Achievements achievements={unearnedAchievements} locked={true}></Achievements>
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

