/**
 * Notification orchestrator — email (Nodemailer) + SMS (mock/Twilio).
 */
const config = require('../config');
const emailConfig = require('../config/email');
const emailService = require('./email.service');
const emailTemplates = require('../templates/email');

async function sendSms(phone, message) {
  if (config.sms.provider === 'mock' || !config.sms.twilio.accountSid) {
    console.log(`[SMS MOCK] To: ${phone}\n${message}`);
    return { mocked: true };
  }
  console.log(`[SMS] Twilio send to ${phone}: ${message}`);
  return { mocked: false };
}

/** Send email only if user has an email address */
async function sendEmailToUser(user, templateFn, data, templateName) {
  if (!user?.email) return { skipped: true, channel: 'email' };
  return emailService.sendTemplateEmail(user.email, templateFn, data, templateName);
}

async function sendOtpNotification({ email, phone, otpCode }) {
  const expiryMinutes = config.otp.expiryMinutes;

  const tasks = [];

  if (email) {
    tasks.push(
      emailService.sendTemplateEmail(
        email,
        emailTemplates.otp,
        { otpCode, expiryMinutes },
        'otp'
      )
    );
  }

  if (phone) {
    const message = `Your ${emailConfig.appName} verification code is ${otpCode}. Valid for ${expiryMinutes} minutes.`;
    tasks.push(sendSms(phone, message));
  }

  const results = await Promise.all(tasks);
  return { email: results[0], sms: results[1] };
}

function extractTrainRouteFromBooking(booking) {
  return {
    train: {
      number: booking.train_number,
      name: booking.train_name,
    },
    route: {
      source: booking.source_code,
      destination: booking.destination_code,
    },
  };
}

async function sendBookingConfirmation(user, booking, tickets) {
  const { train, route } = extractTrainRouteFromBooking(booking);

  const emailResult = await sendEmailToUser(
    user,
    emailTemplates.bookingConfirmation,
    { booking, tickets, train, route },
    'bookingConfirmation'
  );

  if (user.phone) {
    const seats = tickets.map((t) => t.seat_number || t.seatNumber).join(', ');
    const ref = booking.booking_reference || booking.bookingReference;
    await sendSms(
      user.phone,
      `Booking confirmed! Ref: ${ref}. Seats: ${seats}. Amount: ₹${booking.total_amount || booking.totalAmount}.`
    );
  }

  return { email: emailResult };
}

async function sendCancellationNotification(user, booking) {
  const { train, route } = extractTrainRouteFromBooking(booking);

  const emailResult = await sendEmailToUser(
    user,
    emailTemplates.bookingCancellation,
    { booking, train, route },
    'bookingCancellation'
  );

  if (user.phone) {
    const ref = booking.booking_reference || booking.bookingReference;
    await sendSms(
      user.phone,
      `Booking ${ref} for ${booking.travel_date || booking.travelDate} has been cancelled.`
    );
  }

  return { email: emailResult };
}

async function sendWaitlistConfirmation(user, waitlist, booking) {
  const { train, route } = extractTrainRouteFromBooking(booking);

  const emailResult = await sendEmailToUser(
    user,
    emailTemplates.waitlistPromoted,
    { waitlist, booking, train, route },
    'waitlistPromoted'
  );

  if (user.phone) {
    await sendSms(
      user.phone,
      `Promoted from waitlist! Booking ${booking.booking_reference} confirmed for ${booking.travel_date}.`
    );
  }

  return { email: emailResult };
}

async function sendWaitlistJoined(user, waitlist, extra = {}) {
  const emailResult = await sendEmailToUser(
    user,
    emailTemplates.waitlistJoined,
    {
      waitlist: { ...waitlist, totalInQueue: extra.totalInQueue },
      train: extra.train,
      route: extra.route,
    },
    'waitlistJoined'
  );

  if (user.phone) {
    await sendSms(
      user.phone,
      `Train full. Waitlist position #${waitlist.position} for ${waitlist.travel_date || waitlist.travelDate}.`
    );
  }

  return { email: emailResult };
}

/** Legacy plain notify — prefer typed methods above */
async function notifyUser(user, subject, message) {
  if (user.email) {
    await emailService.sendMail({
      to: user.email,
      subject,
      text: message,
      html: `<p>${message}</p>`,
      template: 'generic',
    });
  }
  if (user.phone) await sendSms(user.phone, message);
}

module.exports = {
  sendOtpNotification,
  sendBookingConfirmation,
  sendCancellationNotification,
  sendWaitlistConfirmation,
  sendWaitlistJoined,
  notifyUser,
  sendSms,
  emailService,
};
