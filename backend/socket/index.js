/**
 * Socket.IO server — real-time seat availability per route + travel date.
 */
const { Server } = require('socket.io');
const socketConfig = require('../config/socket');
const EVENTS = require('../utils/socketEvents');
const availabilityService = require('../services/availability.service');
const ApiError = require('../utils/ApiError');

let io = null;

function getRoomName(routeId, travelDate) {
  const date = availabilityService.formatTravelDate(travelDate);
  return `route:${routeId}:${date}`;
}

function validateSubscribePayload(data) {
  const routeId = parseInt(data?.routeId, 10);
  const travelDate = data?.travelDate;

  if (!routeId || routeId < 1) {
    throw ApiError.badRequest('routeId is required');
  }
  if (!travelDate || !/^\d{4}-\d{2}-\d{2}$/.test(String(travelDate).slice(0, 10))) {
    throw ApiError.badRequest('travelDate must be YYYY-MM-DD');
  }

  const travel = new Date(travelDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  travel.setHours(0, 0, 0, 0);
  if (travel < today) {
    throw ApiError.badRequest('travelDate cannot be in the past');
  }

  const fareClass = data?.fareClass || data?.class || null;

  return {
    routeId,
    travelDate: availabilityService.formatTravelDate(travelDate),
    fareClass,
  };
}

function setupSocketHandlers(socketIo) {
  socketIo.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on(EVENTS.SUBSCRIBE_ROUTE, async (data, ack) => {
      try {
        const { routeId, travelDate, fareClass } = validateSubscribePayload(data);
        const room = getRoomName(routeId, travelDate);

        socket.join(room);
        const snapshot = await availabilityService.getSnapshot(
          routeId,
          travelDate,
          fareClass
        );

        const payload = {
          ...snapshot,
          subscribed: true,
          room,
        };

        socket.emit(EVENTS.SEAT_AVAILABILITY, payload);

        if (typeof ack === 'function') {
          ack({ success: true, room, data: snapshot });
        }

        socket.emit(EVENTS.SUBSCRIBED, {
          routeId,
          travelDate,
          room,
          message: `Subscribed to live updates for route ${routeId} on ${travelDate}`,
        });

        console.log(`[Socket.IO] ${socket.id} joined ${room}`);
      } catch (err) {
        const message = err.message || 'Subscription failed';
        socket.emit(EVENTS.ERROR, { message });
        if (typeof ack === 'function') ack({ success: false, message });
      }
    });

    socket.on(EVENTS.UNSUBSCRIBE_ROUTE, (data) => {
      try {
        const { routeId, travelDate } = validateSubscribePayload(data);
        const room = getRoomName(routeId, travelDate);
        socket.leave(room);
        // fareClass ignored for leave — room is per route+date
        console.log(`[Socket.IO] ${socket.id} left ${room}`);
      } catch {
        // ignore invalid unsubscribe
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Initialize Socket.IO on the HTTP server.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: socketConfig.cors,
    pingTimeout: socketConfig.pingTimeout,
    pingInterval: socketConfig.pingInterval,
  });

  setupSocketHandlers(io);
  console.log('[Socket.IO] Real-time seat availability enabled');
  return io;
}

function getIO() {
  return io;
}

/**
 * Broadcast updated availability to all clients watching a route + date.
 * Call after booking, cancellation, or waitlist promotion.
 */
async function broadcastSeatUpdate(routeId, travelDate, meta = {}) {
  if (!io) return null;

  const date = availabilityService.formatTravelDate(travelDate);
  const room = getRoomName(routeId, date);

  try {
    const snapshot = await availabilityService.getSnapshot(routeId, date);
    const payload = {
      ...snapshot,
      ...meta,
      updatedAt: new Date().toISOString(),
    };

    io.to(room).emit(EVENTS.SEAT_AVAILABILITY, payload);

    const roomSize = (await io.in(room).fetchSockets()).length;
    console.log(
      `[Socket.IO] Broadcast to ${room} (${roomSize} client(s)) | available: ${snapshot.availability?.availableSeats ?? 'N/A'} | reason: ${meta.reason || 'update'}`
    );

    return { room, clients: roomSize, payload };
  } catch (err) {
    console.error('[Socket.IO] Broadcast failed:', err.message);
    return null;
  }
}

module.exports = {
  initSocket,
  getIO,
  getRoomName,
  broadcastSeatUpdate,
  EVENTS,
};
