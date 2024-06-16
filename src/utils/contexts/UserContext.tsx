import { createContext } from 'react'
import { Challenge, Counter, Item, MiscSettings, PreferencesType, User } from '../types'

type UserContextType = {
  user?: User
  setUser?: Function
  loading: boolean
  loadedSiteVer?: string
  setLoadedSiteVer?: Function
  error?: boolean
  counter?: Counter
  setCounter?: Function
  items?: Item[]
  setItems?: Function
  miscSettings?: MiscSettings
  setMiscSettings?: Function
  challenges?: Challenge[]
  setChallenges?: Function
  totalCounters?: number
  setTotalCounters?: Function
  unreadMessageCount?: number
  setUnreadMessageCount?: Function
  preferences?: PreferencesType
  setPreferences?: Function
}

export const UserContext = createContext<UserContextType>({ loading: true })
