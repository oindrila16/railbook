/**
 * Email template registry.
 */
const { otpTemplate } = require('./otp');
const { bookingConfirmationTemplate } = require('./bookingConfirmation');
const { bookingCancellationTemplate } = require('./bookingCancellation');
const { waitlistJoinedTemplate } = require('./waitlistJoined');
const { waitlistPromotedTemplate } = require('./waitlistPromoted');

module.exports = {
  otp: otpTemplate,
  bookingConfirmation: bookingConfirmationTemplate,
  bookingCancellation: bookingCancellationTemplate,
  waitlistJoined: waitlistJoinedTemplate,
  waitlistPromoted: waitlistPromotedTemplate,
};
