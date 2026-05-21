import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { formatBDT } from '../utils/currency';
import * as adminService from '../services/adminService';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'trains', label: 'Train prices' },
  { id: 'routes', label: 'Routes & timings' },
];

function StatCard({ label, value }) {
  return (
    <div className="card-surface p-6">
      <p className="text-caption">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [trains, setTrains] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editTrainId, setEditTrainId] = useState(null);
  const [editTrainPrice, setEditTrainPrice] = useState('');
  const [editRouteId, setEditRouteId] = useState(null);
  const [routeForm, setRouteForm] = useState({});

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      adminService.getStats(),
      adminService.getBookings(15),
      adminService.getTrains(),
      adminService.getRoutes(),
    ])
      .then(([s, b, t, r]) => {
        setStats(s);
        setBookings(b.bookings || []);
        setTrains(t.trains || []);
        setRoutes(r.routes || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const saveTrainPrice = async (trainId) => {
    try {
      const updated = await adminService.updateTrain(trainId, {
        basePrice: parseFloat(editTrainPrice),
      });
      setEditTrainId(null);
      setSuccess(
        updated.fareSync
          ? `Train prices synced to ${updated.fareSync.routesUpdated} route(s) on the user site.`
          : 'Train updated.'
      );
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditRoute = (route) => {
    setEditRouteId(route.routeId);
    setRouteForm({
      departureTime: route.schedule.departureTime,
      arrivalTime: route.schedule.arrivalTime,
      economyPrice: String(route.economyPrice),
      isActive: route.isActive,
    });
  };

  const saveRoute = async (routeId) => {
    try {
      await adminService.updateRoute(routeId, {
        departureTime: routeForm.departureTime,
        arrivalTime: routeForm.arrivalTime,
        economyPrice: parseFloat(routeForm.economyPrice),
        isActive: routeForm.isActive,
      });
      setEditRouteId(null);
      setSuccess('Route updated on the user site (times, price, visibility).');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <LoadingSpinner label="Loading admin panel..." />;

  return (
    <div className="page-container page-section">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-caption">Admin — manage only</p>
          <h1 className="heading-section mt-1">RailBook control panel</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-muted">
            Admins cannot book tickets. Changes here update search, offers, prices, and booking
            for customers immediately.
          </p>
        </div>
        <Link to="/search" className="btn-secondary">
          View user site
        </Link>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />
      {success && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-5 py-4 text-sm text-emerald-900">
          {success}
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-ink text-paper' : 'bg-paper-muted text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Users" value={stats.users} />
            <StatCard label="Confirmed bookings" value={stats.confirmedBookings} />
            <StatCard label="Revenue" value={formatBDT(stats.revenueBDT)} />
            <StatCard label="Active routes" value={stats.activeRoutes} />
          </div>
          <section className="mt-12">
            <h2 className="heading-card text-lg">Recent customer bookings</h2>
            <div className="card-surface mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-caption">
                    <th className="p-4">Ref</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Train</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-line/60">
                      <td className="p-4 font-medium">{b.bookingReference}</td>
                      <td className="p-4 text-ink-muted">{b.userEmail}</td>
                      <td className="p-4">{b.trainName}</td>
                      <td className="p-4">{b.travelDate}</td>
                      <td className="p-4 tabular-nums">{formatBDT(b.totalAmount)}</td>
                      <td className="p-4 capitalize">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === 'trains' && (
        <section>
          <h2 className="heading-card text-lg">Train base prices</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Updates economy / business / first fares on every route for that train.
          </p>
          <div className="card-surface mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-caption">
                  <th className="p-4">Train</th>
                  <th className="p-4">Economy</th>
                  <th className="p-4">Business</th>
                  <th className="p-4">First</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {trains.map((t) => {
                  const economy = t.fares?.find((f) => f.fareClass === 'economy');
                  const business = t.fares?.find((f) => f.fareClass === 'business');
                  const first = t.fares?.find((f) => f.fareClass === 'first');
                  return (
                    <tr key={t.id} className="border-b border-line/60">
                      <td className="p-4">
                        <span className="font-medium">{t.name}</span>
                        <span className="ml-2 text-ink-muted">({t.number})</span>
                      </td>
                      <td className="p-4">
                        {editTrainId === t.id ? (
                          <input
                            type="number"
                            min={1}
                            value={editTrainPrice}
                            onChange={(e) => setEditTrainPrice(e.target.value)}
                            className="input-field w-28 py-2"
                          />
                        ) : (
                          formatBDT(economy?.basePrice ?? t.basePrice)
                        )}
                      </td>
                      <td className="p-4 text-ink-muted">{formatBDT(business?.basePrice ?? 0)}</td>
                      <td className="p-4 text-ink-muted">{formatBDT(first?.basePrice ?? 0)}</td>
                      <td className="p-4">
                        {editTrainId === t.id ? (
                          <button
                            type="button"
                            className="btn-primary py-2 text-xs"
                            onClick={() => saveTrainPrice(t.id)}
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-secondary py-2 text-xs"
                            onClick={() => {
                              setEditTrainId(t.id);
                              setEditTrainPrice(String(t.basePrice));
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'routes' && (
        <section>
          <h2 className="heading-card text-lg">Routes, timings & per-route prices</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Departure/arrival times and economy price apply to this route only. Inactive routes
            are hidden from search.
          </p>
          <div className="card-surface mt-4 overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-caption">
                  <th className="p-4">Route</th>
                  <th className="p-4">Train</th>
                  <th className="p-4">Depart</th>
                  <th className="p-4">Arrive</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Economy</th>
                  <th className="p-4">Active</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r.routeId} className="border-b border-line/60">
                    <td className="p-4 font-medium">
                      {r.route.source} → {r.route.destination}
                    </td>
                    <td className="p-4 text-ink-muted">{r.train.name}</td>
                    <td className="p-4">
                      {editRouteId === r.routeId ? (
                        <input
                          type="time"
                          value={routeForm.departureTime}
                          onChange={(e) =>
                            setRouteForm((f) => ({ ...f, departureTime: e.target.value }))
                          }
                          className="input-field w-28 py-2"
                        />
                      ) : (
                        r.schedule.departureTime
                      )}
                    </td>
                    <td className="p-4">
                      {editRouteId === r.routeId ? (
                        <input
                          type="time"
                          value={routeForm.arrivalTime}
                          onChange={(e) =>
                            setRouteForm((f) => ({ ...f, arrivalTime: e.target.value }))
                          }
                          className="input-field w-28 py-2"
                        />
                      ) : (
                        r.schedule.arrivalTime
                      )}
                    </td>
                    <td className="p-4 text-ink-muted">{r.schedule.durationLabel}</td>
                    <td className="p-4">
                      {editRouteId === r.routeId ? (
                        <input
                          type="number"
                          min={1}
                          value={routeForm.economyPrice}
                          onChange={(e) =>
                            setRouteForm((f) => ({ ...f, economyPrice: e.target.value }))
                          }
                          className="input-field w-24 py-2"
                        />
                      ) : (
                        formatBDT(r.economyPrice)
                      )}
                    </td>
                    <td className="p-4">
                      {editRouteId === r.routeId ? (
                        <select
                          value={routeForm.isActive ? '1' : '0'}
                          onChange={(e) =>
                            setRouteForm((f) => ({
                              ...f,
                              isActive: e.target.value === '1',
                            }))
                          }
                          className="input-field w-24 py-2"
                        >
                          <option value="1">Yes</option>
                          <option value="0">No</option>
                        </select>
                      ) : r.isActive ? (
                        'Yes'
                      ) : (
                        'No'
                      )}
                    </td>
                    <td className="p-4">
                      {editRouteId === r.routeId ? (
                        <button
                          type="button"
                          className="btn-primary py-2 text-xs"
                          onClick={() => saveRoute(r.routeId)}
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-secondary py-2 text-xs"
                          onClick={() => startEditRoute(r)}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
