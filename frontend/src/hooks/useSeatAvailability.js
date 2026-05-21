/**
 * Subscribe to real-time seat availability for multiple routes via Socket.IO.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

function getSocketUrl() {
  const api = import.meta.env.VITE_API_URL || '';
  if (api.startsWith('http')) return api;
  return window.location.origin;
}

export function useSeatAvailability(routeIds = [], travelDate, fareClass = 'economy') {
  const [liveByRoute, setLiveByRoute] = useState({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const idsKey = routeIds.join(',');

  const mergeUpdate = useCallback((data) => {
    if (!data?.routeId) return;
    setLiveByRoute((prev) => ({
      ...prev,
      [data.routeId]: data,
    }));
  }, []);

  useEffect(() => {
    if (!travelDate || routeIds.length === 0) {
      setLiveByRoute({});
      return undefined;
    }

    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      routeIds.forEach((routeId) => {
        socket.emit('subscribe:route', { routeId, travelDate, fareClass });
      });
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('seat:availability', mergeUpdate);

    return () => {
      routeIds.forEach((routeId) => {
        socket.emit('unsubscribe:route', { routeId, travelDate, fareClass });
      });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [idsKey, travelDate, fareClass, mergeUpdate]);

  return { liveByRoute, connected };
}
