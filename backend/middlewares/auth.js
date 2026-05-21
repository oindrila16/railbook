/**
 * JWT authentication middleware — protects private routes.
 */
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');
const userModel = require('../models/user.model');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token required');
    }

    const token = header.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await userModel.findById(decoded.userId);
    if (!user || !user.is_active) {
      throw ApiError.unauthorized('User not found or inactive');
    }
    if (!user.is_verified) {
      throw ApiError.forbidden('Please verify your account with OTP first');
    }

    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.full_name,
      role: user.role || 'user',
    };
    next();
  } catch (err) {
    if (err.isOperational) return next(err);
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
}

module.exports = { authenticate };
