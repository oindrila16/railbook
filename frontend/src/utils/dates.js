/**
 * Local calendar dates (avoids UTC shift from toISOString()).
 */

export function formatLocalDateISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayISO() {
  return formatLocalDateISO(new Date());
}

/** Next calendar day in the user's timezone */
export function getTomorrowISO() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return formatLocalDateISO(d);
}

export function formatDateLabel(iso) {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function isTomorrow(iso) {
  return iso === getTomorrowISO();
}
