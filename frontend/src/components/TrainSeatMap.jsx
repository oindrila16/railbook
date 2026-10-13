import { useCallback, useMemo, useState } from 'react';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { motion } from 'framer-motion';
import * as trainService from '../services/trainService';
import { formatBDT } from '../utils/currency';
import { fareClassLabel } from '../constants/fareClasses';

function seatClass(status, isSelected) {
  if (isSelected) return 'train-seat train-seat--selected';
  if (status === 'booked') return 'train-seat train-seat--booked';
  return 'train-seat train-seat--available';
}

/** Mini seat swatch for the legend — matches map seat styling */
function LegendSeatIcon({ variant }) {
  const base =
    'inline-flex h-8 w-10 shrink-0 items-center justify-center rounded-lg border-2 text-[10px] font-bold shadow-sm';

  if (variant === 'available') {
    return (
      <span
        className={`${base} border-emerald-500 bg-white text-emerald-600`}
        aria-hidden
      />
    );
  }
  if (variant === 'selected') {
    return (
      <span
        className={`${base} border-emerald-800 bg-emerald-500 text-white`}
        aria-hidden
      />
    );
  }
  if (variant === 'booked') {
    return (
      <span
        className={`${base} border-line-dark/30 bg-paper-muted text-ink-faint`}
        aria-hidden
      />
    );
  }
  if (variant === 'upper') {
    return (
      <span
        className={`${base} border-amber-500 bg-amber-50 text-amber-700`}
        aria-hidden
      />
    );
  }
  if (variant === 'lower') {
    return (
      <span
        className={`${base} border-emerald-600 bg-emerald-50 text-emerald-700`}
        aria-hidden
      />
    );
  }
  return null;
}

function SeatButton({ seat, isSelected, onToggle }) {
  return (
    <motion.button
      type="button"
      disabled={seat.status === 'booked'}
      onClick={() => onToggle(seat)}
      className={seatClass(seat.status, isSelected)}
      title={
        seat.berth
          ? `${seat.label} (${seat.berth} berth)`
          : `${seat.label} (${seat.position})`
      }
      whileTap={{ scale: 0.92 }}
    >
      {seat.label.replace(/^[A-Z]/, '') || seat.label}
    </motion.button>
  );
}

