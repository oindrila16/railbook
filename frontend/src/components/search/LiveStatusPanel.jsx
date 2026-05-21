import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ErrorAlert from '../ErrorAlert';
import SelectField from '../SelectField';
import { tapScale } from '../../utils/motion';
import * as trainService from '../../services/trainService';
import { getTodayISO } from '../../utils/dates';

const STATUS_COLORS = {
  scheduled: 'bg-paper-muted text-ink-muted',
  running: 'bg-accent-muted text-accent',
  arrived: 'bg-ink text-paper',
  completed: 'bg-paper-muted text-ink-faint',
};

export default function LiveStatusPanel() {
  const today = getTodayISO();
  const [trains, setTrains] = useState([]);
  const [trainNumber, setTrainNumber] = useState('');
  const [date, setDate] = useState(today);
  const [result, setResult] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    trainService.listTrains().then(setTrains).catch(() => setTrains([]));
    trainService
      .getLiveOverview(today)
      .then(setOverview)
      .catch(() => setOverview(null));
  }, [today]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trainNumber) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await trainService.getLiveStatus({ trainNumber, date });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">
        Track running status for Bangladesh Railway trains (simulated from schedule for demo).
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Train"
          value={trainNumber}
          onChange={(e) => setTrainNumber(e.target.value)}
        >
          <option value="">Select train</option>
          {trains.map((t) => (
            <option key={t.number} value={t.number}>
              {t.number} — {t.name}
            </option>
          ))}
        </SelectField>
        <div>
          <label className="text-caption">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field mt-2"
          />
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <motion.button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !trainNumber}
        className="btn-primary w-full py-4"
        {...tapScale}
      >
        {loading ? 'Loading...' : 'Check live status'}
      </motion.button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-surface space-y-5 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="heading-card">
                {result.trainNumber} — {result.trainName}
              </h3>
              <p className="mt-1 text-sm text-ink-muted">{result.travelDate}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                STATUS_COLORS[result.status] || STATUS_COLORS.scheduled
              }`}
            >
              {result.statusLabel}
            </span>
          </div>

          {result.legs?.map((leg) => (
            <div key={leg.routeId} className="rounded-2xl bg-paper-muted/40 p-4">
              <p className="font-semibold text-ink">
                {leg.source} → {leg.destination}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {leg.departureTime?.slice(0, 5)} – {leg.arrivalTime?.slice(0, 5)} ·{' '}
                {leg.durationLabel}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line/60">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${leg.progressPercent}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-ink-muted">{leg.message}</p>
            </div>
          ))}
        </motion.div>
      )}

      {overview?.trains?.length > 0 && !result && (
        <div className="space-y-3">
          <p className="text-caption">Today&apos;s trains</p>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {overview.trains.map((t) => (
              <button
                key={t.trainNumber}
                type="button"
                onClick={() => {
                  setTrainNumber(t.trainNumber);
                  setResult(null);
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-line/60 bg-paper px-4 py-3 text-left text-sm transition-colors hover:border-ink/20 hover:bg-paper-muted/30"
              >
                <span>
                  <span className="font-semibold text-ink">{t.trainNumber}</span>
                  <span className="mx-2 text-ink-faint">·</span>
                  <span className="text-ink-muted">{t.route}</span>
                </span>
                <span className="text-xs font-medium text-ink-muted">{t.statusLabel}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
