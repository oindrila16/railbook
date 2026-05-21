import { motion } from 'framer-motion';

/**
 * Positions a cartoon character with optional gentle float animation.
 */
export default function CharacterSpot({
  children,
  className = '',
  float = false,
  delay = 0,
  ariaHidden = true,
}) {
  return (
    <motion.div
      className={`character-spot ${float ? 'character-spot--float' : ''} ${className}`.trim()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden={ariaHidden}
    >
      {children}
    </motion.div>
  );
}
