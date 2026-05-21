/**
 * Train coach layouts: multi-coach (A, B, C…) with chair 2+2 or sleeper upper/lower berths.
 * Global seat IDs S1…Sn map to database seat_number.
 */
const COLUMNS = ['A', 'B', 'C', 'D'];
const AISLE_AFTER = 'B';
const COACH_IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const CHAIR_SEATS_PER_COACH = 72;
const SLEEPER_BERTHS_PER_COACH = 48;
const BERTHS_PER_BAY = 4;

function resolveLayoutType(trainClass) {
  const tc = String(trainClass || '').toLowerCase();
  if (tc === 'sleeper') return 'sleeper';
  return 'chair';
}

function buildChairCoach(coachId, startIndex, capacity) {
  const seats = [];
  const quota = Math.min(capacity, CHAIR_SEATS_PER_COACH);

  for (let i = 0; i < quota; i += 1) {
    const row = Math.floor(i / 4) + 1;
    const colIndex = i % 4;
    const column = COLUMNS[colIndex];
    const globalNum = startIndex + i + 1;
    seats.push({
      id: `S${globalNum}`,
      label: `${coachId}${row}${column}`,
      coachId,
      row,
      column,
      berth: null,
      position: colIndex === 0 || colIndex === 3 ? 'window' : 'aisle',
    });
  }

  const rowMap = new Map();
  for (const seat of seats) {
    if (!rowMap.has(seat.row)) rowMap.set(seat.row, []);
    rowMap.get(seat.row).push(seat);
  }

  const rows = [...rowMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rowNumber, rowSeats]) => ({ rowNumber, seats: rowSeats }));

  return {
    id: coachId,
    label: `Coach ${coachId}`,
    layoutType: 'chair',
    columns: COLUMNS,
    aisleAfter: AISLE_AFTER,
    seatCount: seats.length,
    seats,
    rows,
  };
}

/** Sleeper: each bay has left/right × upper/lower (4 berths), corridor in the middle. */
function buildSleeperCoach(coachId, startIndex, capacity) {
  const seats = [];
  const quota = Math.min(capacity, SLEEPER_BERTHS_PER_COACH);
  const berthDefs = [
    { side: 'left', berth: 'upper', short: 'LU' },
    { side: 'left', berth: 'lower', short: 'LL' },
    { side: 'right', berth: 'upper', short: 'RU' },
    { side: 'right', berth: 'lower', short: 'RL' },
  ];

  for (let i = 0; i < quota; i += 1) {
    const bay = Math.floor(i / BERTHS_PER_BAY) + 1;
    const def = berthDefs[i % BERTHS_PER_BAY];
    const globalNum = startIndex + i + 1;
    seats.push({
      id: `S${globalNum}`,
      label: `${coachId}${bay}${def.short}`,
      coachId,
      bay,
      side: def.side,
      berth: def.berth,
      row: bay,
      column: def.short,
      position: def.berth,
    });
  }

  const bayMap = new Map();
  for (const seat of seats) {
    if (!bayMap.has(seat.bay)) bayMap.set(seat.bay, []);
    bayMap.get(seat.bay).push(seat);
  }

  const rows = [...bayMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bayNumber, baySeats]) => {
      const left = baySeats.filter((s) => s.side === 'left');
      const right = baySeats.filter((s) => s.side === 'right');
      const sortBerth = (a, b) => (a.berth === 'upper' ? -1 : 1) - (b.berth === 'upper' ? -1 : 1);
      return {
        bayNumber,
        rowNumber: bayNumber,
        sides: [
          { side: 'left', berths: [...left].sort(sortBerth) },
          { side: 'right', berths: [...right].sort(sortBerth) },
        ],
      };
    });

  return {
    id: coachId,
    label: `Coach ${coachId}`,
    layoutType: 'sleeper',
    seatCount: seats.length,
    seats,
    rows,
  };
}

/**
 * Split class quota across coaches (A, B, C…).
 */
/** @param {number} seatIndexStart - 0-based offset (class range starts at S{offset+1}) */
function buildMultiCoachLayout(seatQuota, trainClass, seatIndexStart = 0) {
  const layoutType = resolveLayoutType(trainClass);
  const quota = Math.max(1, Math.min(Number(seatQuota) || 48, 400));
  const perCoach = layoutType === 'sleeper' ? SLEEPER_BERTHS_PER_COACH : CHAIR_SEATS_PER_COACH;
  const coaches = [];
  let seatIndex = Math.max(0, Number(seatIndexStart) || 0);
  let coachIdx = 0;

  while (seatIndex < quota && coachIdx < COACH_IDS.length) {
    const remaining = quota - seatIndex;
    const capacity = Math.min(perCoach, remaining);
    const coachId = COACH_IDS[coachIdx];
    const coach =
      layoutType === 'sleeper'
        ? buildSleeperCoach(coachId, seatIndex, capacity)
        : buildChairCoach(coachId, seatIndex, capacity);
    coaches.push(coach);
    seatIndex += coach.seatCount;
    coachIdx += 1;
  }

  const allSeats = coaches.flatMap((c) => c.seats);

  return {
    layoutType,
    totalSeats: allSeats.length,
    coaches,
    seats: allSeats,
  };
}

/** @deprecated Use buildMultiCoachLayout */
function buildTrainSeatLayout(seatQuota, trainClass = 'AC') {
  const multi = buildMultiCoachLayout(seatQuota, trainClass);
  const first = multi.coaches[0];
  return {
    layoutType: first?.layoutType === 'sleeper' ? 'sleeper' : '2+2',
    columns: COLUMNS,
    aisleAfter: AISLE_AFTER,
    totalSeats: multi.totalSeats,
    seats: multi.seats,
    rows: first?.rows || [],
    coaches: multi.coaches,
  };
}

function isValidSeatForClass(seatId, minSeat, maxSeat) {
  const match = /^S(\d+)$/i.exec(String(seatId || '').trim());
  if (!match) return false;
  const num = parseInt(match[1], 10);
  const min = Number(minSeat);
  const max = Number(maxSeat);
  if (Number.isFinite(min) && Number.isFinite(max) && max >= min) {
    return num >= min && num <= max;
  }
  return num >= 1 && num <= Number(maxSeat || minSeat || 0);
}

module.exports = {
  buildMultiCoachLayout,
  buildTrainSeatLayout,
  buildChairCoach,
  buildSleeperCoach,
  resolveLayoutType,
  isValidSeatForClass,
  COLUMNS,
  AISLE_AFTER,
  COACH_IDS,
  CHAIR_SEATS_PER_COACH,
  SLEEPER_BERTHS_PER_COACH,
};
