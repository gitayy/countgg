import { useEffect, useState } from 'react';
import { getAchievements } from '../api';
import { AchievementType, CounterAchievementType } from '../types';
import { useIsMounted } from './useIsMounted';

export function useFetchAchievements(uuid?: string) {
      const [achievements, setAchievements] = useState<CounterAchievementType[]>([]);
      const [allAchievements, setAllAchievements] = useState<AchievementType[]>([]);
      const [achievementsLoading, setAchievementsLoading] = useState<boolean>(true);
      const isMounted = useIsMounted();
    
      useEffect(() => {
          getAchievements(uuid)
          .then(({ data }) => {
            if (isMounted.current) { 
              setAchievements(data.user_achievements); 
              setAllAchievements(data.all_achievements);
            }
            setAchievementsLoading(false);
          })
          .catch((err) => {
            console.log(err);
          })
    }, [uuid]);    
     return { achievements, achievementsLoading, setAchievements, allAchievements };
    }