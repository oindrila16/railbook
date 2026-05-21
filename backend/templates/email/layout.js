/**
 * Shared HTML email layout wrapper.
 */
const emailConfig = require('../../config/email');

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function baseLayout({ title, preheader, bodyHtml }) {
  const appName = escapeHtml(emailConfig.appName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f8; color: #1a1a2e; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: #fff; padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 32px; line-height: 1.6; font-size: 15px; }
    .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .details { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 8px 0; vertical-align: top; }
    .details td:first-child { color: #64748b; width: 40%; font-size: 13px; }
    .details td:last-child { font-weight: 500; }
    .otp-box { font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; background: #f1f5f9; padding: 24px; border-radius: 8px; margin: 24px 0; color: #1e3a5f; }
    .footer { padding: 20px 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; text-align: center; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin-top: 16px; }
    .warning { color: #b45309; font-size: 13px; }
  </style>
</head>
<body>
  <span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader || '')}</span>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>${appName}</h1>
        <p>${escapeHtml(title)}</p>
      </div>
      <div class="content">
        ${bodyHtml}
      </div>
      <div class="footer">
        <p>This is an automated message from ${appName}. Please do not reply directly.</p>
        <p>Need help? Contact <a href="mailto:${escapeHtml(emailConfig.supportEmail)}">${escapeHtml(emailConfig.supportEmail)}</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { baseLayout, escapeHtml };
