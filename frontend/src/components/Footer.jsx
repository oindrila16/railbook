import { motion } from 'framer-motion';
import { fadeIn } from '../utils/motion';
import CharacterSpot from './characters/CharacterSpot';
import { TravelerWaving } from './characters/CartoonCharacters';

export default function Footer() {
  return (
    <motion.footer
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative z-10 mt-auto border-t border-line/70 bg-paper/85 py-14 backdrop-blur-md sm:py-16"
    >
      <div className="page-container flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:gap-6 sm:text-left">
        <div className="flex items-center justify-center gap-4 sm:justify-start">
          <CharacterSpot className="hidden sm:block" float>
            <TravelerWaving size={52} />
          </CharacterSpot>
          <p className="text-sm text-ink-muted">
            © {new Date().getFullYear()} RailBook — Train Ticket Booking
          </p>
        </div>
        <p className="text-xs tracking-wide text-ink-faint">Prices in Bangladeshi Taka (৳)</p>
      </div>
    </motion.footer>
  );
}
