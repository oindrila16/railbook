const { baseLayout, escapeHtml } = require('./layout');
const emailConfig = require('../../config/email');

function otpTemplate({ otpCode, expiryMinutes }) {
  const subject = `${emailConfig.appName} — Your verification code`;
  const text = `Your verification code is ${otpCode}. Valid for ${expiryMinutes} minutes. Do not share this code.`;

  const bodyHtml = `
    <span class="badge">Account verification</span>
    <p>Hello,</p>
    <p>Use the code below to verify your account:</p>
    <div class="otp-box">${escapeHtml(otpCode)}</div>
    <p>This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
    <p class="warning">⚠️ Never share this code with anyone. Our team will never ask for it.</p>
  `;

  const html = baseLayout({
    title: 'Verify your account',
    preheader: `Your OTP is ${otpCode}`,
    bodyHtml,
  });

  return { subject, text, html };
}

module.exports = { otpTemplate };
