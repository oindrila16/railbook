const { baseLayout, escapeHtml } = require('./layout');
const emailConfig = require('../../config/email');

function formatDate(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function waitlistJoinedTemplate({ waitlist, train, route }) {
  const position = waitlist.position;
  const travelDate = waitlist.travel_date || waitlist.travelDate;
  const totalInQueue = waitlist.totalInQueue;

  const subject = `Waitlist position #${position} — ${emailConfig.appName}`;
  const text = `You are on the waitlist at position ${position} for travel on ${formatDate(travelDate)}.`;

  const bodyHtml = `
    <span class="badge" style="background:#fef3c7;color:#b45309;">Waitlist</span>
    <p>The train is currently full. You have been added to the waitlist.</p>
    <div class="details">
      <table>
        <tr><td>Your position</td><td><strong>#${position}</strong>${totalInQueue ? ` of ${totalInQueue}` : ''}</td></tr>
        <tr><td>Train</td><td>${escapeHtml(train?.number || '')} — ${escapeHtml(train?.name || '')}</td></tr>
        <tr><td>Route</td><td>${escapeHtml(route?.source || '')} → ${escapeHtml(route?.destination || '')}</td></tr>
        <tr><td>Travel date</td><td>${escapeHtml(formatDate(travelDate))}</td></tr>
      </table>
    </div>
    <p>When a seat opens (e.g. after a cancellation), you will be <strong>automatically promoted</strong> in queue order and notified by email.</p>
  `;

  const html = baseLayout({
    title: 'Added to waitlist',
    preheader: `Waitlist position #${position}`,
    bodyHtml,
  });

  return { subject, text, html };
}

module.exports = { waitlistJoinedTemplate };
