import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authState';
import LoadingSpinner from './LoadingSpinner';

/** Logged-in customers only — admins are redirected to the admin panel. */
export default function UserOnlyRoute({ children }) {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}
