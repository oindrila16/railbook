const { baseLayout, escapeHtml } = require('./layout');
const emailConfig = require('../../config/email');

function formatDate(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function bookingConfirmationTemplate({ booking, tickets, train, route }) {
  const ref = booking.booking_reference || booking.bookingReference;
  const travelDate = booking.travel_date || booking.travelDate;
  const total = booking.total_amount ?? booking.totalAmount;
  const seatList = (tickets || [])
    .map(
      (t) =>
        `<tr><td>${escapeHtml(t.passenger_name || t.passengerName)}</td><td>${escapeHtml(t.seat_number || t.seatNumber)}</td><td>৳${Number(t.ticket_price ?? t.ticketPrice).toFixed(2)}</td></tr>`
    )
    .join('');

  const subject = `Booking confirmed — ${ref}`;
  const text = `Booking ${ref} confirmed for ${formatDate(travelDate)}. Total: ৳${total}.`;

  const bodyHtml = `
    <span class="badge">✓ Confirmed</span>
    <p>Your train tickets have been booked successfully!</p>
    <div class="details">
      <table>
        <tr><td>Booking reference</td><td><strong>${escapeHtml(ref)}</strong></td></tr>
        <tr><td>Train</td><td>${escapeHtml(train?.number || '')} — ${escapeHtml(train?.name || '')}</td></tr>
        <tr><td>Route</td><td>${escapeHtml(route?.source || '')} → ${escapeHtml(route?.destination || '')}</td></tr>
        <tr><td>Travel date</td><td>${escapeHtml(formatDate(travelDate))}</td></tr>
        <tr><td>Total amount</td><td><strong>৳${Number(total).toFixed(2)}</strong></td></tr>
      </table>
    </div>
    <p><strong>Passengers &amp; seats</strong></p>
    <div class="details">
      <table>
        <tr><td><strong>Passenger</strong></td><td><strong>Seat</strong></td><td><strong>Price</strong></td></tr>
        ${seatList}
      </table>
    </div>
    <a href="${escapeHtml(emailConfig.appUrl)}/bookings" class="btn">View booking</a>
  `;

  const html = baseLayout({
    title: 'Booking confirmation',
    preheader: `Confirmed: ${ref} — ${formatDate(travelDate)}`,
    bodyHtml,
  });

  return { subject, text, html };
}

module.exports = { bookingConfirmationTemplate };
