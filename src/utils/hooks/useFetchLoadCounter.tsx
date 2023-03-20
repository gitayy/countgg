import { useEffect, useState } from 'react';
import { loadCounter } from '../api';
import { Counter } from '../types';
import { useIsMounted } from './useIsMounted';


export function useFetchLoadCounter(counter_id: string) {
      const [loadedCounter, setLoadedCounter] = useState<Counter>();
      const [loadedCounterLoading, setLoadedCounterLoading] = useState<boolean>(true);
      const [loadedCounterStats, setLoadedCounterStats] = useState<any>();
      const isMounted = useIsMounted();
    
      useEffect(() => {
        loadCounter(counter_id)
        .then(({ data }) => {
          if (isMounted.current) { 
            console.log(data);
            setLoadedCounter(data.loadedCounter); 
            setLoadedCounterStats(data.loadedCounterStats)
          }
          setLoadedCounterLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setLoadedCounterLoading(false);
        })
    }, [counter_id]);
    
      return { loadedCounter, loadedCounterStats, loadedCounterLoading };
    }