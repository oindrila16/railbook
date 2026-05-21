import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import UserOnlyRoute from './components/UserOnlyRoute';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import BookingPage from './pages/BookingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import OffersPage from './pages/OffersPage';
import PricesPage from './pages/PricesPage';
import HelpPage from './pages/HelpPage';
import AdminRoute from './components/AdminRoute';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
