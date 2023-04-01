import { useEffect, useRef, useState } from 'react';
import { getAuthStatus } from '../api';
import { addCounterToCache, cachedCounters } from '../helpers';
import { AllegianceType, Counter, User } from '../types';
import { useIsMounted } from './useIsMounted';

export function useFetchUser() {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState<boolean>(true);
  const [loadedSiteVer, setLoadedSiteVer] = useState<string>();
  const [counter, setCounter] = useState<Counter>();
  const [allegiance, setAllegiance] = useState<AllegianceType>();
  const isMounted = useIsMounted();

  useEffect(() => {
    getAuthStatus()
      .then(({ data }) => {
        if (isMounted.current) { 
          setUser(data.user); 
          setLoadedSiteVer(data.site_version);
          setCounter(data.counter);
          setAllegiance(data.allegiance);
          if(data.teammates) {
            for(const counter of data.teammates) {
              addCounterToCache(counter);
            }
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
      })
  }, []);

  return { user, setUser, loading, loadedSiteVer, setLoadedSiteVer, counter, setCounter, allegiance, setAllegiance };
}
