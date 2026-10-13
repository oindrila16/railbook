import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/authState';
import NavLinks from './NavLinks';
import { StickerTrain } from './icons/StickerIcons';
import { ease, tapScale, springSoft } from '../utils/motion';

export default function Navbar() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: scrolled ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.65)',
        boxShadow: scrolled
          ? '0 1px 2px rgba(35, 35, 38, 0.05), 0 6px 24px rgba(35, 35, 38, 0.07)'
          : '0 0 0 rgba(35, 35, 38, 0)',
      }}
      transition={{ duration: 0.4, ease: ease.smooth }}
      className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
        scrolled ? 'border-line/90' : 'border-transparent'
      }`}
    >
      <nav className="page-container flex h-[4.5rem] items-center justify-between sm:h-[4.75rem]">
        <Link
          to="/"
          className="group flex items-center gap-3"
          onClick={closeMenu}
        >
          <motion.span
            whileHover={{ scale: 1.04, rotate: -3 }}
            transition={springSoft}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-paper shadow-card"
          >
            <StickerTrain size={26} className="text-paper" framed={false} />
          </motion.span>
          <span className="font-brand text-[1.35rem] text-ink transition-opacity duration-300 group-hover:opacity-80">
            RailBook
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-6 lg:gap-10 md:flex">
          <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden">
            <NavLinks
            showBookings={isLoggedIn && !isAdmin}
            showAdmin={isAdmin}
            showHelp={!isAdmin}
            mobile={false}
          />
          </div>

          <div className="flex shrink-0 items-center gap-3 border-l border-line/80 pl-6 lg:gap-4 lg:pl-8">
            {isLoggedIn ? (
              <>
                <span
                  className="hidden max-w-[10rem] truncate text-sm text-ink-muted lg:block xl:max-w-[12rem]"
                  title={user?.email || user?.fullName}
                >
                  {isAdmin ? user?.email : user?.fullName || user?.email}
                </span>
                <motion.button type="button" onClick={logout} className="btn-secondary shrink-0 py-2.5" {...tapScale}>
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost shrink-0">
                  Login
                </Link>
                <Link to="/register" className="btn-primary shrink-0 py-2.5">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>

        <motion.button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line/80 bg-paper shadow-inner md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          {...tapScale}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            {menuOpen ? (
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </motion.button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="fixed inset-0 top-[4.5rem] z-40 bg-ink/15 backdrop-blur-sm md:hidden"
              onClick={closeMenu}
              aria-label="Close menu"
            />
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: ease.smooth }}
              className="overflow-hidden border-b border-line bg-paper/98 shadow-lift backdrop-blur-xl md:hidden"
            >
              <div className="page-container space-y-1 py-7">
                <NavLinks
                  showBookings={isLoggedIn && !isAdmin}
                  showAdmin={isAdmin}
                  showHelp={!isAdmin}
                  onNavigate={closeMenu}
                  mobile
                />
                <div className="divider-soft mt-7 space-y-3 pt-7">
                  {isLoggedIn ? (
                    <>
                      <p className="px-2 text-sm text-ink-muted">
                        {isAdmin ? user?.email : user?.fullName || user?.email}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          closeMenu();
                        }}
                        className="btn-secondary w-full"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <div className="grid gap-3">
                      <Link to="/login" onClick={closeMenu} className="btn-ghost w-full justify-center py-3">
                        Login
                      </Link>
                      <Link to="/register" onClick={closeMenu} className="btn-primary w-full justify-center">
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
