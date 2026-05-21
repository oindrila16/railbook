const { baseLayout, escapeHtml } = require('./layout');
const emailConfig = require('../../config/email');

function formatDate(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function bookingCancellationTemplate({ booking, train, route }) {
  const ref = booking.booking_reference || booking.bookingReference;
  const travelDate = booking.travel_date || booking.travelDate;

  const subject = `Booking cancelled — ${ref}`;
  const text = `Your booking ${ref} for ${formatDate(travelDate)} has been cancelled. Seats have been released.`;

  const bodyHtml = `
    <span class="badge" style="background:#fee2e2;color:#b91c1c;">Cancelled</span>
    <p>Your booking has been cancelled as requested.</p>
    <div class="details">
      <table>
        <tr><td>Booking reference</td><td><strong>${escapeHtml(ref)}</strong></td></tr>
        <tr><td>Train</td><td>${escapeHtml(train?.number || '')} — ${escapeHtml(train?.name || '')}</td></tr>
        <tr><td>Route</td><td>${escapeHtml(route?.source || '')} → ${escapeHtml(route?.destination || '')}</td></tr>
        <tr><td>Travel date</td><td>${escapeHtml(formatDate(travelDate))}</td></tr>
      </table>
    </div>
    <p>Your seats have been released. If you were eligible for a refund, it will be processed per our policy.</p>
    <a href="${escapeHtml(emailConfig.appUrl)}/trains/search" class="btn">Search trains</a>
  `;

  const html = baseLayout({
    title: 'Booking cancelled',
    preheader: `Cancelled: ${ref}`,
    bodyHtml,
  });

  return { subject, text, html };
}

module.exports = { bookingCancellationTemplate };
