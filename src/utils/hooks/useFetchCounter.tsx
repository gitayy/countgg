import { useEffect, useState } from 'react';
import { getCounter } from '../api';
import { Counter } from '../types';
import { useIsMounted } from './useIsMounted';


export function useCounterConfig() {
      const [counter, setCounter] = useState<Counter>();
      const [loading, setLoading] = useState<boolean>(true);
      const isMounted = useIsMounted();
    
      useEffect(() => {
        getCounter()
        .then(({ data }) => {
          if (isMounted.current) { setCounter(data);  }
          setLoading(false);
        })
        .catch((err) => {
          console.log(err);
        })
    }, []);
    
      return { counter, loading };
    }