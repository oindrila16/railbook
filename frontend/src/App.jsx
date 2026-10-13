import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/LoadingSpinner';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import UserOnlyRoute from './components/UserOnlyRoute';
import HomePage from './pages/HomePage';
const SearchPage = lazy(() => import('./pages/SearchPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage'));
const OffersPage = lazy(() => import('./pages/OffersPage'));
const PricesPage = lazy(() => import('./pages/PricesPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
import AdminRoute from './components/AdminRoute';
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner label="Loading page…" />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="offers" element={<OffersPage />} />
            <Route path="prices" element={<PricesPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route
              path="book/:routeId"
              element={
                <UserOnlyRoute>
                  <BookingPage />
                </UserOnlyRoute>
              }
            />
            <Route
              path="bookings"
              element={
                <UserOnlyRoute>
                  <MyBookingsPage />
                </UserOnlyRoute>
              }
            />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="verify-otp" element={<VerifyOtpPage />} />
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
