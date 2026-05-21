import { motion, useReducedMotion } from 'framer-motion';
import { pageTransition } from '../utils/motion';

export default function PageTransition({ children }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div>{children}</div>;
  }

  return (
    <motion.div
      initial={false}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      className="will-change-[opacity,transform]"
    >
      {children}
    </motion.div>
  );
}
