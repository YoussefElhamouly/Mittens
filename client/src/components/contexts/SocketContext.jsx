import React, { createContext, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { getUserData, getIsLoggedIn } from '../../Redux/Slices/userDataSlice.js';
const SocketContext = createContext();

const SocketContextProvider = ({ children }) => {
  const socket = useRef(null);
  const isLoggedIn = useSelector(getIsLoggedIn);
  const userData = useSelector(getUserData);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const domain = import.meta.env.VITE_DOMAIN;
  useEffect(() => {
    if (isLoggedIn) {
      if (!socket.current) {
        socket.current = io('/', {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 2000,
          withCredentials: true,
        });
        socket.current.on('connect', () => {
          setIsSocketReady(true);
        });
        socket.current.emit('joinNotificationsRoom', userData.userTag);
      }
    } else {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
      setIsSocketReady(false);
    }
  }, [isLoggedIn]);
  return <SocketContext.Provider value={{ socket, domain, isSocketReady }}> {children}</SocketContext.Provider>;
};

export { SocketContext, SocketContextProvider };
