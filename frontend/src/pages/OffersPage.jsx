import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatBDT } from '../utils/currency';
import { FARE_CLASSES } from '../constants/fareClasses';
import { getTomorrowISO, formatDateLabel } from '../utils/dates';
import { fadeUp, stagger, scaleIn } from '../utils/motion';
import { IconArrowRight } from '../components/icons/Icons';
import * as pricingService from '../services/pricingService';

export default function OffersPage() {
  const [matrix, setMatrix] = useState(null);
  const [travelDate, setTravelDate] = useState(getTomorrowISO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const nextDay = getTomorrowISO();
    pricingService
      .getFareMatrix({ days: 1, fromDate: nextDay })
      .then((data) => {
        setMatrix(data);
        setTravelDate(data.dates?.[0] || nextDay);
      })
      .catch(() => setMatrix(null))
      .finally(() => setLoading(false));
  }, []);

  const routes = matrix?.routes?.slice(0, 12) || [];

  return (
    <div className="page-container page-section">
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="max-w-2xl">
        <p className="text-caption">Offers for you</p>
        <h1 className="heading-section mt-2">Popular routes & deals</h1>
        <p className="mt-4 max-w-xl text-body">
          Promotional fares in ৳ — always below regular train prices ·{' '}
          {formatDateLabel(travelDate)}.
        </p>
        <Link to="/prices" className="link-subtle mt-4 inline-flex rounded-full px-4 py-2 hover:bg-paper-muted">
          View all prices by date
          <IconArrowRight size={16} />
        </Link>
      </motion.div>

      {loading ? (
        <LoadingSpinner label="Loading offers..." />
      ) : routes.length === 0 ? (
        <p className="card-surface mt-10 p-10 text-center text-body">No offers available right now.</p>
      ) : (
        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {routes.map((route) => {
            const dayPrices = route.pricesByDate?.[travelDate];
            const lowestOffer = dayPrices?.lowestOffer;
            const lowestRegular = dayPrices?.lowestRegular ?? dayPrices?.lowestPrice;
            const searchBase = `/search?source=${route.route.source}&destination=${route.route.destination}&date=${travelDate}&passengers=1`;

            return (
              <motion.article
                key={route.routeId}
                variants={scaleIn}
                whileHover={{ y: -5, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } }}
                className="card-surface-interactive flex flex-col p-7 sm:p-8"
              >
                <p className="text-sm font-semibold text-ink">
                  {route.route.source} → {route.route.destination}
                </p>
                <p className="mt-1 text-xs text-ink-muted">{route.train.name}</p>
                {lowestOffer != null ? (
                  <div className="mt-4">
                    <p className="text-sm text-ink-faint line-through">
                      Regular from {formatBDT(lowestRegular)}
                    </p>
                    <p className="text-xl font-semibold tracking-tight text-emerald-700">
                      Offer from {formatBDT(lowestOffer)}
                    </p>
                  </div>
                ) : (
                  lowestRegular != null && (
                    <p className="mt-4 text-xl font-semibold tracking-tight text-ink">
                      From {formatBDT(lowestRegular)}
                    </p>
                  )
                )}
                <ul className="mt-4 space-y-2 border-t border-line/60 pt-4">
                  {FARE_CLASSES.map((c) => {
                    const fare = dayPrices?.byClass?.[c.id];
                    const hasOffer = fare?.hasOffer && fare?.offerPrice != null;
                    return (
                      <li key={c.id} className="flex justify-between text-xs">
                        <span className="text-ink-muted">{c.label}</span>
                        <span className="text-right">
                          {hasOffer ? (
                            <>
                              <span className="mr-2 text-ink-faint line-through">
                                {formatBDT(fare.regularPrice)}
                              </span>
                              <span className="font-semibold tabular-nums text-emerald-700">
                                {formatBDT(fare.offerPrice)}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold tabular-nums text-ink">
                              {fare ? formatBDT(fare.currentPrice) : '—'}
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  to={searchBase}
                  className="btn-secondary mt-6 inline-flex items-center justify-center gap-2"
                >
                  Search this route
                  <IconArrowRight size={16} />
                </Link>
              </motion.article>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
