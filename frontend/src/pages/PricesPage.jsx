import { useCallback, useState } from 'react';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { motion } from 'framer-motion';
import FareMatrix from '../components/FareMatrix';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SectionHeader from '../components/SectionHeader';
import * as pricingService from '../services/pricingService';
import { getTomorrowISO } from '../utils/dates';
import { fadeUpTight } from '../utils/motion';

export default function PricesPage() {
  const [defaultFrom] = useState(getTomorrowISO);

  const [days, setDays] = useState(7);
  const [selectedDate, setSelectedDate] = useState(defaultFrom);
  const [dismissedError, setDismissedError] = useState('');
  const loader = useCallback(() => pricingService.getFareMatrix({ days, fromDate: defaultFrom }), [days, defaultFrom]);
  const { data: matrix, loading, error: requestError } = useAsyncResource(loader);
  const error = requestError === dismissedError ? '' : requestError;
  const displayedDate = matrix?.dates?.includes(selectedDate) ? selectedDate : matrix?.dates?.[0] || selectedDate;

  return (
    <div className="page-container page-section">
      <motion.div variants={fadeUpTight} initial="hidden" animate="visible">
        <SectionHeader
          title="Fare guide"
          subtitle="Compare Economy, Business, and First Class prices across all routes and upcoming travel dates."
        />
      </motion.div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3 text-sm text-ink-muted">
          <span className="text-caption">Show</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="input-field w-auto min-w-[7rem] py-2.5"
          >
            {[3, 7, 14].map((n) => (
              <option key={n} value={n}>
                {n} days
              </option>
            ))}
          </select>
        </label>
        {matrix && (
          <span className="text-sm text-ink-muted">
            {matrix.routeCount} routes · {matrix.dates?.length} dates
          </span>
        )}
      </div>

      <div className="mt-8">
        <ErrorAlert message={error} onDismiss={() => setDismissedError(requestError)} />
      </div>

      {loading ? (
        <LoadingSpinner label="Loading fares..." />
      ) : (
        <div className="mt-6">
          <FareMatrix
            matrix={matrix}
            selectedDate={displayedDate}
            onDateChange={setSelectedDate}
          />
        </div>
      )}
    </div>
  );
}
