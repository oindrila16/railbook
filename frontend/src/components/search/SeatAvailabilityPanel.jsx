import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import ErrorAlert from '../ErrorAlert';
import SelectField from '../SelectField';
import { IconSwap } from '../icons/Icons';
import { formatBDT } from '../../utils/currency';
import { FARE_CLASSES, DEFAULT_FARE_CLASS } from '../../constants/fareClasses';
import { tapScale } from '../../utils/motion';
import * as trainService from '../../services/trainService';
import { getTomorrowISO, getTodayISO } from '../../utils/dates';

export default function SeatAvailabilityPanel({ stations = [], stationsLoading = false }) {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({
    source: '',
    destination: '',
    date: getTomorrowISO(),
    fareClass: DEFAULT_FARE_CLASS,
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const swapStations = () => {
    setForm((f) => ({ ...f, source: f.destination, destination: f.source }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.source || !form.destination || !form.date) return;
    setError('');
    setResults(null);
    setLoading(true);
    try {
      const data = await trainService.getSeatAvailability(form);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">
        Check how many seats are left in each class without starting a booking.
      </p>

      <div className="search-fields-shell">
        <div className="search-form-grid search-form-grid--four">
          <div className="search-field-tile">
            <SelectField
              label="From"
              labelClassName="search-field-label"
              required
              disabled={stationsLoading && stations.length === 0}
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              <option value="">Select station</option>
              {stations.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </SelectField>
          </div>

          <div className="search-field-tile">
            <SelectField
              label="To"
              labelClassName="search-field-label"
              required
              disabled={stationsLoading && stations.length === 0}
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
            >
              <option value="">Select station</option>
              {stations.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </SelectField>
          </div>

          <div className="search-swap-wrap sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={swapStations}
              className="search-swap-btn"
              aria-label="Swap stations"
            >
              <IconSwap size={16} />
            </button>
          </div>

          <div className="search-field-tile">
            <label className="search-field-label">Travel date</label>
            <input
              type="date"
              required
              min={getTodayISO()}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="search-date-input mt-2 w-full min-w-0 border-0 bg-transparent p-0 font-semibold text-ink outline-none"
            />
          </div>

          <div className="search-field-tile">
            <SelectField
              label="Class"
              labelClassName="search-field-label"
              value={form.fareClass}
              onChange={(e) => setForm({ ...form, fareClass: e.target.value })}
            >
              {FARE_CLASSES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <motion.button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="btn-search"
        {...tapScale}
      >
        {loading ? 'Checking seats...' : 'Check availability'}
      </motion.button>

      {results && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <p className="text-sm text-ink-muted">
            {results.count} train(s) · {results.query?.source} → {results.query?.destination} ·{' '}
            {results.date}
          </p>

          {results.routes?.length === 0 ? (
            <p className="card-surface p-8 text-center text-body">No trains on this route.</p>
          ) : (
            results.routes.map((route) => {
              const selectedFare =
                route.fares?.find((f) => f.class === form.fareClass) || route.fares?.[0];
              const avail = selectedFare?.availability || route.availability;
              const searchUrl = `/search?source=${form.source}&destination=${form.destination}&date=${form.date}&passengers=1&class=${form.fareClass}`;

              return (
                <div key={route.routeId} className="card-surface p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink">{route.train.name}</p>
                      <p className="text-xs text-ink-muted">
                        {route.train.number} · {route.schedule.departureTime?.slice(0, 5)} –{' '}
                        {route.schedule.arrivalTime?.slice(0, 5)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-caption">{selectedFare?.label || 'Fare'}</p>
                      <p className="text-xl font-semibold text-ink">
                        {formatBDT(selectedFare?.currentPrice ?? route.pricing?.currentPrice)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-ink">
                        {avail?.isFull
                          ? 'Full — waitlist'
                          : `${avail?.availableSeats ?? 0} seats left`}
                      </p>
                    </div>
                  </div>

                  {route.fares?.length > 1 && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-line/50 pt-4">
                      {route.fares.map((f) => (
                        <span
                          key={f.class}
                          className={`rounded-full px-3 py-1 text-xs ${
                            f.class === form.fareClass
                              ? 'bg-ink text-paper'
                              : 'bg-paper-muted text-ink-muted'
                          }`}
                        >
                          {f.label}: {f.availability.isFull ? 'Full' : f.availability.availableSeats}{' '}
                          left · {formatBDT(f.currentPrice)}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    to={isAdmin ? '/admin' : searchUrl}
                    className="btn-secondary mt-4 inline-flex text-sm"
                  >
                    {isAdmin ? 'Manage in admin' : avail?.isFull ? 'View search' : 'Search & book'}
                  </Link>
                </div>
              );
            })
          )}
        </motion.div>
      )}
    </div>
  );
}
