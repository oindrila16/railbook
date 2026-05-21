import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import ErrorAlert from '../ErrorAlert';
import { formatBDT } from '../../utils/currency';
import { tapScale } from '../../utils/motion';
import * as trainService from '../../services/trainService';

function StatusBadge({ status }) {
  const styles = {
    confirmed: 'bg-ink text-paper',
    cancelled: 'border border-line text-ink-muted',
    waitlisted: 'border border-ink text-ink',
    pending: 'bg-paper-muted text-ink',
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
        styles[status] || styles.pending
      }`}
    >
      {status}
    </span>
  );
}

export default function PnrStatusPanel() {
  const { isAdmin } = useAuth();
  const [reference, setReference] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await trainService.lookupPnr(reference);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-ink-muted">
        Enter your <strong className="font-medium text-ink">booking reference</strong> (PNR) from
        your confirmation email, e.g. <code className="text-xs">BR20260521A3F9K2</code>.
      </p>

      <div>
        <label className="text-caption">Booking reference</label>
        <input
          type="text"
          required
          value={reference}
          onChange={(e) => setReference(e.target.value.toUpperCase())}
          placeholder="BR20260521XXXXXX"
          className="input-field mt-2 font-semibold uppercase tracking-[0.2em]"
        />
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <motion.button
        type="submit"
        disabled={loading || !reference.trim()}
        className="btn-primary w-full py-4"
        {...tapScale}
      >
        {loading ? 'Checking...' : 'Check PNR status'}
      </motion.button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-surface space-y-5 p-6 sm:p-7"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="heading-card tracking-wide">{result.bookingReference}</h3>
            <StatusBadge status={result.status} />
          </div>

          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-caption">Train</p>
              <p className="mt-1 font-medium text-ink">
                {result.train.number} — {result.train.name}
              </p>
            </div>
            <div>
              <p className="text-caption">Route</p>
              <p className="mt-1 font-medium text-ink">
                {result.route.source} → {result.route.destination}
              </p>
            </div>
            <div>
              <p className="text-caption">Travel date</p>
              <p className="mt-1 font-medium text-ink">{result.travelDate}</p>
            </div>
            <div>
              <p className="text-caption">Class</p>
              <p className="mt-1 font-medium text-ink">{result.fareClassLabel}</p>
            </div>
            <div>
              <p className="text-caption">Departure</p>
              <p className="mt-1 font-medium text-ink">
                {result.route.departureTime?.slice(0, 5)}
              </p>
            </div>
            <div>
              <p className="text-caption">Total</p>
              <p className="mt-1 font-semibold text-ink">{formatBDT(result.totalAmount)}</p>
            </div>
          </div>

          {result.tickets?.length > 0 && (
            <div className="divider-soft pt-5">
              <p className="text-caption mb-3">Passengers & seats</p>
              <ul className="space-y-2">
                {result.tickets.map((t, i) => (
                  <li
                    key={i}
                    className="flex justify-between rounded-2xl bg-paper-muted/50 px-4 py-3 text-sm"
                  >
                    <span>{t.passengerName}</span>
                    <span className="font-medium">
                      Seat {t.seatNumber} · {formatBDT(t.ticketPrice)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isAdmin && (
            <Link to="/bookings" className="link-subtle text-sm">
              View in My Bookings →
            </Link>
          )}
        </motion.div>
      )}
    </form>
  );
}
