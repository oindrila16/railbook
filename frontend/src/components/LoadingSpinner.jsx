import { motion } from 'framer-motion';
import { fadeIn } from '../utils/motion';
import { TicketMascot } from './characters/CartoonCharacters';

export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24">
      <div className="character-spot character-spot--bob mb-1">
        <TicketMascot size={56} />
      </div>
      <motion.div
        className="relative h-12 w-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-line/80"
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-ink"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
      <motion.p variants={fadeIn} initial="hidden" animate="visible" className="text-sm text-ink-muted">
        {label}
      </motion.p>
    </div>
  );
}
