import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AuthCard from '../components/AuthCard';
import ErrorAlert from '../components/ErrorAlert';
import { tapScale } from '../utils/motion';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login({ email, password });
      const dest =
        result.user?.role === 'admin' || result.user?.isAdmin ? '/admin' : from;
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Customers book tickets · Admins manage trains in the control panel">
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="label-field">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label-field">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            autoComplete="current-password"
          />
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
          {...tapScale}
        >
          {loading ? 'Signing in...' : 'Login'}
        </motion.button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        No account?{' '}
        <Link to="/register" className="font-medium text-ink underline-offset-2 hover:underline">
          Register
        </Link>
      </p>
    </AuthCard>
  );
}
