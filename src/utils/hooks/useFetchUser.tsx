import { useEffect, useRef, useState } from 'react';
import { getAuthStatus } from '../api';
import { User } from '../types';
import { useIsMounted } from './useIsMounted';

export function useFetchUser() {
  const [user, setUser] = useState<User>();
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [loadedSiteVer, setLoadedSiteVer] = useState<string>();
  const isMounted = useIsMounted();

  useEffect(() => {
    getAuthStatus()
      .then(({ data }) => {
        if (isMounted.current) { 
          setUser(data.user); 
          setLoadedSiteVer(data.site_version);
        }
        setUserLoading(false);
      })
      .catch((err) => {
        console.log(err);
      })
  }, []);

  return { user, userLoading, loadedSiteVer, setLoadedSiteVer };
}
