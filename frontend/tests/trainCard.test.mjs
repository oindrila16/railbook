import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const server = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
const { renderCard } = await server.ssrLoadModule('/tests/renderCard.jsx');
test.after(async () => server.close());
const train = {
  routeId: 1,
  train: { name: 'Example Express', number: '701' },
  source: { code: 'DHK' }, destination: { code: 'CTG' },
  schedule: { departureTime: '06:00', arrivalTime: '12:00', durationLabel: '6h' },
  fares: [{ class: 'economy', label: 'Economy', availability: { availableSeats: 10, isFull: false }, pricing: { currentPrice: 100 } }],
};

test('live snapshots override original search availability and prices', () => {
  const html = renderCard(train, { fareClass: 'economy', fares: [{ class: 'economy', availability: { availableSeats: 2, isFull: false }, pricing: { currentPrice: 250 } }] });
  assert.ok(html.includes('2 left'));
  assert.ok(html.includes('250'));
  assert.ok(!html.includes('10 left'));
  assert.ok(html.includes('Seats · live'));
});

test('full trains offer a working waitlist link', () => {
  const html = renderCard(train, { fareClass: 'economy', fares: [{ class: 'economy', availability: { availableSeats: 0, isFull: true }, pricing: { currentPrice: 250 } }] });
  assert.match(html, /href="\/book\/1\?date=2026-10-14[^\"]*"[^>]*>Join waitlist<\/a>/);
  assert.ok(!html.includes('>Book now<'));
});

test('the selected fare class uses its own live availability', () => {
  const html = renderCard({ ...train, fares: [...train.fares, { class: 'business', availability: { availableSeats: 8 }, pricing: { currentPrice: 400 } }] }, {
    fares: [
      { class: 'economy', availability: { availableSeats: 1 }, pricing: { currentPrice: 200 } },
      { class: 'business', availability: { availableSeats: 3 }, pricing: { currentPrice: 600 } },
    ],
  }, 'business');
  assert.ok(html.includes('3 left'));
  assert.ok(html.includes('600'));
  assert.ok(!html.includes('8 left'));
});

test('direct booking URLs can load train details without navigation state', async (t) => {
  const { default: api } = await server.ssrLoadModule('/src/services/api.js');
  const { getTrainForBooking } = await server.ssrLoadModule('/src/services/trainService.js');
  const original = api.get;
  t.after(() => { api.get = original; });
  api.get = async (url, config) => {
    assert.equal(url, '/trains/availability/1');
    assert.deepEqual(config.params, { date: '2099-01-01', class: 'business' });
    return { data: { data: {
      found: true, routeId: 1, train: { name: 'Example Express' },
      route: { source: 'DHK', destination: 'CTG', departureTime: '06:00', arrivalTime: '12:00' },
      fares: [{ class: 'business' }], fareClass: 'business',
    } } };
  };
  const result = await getTrainForBooking({ routeId: 1, date: '2099-01-01', fareClass: 'business' });
  assert.equal(result.train.name, 'Example Express');
  assert.equal(result.source.code, 'DHK');
  assert.equal(result.destination.code, 'CTG');
  assert.equal(result.schedule.departureTime, '06:00');
  assert.equal(result.fares[0].class, 'business');
});
