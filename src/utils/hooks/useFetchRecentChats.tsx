import { useContext, useEffect, useState } from 'react';
import { getRecentCounts } from '../api';
import { UserContext } from '../contexts/UserContext';
import { addCounterToCache } from '../helpers';
import { PostType} from '../types';
import { useIsMounted } from './useIsMounted';


export function useFetchRecentChats(thread_name: string, context: string | (string | null)[] | null) {
      const [recentChats, setRecentChats] = useState<PostType[]>([]);
      const [recentChatsLoading, setRecentChatsLoading] = useState<boolean>(true);
      const [loadedOldestChats, setLoadedOldestChats] = useState(false); 
      const [loadedNewestChats, setLoadedNewestChats] = useState(true);
      const isMounted = useIsMounted();
      const { user, userLoading } = useContext(UserContext);
    
      useEffect(() => {
        getRecentCounts(thread_name, context, true)
        .then(({ data }) => {
          console.log(data);
        if (isMounted.current && data.recentCounts) { 
          if(user && user.pref_load_from_bottom) {
            setRecentChats(data.recentCounts.reverse());
          } else {
            setRecentChats(data.recentCounts);
          } 
          for (const counter of data.counters) {
              addCounterToCache(counter)
          }
        }
        if(data.isOldestChats !== undefined) {
          setLoadedOldestChats(data.isOldest);
          setLoadedNewestChats(data.isNewest);
        }
          setRecentChatsLoading(false);
        })
        .catch((err) => {
          console.log(err);
        })
    }, []);
    
      return { recentChats, recentChatsLoading, setRecentChats, loadedOldestChats, setLoadedOldestChats, loadedNewestChats, setLoadedNewestChats };
    }