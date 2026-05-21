import { motion } from 'framer-motion';
import { fadeUp } from '../utils/motion';
import CharacterSpot from './characters/CharacterSpot';
import { TravelerWaving } from './characters/CartoonCharacters';

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="page-container flex min-h-[70vh] flex-col justify-center page-section-sm">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative mx-auto w-full max-w-md"
      >
        <CharacterSpot className="absolute -top-14 left-1/2 z-10 -translate-x-1/2 sm:-top-16" float delay={0.1}>
          <TravelerWaving size={88} />
        </CharacterSpot>
        <div className="card-surface-elevated p-9 sm:p-11">
          <h1 className="heading-section text-2xl sm:text-[1.75rem]">{title}</h1>
          {subtitle && <p className="mt-4 text-body">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}
