/**
 * Subscribe to real-time seat availability for multiple routes via Socket.IO.
 */
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

function getSocketUrl() {
  const api = import.meta.env.VITE_API_URL || '';
  if (api.startsWith('http')) return api;
  return window.location.origin;
}

export function useSeatAvailability(routeIds = [], travelDate, fareClass = 'economy') {
  const [liveState, setLiveState] = useState({ key: '', routes: {} });
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const idsKey = routeIds.join(',');
  const subscriptionKey = `${idsKey}:${travelDate}:${fareClass}`;

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',').map(Number) : [];
    if (!travelDate || ids.length === 0) return undefined;

    const socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      ids.forEach((routeId) => {
        socket.emit('subscribe:route', { routeId, travelDate, fareClass });
      });
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('seat:availability', (data) => {
      if (!ids.includes(Number(data?.routeId)) || data.travelDate !== travelDate || data.fareClass !== fareClass) return;
      setLiveState((prev) => ({
        key: subscriptionKey,
        routes: { ...(prev.key === subscriptionKey ? prev.routes : {}), [data.routeId]: data },
      }));
    });

    return () => {
      ids.forEach((routeId) => {
        socket.emit('unsubscribe:route', { routeId, travelDate, fareClass });
      });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [idsKey, travelDate, fareClass, subscriptionKey]);

  return { liveByRoute: liveState.key === subscriptionKey ? liveState.routes : {}, connected };
}
