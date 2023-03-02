import { useEffect, useState } from 'react';
import { loadCounter } from '../api';
import { Counter } from '../types';
import { useIsMounted } from './useIsMounted';


export function useFetchLoadCounter(counter_id: string) {
      const [loadedCounter, setLoadedCounter] = useState<Counter>();
      const [loadedCounterLoading, setLoadedCounterLoading] = useState<boolean>(true);
      const isMounted = useIsMounted();
    
      useEffect(() => {
        loadCounter(counter_id)
        .then(({ data }) => {
          if (isMounted.current) { setLoadedCounter(data); }
          setLoadedCounterLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setLoadedCounterLoading(false);
        })
    }, [counter_id]);
    
      return { loadedCounter, loadedCounterLoading };
    }