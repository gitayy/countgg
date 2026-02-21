import { useContext, useEffect, useRef, useState } from 'react'
import { getRecentCounts } from '../api'
import { UserContext } from '../contexts/UserContext'
import { addCounterToCache } from '../helpers'
import { PostType } from '../types'
import { useIsMounted } from './useIsMounted'

export function useFetchRecentCounts(
  thread_name: string,
  context: string | (string | null)[] | null,
  socketStatus: string,
  thread_ref: React.MutableRefObject<string | null>,
) {
  const [recentCounts, setRecentCounts] = useState<PostType[]>([])
  const recentCountsRef = useRef<PostType[]>([])
  const [recentCountsLoading, setRecentCountsLoading] = useState<boolean>(true)
  const [recentCountsError, setRecentCountsError] = useState<{ status?: number; message: string } | null>(null)
  const [recentCountsRetryInMs, setRecentCountsRetryInMs] = useState<number | null>(null)
  const [loadedOldest, setLoadedOldest] = useState(false)
  const [loadedNewest, setLoadedNewest] = useState(true)
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
      setRecentCountsRetryInMs(retryDelayMs)
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current)
      }
      retryIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, retryAt - Date.now())
        setRecentCountsRetryInMs(remaining)
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

    const fetchRecentCounts = async () => {
      if (cancelled || loading || socketStatus !== 'LIVE') {
        return
      }

      setRecentCountsLoading(true)
      try {
        const { data } = await getRecentCounts(thread_name, context)
        if (!isMounted.current || cancelled || thread_ref.current !== thread_name) {
          return
        }
        if (data.recentCounts) {
          if (user && !loading && preferences && preferences.pref_load_from_bottom) {
            const reversedRecentCounts = [...data.recentCounts].reverse()
            setRecentCounts(reversedRecentCounts)
            recentCountsRef.current = reversedRecentCounts
          } else {
            recentCountsRef.current = data.recentCounts
            setRecentCounts(data.recentCounts)
          }
          for (const counter of data.counters) {
            addCounterToCache(counter)
          }
        }
        if (data.isOldest !== undefined) {
          setLoadedOldest(data.isOldest)
          setLoadedNewest(data.isNewest)
        }

        retryAttemptRef.current = 0
        setRecentCountsError(null)
        setRecentCountsRetryInMs(null)
        clearRetryTimers()
        setRecentCountsLoading(false)
      } catch (err: any) {
        if (cancelled) {
          return
        }
        const status = err?.response?.status
        if (status === 429) {
          retryAttemptRef.current += 1
          const retryDelayMs = Math.min(30000, 1000 * Math.pow(2, retryAttemptRef.current - 1))
          setRecentCountsError({ status: 429, message: 'Rate limited while loading posts.' })
          setRecentCountsLoading(false)
          scheduleRetry(retryDelayMs, fetchRecentCounts)
        } else {
          setRecentCountsError({ status, message: 'Failed to load posts.' })
          setRecentCountsRetryInMs(null)
          setRecentCountsLoading(false)
          clearRetryTimers()
          console.log(err)
        }
      }
    }

    if (!loading && socketStatus === 'LIVE') {
      retryAttemptRef.current = 0
      setRecentCountsError(null)
      setRecentCountsRetryInMs(null)
      fetchRecentCounts()
    }

    return () => {
      cancelled = true
      clearRetryTimers()
    }
  }, [loading, thread_name, socketStatus, context, user, preferences?.pref_load_from_bottom])

  // useEffect(() => {

  // }, [thread_name]);

  return {
    recentCounts,
    recentCountsLoading,
    recentCountsError,
    recentCountsRetryInMs,
    setRecentCounts,
    loadedOldest,
    setLoadedOldest,
    loadedNewest,
    setLoadedNewest,
    recentCountsRef,
  }
}
