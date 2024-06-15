import { useEffect, useState } from 'react'
import { getAllServers } from '../api'
import { Server } from '../types'
import { useIsMounted } from './useIsMounted'

export function useFetchAllServers() {
  const [servers, setServers] = useState<Server[]>([])
  const [serversLoading, setServersLoading] = useState<boolean>(true)
  const isMounted = useIsMounted()

  useEffect(() => {
    getAllServers()
      .then(({ data }) => {
        if (isMounted.current) {
            setServers(data)
        }
        setServersLoading(false)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  return { servers, serversLoading }
}