function ChairCoachGrid({ layout, selectedSeats, onToggle }) {
  return (
    <div className="train-coach-grid mx-auto max-w-2xl">
      {layout.rows.map((row) => {
        const left = row.seats.filter((s) => s.column === 'A' || s.column === 'B');
        const right = row.seats.filter((s) => s.column === 'C' || s.column === 'D');

        return (
          <div key={row.rowNumber} className="train-coach-row">
            <span className="train-row-label">{row.rowNumber}</span>
            <div className="train-row-seats">
              <div className="train-side">
                {left.map((seat) => (
                  <SeatButton
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeats.includes(seat.id.toUpperCase())}
                    onToggle={onToggle}
                  />
                ))}
              </div>
              <div className="train-aisle" aria-hidden />
              <div className="train-side">
                {right.map((seat) => (
                  <SeatButton
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeats.includes(seat.id.toUpperCase())}
                    onToggle={onToggle}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SleeperCoachGrid({ layout, selectedSeats, onToggle }) {
  return (
    <div className="train-sleeper-grid mx-auto max-w-2xl">
      {layout.rows.map((row) => (
        <div key={row.bayNumber} className="train-sleeper-bay">
          <span className="train-row-label">{row.bayNumber}</span>
          <div className="train-row-seats">
            {row.sides
              .filter((s) => s.side === 'left')
              .map((side) => (
                <div key={side.side} className="train-sleeper-side">
                  {side.berths.map((berth) => (
                    <SeatButton
                      key={berth.id}
                      seat={berth}
                      isSelected={selectedSeats.includes(berth.id.toUpperCase())}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              ))}
            <div className="train-aisle train-aisle--sleeper" aria-hidden />
            {row.sides
              .filter((s) => s.side === 'right')
              .map((side) => (
                <div key={side.side} className="train-sleeper-side">
                  {side.berths.map((berth) => (
                    <SeatButton
                      key={berth.id}
                      seat={berth}
                      isSelected={selectedSeats.includes(berth.id.toUpperCase())}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TrainSeatMap({
  routeId,
  travelDate,
  fareClass,
  maxSeats,
  selectedSeats,
  onSelectionChange,
}) {
  const [activeCoachId, setActiveCoachId] = useState('A');
  const loader = useCallback(() => trainService.getSeatMap({ routeId, date: travelDate, fareClass }),
    [routeId, travelDate, fareClass]);
  const { data: mapData, loading, error } = useAsyncResource(loader);

  const labelById = useMemo(() => {
    const m = new Map();
    mapData?.coaches?.forEach((coach) => {
      coach.seats?.forEach((s) => m.set(s.id, s.label));
    });
    return m;
  }, [mapData]);

  const activeCoach = useMemo(
    () => mapData?.coaches?.find((c) => c.id === activeCoachId) || mapData?.coaches?.[0],
    [mapData, activeCoachId]
  );

  const activePassengerIndex = selectedSeats.length < maxSeats ? selectedSeats.length : null;

  const toggleSeat = (seat) => {
    if (seat.status === 'booked') return;
    const id = seat.id.toUpperCase();
    const idx = selectedSeats.indexOf(id);
    if (idx >= 0) {
      onSelectionChange(selectedSeats.filter((s) => s !== id));
      return;
    }
    if (selectedSeats.length >= maxSeats) return;
    onSelectionChange([...selectedSeats, id]);
  };

  if (loading) {
    return (
      <div className="card-surface p-8 text-center text-sm text-ink-muted">
        Loading coach layout…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (!mapData || !activeCoach) return null;

  const { availability, pricing, train, layoutType, directionLabel, coaches } = mapData;
  const isSleeper = layoutType === 'sleeper' || activeCoach.layoutType === 'sleeper';

  return (
    <section className="card-surface overflow-hidden">
      <div className="border-b border-line/60 p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="heading-card text-lg">Select seats</h3>
            <p className="mt-1.5 text-sm text-ink-muted">
              {train.name} ({train.number}) · {train.class}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {isSleeper
                ? 'Sleeper — upper (U) & lower (L) berths · corridor in centre'
                : 'Chair car — 2+2 · window (A/D) · aisle (B/C)'}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-ink">{formatBDT(pricing?.currentPrice)} / seat</p>
            <p className="text-ink-muted">
              {availability.availableSeats} of {availability.classQuota} available
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {coaches.map((coach) => (
            <button
              key={coach.id}
              type="button"
              onClick={() => setActiveCoachId(coach.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                coach.id === activeCoachId
                  ? 'bg-ink text-paper shadow-card'
                  : 'bg-paper-muted text-ink-muted hover:bg-line/40'
              }`}
            >
              {coach.label}
              <span className="ml-1.5 text-xs font-normal opacity-80">
                ({coach.availableSeats} free)
              </span>
            </button>
          ))}
        </div>

        <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-ink-muted">
          {mapData.legend.map((item) => (
            <li key={item.key} className="inline-flex items-center gap-2.5">
              <LegendSeatIcon variant={item.key} />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="train-coach-scroll px-4 py-6 sm:px-6">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-ink-muted">
          {directionLabel} · {activeCoach.label}
        </p>

        {isSleeper ? (
          <SleeperCoachGrid
            layout={activeCoach.layout}
            selectedSeats={selectedSeats}
            onToggle={toggleSeat}
          />
        ) : (
          <ChairCoachGrid
            layout={activeCoach.layout}
            selectedSeats={selectedSeats}
            onToggle={toggleSeat}
          />
        )}

        <div className="train-platform-bar mt-6">
          <span>Platform side · rear of {activeCoach.label}</span>
        </div>
      </div>

      <div className="border-t border-line/60 bg-paper-muted/40 px-6 py-5 sm:px-7">
        {activePassengerIndex !== null ? (
          <p className="text-sm font-medium text-ink">
            Choose {isSleeper ? 'berth' : 'seat'} for passenger {activePassengerIndex + 1} of{' '}
            {maxSeats}
          </p>
        ) : (
          <p className="text-sm font-medium text-emerald-700">
            All {maxSeats} {isSleeper ? 'berths' : 'seats'} selected — tap to change
          </p>
        )}
        {selectedSeats.length > 0 && (
          <p className="mt-2 text-sm text-ink-muted">
            Selected:{' '}
            {selectedSeats.map((id) => labelById.get(id) || id).join(', ')}
          </p>
        )}
        <p className="mt-2 text-xs text-ink-faint">
          Switch coaches with tabs above · leave empty to auto-assign ·{' '}
          {fareClassLabel(fareClass)}
        </p>
      </div>
    </section>
  );
}
