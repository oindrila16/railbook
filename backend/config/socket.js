/**
 * Socket.IO configuration.
 */
require('dotenv').config();

module.exports = {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
};
