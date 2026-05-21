import { motion } from 'framer-motion';
import { fadeUpTight } from '../utils/motion';

export default function SectionHeader({ title, subtitle, align = 'left', className = '' }) {
  const alignClass = align === 'center' ? 'text-center mx-auto max-w-2xl' : '';

  return (
    <motion.header
      variants={fadeUpTight}
      initial="hidden"
      animate="visible"
      whileInView="visible"
      viewport={{ once: true, margin: '-48px' }}
      className={`mb-8 sm:mb-10 ${alignClass} ${className}`}
    >
      <h2 className="heading-section">{title}</h2>
      {subtitle && <p className="mt-3 max-w-xl text-body">{subtitle}</p>}
    </motion.header>
  );
}
