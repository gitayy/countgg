import { createContext, useContext } from 'react';
import { io } from 'socket.io-client';

export const socket = io(`${process.env.REACT_APP_SOCKET_HOST}`, {
// export const socket = io(`http://192.168.50.56:3004`, {
  withCredentials: true,
  autoConnect: true,
  secure: true,
  reconnection: true,
  rejectUnauthorized: false,
  transports: ['polling', 'websocket'],
});


    // socket.on(`site_version`, function(data) {
    //   if(setLoadedSiteVer) {setLoadedSiteVer(data)}
    // });

export const SocketContext = createContext(socket);