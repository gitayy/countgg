import { useEffect, useState } from 'react';
import { getCountByUuid } from '../api';
import { addCounterToCache } from '../helpers';
import { PostType, ThreadType } from '../types';
import { useIsMounted } from './useIsMounted';


export function useFetchSpecificCount(uuid: string) {
      const [specificCount, setSpecificCount] = useState<PostType[]>([]);
      const [specificCountThread, setSpecificCountThread] = useState<ThreadType>()
      const [specificCountLoading, setSpecificCountLoading] = useState<boolean>(true);
      const isMounted = useIsMounted();
    
      useEffect(() => {
        getCountByUuid(uuid)
        .then(({ data }) => {
        if (isMounted.current && data.count) { 
            setSpecificCount(data.count); 
            setSpecificCountThread(data.thread);
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
    
      return { specificCount, specificCountLoading, setSpecificCount, specificCountThread };
    }