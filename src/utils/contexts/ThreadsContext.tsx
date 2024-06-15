import { createContext } from 'react'
import { AllegianceType, Counter, Item, ThreadType, User } from '../types'

type ThreadsContextType = {
  allThreads: ThreadType[]
  setAllThreads?: Function
  allThreadsLoading: boolean
  setAllThreadsLoading?: Function
}

export const ThreadsContext = createContext<ThreadsContextType>({ allThreads: [], allThreadsLoading: true })
