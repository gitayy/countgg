import { useContext, useEffect, useRef, useState } from 'react';
import { getRecentCounts } from '../api';
import { UserContext } from '../contexts/UserContext';
import { addCounterToCache } from '../helpers';
import { PostType } from '../types';
import { useIsMounted } from './useIsMounted';


export function useFetchRecentCounts(thread_name: string, context: string | (string | null)[] | null, socketStatus: string) {
      const [recentCounts, setRecentCounts] = useState<PostType[]>([]);
      const recentCountsRef = useRef<PostType[]>([]);
      const [recentCountsLoading, setRecentCountsLoading] = useState<boolean>(true);
      const [loadedOldest, setLoadedOldest] = useState(false); 
      const [loadedNewest, setLoadedNewest] = useState(true);
      const isMounted = useIsMounted();
      const { user, loading } = useContext(UserContext);
    
      useEffect(() => {
        if(!loading && socketStatus === "LIVE") {
          setRecentCountsLoading(true);
          getRecentCounts(thread_name, context)
          .then(({ data }) => {
          if (isMounted.current && data.recentCounts) { 
            if(user && !loading && user.pref_load_from_bottom) {
              setRecentCounts(data.recentCounts.reverse())
              recentCountsRef.current = data.recentCounts;
            } else {
              recentCountsRef.current = data.recentCounts;
              setRecentCounts(data.recentCounts)
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
        }
    }, [loading, thread_name, socketStatus]);

    // useEffect(() => {

      
    // }, [thread_name]);
    
      return { recentCounts, recentCountsLoading, setRecentCounts, loadedOldest, setLoadedOldest, loadedNewest, setLoadedNewest, recentCountsRef };
    }