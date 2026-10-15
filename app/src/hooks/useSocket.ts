'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let sharedSocket: Socket | null = null;

function getOrCreateSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  if (!sharedSocket) {
    sharedSocket = io({
      path: '/socket.io',
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
    });
  }
  return sharedSocket;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState<boolean>(() => {
    return sharedSocket ? sharedSocket.connected : false;
  });

  useEffect(() => {
    const socket = getOrCreateSocket();
    if (!socket) return;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = () => setIsConnected(false);

    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
    };
  }, []);

  return {
    socket: sharedSocket || getOrCreateSocket(),
    isConnected,
  };
}
