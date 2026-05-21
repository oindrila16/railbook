import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import FareMatrix from '../components/FareMatrix';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import SectionHeader from '../components/SectionHeader';
import * as pricingService from '../services/pricingService';
import { getTomorrowISO } from '../utils/dates';
import { fadeUpTight } from '../utils/motion';

export default function PricesPage() {
  const defaultFrom = getTomorrowISO();

  const [days, setDays] = useState(7);
  const [matrix, setMatrix] = useState(null);
  const [selectedDate, setSelectedDate] = useState(defaultFrom);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    pricingService
      .getFareMatrix({ days, fromDate: defaultFrom })
      .then((data) => {
        setMatrix(data);
        if (data.dates?.length && !data.dates.includes(selectedDate)) {
          setSelectedDate(data.dates[0]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [days, defaultFrom]);

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
        <ErrorAlert message={error} onDismiss={() => setError('')} />
      </div>

      {loading ? (
        <LoadingSpinner label="Loading fares..." />
      ) : (
        <div className="mt-6">
          <FareMatrix
            matrix={matrix}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>
      )}
    </div>
  );
}
