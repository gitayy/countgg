import { useEffect, useState } from 'react';
import { getCountByUuid, getMentions } from '../api';
import { addCounterToCache } from '../helpers';
import { Counter, PostType, ThreadType } from '../types';
import { useIsMounted } from './useIsMounted';


export function useFetchMentions(from: number|undefined) {
      const [loadedMentions, setLoadedMentions] = useState<{mentions: any[], posts: PostType[], counters: Counter[], threads: ThreadType[]}>();
      const [loadedMentionsLoading, setLoadedMentionsLoading] = useState<boolean>(true);
      const isMounted = useIsMounted();
    
      useEffect(() => {
        getMentions(from)
        .then(({ data }) => {
        if (isMounted.current && data) { 
            setLoadedMentions(data); 
          for (const counter of data.counters) {
              addCounterToCache(counter)
          }
        }
        setLoadedMentionsLoading(false);
        })
        .catch((err) => {
          console.log(err);
        })
    }, []);
    
      return { loadedMentions, loadedMentionsLoading, setLoadedMentions };
    }