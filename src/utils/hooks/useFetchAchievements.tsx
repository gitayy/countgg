import { useEffect, useState } from 'react';
import { getAchievements } from '../api';
import { useIsMounted } from './useIsMounted';

export function useFetchAchievements(uuid: string) {
      const [achievements, setAchievements] = useState<object>();
      const [achievementsloading, setAchievementsLoading] = useState<boolean>(true);
      const isMounted = useIsMounted();
    
      useEffect(() => {
          getAchievements(uuid)
          .then(({ data }) => {
            if (isMounted.current) { setAchievements(data); }
            setAchievementsLoading(false);
          })
          .catch((err) => {
            console.log(err);
          })
    }, []);    
     return { achievements, achievementsloading };
    }