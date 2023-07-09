import { useContext, useEffect, useRef, useState } from 'react';
import { getRecentCounts } from '../api';
import { UserContext } from '../contexts/UserContext';
import { addCounterToCache } from '../helpers';
import { PostType} from '../types';
import { useIsMounted } from './useIsMounted';


export function useFetchRecentChats(thread_name: string, context: string | (string | null)[] | null) {
      const [recentChats, setRecentChats] = useState<PostType[]>([]);
      const recentChatsRef = useRef<PostType[]>([]);
      const [recentChatsLoading, setRecentChatsLoading] = useState<boolean>(true);
      const [loadedOldestChats, setLoadedOldestChats] = useState(false); 
      const [loadedNewestChats, setLoadedNewestChats] = useState(true);
      const isMounted = useIsMounted();
      const { user } = useContext(UserContext);
    
      useEffect(() => {
        getRecentCounts(thread_name, context, true)
        .then(({ data }) => {
        if (isMounted.current && data.recentCounts) { 
          if(user && user.pref_load_from_bottom) {
            setRecentChats(data.recentCounts.reverse());
            recentChatsRef.current = data.recentCounts.reverse();
          } else {
            setRecentChats(data.recentCounts);
            recentChatsRef.current = data.recentCounts;
          } 
          for (const counter of data.counters) {
              addCounterToCache(counter)
          }
        }
        if(data.isOldest !== undefined) {
          setLoadedOldestChats(data.isOldest);
          setLoadedNewestChats(data.isNewest);
        }
          setRecentChatsLoading(false);
        })
        .catch((err) => {
          console.log(err);
        })
    }, []);
    
      return { recentChats, recentChatsLoading, setRecentChats, loadedOldestChats, setLoadedOldestChats, loadedNewestChats, setLoadedNewestChats, recentChatsRef };
    }