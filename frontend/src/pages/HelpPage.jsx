import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { fadeUp } from '../utils/motion';
import { IconArrowRight } from '../components/icons/Icons';
import CharacterSpot from '../components/characters/CharacterSpot';
import { ConductorBuddy } from '../components/characters/CartoonCharacters';

const faqs = [
  {
    q: 'How do I book a train ticket?',
    a: 'Search for your route on the home page, pick a train, sign in, enter passenger details, and confirm your booking.',
  },
  {
    q: 'How do I verify my account?',
    a: 'After registering, enter the 6-digit OTP sent to your email. In local development, check the backend terminal for [EMAIL MOCK] if email is not configured.',
  },
  {
    q: 'Can I cancel a booking?',
    a: 'Yes. Open My Bookings, find a confirmed reservation, and use Cancel booking to release your seats.',
  },
  {
    q: 'What if the train is full?',
    a: 'You can join the waitlist. When a seat opens, you may be promoted automatically and notified by email.',
  },
];

export default function HelpPage() {
  const { isAdmin } = useAuth();

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="page-container page-section">
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-2xl content-stack">
        <div>
          <h1 className="heading-section">Help & support</h1>
          <p className="mt-4 text-body">
            Answers to common questions about booking, accounts, and cancellations on RailBook.
          </p>
        </div>

        <div className="content-stack-sm">
          {faqs.map((item, i) => (
            <motion.article
              key={item.q}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="card-surface-interactive p-7 sm:p-8"
            >
              <h2 className="heading-card text-base">{item.q}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.a}</p>
            </motion.article>
          ))}
        </div>

        <div className="card-surface-elevated relative overflow-hidden p-8 sm:p-9">
          <CharacterSpot className="absolute -bottom-2 -right-1 hidden opacity-80 sm:block" float delay={0.25}>
            <ConductorBuddy size={72} className="rotate-6" />
          </CharacterSpot>
          <h2 className="heading-card text-base">Still need help?</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Use the <strong className="font-semibold text-ink">live chat</strong> button at the
            bottom-right for instant answers, or search trains and view your reservations below.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/search" className="btn-primary inline-flex items-center gap-2">
              Search trains
              <IconArrowRight size={16} />
            </Link>
            <Link to="/bookings" className="btn-secondary">
              My bookings
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
