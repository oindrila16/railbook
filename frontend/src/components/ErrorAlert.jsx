import { motion, AnimatePresence } from 'framer-motion';
import { ease } from '../utils/motion';

export default function ErrorAlert({ message, onDismiss }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.3, ease: ease.smooth }}
          className="mb-8 overflow-hidden"
        >
          <div className="flex items-start justify-between gap-4 rounded-2xl border border-ink/15 bg-paper-muted px-5 py-4 text-sm text-ink">
            <span className="leading-relaxed">{message}</span>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="shrink-0 rounded-lg p-1 text-ink-faint transition-colors hover:bg-paper hover:text-ink"
                aria-label="Dismiss"
              >
                ×
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
