/**
 * Requires authenticated admin user.
 */
const ApiError = require('../utils/ApiError');

function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  if (req.user.role !== 'admin') {
    return next(ApiError.forbidden('Admin access required'));
  }
  return next();
}

module.exports = { requireAdmin };
