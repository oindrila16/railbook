/**
 * Train schedule time helpers.
 */

function parseTimeToMinutes(timeStr) {
  const raw = String(timeStr || '').trim().slice(0, 8);
  const parts = raw.split(':').map((p) => parseInt(p, 10));
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  return h * 60 + m;
}

function formatMinutesToTime(totalMinutes) {
  const mins = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

function computeDurationMinutes(departureTime, arrivalTime) {
  const dep = parseTimeToMinutes(departureTime);
  let arr = parseTimeToMinutes(arrivalTime);
  if (arr < dep) arr += 24 * 60;
  return Math.max(1, arr - dep);
}

function formatDurationLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

module.exports = {
  parseTimeToMinutes,
  formatMinutesToTime,
  computeDurationMinutes,
  formatDurationLabel,
};
