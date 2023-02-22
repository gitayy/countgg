import { createContext } from 'react';
import { io } from 'socket.io-client';

export const socket = io(`${process.env.REACT_APP_API_HOST}`, {
  withCredentials: true,
  autoConnect: true,
  secure: true,
  reconnection: true,
  rejectUnauthorized: false,
  transports: ['polling', 'websocket'],
});

export const SocketContext = createContext(socket);