/**
 * OTP generation utilities.
 */
const crypto = require('crypto');
const config = require('../config');

/** Generate a cryptographically random 6-digit OTP */
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/** Compute expiry datetime for new OTP records */
function getOtpExpiry() {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + config.otp.expiryMinutes);
  return expires;
}

module.exports = { generateOtp, getOtpExpiry };
