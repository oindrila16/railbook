/** Rounded stroke icons — consistent across the app */

const defaults = {
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
};

export function IconChevronDown({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...defaults} d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconChevronUp({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...defaults} d="M6 15l6-6 6 6" />
    </svg>
  );
}

export function IconArrowRight({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...defaults} d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconArrowLeft({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...defaults} d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function IconSwap({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path {...defaults} d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" />
    </svg>
  );
}

export function IconSearch({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <circle {...defaults} cx="11" cy="11" r="7" />
      <path {...defaults} d="M20 20l-3.5-3.5" />
    </svg>
  );
}
