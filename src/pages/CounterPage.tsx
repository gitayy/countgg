import { useParams } from 'react-router-dom';
import { useContext, useState } from 'react';
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

  export const CounterPage = () => {
    const params = useParams();
    const counterId:string = params.counterId || '';
    const { counter, loading } = useContext(CounterContext);
    const newSocket = useContext(SocketContext);
    const { loadedCounter, loadedCounterLoading } = useFetchLoadCounter(counterId);
    // const { loadedCounterStats, loadedCounterStatsLoading } = useFetchLoadCounterStats(counterId);
    const { achievements, achievementsloading } = useFetchAchievements(counterId);
    const isMounted = useIsMounted();

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

    
    if(loadedCounter && !loadedCounterLoading && !achievementsloading && isMounted.current) {

      return (
        <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
          <CounterCard fullSize={true} maxHeight={100} maxWidth={100} boxPadding={2} counter={loadedCounter}></CounterCard>
            <TabContext value={tabValue}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList onChange={handleTabChange} sx={{bgcolor: "background.paper"}} aria-label="Counter Tabs">
                  <Tab label="Info" value="1" />
                  <Tab label="Stats" value="2" />
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
                No stats found :( (Coming soon)
              </TabPanel>
              <TabPanel value="3">
                <Achievements achievements={achievements}></Achievements>
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

