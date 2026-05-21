/**
 * Socket.IO event name constants.
 */
module.exports = {
  // Client → Server
  SUBSCRIBE_ROUTE: 'subscribe:route',
  UNSUBSCRIBE_ROUTE: 'unsubscribe:route',

  // Server → Client
  SEAT_AVAILABILITY: 'seat:availability',
  SUBSCRIBED: 'subscribed',
  ERROR: 'error',
};
