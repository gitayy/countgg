import { useContext, useEffect, useState } from 'react';
import { getRecentCounts } from '../api';
import { UserContext } from '../contexts/UserContext';
import { addCounterToCache } from '../helpers';
import { PostType } from '../types';
import { useIsMounted } from './useIsMounted';


export function useFetchRecentCounts(thread_name: string, context: string | (string | null)[] | null) {
      const [recentCounts, setRecentCounts] = useState<PostType[]>([]);
      const [recentCountsLoading, setRecentCountsLoading] = useState<boolean>(true);
      const [loadedOldest, setLoadedOldest] = useState(false); 
      const [loadedNewest, setLoadedNewest] = useState(true);
      const isMounted = useIsMounted();
      const { user, userLoading } = useContext(UserContext);
    
      useEffect(() => {
        getRecentCounts(thread_name, context)
        .then(({ data }) => {
          console.log(data);
        if (isMounted.current && data.recentCounts) { 
          if(user && user.pref_load_from_bottom) {
            setRecentCounts(data.recentCounts.reverse());
          } else {
            setRecentCounts(data.recentCounts);
          } 
          for (const counter of data.counters) {
              addCounterToCache(counter)
          }
        }
        if(data.isOldest !== undefined) {
          setLoadedOldest(data.isOldest);
          setLoadedNewest(data.isNewest);
        }
          setRecentCountsLoading(false);
        })
        .catch((err) => {
          console.log(err);
        })
    }, []);
    
      return { recentCounts, recentCountsLoading, setRecentCounts, loadedOldest, setLoadedOldest, loadedNewest, setLoadedNewest };
    }