import { useEffect, useState } from 'react'
import { getAuthStatus } from '../api'
import { Challenge, Counter, Item, MiscSettings, PreferencesType, User } from '../types'
import { useIsMounted } from './useIsMounted'
import { defaultPreferences } from '../helpers'

export function useFetchUser() {
  const [user, setUser] = useState<User>()
  const [loading, setLoading] = useState<boolean>(true)
  const [loadedSiteVer, setLoadedSiteVer] = useState<string>()
  const [totalCounters, setTotalCounters] = useState<number>()
  const [counter, setCounter] = useState<Counter>()
  const [items, setItems] = useState<Item[]>()
  const [miscSettings, setMiscSettings] = useState<MiscSettings>()
  const [challenges, setChallenges] = useState<Challenge[]>()
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>()
  const [preferences, setPreferences] = useState<PreferencesType>(defaultPreferences)
  const isMounted = useIsMounted()

  useEffect(() => {
    getAuthStatus()
      .then(({ data }) => {
        if (isMounted.current) {
          setUser(data.user)
          setLoadedSiteVer(data.site_version)
          setCounter(data.counter)
          setItems(data.items)
          setMiscSettings(data.miscSettings)
          setTotalCounters(data.totalCounters)
          setUnreadMessageCount(data.unreadMentionCount)
          setPreferences((prevPrefs) => {
            if(prevPrefs) {
              return prevPrefs
            }
            return data.user as PreferencesType
        })
        }
        setLoading(false)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  return {
    user,
    setUser,
    loading,
    loadedSiteVer,
    setLoadedSiteVer,
    counter,
    setCounter,
    items,
    setItems,
    miscSettings,
    setMiscSettings,
    challenges,
    setChallenges,
    totalCounters,
    setTotalCounters,
    unreadMessageCount,
    setUnreadMessageCount,
    preferences,
    setPreferences,
  }
}
