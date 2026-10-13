const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');
const pool = require('../config/database');
const users = require('../models/user.model');
const otps = require('../models/otp.model');
const notifications = require('../services/notification.service');
const auth = require('../services/auth.service');
const rateLimit = require('../middlewares/rateLimit');
const config = require('../config');

test('registration rejects a new contact attached to an existing unverified account', async (t) => {
  t.mock.method(users, 'findByEmail', async () => ({ id: 1, email: 'original@example.com', phone: null, is_verified: 0 }));
  const update = t.mock.method(users, 'updatePassword', async () => {});
  const send = t.mock.method(notifications, 'sendOtpNotification', async () => ({ delivered: true }));
  await assert.rejects(auth.register({ email: 'original@example.com', phone: '+8801712345678', password: 'Pass1234', fullName: 'Example' }), { statusCode: 409 });
  assert.equal(update.mock.callCount(), 0);
  assert.equal(send.mock.callCount(), 0);
});

test('resending registration uses stored contacts and defers password changes', async (t) => {
  const user = { id: 1, email: 'original@example.com', phone: '+8801712345678', is_verified: 0 };
  t.mock.method(users, 'findByEmail', async () => user);
  t.mock.method(users, 'findById', async () => user);
  t.mock.method(require('bcrypt'), 'hash', async () => 'pending-hash');
  t.mock.method(require('bcrypt'), 'compare', async () => true);
  const update = t.mock.method(users, 'updatePassword', async () => {});
  t.mock.method(otps, 'invalidatePrevious', async () => {});
  const create = t.mock.method(otps, 'create', async () => 1);
  const send = t.mock.method(notifications, 'sendOtpNotification', async () => ({ delivered: true }));
  await auth.register({ email: user.email, password: 'Pass1234', fullName: 'Example' });
  assert.equal(update.mock.callCount(), 0);
  assert.equal(create.mock.calls[0].arguments[0].pendingPasswordHash, 'pending-hash');
  assert.equal(send.mock.calls[0].arguments[0].phone, user.phone);
});

test('failed OTP delivery does not return registration success', async (t) => {
  const user = { id: 1, email: 'original@example.com', phone: null, is_verified: 0 };
  t.mock.method(users, 'findByEmail', async () => user);
  t.mock.method(users, 'findById', async () => user);
  t.mock.method(require('bcrypt'), 'hash', async () => 'pending-hash');
  t.mock.method(require('bcrypt'), 'compare', async () => true);
  t.mock.method(otps, 'invalidatePrevious', async () => {});
  t.mock.method(otps, 'create', async () => 1);
  t.mock.method(notifications, 'sendOtpNotification', async () => ({ delivered: false }));
  await assert.rejects(auth.register({ email: user.email, password: 'Pass1234', fullName: 'Example' }), { statusCode: 503 });
});

function otpConnection(record, user = { id: 1, is_active: 1, is_verified: 0 }) {
  const queries = [];
  const connection = {
    beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {},
    query: async (sql, params) => {
      queries.push({ sql, params });
      if (sql.includes('SELECT * FROM otp_verifications')) return [[record.is_used ? undefined : record].filter(Boolean)];
      if (sql.includes('SELECT * FROM users')) return [[user]];
      if (sql.includes('attempts = attempts + 1')) record.attempts += 1;
      if (sql.includes('SET is_used = 1')) record.is_used = 1;
      return [{ affectedRows: 1 }];
    },
  };
  return { connection, queries };
}

test('an OTP is locked out after five wrong guesses, including a later correct guess', async (t) => {
  const record = { id: 1, user_id: 1, otp_code: '123456', attempts: 0, is_used: 0 };
  const { connection, queries } = otpConnection(record);
  t.mock.method(pool, 'getConnection', async () => connection);
  for (let i = 0; i < 5; i++) assert.equal(await otps.verifyRegistration({ email: 'original@example.com', otpCode: '000000' }), null);
  assert.equal(await otps.verifyRegistration({ email: 'original@example.com', otpCode: '123456' }), null);
  assert.equal(record.attempts, 5);
  assert.ok(queries.every(({ sql }) => !sql.startsWith('UPDATE users')));
});

