import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SearchCard from '../components/SearchCard';
import { IconArrowRight } from '../components/icons/Icons';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatBDT } from '../utils/currency';
import { FARE_CLASSES } from '../constants/fareClasses';
import { getTomorrowISO, formatDateLabel } from '../utils/dates';
import { fadeUp, stagger, scaleIn, springSoft } from '../utils/motion';
import { FALLBACK_STATIONS } from '../data/fallbackStations';
import * as trainService from '../services/trainService';
import * as pricingService from '../services/pricingService';
import ErrorAlert from '../components/ErrorAlert';
import {
  StickerTrain,
  StickerShield,
  StickerTag,
  StickerSupport,
} from '../components/icons/StickerIcons';
import CharacterSpot from '../components/characters/CharacterSpot';
import { TravelerWaving } from '../components/characters/CartoonCharacters';
import EmptyStateCard from '../components/characters/EmptyStateCard';

const features = [
  { title: 'Live Tracking', desc: 'Real-time seat availability', Icon: StickerTrain },
  { title: 'Secure Booking', desc: 'Verified accounts & checkout', Icon: StickerShield },
  { title: 'Best Prices', desc: 'Smart dynamic fares in ৳', Icon: StickerTag },
  { title: '24/7 Support', desc: 'Help whenever you travel', Icon: StickerSupport },
];

function pickTopRoutesForDate(routes, travelDate, limit = 4) {
  return routes
    .filter((r) => r.pricesByDate?.[travelDate])
    .sort((a, b) => {
      const pa = a.pricesByDate[travelDate].lowestPrice ?? Number.MAX_SAFE_INTEGER;
      const pb = b.pricesByDate[travelDate].lowestPrice ?? Number.MAX_SAFE_INTEGER;
      return pa - pb;
    })
    .slice(0, limit);
}

export default function HomePage() {
  const [stations, setStations] = useState(FALLBACK_STATIONS);
  const [topRoutes, setTopRoutes] = useState([]);
  const [travelDate, setTravelDate] = useState(getTomorrowISO);
  const [loading, setLoading] = useState(true);
  const [stationsNotice, setStationsNotice] = useState('');

  const loadTopRoutes = useCallback(() => {
    const nextDay = getTomorrowISO();
    return Promise.all([
      trainService.getStations(),
      pricingService.getFareMatrix({ days: 1, fromDate: nextDay }).catch(() => null),
    ]).then(([stations, matrix]) => {
      setStations(stations.length > 0 ? stations : FALLBACK_STATIONS);
      setTravelDate(nextDay);
      setStationsNotice(trainService.stationsLoadedFromApi() ? '' : 'We could not load stations right now. Please try again later.');
      setTopRoutes(pickTopRoutesForDate(matrix?.routes || [], nextDay));
    }).catch(() => {
      setStations(FALLBACK_STATIONS);
      setTopRoutes([]);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTopRoutes();
  }, [loadTopRoutes]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        const current = getTomorrowISO();
        if (current !== travelDate) {
          setLoading(true);
          loadTopRoutes();
        }
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [travelDate, loadTopRoutes]);

  return (
    <div className="overflow-x-hidden">
      <section className="page-container relative pb-20 pt-14 sm:pb-28 sm:pt-20 lg:pt-24">
        <CharacterSpot
          className="absolute -left-2 top-8 hidden opacity-90 lg:block xl:left-4"
          float
          delay={0.2}
        >
          <TravelerWaving size={100} />
        </CharacterSpot>
        <CharacterSpot
          className="absolute -right-2 top-16 hidden opacity-90 lg:block xl:right-4"
          float
          delay={0.35}
        >
          <TravelerWaving size={88} className="scale-x-[-1]" />
        </CharacterSpot>

        <motion.div
          className="relative mx-auto max-w-3xl text-center"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <motion.p
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, ...springSoft }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-line/80 bg-paper/95 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted shadow-inner backdrop-blur-sm"
          >
            Your journey, our priority <span aria-hidden>♥</span>
          </motion.p>
          <h1 className="heading-display text-[2.35rem] sm:text-display">
            Explore Bangladesh with RailBook
          </h1>
          <p className="mx-auto mt-5 max-w-md text-body">
            Safe, comfortable & easy train bookings
          </p>
        </motion.div>

        <div className="mx-auto mt-12 w-full min-w-0 max-w-6xl sm:mt-14 lg:mt-16">
          <ErrorAlert message={stationsNotice} onDismiss={() => setStationsNotice('')} />
          <SearchCard stations={stations} stationsLoading={loading} />

          <motion.div
            className="mt-10 grid grid-cols-2 gap-8 rounded-4xl border border-line/50 bg-paper/90 px-6 py-8 shadow-card backdrop-blur-sm sm:grid-cols-4 sm:gap-6 sm:px-10 sm:py-9"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={scaleIn}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.28 }}
                className="text-center sm:text-left"
              >
                <f.Icon size={32} className="text-ink-muted" />
                <p className="mt-3 text-sm font-semibold text-ink">{f.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="page-container section-spacing-sm pb-28 lg:pb-32">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 sm:mb-12">
          <div>
            <p className="text-caption">Offers for you</p>
            <h2 className="heading-section mt-2">Top routes</h2>
            {travelDate && (
              <p className="mt-1 text-sm text-ink-muted">
                Tomorrow · {formatDateLabel(travelDate)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/prices" className="link-subtle rounded-full px-4 py-2 hover:bg-paper-muted">
              All prices
              <IconArrowRight size={16} />
            </Link>
            <Link to="/offers" className="link-subtle rounded-full px-4 py-2 hover:bg-paper-muted">
              Offers
              <IconArrowRight size={16} />
            </Link>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : topRoutes.length === 0 ? (
          <EmptyStateCard
            title="No routes to show yet"
            message="Search trains above to explore fares and popular journeys across Bangladesh."
            mood="happy"
          />
        ) : (
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            {topRoutes.map((route) => {
              const dayPrices = route.pricesByDate?.[travelDate];
              const searchUrl = `/search?source=${encodeURIComponent(route.route.source)}&destination=${encodeURIComponent(route.route.destination)}&date=${travelDate}&passengers=1&class=economy`;

              return (
                <motion.article
                  key={route.routeId}
                  variants={scaleIn}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="card-surface-interactive relative rounded-3xl p-6 sm:p-7"
                >
                  <p className="text-sm font-semibold text-ink">
                    {route.route.source} → {route.route.destination}
                  </p>
                  <p className="mt-2 text-xs text-ink-muted">{route.train.name}</p>
                  {dayPrices?.lowestPrice != null && (
                    <p className="mt-4 text-lg font-semibold text-ink">
                      From {formatBDT(dayPrices.lowestPrice)}
                    </p>
                  )}
                  <ul className="mt-3 space-y-1">
                    {FARE_CLASSES.map((c) => {
                      const fare = dayPrices?.byClass?.[c.id];
                      return (
                        <li key={c.id} className="flex justify-between text-[11px]">
                          <span className="text-ink-faint">{c.label}</span>
                          <span className="font-medium tabular-nums text-ink-muted">
                            {fare ? formatBDT(fare.currentPrice) : '—'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <Link
                    to={searchUrl}
                    className="btn-secondary relative z-10 mt-5 w-full justify-center text-xs"
                  >
                    Search trains
                    <IconArrowRight size={14} />
                  </Link>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </section>
    </div>
  );
}
