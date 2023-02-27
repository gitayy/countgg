import { MutableRefObject, useEffect, useState } from 'react';
import { getOlderCounts } from '../api';
import { addCounterToCache } from '../helpers';
import { Counter, PostType, ThreadType } from '../types';
import { useIsMounted } from './useIsMounted';


export function useFetchOlderCounts(thread_name: string, posts: PostType[], setPosts: Function, shouldLoad: boolean) {
      const [olderCounts, setOlderCounts] = useState<PostType[]>([]);
      const [olderCountsLoading, setOlderCountsLoading] = useState<boolean>(true);
      const [isOldest, setIsOldest] = useState<boolean|null>();
      const isMounted = useIsMounted();
    
      useEffect(() => {
        if(shouldLoad && posts.length > 0) {
            getOlderCounts(thread_name, posts[0].uuid)
            .then(({ data }) => {
            if (isMounted.current && data.recentCounts) { 
              setOlderCounts(data.recentCounts); 
              if(data.isOldest) {
                setIsOldest(true);
              }
            }
              setOlderCountsLoading(false);
            })
            .catch((err) => {
              console.log(err);
            })
        }
    }, [shouldLoad]);
    
      return { olderCounts, olderCountsLoading, isOldest };
    }