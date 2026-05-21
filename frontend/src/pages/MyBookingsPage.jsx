import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SectionHeader from '../components/SectionHeader';
import { formatBDT } from '../utils/currency';
import { fadeUp, stagger, scaleIn, tapScale, ease } from '../utils/motion';
import * as bookingService from '../services/bookingService';
import EmptyStateCard from '../components/characters/EmptyStateCard';

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

export default function MyBookingsPage() {
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [cancellingId, setCancellingId] = useState(null);

  const load = () => {
    setLoading(true);
    bookingService
      .getUserBookings()
      .then((data) => setBookings(data.bookings || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking? Seats will be released.')) return;
    setCancellingId(id);
    setError('');
    try {
      await bookingService.cancelBooking(id);
      setSuccess('Booking cancelled successfully.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="page-container page-section">
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <SectionHeader
          title="My bookings"
          subtitle="View and manage your train reservations"
        />
      </motion.div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: ease.smooth }}
            className="card-surface mt-8 px-5 py-4 text-sm text-ink"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSpinner />
      ) : bookings.length === 0 ? (
        <EmptyStateCard
          className="sm:mt-12"
          title="Your ticket diary is empty"
          message="No bookings yet — search for a train and book your first adventure."
          mood="happy"
        />
      ) : (
        <motion.div
          className="content-stack mt-10 sm:mt-12"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {bookings.map((b) => (
            <motion.article
              key={b.id}
              variants={scaleIn}
              whileHover={{ y: -5, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } }}
              className="card-surface-interactive p-8 sm:p-9"
            >
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="heading-card">{b.train.name}</h2>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="text-sm text-ink-muted">
                    Ref: {b.bookingReference} · {b.route.source} → {b.route.destination}
                    {b.fareClassLabel && (
                      <>
                        <span className="mx-2 text-line-dark">·</span>
                        {b.fareClassLabel}
                      </>
                    )}
                  </p>
                  <p className="text-sm text-ink-muted">Travel date: {b.travelDate}</p>
                </div>
                <p className="text-2xl font-semibold tracking-tight text-ink">
                  {formatBDT(b.totalAmount)}
                </p>
              </div>

              {b.tickets?.length > 0 && (
                <ul className="divider-soft mt-6 space-y-3 pt-6">
                  {b.tickets.map((t) => (
                    <li key={t.id} className="flex flex-wrap justify-between gap-2 text-sm">
                      <span className="text-ink">
                        {t.passengerName} · {t.passengerGender} · age {t.passengerAge}
                      </span>
                      <span className="font-medium text-ink">
                        Seat {t.seatNumber} · {formatBDT(t.ticketPrice)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {b.status === 'confirmed' && (
                <motion.button
                  type="button"
                  onClick={() => handleCancel(b.id)}
                  disabled={cancellingId === b.id}
                  className="btn-secondary mt-6"
                  {...tapScale}
                >
                  {cancellingId === b.id ? 'Cancelling...' : 'Cancel booking'}
                </motion.button>
              )}
            </motion.article>
          ))}
        </motion.div>
      )}
    </div>
  );
}
