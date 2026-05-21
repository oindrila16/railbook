/**
 * Application entry point.
 * Wires Express, middleware, routes, and Socket.IO (added in later steps).
 */
require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const emailService = require('./services/email.service');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

// Socket.IO — real-time seat availability
initSocket(server);

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Health check — confirms server is running
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Train Ticket Booking API is running',
    timestamp: new Date().toISOString(),
    email: emailService.getStatus(),
    socket: { enabled: true, events: ['subscribe:route', 'seat:availability'] },
  });
});

// API routes
app.use(routes);

// 404 + centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\nPort ${PORT} is already in use. Stop the other process, then run npm run dev again:\n` +
        `  netstat -ano | findstr :${PORT}\n` +
        `  taskkill /PID <pid> /F\n`
    );
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  await emailService.verifyConnection();
});

module.exports = { app, server };
