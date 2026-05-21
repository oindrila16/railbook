/**
 * PNR / booking reference lookup (public, no auth).
 */
const ApiError = require('../utils/ApiError');
const bookingModel = require('../models/booking.model');
const ticketModel = require('../models/ticket.model');
const { getFareClassLabel } = require('../config/fareClasses');

function formatBooking(row, tickets) {
  return {
    bookingReference: row.booking_reference,
    status: row.status,
    travelDate: row.travel_date,
    fareClass: row.fare_class || 'economy',
    fareClassLabel: getFareClassLabel(row.fare_class || 'economy'),
    seatCount: row.seat_count,
    totalAmount: Number(row.total_amount),
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
    train: {
      number: row.train_number,
      name: row.train_name,
      class: row.train_class,
    },
    route: {
      source: row.source_code,
      sourceName: row.source_name,
      destination: row.destination_code,
      destinationName: row.destination_name,
      departureTime: row.departure_time,
      arrivalTime: row.arrival_time,
      durationMinutes: row.duration_minutes,
    },
    tickets: tickets.map((t) => ({
      passengerName: t.passenger_name,
      seatNumber: t.seat_number,
      ticketPrice: Number(t.ticket_price),
      status: t.status,
      fareClass: t.fare_class || row.fare_class || 'economy',
    })),
  };
}

async function lookupByReference(reference) {
  const ref = String(reference || '').trim();
  if (!ref || ref.length < 6) {
    throw ApiError.badRequest('Enter a valid booking reference (e.g. BR20260521A3F9K2)');
  }

  const booking = await bookingModel.findByReference(ref);
  if (!booking) {
    throw ApiError.notFound('No booking found for this reference. Check the code and try again.');
  }

  const tickets = await ticketModel.findByBookingId(booking.id);
  return formatBooking(booking, tickets);
}

module.exports = { lookupByReference };
