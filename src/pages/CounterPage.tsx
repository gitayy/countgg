import { useLocation, useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../utils/contexts/SocketContext';
import { useFetchLoadCounter } from '../utils/hooks/useFetchLoadCounter';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import { Avatar, Box, Button, Card, CardContent, Chip, LinearProgress, MenuItem, Select, Tab, Typography } from '@mui/material';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { useFetchAchievements } from '../utils/hooks/useFetchAchievements';
import { Achievements } from '../components/Achievements';
import { Loading } from '../components/Loading';
import { CounterCard } from '../components/CounterCard';
import { calculateLevel, convertToTimestamp, formatDateExact, formatTimeDiff } from '../utils/helpers';
import { modToggleBan, modToggleMute } from '../utils/api';
import { AchievementType } from '../utils/types';
import { UserContext } from '../utils/contexts/UserContext';
import LeaderboardGraph from '../components/LeaderboardGraph';
import { XPDisplay } from '../components/XPDisplay';
import Spoiler from '../components/Spoiler';
import CountggLogo2 from '../assets/emotes/gg.png'


  export const CounterPage = () => {
    const params = useParams();
    const counterId:string = params.counterId || '';
    const { counter, loading, user } = useContext(UserContext);
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
        const sortedEarnedAchievements = earned.sort((a, b) => {
          return a.countersEarned - b.countersEarned;
        });
        const sortedAchievements = achievements
        setUnearnedAchievements(sortedUnearnedPublicAchievements);
        setEarnedAchievements(sortedEarnedAchievements);
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
        const res = await modToggleBan(loadedCounter.uuid);
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
        const res = await modToggleMute(loadedCounter.uuid);
        }
        catch(err) {
          console.log("Did not work");
        }
      } else {
        console.log("Counter not loaded yet");
      }
    };
    
    if(loadedCounter && !loadedCounterLoading && !achievementsLoading && !unearnedAchievementsLoading && isMounted.current && (!loadedCounter.roles.includes('banned') || (counter && (counter.roles.includes('mod') || counter.roles.includes('admin'))))) {

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
                <Typography variant='h5'>Info for {loadedCounter.name}
                <Chip
                sx={{mx: 0.5}}
                avatar={<Avatar src={loadedCounter.avatar.length > 5 ? `https://cdn.discordapp.com/avatars/${loadedCounter.discordId}/${loadedCounter.avatar}` : CountggLogo2} />}
                label={`UUID: ${loadedCounter.uuid}`}
                />
                <Chip
                sx={{mx: 0.5}}
                avatar={<Avatar src={loadedCounter.avatar.length > 5 ? `https://cdn.discordapp.com/avatars/${loadedCounter.discordId}/${loadedCounter.avatar}` : CountggLogo2} />}
                label={`ID: ${loadedCounter.id}`}
                />
                </Typography>
                <Typography>{convertToTimestamp(loadedCounter.uuid) !== null ? `Joined: ${formatDateExact(convertToTimestamp(loadedCounter.uuid) as number)}` : `Error calculating join date.`}</Typography>
                <Typography>{convertToTimestamp(loadedCounter.uuid) !== null ? `Member for: ${formatTimeDiff(convertToTimestamp(loadedCounter.uuid) as number, Date.now())}` : `Error calculating join date.`}</Typography>
                <Card>
                  <div style={{ backgroundColor: loadedCounter.color, height: 100 }} />
                  <CardContent>
                    <Typography variant="h5" color="text.primary">
                      Color: {loadedCounter.color}
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card sx={{my: 2, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                  <Typography variant="body1">LVL {calculateLevel(loadedCounter.xp).level}</Typography>
                  <LinearProgress variant="determinate" color='secondary' title={`${loadedCounter.xp.toString()} / ${calculateLevel(loadedCounter.xp).xpRequired}`} value={((loadedCounter.xp - calculateLevel(loadedCounter.xp).minXP) / (calculateLevel(loadedCounter.xp).xpRequired - calculateLevel(loadedCounter.xp).minXP)) * 100} sx={{borderRadius: '10px', width: '100%'}} />
                  <Typography sx={{fontSize: '9px', mt: 0.5}}>{`${parseInt(`${loadedCounter.xp}`).toLocaleString()} / ${calculateLevel(loadedCounter.xp).xpRequired.toLocaleString()}`}</Typography>
                </Card>
                {user && loadedCounter.uuid === user.uuid && <Spoiler title={`Time online`}><Typography>Time online (est.): {formatTimeDiff(0, parseFloat(user.timeOnline || '0'))}</Typography><Typography variant='body2'>This value is unreliable.</Typography></Spoiler>}
                {counter && counter.roles.includes('mod') && <Button variant='contained' color='error' onClick={toggleBan}>{loadedCounter.roles.includes('banned') ? 'Unban User' : 'Ban User'}</Button>}
                {counter && counter.roles.includes('mod') && <Button variant='contained' color='error' onClick={toggleMute}>{loadedCounter.roles.includes('muted') ? 'Unmute User' : 'Mute User'}</Button>}
              </TabPanel>
              <TabPanel value="2">
                In progress for a redesign.
                {/* <LeaderboardGraph stats={loadedCounterStats} cum={true}></LeaderboardGraph> */}
              {/* <Select
                value={statThread}
                onChange={(e) => setStatThread((e.target as HTMLSelectElement).value)}
              >
                {Object.keys(loadedCounterStats).map((stat) => {
                  return <MenuItem key={stat} value={stat}>{stat}</MenuItem>
                })}
                </Select>
                {loadedCounterStats && loadedCounterStats[statThread] && loadedCounterStats[statThread]['posts'] && <>
                  <Typography sx={{mb: 2}} component={'div'}>Posts: {loadedCounterStats[statThread]['posts'].toLocaleString()}</Typography>
                  <Typography sx={{mb: 2}} component={'div'}>Counts: {loadedCounterStats[statThread]['counts'].toLocaleString()} ({(loadedCounterStats[statThread]['counts'] / loadedCounterStats[statThread]['posts']).toLocaleString(undefined, {style: 'percent'})})</Typography>
                  <Typography sx={{mb: 2}} component={'div'}>Stricken: {loadedCounter.uuid === '16770982-3126-4101-a929-873567101929' ? '0' : loadedCounterStats[statThread]['mistakes'].toLocaleString()} ({loadedCounter.uuid === '16770982-3126-4101-a929-873567101929' ? '0%' : (loadedCounterStats[statThread]['mistakes'] / (loadedCounterStats[statThread]['mistakes'] + loadedCounterStats[statThread]['counts'])).toLocaleString(undefined, {style: 'percent'})})</Typography>
                  <Typography sx={{mb: 2}} component={'div'}>Parity: {loadedCounterStats[statThread]['odds'].toLocaleString()} ({(loadedCounterStats[statThread]['odds'] / loadedCounterStats[statThread]['counts']).toLocaleString(undefined, {style: 'percent'})}) odds // {loadedCounterStats[statThread]['evens'].toLocaleString()} ({(loadedCounterStats[statThread]['evens'] / loadedCounterStats[statThread]['counts']).toLocaleString(undefined, {style: 'percent'})}) evens</Typography>
                  <Typography sx={{mb: 2}} component={'div'}>Avg. time since last post: {loadedCounterStats[statThread]['avg_post_reply'].toLocaleString()}ms</Typography>
                  <Typography sx={{mb: 2}} component={'div'}>Avg. time since last count: {loadedCounterStats[statThread]['avg_count_reply'].toLocaleString()}ms</Typography>
                </>} */}
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
    } else if(loadedCounter && loadedCounter.roles.includes('banned')) {
      return (
        <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>This user ({loadedCounter.uuid}) is banned.</Box>
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

