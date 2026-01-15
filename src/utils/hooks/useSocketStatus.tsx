import { useContext, useEffect, useState } from 'react'
import { SocketContext } from '../contexts/SocketContext'

export function useSocketStatus() {
  const socket = useContext(SocketContext)
  const [connected, setConnected] = useState(socket.connected)

  useEffect(() => {
    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [socket])

  return connected
}
