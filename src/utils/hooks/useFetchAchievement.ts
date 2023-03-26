import { useEffect, useState } from 'react';
import { getAchievement } from '../api';
import { AchievementType, Counter, CounterAchievementType } from '../types';
import { useIsMounted } from './useIsMounted';


export function useFetchAchievement(id: number) {
      const [achievement, setAchievement] = useState<AchievementType>();
      const [counterAchievements, setCounterAchievements] = useState<CounterAchievementType[]>();
      const [countersWhoEarnedAchievement, setCountersWhoEarnedAchievement] = useState<Counter[]>();
      const [achievementLoading, setAchievementLoading] = useState<boolean>(true);
      const isMounted = useIsMounted();
    
      useEffect(() => {
        getAchievement(id)
        .then(({ data }) => {
          if (isMounted.current) { 
            setAchievement(data.achievement);
            setCounterAchievements(data.counterAchievements); 
            setCountersWhoEarnedAchievement(data.countersWhoEarnedAchievement); 
          }
          setAchievementLoading(false);
        })
        .catch((err) => {
          setAchievementLoading(false);
          console.log(err);
        })
    }, []);
    
      return { achievement, counterAchievements, countersWhoEarnedAchievement, achievementLoading };
    }