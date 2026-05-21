/**
 * Calendar dates in local/server timezone — avoids UTC shift from toISOString().
 */

function parseISODateLocal(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTodayISO() {
  return formatDateISO(new Date());
}

function addDaysISO(iso, days) {
  const d = parseISODateLocal(iso);
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

/**
 * @param {number} days - number of dates (1–14)
 * @param {string} [fromDate] - YYYY-MM-DD start (defaults to today)
 */
function buildDateRange(days, fromDate) {
  const count = Math.min(Math.max(Number(days) || 7, 1), 14);
  const start = fromDate ? parseISODateLocal(fromDate) : parseISODateLocal(getTodayISO());
  const today = parseISODateLocal(getTodayISO());

  if (start < today) {
    const ApiError = require('./ApiError');
    throw ApiError.badRequest('fromDate cannot be in the past');
  }

  const dates = [];
  const cursor = new Date(start);
  for (let i = 0; i < count; i++) {
    dates.push(formatDateISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

module.exports = {
  parseISODateLocal,
  formatDateISO,
  getTodayISO,
  addDaysISO,
  buildDateRange,
};
