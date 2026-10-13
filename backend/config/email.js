/**
 * Email / Nodemailer configuration.
 */
require('dotenv').config();

module.exports = {
  enabled: process.env.EMAIL_ENABLED !== 'false',
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT, 10) === 465,
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.EMAIL_FROM || 'Train Booking <noreply@trainbooking.com>',
  replyTo: process.env.EMAIL_REPLY_TO || '',
  appName: process.env.APP_NAME || 'Train Ticket Booking',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@trainbooking.com',
  /** Log emails to console when SMTP is not configured */
  mockInDevelopment: process.env.NODE_ENV !== 'production' && process.env.EMAIL_MOCK !== 'false',
};
