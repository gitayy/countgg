import { createContext, MutableRefObject } from 'react';
import { AllegianceType, Counter, User } from '../types';

type UserContextType = {
    user?: User;
    setUser?: Function,
    loading: boolean,
    loadedSiteVer?: string, 
    setLoadedSiteVer?: Function,
    error?: boolean
    counter?: Counter,
    setCounter?: Function, 
    allegiance?: AllegianceType,
    setAllegiance?: Function,   
  };
  
  export const UserContext = createContext<UserContextType>({loading: true});