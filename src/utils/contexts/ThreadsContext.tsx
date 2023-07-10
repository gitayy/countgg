import { createContext } from 'react';
import { AllegianceType, Counter, Item, ThreadType, User } from '../types';

type ThreadsContextType = {
    allThreads: ThreadType[];
    allThreadsLoading: boolean;
};
  
export const ThreadsContext = createContext<ThreadsContextType>({allThreads: [], allThreadsLoading: true});