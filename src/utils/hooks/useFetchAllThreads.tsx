import { useEffect, useState } from 'react'
import { getAllThreads, getUnapproved } from '../api'
import { Counter, ThreadType } from '../types'
import { useIsMounted } from './useIsMounted'

export function useFetchAllThreads() {
  const [allThreads, setAllThreads] = useState<ThreadType[]>([])
  const [allThreadsLoading, setAllThreadsLoading] = useState<boolean>(true)
  const isMounted = useIsMounted()

  useEffect(() => {
    getAllThreads()
      .then(({ data }) => {
        if (isMounted.current) {
          setAllThreads(data)
        }
        setAllThreadsLoading(false)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  return { allThreads, allThreadsLoading }
}
