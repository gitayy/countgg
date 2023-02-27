import { useEffect, useState } from 'react';
import { getCountByUuid } from '../api';
import { addCounterToCache } from '../helpers';
import { PostType } from '../types';
import { useIsMounted } from './useIsMounted';


export function useFetchSpecificCount(uuid: string) {
      const [specificCount, setSpecificCount] = useState<PostType[]>([]);
      const [specificCountLoading, setSpecificCountLoading] = useState<boolean>(true);
      const isMounted = useIsMounted();
    
      useEffect(() => {
        getCountByUuid(uuid)
        .then(({ data }) => {
        if (isMounted.current && data.count) { 
            setSpecificCount(data.count); 
          for (const counter of data.counters) {
              addCounterToCache(counter)
          }
        }
        setSpecificCountLoading(false);
        })
        .catch((err) => {
          console.log(err);
        })
    }, []);
    
      return { specificCount, specificCountLoading, setSpecificCount };
    }