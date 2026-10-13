import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as authService from '../services/authService';
import { useAuth } from '../context/authState';
import { getPendingEmail, getPendingVerificationMode, clearPendingEmail } from '../utils/auth';
import AuthCard from '../components/AuthCard';
import ErrorAlert from '../components/ErrorAlert';
import { tapScale } from '../utils/motion';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeVerification } = useAuth();
  const email = location.state?.email || getPendingEmail() || '';
  const isConsoleVerification = (location.state?.verificationMode || getPendingVerificationMode()) === 'console';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) navigate('/register', { replace: true });
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputsRef.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) {
      setError('Enter the full 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await authService.verifyOtp({ email, otp });
      completeVerification(result);
      clearPendingEmail();
      const isAdmin = result.user?.role === 'admin' || result.user?.isAdmin;
      navigate(isAdmin ? '/admin' : '/bookings', {
        replace: true,
        state: {
          message: isAdmin
            ? 'Account verified. Welcome to the admin panel.'
            : 'Account verified! You are now logged in.',
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Verify your email"
      subtitle={
        <>
          {isConsoleVerification ? 'Enter the 6-digit code for ' : 'Enter the 6-digit code sent to '}<strong className="text-ink">{email}</strong>
        </>
      }
    >
      {isConsoleVerification && <p className="mt-3 text-xs text-ink-faint">
        This is a local demo. Find your verification code in the terminal running the server.
      </p>}

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="flex justify-center gap-2.5 sm:gap-3" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-14 w-11 rounded-2xl border border-line bg-paper text-center text-xl font-semibold text-ink shadow-inner outline-none transition-all duration-300 focus:border-ink focus:ring-4 focus:ring-ink/[0.06] sm:h-16 sm:w-12"
            />
          ))}
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          className="btn-primary mt-8 w-full"
          {...tapScale}
        >
          {loading ? 'Verifying...' : 'Verify & continue'}
        </motion.button>
      </form>
    </AuthCard>
  );
}