test('OTP consumption and deferred password update share a transaction; replay is rejected', async (t) => {
  const record = { id: 1, user_id: 1, otp_code: '123456', pending_password_hash: 'new-hash', attempts: 0, is_used: 0 };
  const { connection, queries } = otpConnection(record);
  const commit = t.mock.method(connection, 'commit', async () => {});
  t.mock.method(pool, 'getConnection', async () => connection);
  assert.equal((await otps.verifyRegistration({ email: 'original@example.com', otpCode: '123456' })).id, 1);
  const update = queries.find(({ sql }) => sql.startsWith('UPDATE users'));
  assert.deepEqual(update.params, ['new-hash', 1]);
  assert.ok(queries[0].sql.includes('FOR UPDATE'));
  assert.equal(commit.mock.callCount(), 1);
  assert.equal(await otps.verifyRegistration({ email: 'original@example.com', otpCode: '123456' }), null);
});

test('a stale registration OTP cannot change a verified account password', async (t) => {
  const record = { id: 1, user_id: 1, otp_code: '123456', pending_password_hash: 'new-hash', attempts: 0, is_used: 0 };
  const { connection, queries } = otpConnection(record, { id: 1, is_active: 1, is_verified: 1 });
  t.mock.method(pool, 'getConnection', async () => connection);
  await otps.verifyRegistration({ email: 'original@example.com', otpCode: '123456' });
  assert.ok(queries.every(({ sql }) => !sql.startsWith('UPDATE users')));
});

test('rate limiting tracks contacts across IPs and resets expired windows', () => {
  let time = 0;
  const limit = rateLimit({ max: 2, windowMs: 1000, now: () => time });
  const responses = [];
  let allowed = 0;
  const res = { setHeader: () => {}, status: (code) => ({ json: () => responses.push(code) }) };
  for (let i = 0; i < 3; i++) limit({ ip: String(i), body: { email: 'same@example.com' } }, res, () => allowed++);
  assert.equal(allowed, 2);
  assert.deepEqual(responses, [429]);
  time = 1001;
  limit({ ip: '3', body: { email: 'same@example.com' } }, res, () => allowed++);
  assert.equal(allowed, 3);
});

test('production rejects missing or known JWT secrets', () => {
  const script = `require(${JSON.stringify(path.resolve(__dirname, '../config/index.js'))})`;
  for (const secret of ['', 'change-me-in-production', 'short']) {
    assert.throws(() => execFileSync(process.execPath, ['-e', script], {
      cwd: os.tmpdir(), env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: secret }, stdio: 'pipe',
    }), /JWT_SECRET/);
  }
  execFileSync(process.execPath, ['-e', script], {
    cwd: os.tmpdir(), env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(64) }, stdio: 'pipe',
  });
});

test('Twilio sends a real form-encoded request and surfaces provider failures', async (t) => {
  const original = { provider: config.sms.provider, twilio: config.sms.twilio };
  config.sms.provider = 'twilio';
  config.sms.twilio = { accountSid: 'ACtest', authToken: 'test-token', phoneNumber: '+15551234567' };
  t.after(() => Object.assign(config.sms, original));
  const fetchMock = t.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => ({ sid: 'SMtest', status: 'queued' }) }));
  const result = await notifications.sendSms('+8801712345678', 'Test message');
  assert.equal(result.mocked, false);
  assert.equal(result.success, true);
  assert.equal(fetchMock.mock.calls[0].arguments[1].body.get('To'), '+8801712345678');
  assert.equal(fetchMock.mock.calls[0].arguments[1].body.get('Body'), 'Test message');
  fetchMock.mock.mockImplementation(async () => ({ ok: false, json: async () => ({ message: 'Rejected' }) }));
  assert.equal((await notifications.sendSms('+8801712345678', 'Test message')).success, false);
});

