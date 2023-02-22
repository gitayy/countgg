import { useEffect, useState } from 'react';
import { getUnapproved } from '../api';
import { Counter } from '../types';
import { useIsMounted } from './useIsMounted';


export function useFetchUnapproved() {
      const [unapproved, setUnapproved] = useState<Counter[]>();
      const [unapprovedLoading, setUnapprovedLoading] = useState<boolean>(true);
      const isMounted = useIsMounted();
    
      useEffect(() => {
        getUnapproved()
        .then(({ data }) => {
          if (isMounted.current) { setUnapproved(data);  }
          setUnapprovedLoading(false);
        })
        .catch((err) => {
          console.log(err);
        })
    }, []);
    
      return { unapproved, unapprovedLoading };
    }