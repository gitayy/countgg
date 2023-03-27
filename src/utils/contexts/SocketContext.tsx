import { createContext, useContext } from 'react';
import { io } from 'socket.io-client';

export const socket = io(`${process.env.REACT_APP_SOCKET_HOST}`, {
  withCredentials: true,
  autoConnect: true,
  secure: true,
  reconnection: true,
  rejectUnauthorized: false,
  transports: ['websocket', 'polling'],
  // transports: ['polling', 'websocket'],
  // transports: ['websocket'],
});


    // socket.on(`site_version`, function(data) {
    //   if(setLoadedSiteVer) {setLoadedSiteVer(data)}
    // });

export const SocketContext = createContext(socket);