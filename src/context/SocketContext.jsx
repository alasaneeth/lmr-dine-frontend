// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../api/apiClient';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user }     = useAuth();
  const socketRef    = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      setConnected(false);
      return;
    }

    const token = getAccessToken();
    const socket = io(SOCKET_URL, {
      auth:       { token },
      transports: ['websocket', 'polling'],
      reconnection:      true,
      reconnectionDelay: 1000,
    });

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      setConnected(false);
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [user]);

  const subscribe   = (event, cb) => socketRef.current?.on(event, cb);
  const unsubscribe = (event, cb) => socketRef.current?.off(event, cb);
  const emit        = (event, data) => socketRef.current?.emit(event, data);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, subscribe, unsubscribe, emit }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
