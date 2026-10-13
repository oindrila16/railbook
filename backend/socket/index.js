/**
 * Socket.IO server — real-time seat availability per route + travel date.
 */
const { Server } = require('socket.io');
const socketConfig = require('../config/socket');
const EVENTS = require('../utils/socketEvents');
const availabilityService = require('../services/availability.service');
const { FARE_CLASS_IDS, normalizeFareClass } = require('../config/fareClasses');
const { parseISODateLocal, getTodayISO } = require('../utils/dates');
const ApiError = require('../utils/ApiError');

let io = null;

function getRoomName(routeId, travelDate, fareClass = 'economy') {
  const date = availabilityService.formatTravelDate(travelDate);
  return `route:${routeId}:${date}:${fareClass}`;
}

function validateSubscribePayload(data) {
  const routeId = parseInt(data?.routeId, 10);
  const travelDate = data?.travelDate;

  if (!routeId || routeId < 1) {
    throw ApiError.badRequest('routeId is required');
  }
  if (!travelDate || !/^\d{4}-\d{2}-\d{2}$/.test(String(travelDate))) {
    throw ApiError.badRequest('travelDate must be YYYY-MM-DD');
  }

  const travel = parseISODateLocal(travelDate);
  const today = parseISODateLocal(getTodayISO());
  if (!Number.isFinite(travel.getTime())) throw ApiError.badRequest('Invalid travel date');
  if (travel < today) {
    throw ApiError.badRequest('travelDate cannot be in the past');
  }

  const fareClass = normalizeFareClass(data?.fareClass || data?.class || 'economy');
  if (!fareClass) throw ApiError.badRequest('Invalid fare class');

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
        const room = getRoomName(routeId, travelDate, fareClass);

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
        const { routeId, travelDate, fareClass } = validateSubscribePayload(data);
        const room = getRoomName(routeId, travelDate, fareClass);
        socket.leave(room);
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
  try {
    const results = [];
    for (const fareClass of FARE_CLASS_IDS) {
      const room = getRoomName(routeId, date, fareClass);
      const snapshot = await availabilityService.getSnapshot(routeId, date, fareClass);
      io.to(room).emit(EVENTS.SEAT_AVAILABILITY, {
        ...snapshot, ...meta, updatedAt: new Date().toISOString(),
      });
      results.push({ room });
    }
    return results;
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
