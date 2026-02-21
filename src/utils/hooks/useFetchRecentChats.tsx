import { useContext, useEffect, useRef, useState } from 'react'
import { getRecentCounts } from '../api'
import { UserContext } from '../contexts/UserContext'
import { addCounterToCache } from '../helpers'
import { PostType } from '../types'
import { useIsMounted } from './useIsMounted'

export function useFetchRecentChats(
  thread_name: string,
  context: string | (string | null)[] | null,
  socketStatus: string,
  thread_ref: React.MutableRefObject<string | null>,
) {
  const [recentChats, setRecentChats] = useState<PostType[]>([])
  const recentChatsRef = useRef<PostType[]>([])
  const [recentChatsLoading, setRecentChatsLoading] = useState<boolean>(true)
  const [recentChatsError, setRecentChatsError] = useState<{ status?: number; message: string } | null>(null)
  const [recentChatsRetryInMs, setRecentChatsRetryInMs] = useState<number | null>(null)
  const [loadedOldestChats, setLoadedOldestChats] = useState(false)
  const [loadedNewestChats, setLoadedNewestChats] = useState(true)
  const isMounted = useIsMounted()
  const { user, loading, preferences } = useContext(UserContext)
  const retryAttemptRef = useRef(0)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    if (retryIntervalRef.current) {
      clearInterval(retryIntervalRef.current)
      retryIntervalRef.current = null
    }

    let cancelled = false

    const clearRetryTimers = () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current)
        retryIntervalRef.current = null
      }
    }

    const scheduleRetry = (retryDelayMs: number, fetchFn: () => Promise<void>) => {
      const retryAt = Date.now() + retryDelayMs
      setRecentChatsRetryInMs(retryDelayMs)
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current)
      }
      retryIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, retryAt - Date.now())
        setRecentChatsRetryInMs(remaining)
        if (remaining <= 0 && retryIntervalRef.current) {
          clearInterval(retryIntervalRef.current)
          retryIntervalRef.current = null
        }
      }, 250)

      retryTimeoutRef.current = setTimeout(() => {
        retryTimeoutRef.current = null
        fetchFn()
      }, retryDelayMs)
    }

    const fetchRecentChats = async () => {
      if (cancelled || loading || socketStatus !== 'LIVE') {
        return
      }

      setRecentChatsLoading(true)
      try {
        const { data } = await getRecentCounts(thread_name, context, true)
        if (!isMounted.current || cancelled || thread_ref.current !== thread_name) {
          return
        }
        if (data.recentCounts) {
          if (user && !loading && preferences && preferences.pref_load_from_bottom) {
            const reversedRecentChats = [...data.recentCounts].reverse()
            setRecentChats(reversedRecentChats)
            recentChatsRef.current = reversedRecentChats
          } else {
            setRecentChats(data.recentCounts)
            recentChatsRef.current = data.recentCounts
          }
          for (const counter of data.counters) {
            addCounterToCache(counter)
          }
        }
        if (data.isOldest !== undefined) {
          setLoadedOldestChats(data.isOldest)
          setLoadedNewestChats(data.isNewest)
        }

        retryAttemptRef.current = 0
        setRecentChatsError(null)
        setRecentChatsRetryInMs(null)
        clearRetryTimers()
        setRecentChatsLoading(false)
      } catch (err: any) {
        if (cancelled) {
          return
        }
        const status = err?.response?.status
        if (status === 429) {
          retryAttemptRef.current += 1
          const retryDelayMs = Math.min(30000, 1000 * Math.pow(2, retryAttemptRef.current - 1))
          setRecentChatsError({ status: 429, message: 'Rate limited while loading chats.' })
          setRecentChatsLoading(false)
          scheduleRetry(retryDelayMs, fetchRecentChats)
        } else {
          setRecentChatsError({ status, message: 'Failed to load chats.' })
          setRecentChatsRetryInMs(null)
          setRecentChatsLoading(false)
          clearRetryTimers()
          console.log(err)
        }
      }
    }

    if (!loading && socketStatus === 'LIVE') {
      retryAttemptRef.current = 0
      setRecentChatsError(null)
      setRecentChatsRetryInMs(null)
      fetchRecentChats()
    }

    return () => {
      cancelled = true
      clearRetryTimers()
    }
  }, [loading, thread_name, socketStatus, context, user, preferences?.pref_load_from_bottom])

  return {
    recentChats,
    recentChatsLoading,
    recentChatsError,
    recentChatsRetryInMs,
    setRecentChats,
    loadedOldestChats,
    setLoadedOldestChats,
    loadedNewestChats,
    setLoadedNewestChats,
    recentChatsRef,
  }
}