test('missing Twilio credentials never pretend to send SMS', async (t) => {
  const original = { provider: config.sms.provider, twilio: config.sms.twilio };
  config.sms.provider = 'twilio'; config.sms.twilio = {};
  t.after(() => Object.assign(config.sms, original));
  const fetchMock = t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected network request'); });
  assert.equal((await notifications.sendSms('+8801712345678', 'Test')).success, false);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('joining a full waitlist counts entries using the transaction connection', async (t) => {
  const routeModel = require('../models/route.model');
  const fares = require('../models/routeFare.model');
  const waitlists = require('../models/waitlist.model');
  let counted = false;
  const connection = { beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release: () => {}, query: async (sql, params) => {
    assert.ok(sql.includes('COUNT(*)'));
    assert.deepEqual(params, [1, '2026-10-14']);
    counted = true;
    return [[{ total: 3 }]];
  } };
  t.mock.method(pool, 'getConnection', async () => connection);
  t.mock.method(pool, 'query', async () => [[]]);
  t.mock.method(routeModel, 'findByIdForUpdate', async () => ({ route_id: 1, route_active: 1, train_active: 1, total_seats: 1 }));
  t.mock.method(fares, 'findByRouteId', async () => []);
  t.mock.method(fares, 'countBookedByClassForUpdate', async () => 1);
  t.mock.method(waitlists, 'findByUserRouteDate', async () => null);
  t.mock.method(waitlists, 'getNextPosition', async () => 3);
  t.mock.method(waitlists, 'create', async () => 10);
  const result = await require('../services/waitlist.service').joinWaitlist(1, { routeId: 1, travelDate: '2026-10-14', passengers: [{ name: 'Test User', age: 30, gender: 'other' }], fareClass: 'economy' });
  assert.ok(counted);
  assert.equal(result.waitlist.totalInQueue, 3);
});

test('cancellation reserves released seats for waitlist promotion before commit', async (t) => {
  const bookings = require('../models/booking.model');
  const tickets = require('../models/ticket.model');
  const routes = require('../models/route.model');
  const waitlists = require('../services/waitlist.service');
  const events = [];
  const connection = {
    beginTransaction: async () => {}, rollback: async () => { events.push('rollback'); },
    commit: async () => { events.push('commit'); }, release: () => { events.push('release'); },
  };
  const booking = { id: 1, user_id: 1, route_id: 2, travel_date: '2099-01-01', fare_class: 'business', status: 'confirmed', total_amount: 100 };
  t.mock.method(pool, 'getConnection', async () => connection);
  t.mock.method(pool, 'query', async () => [[{ email: 'test@example.com' }]]);
  t.mock.method(bookings, 'findById', async () => booking);
  t.mock.method(routes, 'findByIdForUpdate', async () => { events.push('route-lock'); return {}; });
  t.mock.method(bookings, 'findByIdForUpdate', async () => { events.push('booking-lock'); return booking; });
  t.mock.method(tickets, 'cancelByBookingId', async () => { events.push('cancel-tickets'); });
  t.mock.method(bookings, 'updateStatus', async () => {});
  t.mock.method(tickets, 'findByBookingId', async () => []);
  t.mock.method(waitlists, 'promoteQueue', async (conn, routeId, date, fareClass) => {
    assert.equal(conn, connection); assert.equal(routeId, 2); assert.equal(fareClass, 'business');
    events.push('promote'); return [];
  });
  t.mock.method(waitlists, 'notifyPromotions', async () => {});
  t.mock.method(notifications, 'sendCancellationNotification', async () => { throw new Error('Provider unavailable'); });
  const result = await require('../services/booking.service').cancelBooking(1, 1);
  assert.equal(result.message, 'Booking cancelled successfully');
  assert.deepEqual(events, ['route-lock', 'booking-lock', 'cancel-tickets', 'promote', 'commit', 'release']);
});

test('waitlist selection is scoped to the fare class with available seats', async () => {
  let params;
  const connection = { query: async (sql, values) => {
    assert.ok(sql.includes('JSON_EXTRACT'));
    params = values;
    return [[]];
  } };
  await require('../models/waitlist.model').getNextWaitingForUpdate(connection, 1, '2030-01-01', 'business');
  assert.deepEqual(params, [1, '2030-01-01', 'business']);
});


test('resending verification requires the original registration password', async (t) => {
  t.mock.method(users, 'findByEmail', async () => ({ id: 1, email: 'original@example.com', is_verified: 0, password_hash: 'original-hash' }));
  t.mock.method(require('bcrypt'), 'compare', async () => false);
  const create = t.mock.method(otps, 'create', async () => 1);
  await assert.rejects(auth.register({ email: 'original@example.com', password: 'Attacker1234', fullName: 'Example' }), { statusCode: 409 });
  assert.equal(create.mock.callCount(), 0);
});

test('socket broadcasts preserve availability for each subscribed fare class', async (t) => {
  const socket = require('../socket');
  const availability = require('../services/availability.service');
  const io = socket.initSocket(require('node:http').createServer());
  t.after(() => new Promise((resolve) => io.close(resolve)));
  const emitted = [];
  t.mock.method(availability, 'getSnapshot', async (routeId, date, fareClass) => ({ routeId, travelDate: date, fareClass }));
  t.mock.method(io, 'to', (room) => ({ emit: (event, payload) => emitted.push({ room, payload }) }));
  await socket.broadcastSeatUpdate(1, '2030-01-01');
  assert.deepEqual(emitted.map(({ payload }) => payload.fareClass), ['economy', 'business', 'first']);
  for (const { room, payload } of emitted) assert.equal(room, `route:1:2030-01-01:${payload.fareClass}`);
});

test('fare quotas never exceed capacity, including the smallest valid trains', () => {
  const { calculateSeatQuotas } = require('../utils/seatQuotas');
  for (const value of [1, 2, 0, -1, 3.5, NaN]) assert.throws(() => calculateSeatQuotas(value), { statusCode: 400 });
  for (let capacity = 3; capacity <= 1000; capacity++) {
    const quotas = calculateSeatQuotas(capacity);
    assert.equal(quotas.reduce((sum, q) => sum + q.seatQuota, 0), capacity);
    assert.ok(quotas.every(q => Number.isInteger(q.seatQuota) && q.seatQuota > 0));
  }
});

test('overnight journeys remain running after midnight until actual arrival', () => {
  const { computeLegStatus } = require('../services/liveStatus.service');
  const route = { route_id: 1, departure_time: '20:30:00', arrival_time: '03:45:00', source_name: 'Source', destination_name: 'Destination' };
  assert.equal(computeLegStatus(route, '2026-10-13', new Date(2026, 9, 14, 1, 0)).status, 'running');
  assert.equal(computeLegStatus(route, '2026-10-13', new Date(2026, 9, 14, 5, 0)).status, 'arrived');
  assert.equal(computeLegStatus(route, '2026-10-13', new Date(2026, 9, 13, 18, 0)).status, 'scheduled');
});

test('local console email delivers OTPs without an SMTP connection', async (t) => {
  const emailConfig = require('../config/email');
  const original = { enabled: emailConfig.enabled, mockInDevelopment: emailConfig.mockInDevelopment };
  t.after(() => Object.assign(emailConfig, original));
  emailConfig.enabled = false; emailConfig.mockInDevelopment = true;
  const transport = t.mock.method(require('nodemailer'), 'createTransport', () => { throw new Error('Unexpected SMTP connection'); });
  t.mock.method(console, 'log', () => {});
  const result = await notifications.sendOtpNotification({ email: 'test@example.invalid', otpCode: '123456' });
  assert.equal(result.delivered, true);
  assert.equal(result.email.mocked, true);
  assert.equal(transport.mock.callCount(), 0);
});
