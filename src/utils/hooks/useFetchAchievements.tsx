import { useEffect, useState } from 'react';
import { getAchievements } from '../api';
import { AchievementType } from '../types';
import { useIsMounted } from './useIsMounted';

export function useFetchAchievements(uuid: string) {
      const [achievements, setAchievements] = useState<AchievementType[]>([]);
      const [allPublicAchievements, setAllPublicAchievements] = useState<AchievementType[]>([]);
      const [achievementsLoading, setAchievementsLoading] = useState<boolean>(true);
      const isMounted = useIsMounted();
    
      useEffect(() => {
          getAchievements(uuid)
          .then(({ data }) => {
            if (isMounted.current) { 
              setAchievements(data.user_achievements); 
              setAllPublicAchievements(data.all_public_achievements)
            }
            setAchievementsLoading(false);
          })
          .catch((err) => {
            console.log(err);
          })
    }, []);    
     return { achievements, achievementsLoading, setAchievements, allPublicAchievements };
    }