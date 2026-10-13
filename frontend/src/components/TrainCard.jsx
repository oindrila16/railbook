import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/authState';
import { formatBDT } from '../utils/currency';
import { fareClassLabel } from '../constants/fareClasses';
import { listItem, tapScale } from '../utils/motion';

function pickFare(train, fareClassId) {
  const fares = train.fares || [];
  if (!fares.length) return null;
  return fares.find((f) => f.class === fareClassId) || fares[0];
}

export default function TrainCard({ train, searchParams, liveData }) {
  const { isAdmin } = useAuth();
  const selectedClass = searchParams.fareClass || 'economy';
  const fare = pickFare(train, selectedClass);
  const liveFare = liveData?.fares?.find((f) => f.class === selectedClass);
  const availability =
    liveFare?.availability ?? liveData?.availability ?? fare?.availability ?? train.availability;
  const pricing =
    liveFare?.pricing ?? liveData?.pricing ?? fare?.pricing ?? train.pricing;

  const price = pricing?.currentPrice ?? 0;
  const available = availability?.availableSeats ?? 0;
  const isFull = availability?.isFull ?? false;
  const isLive = Boolean(liveData);
  const classLabel = fare?.label ?? fareClassLabel(selectedClass);

  const bookLink = `/book/${train.routeId}?date=${searchParams.date}&passengers=${searchParams.passengers}&class=${selectedClass}`;
  const fares = liveData?.fares || train.fares || [];

  return (
    <motion.article
      layout
      variants={listItem}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -5, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } }}
      className="card-surface-interactive group overflow-hidden"
    >
      <div className="flex flex-col gap-8 p-7 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:p-9 lg:p-10">
        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="heading-card">{train.train.name}</h3>
            <span className="badge">{train.train.number}</span>
            <span className="badge-outline">{classLabel}</span>
          </div>
          <p className="text-sm leading-relaxed text-ink-muted">
            {train.source.code} → {train.destination.code}
            <span className="mx-2.5 text-line-dark">·</span>
            {train.schedule.durationLabel}
          </p>
          <div className="flex flex-wrap gap-10 pt-0.5 sm:gap-12">
            {[
              { label: 'Departure', value: train.schedule.departureTime?.slice(0, 5) },
              { label: 'Arrival', value: train.schedule.arrivalTime?.slice(0, 5) },
              {
                label: isLive ? 'Seats · live' : 'Seats',
                value: isFull ? 'Full' : `${available} left`,
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-caption">{item.label}</p>
                <p className="mt-1.5 text-base font-semibold tabular-nums text-ink">{item.value}</p>
              </div>
            ))}
          </div>

          {fares.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {fares.map((f) => (
                <span
                  key={f.class}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-300 ${
                    f.class === selectedClass
                      ? 'bg-ink text-paper shadow-card'
                      : 'bg-paper-muted text-ink-muted'
                  }`}
                >
                  {f.label}: {formatBDT(f.currentPrice ?? f.pricing?.currentPrice)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-5 border-t border-line/60 pt-7 sm:items-end sm:border-l sm:border-t-0 sm:pl-10 sm:pt-0 lg:pl-12">
          <div className="text-left sm:text-right">
            <p className="text-caption">{classLabel}</p>
            <p className="mt-1.5 text-3xl font-semibold tracking-tight text-ink lg:text-[2rem]">
              {formatBDT(price)}
            </p>
            <p className="mt-1 text-xs text-ink-faint">per seat</p>
          </div>
          {isAdmin ? (
            <Link to="/admin" className="btn-secondary w-full sm:min-w-[9.5rem]">
              Manage in admin
            </Link>
          ) : (
            <motion.div {...tapScale} className="w-full sm:w-auto">
              <Link
                to={bookLink}
                state={{ train, searchParams, fareClass: selectedClass }}
                className="btn-primary w-full sm:min-w-[9.5rem]"
              >
                {isFull ? 'Join waitlist' : 'Book now'}
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
