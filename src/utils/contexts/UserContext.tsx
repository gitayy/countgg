import { createContext, MutableRefObject } from 'react';
import { User } from '../types';

type UserContextType = {
    user?: User;
    userLoading: boolean,
    error?: boolean
  };
  
  export const UserContext = createContext<UserContextType>({userLoading: true});