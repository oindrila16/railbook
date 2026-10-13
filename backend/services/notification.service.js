/**
 * Notification orchestrator — email (Nodemailer) + SMS (mock/Twilio).
 */
const config = require('../config');
const emailConfig = require('../config/email');
const emailService = require('./email.service');
const emailTemplates = require('../templates/email');

async function sendSms(phone, message) {
  if (config.sms.provider === 'mock') {
    if (config.env === 'production') return { success: false, error: 'Mock SMS is disabled in production' };
    console.log(`[SMS MOCK] To: ${phone}\n${message}`);
    return { success: true, mocked: true };
  }
  const { accountSid, authToken, phoneNumber } = config.sms.twilio;
  if (config.sms.provider !== 'twilio' || !accountSid || !authToken || !phoneNumber) {
    return { success: false, error: 'SMS provider is not configured' };
  }
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: phone, From: phoneNumber, Body: message }),
        signal: AbortSignal.timeout(10000),
      }
    );
    const data = await response.json();
    if (!response.ok || ['failed', 'undelivered', 'canceled'].includes(data.status)) {
      return { success: false, error: 'SMS delivery failed' };
    }
    return { success: true, mocked: false, messageId: data.sid };
  } catch {
    return { success: false, error: 'SMS provider is unavailable' };
  }
}

/** Send email only if user has an email address */
async function sendEmailToUser(user, templateFn, data, templateName) {
  if (!user?.email) return { skipped: true, channel: 'email' };
  return emailService.sendTemplateEmail(user.email, templateFn, data, templateName);
}

async function sendOtpNotification({ email, phone, otpCode }) {
  const expiryMinutes = config.otp.expiryMinutes;

  const [emailResult, smsResult] = await Promise.all([
    email ? emailService.sendTemplateEmail(
      email, emailTemplates.otp, { otpCode, expiryMinutes }, 'otp'
    ) : Promise.resolve({ skipped: true }),
    phone ? sendSms(phone, `Your ${emailConfig.appName} verification code is ${otpCode}. Valid for ${expiryMinutes} minutes.`)
      : Promise.resolve({ skipped: true }),
  ]);
  return {
    email: emailResult,
    sms: smsResult,
    delivered: emailResult.success === true || smsResult.success === true,
  };
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
      `Booking confirmed! Ref: ${ref}. Seats: ${seats}. Amount: ৳${booking.total_amount || booking.totalAmount}.`
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
