import { useEffect, useState } from 'react';
import { getAuthStatus } from '../api';
import { Counter, Item, User } from '../types';
import { useIsMounted } from './useIsMounted';

export function useFetchUser() {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState<boolean>(true);
  const [loadedSiteVer, setLoadedSiteVer] = useState<string>();
  const [totalCounters, setTotalCounters] = useState<number>();
  const [counter, setCounter] = useState<Counter>();
  const [items, setItems] = useState<Item[]>();
  const isMounted = useIsMounted();

  useEffect(() => {
    getAuthStatus()
      .then(({ data }) => {
        if (isMounted.current) { 
          setUser(data.user); 
          setLoadedSiteVer(data.site_version);
          setCounter(data.counter);
          setItems(data.items);
          setTotalCounters(data.totalCounters)
        }
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
      })
  }, []);

  return { user, setUser, loading, loadedSiteVer, setLoadedSiteVer, counter, setCounter, items, setItems, totalCounters, setTotalCounters };
}
