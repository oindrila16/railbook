import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import BackLink from '../components/BackLink';
import { motion } from 'framer-motion';
import ErrorAlert from '../components/ErrorAlert';
import { formatBDT } from '../utils/currency';
import { fareClassLabel, DEFAULT_FARE_CLASS } from '../constants/fareClasses';
import { fadeUpTight } from '../utils/motion';
import * as bookingService from '../services/bookingService';
import * as pricingService from '../services/pricingService';
import EmptyStateCard from '../components/characters/EmptyStateCard';
import CharacterSpot from '../components/characters/CharacterSpot';
import { TicketMascot } from '../components/characters/CartoonCharacters';
import TrainSeatMap from '../components/TrainSeatMap';

const GENDERS = ['male', 'female', 'other'];

export default function BookingPage() {
  const { routeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const train = location.state?.train;
  const date = searchParams.get('date') || '';
  const passengerCount = Math.max(1, parseInt(searchParams.get('passengers') || '1', 10));
  const fareClass =
    searchParams.get('class') ||
    location.state?.fareClass ||
    location.state?.searchParams?.fareClass ||
    DEFAULT_FARE_CLASS;

  const selectedFare =
    train?.fares?.find((f) => f.class === fareClass) ||
    train?.fares?.[0] ||
    null;

  const [passengers, setPassengers] = useState(
    Array.from({ length: passengerCount }, () => ({
      name: '',
      age: '',
      gender: 'male',
    }))
  );
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [livePricing, setLivePricing] = useState(null);

  const rid = parseInt(routeId, 10);

  useEffect(() => {
    if (!Number.isFinite(rid) || rid < 1 || !date) return;

    pricingService
      .getPriceQuote({
        routeId: rid,
        travelDate: date,
        passengers: passengers.length,
        fareClass,
      })
      .then((quote) => setLivePricing(quote?.pricing ?? null))
      .catch(() => setLivePricing(null));
  }, [rid, date, fareClass, passengers.length]);

  const pricePerSeat =
    livePricing?.currentPrice ??
    selectedFare?.pricing?.currentPrice ??
    selectedFare?.currentPrice ??
    train?.pricing?.currentPrice ??
    0;
  const total = livePricing?.totalAmount ?? pricePerSeat * passengers.length;

  if (!train) {
    return (
      <div className="page-container page-section-sm">
        <EmptyStateCard
          title="Train not found"
          message="Train details are missing. Head back to search and pick a train again."
          mood="curious"
        >
          <Link to="/search" className="btn-primary mt-2 inline-flex">
            Search trains
          </Link>
        </EmptyStateCard>
      </div>
    );
  }

  const updatePassenger = (index, field, value) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const validateForm = () => {
    if (!date) {
      return 'Travel date is missing. Go back to search and select a train again.';
    }

    const rid = parseInt(routeId, 10);
    if (!Number.isFinite(rid) || rid < 1) {
      return 'Invalid route. Go back to search and select a train again.';
    }

    for (let i = 0; i < passengers.length; i += 1) {
      const p = passengers[i];
      if (!p.name.trim()) {
        return `Please enter the full name for passenger ${i + 1}.`;
      }
      const age = parseInt(String(p.age), 10);
      if (!Number.isFinite(age) || age < 1 || age > 120) {
        return `Please enter a valid age (1–120) for passenger ${i + 1}.`;
      }
    }

    if (
      selectedSeats.length > 0 &&
      selectedSeats.length !== passengers.length
    ) {
      return `Select ${passengers.length} seat${passengers.length > 1 ? 's' : ''} (one per passenger), or clear all seats for auto-assign.`;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        routeId: parseInt(routeId, 10),
        travelDate: date,
        fareClass,
        passengers: passengers.map((p, i) => ({
          name: p.name.trim(),
          age: parseInt(String(p.age), 10),
          gender: p.gender,
          ...(selectedSeats[i] ? { seatNumber: selectedSeats[i] } : {}),
        })),
      };

      const result = await bookingService.createBooking(payload);

      if (result.status === 'waitlisted') {
        navigate('/bookings', {
          state: { message: 'Added to waitlist — you will be notified when a seat opens.' },
        });
      } else {
        navigate('/bookings', {
          state: {
            message: `Booking confirmed! Ref: ${result.booking?.bookingReference || 'see My Bookings'}`,
          },
        });
      }
    } catch (err) {
      const detail =
        err.errors?.map((x) => x.message).filter(Boolean).join(' ') || '';
      setError(detail ? `${err.message} ${detail}` : err.message);
    } finally {
      setLoading(false);
    }
  };

  const backUrl = `/search?source=${train.source.code}&destination=${train.destination.code}&date=${date}&passengers=${passengerCount}&class=${fareClass}`;

  return (
    <div className="page-container page-section">
      <motion.div variants={fadeUpTight} initial="hidden" animate="visible" className="mx-auto max-w-4xl content-stack">
        <BackLink to={backUrl}>Back to results</BackLink>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="heading-section">Confirm booking</h1>
          <CharacterSpot className="hidden sm:block" float delay={0.12}>
            <TicketMascot size={64} mood="happy" />
          </CharacterSpot>
        </div>

        <div className="card-surface p-8 sm:p-9">
          <h2 className="heading-card">{train.train.name}</h2>
          <p className="mt-2 text-sm text-ink-muted">
            {train.source.code} → {train.destination.code} · {date} ·{' '}
            {train.schedule.departureTime?.slice(0, 5)} – {train.schedule.arrivalTime?.slice(0, 5)}
            <span className="mx-2 text-line-dark">·</span>
            <span className="badge-outline inline-flex">{fareClassLabel(fareClass)}</span>
          </p>
          {train.fares?.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {train.fares.map((f) => (
                <span
                  key={f.class}
                  className="rounded-full bg-paper-muted px-3 py-1 text-xs text-ink-muted"
                >
                  {f.label}: {formatBDT(f.pricing?.currentPrice ?? f.currentPrice)}
                </span>
              ))}
            </div>
          )}
        </div>

        <TrainSeatMap
          routeId={parseInt(routeId, 10)}
          travelDate={date}
          fareClass={fareClass}
          maxSeats={passengers.length}
          selectedSeats={selectedSeats}
          onSelectionChange={setSelectedSeats}
        />

        <form onSubmit={handleSubmit} noValidate className="content-stack">
          <h3 className="text-caption">Passenger details</h3>

          {passengers.map((p, i) => (
            <div key={i} className="card-surface rounded-3xl bg-paper-muted/30 p-7 sm:p-8">
              <p className="mb-6 text-sm font-semibold text-ink">Passenger {i + 1}</p>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label-field">Full name</label>
                  <input
                    required
                    value={p.name}
                    onChange={(e) => updatePassenger(i, 'name', e.target.value)}
                    className="input-field"
                    placeholder="As on ID"
                  />
                </div>
                <div>
                  <label className="label-field">Age</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={p.age}
                    onChange={(e) => updatePassenger(i, 'age', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">Gender</label>
                  <select
                    value={p.gender}
                    onChange={(e) => updatePassenger(i, 'gender', e.target.value)}
                    className="input-field"
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <div className="relative overflow-hidden rounded-4xl bg-ink p-8 text-paper shadow-soft sm:p-9">
            <CharacterSpot className="absolute bottom-3 right-4 opacity-95" float delay={0.2}>
              <TicketMascot size={52} mood="happy" />
            </CharacterSpot>
            <div className="relative flex justify-between text-sm opacity-90">
              <span>
                {formatBDT(pricePerSeat)} × {passengers.length} seat(s)
              </span>
              <span className="text-ink-faint/80">Dynamic price</span>
            </div>
            <div className="mt-6 flex items-end justify-between border-t border-paper/20 pt-6">
              <span className="font-medium">Total</span>
              <span className="text-3xl font-semibold tracking-tight">{formatBDT(total)}</span>
            </div>
          </div>

          <ErrorAlert message={error} onDismiss={() => setError('')} />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4"
          >
            {loading ? 'Processing…' : 'Confirm booking'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
