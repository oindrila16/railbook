import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAsyncResource } from '../hooks/useAsyncResource';
import BackLink from '../components/BackLink';
import { motion } from 'framer-motion';
import TrainCard from '../components/TrainCard';
import SearchCard from '../components/SearchCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SectionHeader from '../components/SectionHeader';
import { FALLBACK_STATIONS } from '../data/fallbackStations';
import * as trainService from '../services/trainService';
import { useSeatAvailability } from '../hooks/useSeatAvailability';
import LiveBadge from '../components/LiveBadge';
import { fadeUpTight, stagger } from '../utils/motion';
import EmptyStateCard from '../components/characters/EmptyStateCard';
import { BenchTraveler } from '../components/characters/CartoonCharacters';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || '';
  const destination = searchParams.get('destination') || '';
  const date = searchParams.get('date') || '';
  const passengers = searchParams.get('passengers') || '1';
  const fareClass = searchParams.get('class') || 'economy';

  const [stations, setStations] = useState(FALLBACK_STATIONS);
  const [dismissedError, setDismissedError] = useState('');
  const hasQuery = Boolean(source && destination && date);
  useEffect(() => {
    trainService.getStations().then((list) => setStations(list.length > 0 ? list : FALLBACK_STATIONS));
  }, []);
  const loader = useCallback(() => hasQuery
    ? trainService.searchTrains({ source, destination, date, fareClass })
    : Promise.resolve(null), [source, destination, date, fareClass, hasQuery]);
  const { data: results, loading, error: requestError } = useAsyncResource(loader);
  const error = requestError === dismissedError ? '' : requestError;

  const searchQuery = { source, destination, date, passengers, fareClass };
  const trains = results?.trains ?? [];
  const routeIds = trains.map((t) => t.routeId);
  const { liveByRoute, connected } = useSeatAvailability(routeIds, date, fareClass);

  const subtitle = !hasQuery
    ? 'Modify your search below'
    : results?.query
      ? `${results.query.sourceName} (${results.query.source}) → ${results.query.destinationName} (${results.query.destination}) · ${results.query.date}`
      : `${source} → ${destination} · ${date}`;

  return (
    <div className="page-container page-section">
      <motion.div variants={fadeUpTight} initial="hidden" animate="visible" className="content-stack-sm">
        <BackLink to="/">Back to home</BackLink>
        <SectionHeader className="!mb-0" title="Search results" subtitle={subtitle} />
      </motion.div>

      <div className="mt-10 sm:mt-12">
        <SearchCard key={searchParams.toString()} stations={stations} compact />
      </div>

      <div className="mt-10 sm:mt-12">
        <ErrorAlert message={error} onDismiss={() => setDismissedError(requestError)} />
      </div>

      {!hasQuery ? (
        <EmptyStateCard
          title="Ready when you are"
          message="Enter stations and a travel date above — we'll find trains for your journey."
          character={<BenchTraveler size={88} />}
        />
      ) : loading ? (
        <LoadingSpinner label="Searching trains..." />
      ) : trains.length === 0 ? (
        <EmptyStateCard
          title={error ? 'Something went wrong' : 'No trains on this route'}
          message={
            error
              ? 'Could not load trains. Check that the backend is running, then try again.'
              : 'No trains found for this route. Try different stations or dates.'
          }
          mood="curious"
        />
      ) : (
        <motion.div
          className="content-stack mt-10 sm:mt-12"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-wrap items-center gap-4 pb-1">
            <p className="text-sm text-ink-muted">
              {results?.count ?? trains.length} train(s) found
            </p>
            <LiveBadge connected={connected} />
          </div>
          {trains.map((train) => (
            <TrainCard
              key={train.routeId}
              train={train}
              searchParams={searchQuery}
              liveData={liveByRoute[train.routeId]}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
