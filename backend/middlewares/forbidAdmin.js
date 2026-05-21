/**
 * Blocks admin accounts from customer booking actions.
 */
const ApiError = require('../utils/ApiError');

function forbidAdmin(req, res, next) {
  if (req.user?.role === 'admin') {
    return next(
      ApiError.forbidden('Admin accounts cannot book tickets. Use the admin panel to manage trains.')
    );
  }
  return next();
}

module.exports = { forbidAdmin };
