import { NavLink } from 'react-router-dom';

const desktopClass = ({ isActive }) =>
  `relative py-1 text-sm font-medium transition-colors duration-400 ease-smooth ${
    isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
  } after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:rounded-full after:bg-ink after:transition-transform after:duration-400 ${
    isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'
  }`;

const mobileClass = ({ isActive }) =>
  `block rounded-2xl px-4 py-3.5 text-base font-medium transition-all duration-300 ${
    isActive
      ? 'bg-paper-muted text-ink shadow-inner'
      : 'text-ink-muted hover:bg-paper-muted/80 hover:text-ink'
  }`;

export default function NavLinks({ onNavigate, showBookings, showAdmin, showHelp = true, mobile = false }) {
  const className = mobile ? mobileClass : desktopClass;

  return (
    <div
      className={
        mobile ? 'space-y-1' : 'flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:gap-x-7'
      }
    >
      <NavLink to="/" className={className} end onClick={onNavigate}>
        Home
      </NavLink>
      <NavLink to="/search" className={className} onClick={onNavigate}>
        Trains
      </NavLink>
      <NavLink to="/offers" className={className} onClick={onNavigate}>
        Offers
      </NavLink>
      <NavLink to="/prices" className={className} onClick={onNavigate}>
        Prices
      </NavLink>
      {showHelp && (
        <NavLink to="/help" className={className} onClick={onNavigate}>
          Help
        </NavLink>
      )}
      {showBookings && (
        <NavLink to="/bookings" className={className} onClick={onNavigate}>
          My Bookings
        </NavLink>
      )}
      {showAdmin && (
        <NavLink to="/admin" className={className} onClick={onNavigate}>
          Admin
        </NavLink>
      )}
    </div>
  );
}
