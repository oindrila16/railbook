import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as authService from '../services/authService';
import { setPendingEmail } from '../utils/auth';
import AuthCard from '../components/AuthCard';
import ErrorAlert from '../components/ErrorAlert';
import { tapScale } from '../utils/motion';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.register(form);
      setPendingEmail(form.email);
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Create account" subtitle="Register to start booking train tickets">
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="label-field">Full name</label>
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="label-field">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="label-field">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input-field"
            placeholder="Min 8 chars, letter + number"
          />
        </div>
        <motion.button type="submit" disabled={loading} className="btn-primary w-full" {...tapScale}>
          {loading ? 'Creating...' : 'Register'}
        </motion.button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-ink underline-offset-2 hover:underline">
          Login
        </Link>
      </p>
    </AuthCard>
  );
}
