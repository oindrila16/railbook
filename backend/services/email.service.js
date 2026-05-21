/**
 * Nodemailer email delivery service.
 * Sends HTML + plain-text emails; falls back to console mock when SMTP is not configured.
 */
const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

let transporter = null;
let lastVerifyResult = null;

function isConfigured() {
  return Boolean(
    emailConfig.enabled &&
      emailConfig.host &&
      emailConfig.user &&
      emailConfig.pass
  );
}

function getTransporter() {
  if (!isConfigured()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  return transporter;
}

/**
 * Verify SMTP connection on startup.
 */
async function verifyConnection() {
  const transport = getTransporter();
  if (!transport) {
    lastVerifyResult = { configured: false, verified: false, mode: 'mock' };
    return lastVerifyResult;
  }

  try {
    await transport.verify();
    lastVerifyResult = { configured: true, verified: true, mode: 'smtp' };
    console.log(`[EMAIL] SMTP connected (${emailConfig.host}:${emailConfig.port})`);
  } catch (err) {
    lastVerifyResult = {
      configured: true,
      verified: false,
      mode: 'smtp',
      error: err.message,
    };
    console.warn(`[EMAIL] SMTP verification failed: ${err.message}`);
  }
  return lastVerifyResult;
}

function getStatus() {
  return lastVerifyResult || { configured: isConfigured(), verified: false, mode: isConfigured() ? 'smtp' : 'mock' };
}

/**
 * Send an email with HTML and plain-text bodies.
 */
async function sendMail({ to, subject, text, html, template = 'generic' }) {
  if (!to) {
    return { success: false, skipped: true, reason: 'no_recipient' };
  }

  const transport = getTransporter();

  if (!transport) {
    if (emailConfig.mockInDevelopment) {
      console.log('\n========== EMAIL (MOCK) ==========');
      console.log(`To:       ${to}`);
      console.log(`Subject:  ${subject}`);
      console.log(`Template: ${template}`);
      console.log(`Text:\n${text}`);
      console.log('==================================\n');
      return { success: true, mocked: true, to, subject };
    }
    return { success: false, skipped: true, reason: 'smtp_not_configured' };
  }

  const mailOptions = {
    from: emailConfig.from,
    to,
    subject,
    text,
    html,
    replyTo: emailConfig.replyTo || undefined,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(`[EMAIL] Sent to ${to} | ${subject} | id=${info.messageId}`);
    return {
      success: true,
      mocked: false,
      messageId: info.messageId,
      to,
      subject,
    };
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message, to, subject };
  }
}

/**
 * Send using a template function from templates/email.
 */
async function sendTemplateEmail(to, templateFn, data, templateName) {
  const { subject, text, html } = templateFn(data);
  return sendMail({ to, subject, text, html, template: templateName });
}

module.exports = {
  isConfigured,
  verifyConnection,
  getStatus,
  sendMail,
  sendTemplateEmail,
};
