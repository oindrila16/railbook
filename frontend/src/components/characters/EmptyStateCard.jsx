import { motion } from 'framer-motion';
import { TicketMascot } from './CartoonCharacters';
import { scaleIn } from '../../utils/motion';

export default function EmptyStateCard({
  title,
  message,
  children,
  mood = 'curious',
  character,
  className = '',
}) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      className={`card-surface mt-8 flex flex-col items-center gap-5 px-8 py-12 text-center sm:mt-10 sm:px-12 sm:py-14 ${className}`}
    >
      <div className="character-spot character-spot--bob">
        {character ?? <TicketMascot size={80} mood={mood} />}
      </div>
      {title && <p className="text-sm font-semibold text-ink">{title}</p>}
      <p className="max-w-sm text-body">{message}</p>
      {children}
    </motion.div>
  );
}
