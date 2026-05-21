import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import TrainBackground from './TrainBackground';
import Footer from './Footer';
import PageTransition from './PageTransition';
import ChatWidget from './chat/ChatWidget';

export default function Layout({ showBackground = true }) {
  const location = useLocation();
  const { isAdmin } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col">
      {showBackground && <TrainBackground />}
      <Navbar />
      <main className="relative z-10 flex-1 bg-transparent">
        <AnimatePresence initial={false}>
          <PageTransition key={`${location.pathname}${location.search}`}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
      {!isAdmin && <ChatWidget />}
    </div>
  );
}
