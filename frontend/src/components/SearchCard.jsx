import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeUp, tapScale, springSoft } from '../utils/motion';
import SelectField from './SelectField';
import { IconSearch, IconSwap } from './icons/Icons';
import { StickerTrain, StickerTicket, StickerLive, StickerSeat } from './icons/StickerIcons';
import { FARE_CLASSES, DEFAULT_FARE_CLASS } from '../constants/fareClasses';
import { getTomorrowISO, getTodayISO } from '../utils/dates';
import PnrStatusPanel from './search/PnrStatusPanel';
import LiveStatusPanel from './search/LiveStatusPanel';
import SeatAvailabilityPanel from './search/SeatAvailabilityPanel';

const TABS = [
  { id: 'search', label: 'Search', Icon: StickerTrain },
  { id: 'pnr', label: 'PNR', Icon: StickerTicket },
  { id: 'live', label: 'Live', Icon: StickerLive },
  { id: 'seat', label: 'Seats', Icon: StickerSeat },
];

const SEARCH_LABEL = 'search-field-label';

export default function SearchCard({ stations = [], compact = false, stationsLoading = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('search');
  const [form, setForm] = useState({
    source: '',
    destination: '',
    date: getTomorrowISO(),
    passengers: 1,
    fareClass: DEFAULT_FARE_CLASS,
  });

  useEffect(() => {
    if (!compact) return;
    const source = searchParams.get('source');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const fareClass = searchParams.get('class');
    const passengers = searchParams.get('passengers');
    if (!source && !destination && !date) return;
    setForm((f) => ({
      ...f,
      ...(source ? { source } : {}),
      ...(destination ? { destination } : {}),
      ...(date ? { date } : {}),
      ...(fareClass ? { fareClass } : {}),
      ...(passengers ? { passengers: Number(passengers) || 1 } : {}),
    }));
  }, [compact, searchParams.toString()]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!form.source || !form.destination || !form.date) return;
    const params = new URLSearchParams({
      source: form.source,
      destination: form.destination,
      date: form.date,
      passengers: String(form.passengers),
      class: form.fareClass,
    });
    navigate(`/search?${params.toString()}`);
  };

  const swapStations = () => {
    setForm((f) => ({ ...f, source: f.destination, destination: f.source }));
  };

  const dateLabel = form.date
    ? new Date(form.date + 'T12:00:00').toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={`search-card ${compact ? 'search-card--compact' : ''}`}
    >
      {!compact && (
        <div className="search-tabs" role="tablist" aria-label="Booking tools">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`search-tab ${isActive ? 'search-tab--active' : ''}`}
              >
                {isActive && (
                  <motion.span
                    layoutId="search-tab-pill"
                    className="search-tab-pill"
                    transition={springSoft}
                  />
                )}
                <tab.Icon
                  size={22}
                  className={`search-tab-icon shrink-0 ${isActive ? 'text-paper' : 'text-ink-muted'}`}
                />
                <span className="search-tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="search-card-body">
        {activeTab === 'search' && (
          <motion.form
            onSubmit={handleSearchSubmit}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="search-form"
          >
            <div className="search-fields-shell">
              <div className="search-form-grid">
                <div className="search-field-tile relative z-[1] lg:order-1">
                  <SelectField
                    id="search-from-station"
                    label="From"
                    labelClassName={SEARCH_LABEL}
                    selectSize="search"
                    required
                    disabled={stationsLoading && stations.length === 0}
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                  >
                    <option value="">
                      {stationsLoading ? 'Loading...' : 'Select station'}
                    </option>
                    {stations.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </SelectField>
                </div>

                <div className="search-field-tile relative z-[1] lg:order-3">
                  <SelectField
                    id="search-to-station"
                    label="To"
                    labelClassName={SEARCH_LABEL}
                    selectSize="search"
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

                <div className="search-swap-wrap relative z-[2] lg:order-2">
                  <motion.button
                    type="button"
                    onClick={swapStations}
                    whileHover={{ scale: 1.08, rotate: 180 }}
                    whileTap={{ scale: 0.92 }}
                    className="search-swap-btn relative z-[2]"
                    aria-label="Swap stations"
                  >
                    <IconSwap size={18} />
                  </motion.button>
                </div>

                <div className="search-field-tile lg:order-4">
                  <label className={SEARCH_LABEL}>Travel date</label>
                  <input
                    type="date"
                    required
                    min={getTodayISO()}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="search-date-input mt-2 w-full min-w-0 border-0 bg-transparent p-0 font-semibold text-ink outline-none"
                  />
                  {dateLabel && <p className="search-date-hint">{dateLabel}</p>}
                </div>

                <div className="search-field-tile lg:order-5">
                  <SelectField
                    id="search-passengers"
                    label="Passengers"
                    labelClassName={SEARCH_LABEL}
                    selectSize="search"
                    value={form.passengers}
                    onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n === 1 ? '1 passenger' : `${n} passengers`}
                      </option>
                    ))}
                  </SelectField>
                </div>

                <div className="search-field-tile relative z-[1] lg:order-6">
                  <SelectField
                    id="search-fare-class"
                    label="Class"
                    labelClassName={SEARCH_LABEL}
                    selectSize="search"
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

            <motion.button type="submit" className="btn-search" {...tapScale}>
              <IconSearch size={20} />
              Search trains
            </motion.button>
          </motion.form>
        )}

        {activeTab === 'pnr' && <PnrStatusPanel />}
        {activeTab === 'live' && <LiveStatusPanel />}
        {activeTab === 'seat' && (
          <SeatAvailabilityPanel stations={stations} stationsLoading={stationsLoading} />
        )}
      </div>
    </motion.div>
  );
}
