import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/authState';
import { formatBDT } from '../utils/currency';
import { FARE_CLASSES } from '../constants/fareClasses';
import { fadeIn } from '../utils/motion';

function formatDateLabel(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function PriceCell({ fare, route, date, isAdmin }) {
  if (!fare) {
    return <span className="text-ink-faint">—</span>;
  }

  const searchUrl = `/search?source=${route.route.source}&destination=${route.route.destination}&date=${date}&passengers=1&class=${fare.class}`;

  return (
    <div className="space-y-0.5">
      <p className="font-semibold tabular-nums text-ink">{formatBDT(fare.currentPrice)}</p>
      <p className="text-[11px] text-ink-faint">
        {fare.isFull ? 'Full' : `${fare.availableSeats} seats`}
      </p>
      {isAdmin ? (
        <Link to="/admin" className="text-[11px] font-medium text-ink-muted hover:text-ink hover:underline">
          Manage
        </Link>
      ) : (
        <Link to={searchUrl} className="text-[11px] font-medium text-accent hover:underline">
          Book
        </Link>
      )}
    </div>
  );
}

export default function FareMatrix({ matrix, selectedDate, onDateChange }) {
  const { isAdmin } = useAuth();

  if (!matrix?.routes?.length) {
    return (
      <p className="card-surface p-12 text-center text-body">
        No fare data available. Start the backend and run seed.
      </p>
    );
  }

  const dates = matrix.dates || [];
  const activeDate = selectedDate || dates[0];

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {dates.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onDateChange?.(d)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
              d === activeDate
                ? 'bg-ink text-paper shadow-card'
                : 'border border-line/80 bg-paper text-ink-muted hover:border-ink/20 hover:text-ink'
            }`}
          >
            {formatDateLabel(d)}
          </button>
        ))}
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line/80 bg-paper-muted/50">
                <th className="px-5 py-4 text-caption">Route</th>
                <th className="px-5 py-4 text-caption">Train</th>
                <th className="px-5 py-4 text-caption">Departs</th>
                {FARE_CLASSES.map((c) => (
                  <th key={c.id} className="px-5 py-4 text-caption">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.routes.map((route, i) => {
                const dayPrices = route.pricesByDate?.[activeDate];
                return (
                  <motion.tr
                    key={route.routeId}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.35 }}
                    className="border-b border-line/50 transition-colors hover:bg-paper-muted/30"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">
                        {route.route.source} → {route.route.destination}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {route.route.sourceName} → {route.route.destinationName}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-ink-muted">{route.train.name}</td>
                    <td className="px-5 py-4 tabular-nums text-ink-muted">
                      {route.schedule.departureTime?.slice(0, 5)}
                    </td>
                    {FARE_CLASSES.map((c) => (
                      <td key={c.id} className="px-5 py-4">
                        <PriceCell
                          fare={dayPrices?.byClass?.[c.id]}
                          route={route}
                          date={activeDate}
                          isAdmin={isAdmin}
                        />
                      </td>
                    ))}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-ink-faint">
        Prices in {matrix.currency || 'BDT'} · dynamic fares update with demand and travel date
      </p>
    </motion.div>
  );
}
