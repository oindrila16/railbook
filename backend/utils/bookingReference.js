/**
 * Generate unique booking reference (e.g. BR20260521A3F9K2).
 */
const crypto = require('crypto');

function generateBookingReference() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BR${date}${suffix}`;
}

module.exports = { generateBookingReference };
