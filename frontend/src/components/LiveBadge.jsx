import { motion } from 'framer-motion';
import { fadeIn } from '../utils/motion';

export default function LiveBadge({ connected }) {
  if (!connected) return null;
  return (
    <motion.span
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-muted px-3 py-1.5 text-xs font-medium text-ink-muted"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      Live seats
    </motion.span>
  );
}
