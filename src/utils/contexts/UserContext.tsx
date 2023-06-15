import { createContext } from 'react';
import { AllegianceType, Counter, Item, User } from '../types';

type UserContextType = {
    user?: User;
    setUser?: Function,
    loading: boolean,
    loadedSiteVer?: string, 
    setLoadedSiteVer?: Function,
    error?: boolean
    counter?: Counter,
    setCounter?: Function, 
    items?: Item[],
    setItems?: Function,
  };
  
  export const UserContext = createContext<UserContextType>({loading: true});