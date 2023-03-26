import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { CounterContext } from '../utils/contexts/CounterContext';
import { SocketContext } from '../utils/contexts/SocketContext';
import { useFetchLoadCounter } from '../utils/hooks/useFetchLoadCounter';
import { useIsMounted } from '../utils/hooks/useIsMounted';
import { Box, Button, Link, MenuItem, Select, Tab, Typography } from '@mui/material';
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
import { AchievementSmall } from '../components/AchievementSmall';
import { useFetchAchievement } from '../utils/hooks/useFetchAchievement';

  export const AchievementPage = () => {
    const params = useParams();
    const achievementId:number = parseInt(params.achievementId || '0');
    const { counter, loading } = useContext(CounterContext);
    const { achievement, counterAchievements, countersWhoEarnedAchievement, achievementLoading } = useFetchAchievement(achievementId);
    const isMounted = useIsMounted();
    const navigate = useNavigate();

    const location = useLocation();
    useEffect(() => {
        if(achievement) {
            document.title = `${achievement.name} achievement | countGG`;
        }
        return (() => {
          document.title = 'countGG';
        })
      }, [achievement]);
    
    if(!loading && achievement && !achievementLoading && isMounted.current) {

      const counter_achievement = counterAchievements && counter ? counterAchievements.find((counterachievement) => {return counterachievement.achievementId === achievement.id && counterachievement.counterUUID === counter.uuid }) : undefined

      return (
        <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
            <Link color={'inherit'} underline='always' href={`/achievements`} onClick={(e) => {e.preventDefault();navigate(`/achievements`);}}>
                <Typography sx={{mb: 1}} variant="h5">&lt; View All Achievements</Typography>
            </Link>
            <AchievementSmall achievement={achievement} counterAchievement={counter_achievement} locked={false/*!achievements.some(userAchievement => userAchievement.achievementId === achievement.id && userAchievement.isComplete)*/}></AchievementSmall>
            {countersWhoEarnedAchievement && countersWhoEarnedAchievement.length > 0 && <>Earned by&nbsp;{countersWhoEarnedAchievement.map((counter, index) => {
                if(index <= 199) {
                    return <Typography component={'span'}><Link color={counter.color} underline='hover' href={`/counter/${counter.uuid}`} onClick={(e) => {e.preventDefault();navigate(`/counter/${counter.uuid}`);}}>{counter.name}</Link>{index + 1 < countersWhoEarnedAchievement.length ? ', ' : ''}</Typography>
                } else if(index == 200) {
                    return <Typography component={'span'}>and {countersWhoEarnedAchievement.length - 200} more</Typography>
                } else {
                    return;
                }
            })}</>}            
        </Box>
        )
    } else if(!loading && !achievement && !achievementLoading && isMounted.current) {

        return (
          <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>No achievement found :(</Box>
          )
    } else {
      return (
        <Loading />
      );
      }
  };

