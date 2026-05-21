/**
 * Centralized error handler — must be registered last in Express.
 */
const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  // express-validator aggregated errors
  if (err.array && typeof err.array === 'function') {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.array().map((e) => ({ field: e.path, message: e.msg }));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error(err);
  }

  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  else if (err.errors) payload.errors = err.errors;

  res.status(statusCode).json(payload);
}

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

module.exports = { errorHandler, notFoundHandler };
