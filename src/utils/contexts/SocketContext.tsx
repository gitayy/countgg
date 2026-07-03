import { createContext } from 'react'
import { io } from 'socket.io-client'

const resolveSocketUrl = (envUrl: string | undefined): string => {
  if (!envUrl) return ''
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') return envUrl
  return envUrl.replace(/localhost|127\.0\.0\.1/, hostname)
}

export const socket = io(resolveSocketUrl(process.env.REACT_APP_SOCKET_HOST), {
  withCredentials: true,
  autoConnect: true,
  secure: true,
  reconnection: true,
  rejectUnauthorized: false,
  transports: ['websocket', 'polling'],
  // transports: ['polling', 'websocket'],
  // transports: ['websocket'],
})

// socket.on(`site_version`, function(data) {
//   if(setLoadedSiteVer) {setLoadedSiteVer(data)}
// });

export const SocketContext = createContext(socket)
