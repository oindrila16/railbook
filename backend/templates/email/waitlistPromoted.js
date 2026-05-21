const { baseLayout, escapeHtml } = require('./layout');
const emailConfig = require('../../config/email');

function formatDate(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function waitlistPromotedTemplate({ waitlist, booking, train, route }) {
  const ref = booking.booking_reference || booking.bookingReference;
  const travelDate = booking.travel_date || booking.travelDate;
  const previousPosition = waitlist.position || waitlist.previousPosition;
  const total = booking.total_amount ?? booking.totalAmount;

  const subject = `Waitlist confirmed — Booking ${ref}`;
  const text = `Promoted from waitlist (was #${previousPosition}). Booking ${ref} confirmed for ${formatDate(travelDate)}.`;

  const bodyHtml = `
    <span class="badge" style="background:#d1fae5;color:#047857;">Promoted</span>
    <p>Great news! A seat opened up and your waitlist entry has been <strong>automatically confirmed</strong>.</p>
    <div class="details">
      <table>
        <tr><td>Previous waitlist position</td><td>#${escapeHtml(previousPosition)}</td></tr>
        <tr><td>Booking reference</td><td><strong>${escapeHtml(ref)}</strong></td></tr>
        <tr><td>Train</td><td>${escapeHtml(train?.number || '')} — ${escapeHtml(train?.name || '')}</td></tr>
        <tr><td>Route</td><td>${escapeHtml(route?.source || '')} → ${escapeHtml(route?.destination || '')}</td></tr>
        <tr><td>Travel date</td><td>${escapeHtml(formatDate(travelDate))}</td></tr>
        <tr><td>Total amount</td><td><strong>₹${Number(total).toFixed(2)}</strong></td></tr>
      </table>
    </div>
    <p>No further action is required. Your tickets are confirmed.</p>
    <a href="${escapeHtml(emailConfig.appUrl)}/bookings" class="btn">View booking</a>
  `;

  const html = baseLayout({
    title: 'Waitlist promotion — booking confirmed',
    preheader: `You're off the waitlist! Booking ${ref}`,
    bodyHtml,
  });

  return { subject, text, html };
}

module.exports = { waitlistPromotedTemplate };
