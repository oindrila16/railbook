/**
 * Cute minimal sticker icons — soft fills, rounded shapes (no emojis).
 * Uses currentColor so icons adapt on light & dark surfaces.
 */

const S = 'currentColor';

function StickerFrame({ size = 24, className = '', children, framed = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      role="presentation"
    >
      {framed && (
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="10"
          fill={S}
          fillOpacity="0.1"
          stroke={S}
          strokeOpacity="0.14"
          strokeWidth="1"
        />
      )}
      <g transform="translate(4 4)">{children}</g>
    </svg>
  );
}

/** Locomotive — search & brand */
export function StickerTrain({ size = 24, className = '', framed = true }) {
  return (
    <StickerFrame size={size} className={className} framed={framed}>
      <rect x="2" y="14" width="20" height="5" rx="1.2" fill={S} fillOpacity="0.15" stroke={S} strokeWidth="1.35" />
      <path
        d="M4 14V9h4l2-3h4l2 3h4v5"
        stroke={S}
        strokeWidth="1.35"
        strokeLinejoin="round"
        fill={S}
        fillOpacity="0.12"
      />
      <rect x="9" y="6" width="5" height="3" rx="0.8" fill={S} fillOpacity="0.28" />
      <circle cx="7" cy="19" r="2" fill={S} fillOpacity="0.08" stroke={S} strokeWidth="1.15" />
      <circle cx="17" cy="19" r="2" fill={S} fillOpacity="0.08" stroke={S} strokeWidth="1.15" />
      <path d="M20 5c1 0 2 1 2 2" stroke={S} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <circle cx="21" cy="4" r="1" fill={S} fillOpacity="0.35" />
    </StickerFrame>
  );
}

/** Ticket — PNR */
export function StickerTicket({ size = 24, className = '' }) {
  return (
    <StickerFrame size={size} className={className}>
      <path
        d="M3 6h18a2 2 0 012 2v2.5c-1.2.8-1.2 2.2 0 3V17a2 2 0 01-2 2H3V6z"
        fill={S}
        fillOpacity="0.12"
        stroke={S}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path d="M11 6v13" stroke={S} strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
      <path d="M6 10h4M6 14h6" stroke={S} strokeWidth="1.15" strokeLinecap="round" opacity="0.65" />
      <circle cx="16" cy="11" r="2.5" fill={S} fillOpacity="0.22" stroke={S} strokeWidth="1" />
    </StickerFrame>
  );
}

/** Live location pulse */
export function StickerLive({ size = 24, className = '' }) {
  return (
    <StickerFrame size={size} className={className}>
      <circle cx="12" cy="12" r="7" fill="none" stroke={S} strokeWidth="1" opacity="0.25" />
      <circle cx="12" cy="12" r="4.5" fill="none" stroke={S} strokeWidth="1" opacity="0.4" />
      <path
        d="M12 4c3.5 0 6.5 2.8 6.5 6.5 0 4.8-6.5 11.5-6.5 11.5S5.5 15.3 5.5 10.5C5.5 6.8 8.5 4 12 4z"
        fill={S}
        fillOpacity="0.18"
        stroke={S}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.5" r="2" fill={S} fillOpacity="0.1" stroke={S} strokeWidth="1.15" />
    </StickerFrame>
  );
}

/** Seat availability */
export function StickerSeat({ size = 24, className = '' }) {
  return (
    <StickerFrame size={size} className={className}>
      <path
        d="M5 10h14a2 2 0 012 2v3H3v-3a2 2 0 012-2z"
        fill={S}
        fillOpacity="0.12"
        stroke={S}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M5 15h12v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4z"
        fill={S}
        fillOpacity="0.2"
        stroke={S}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path d="M5 12h14" stroke={S} strokeWidth="1.15" strokeLinecap="round" opacity="0.35" />
    </StickerFrame>
  );
}

/** Shield — secure booking */
export function StickerShield({ size = 24, className = '' }) {
  return (
    <StickerFrame size={size} className={className}>
      <path
        d="M12 3L5 6v5.5c0 4.2 3 7.2 7 8.5 4-1.3 7-4.3 7-8.5V6l-7-3z"
        fill={S}
        fillOpacity="0.12"
        stroke={S}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke={S}
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
    </StickerFrame>
  );
}

/** Price tag */
export function StickerTag({ size = 24, className = '' }) {
  return (
    <StickerFrame size={size} className={className}>
      <path
        d="M6 6h8l8 8-8 8H6V6z"
        fill={S}
        fillOpacity="0.12"
        stroke={S}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2" fill={S} fillOpacity="0.22" stroke={S} strokeWidth="1" />
      <path d="M14 14l4 4" stroke={S} strokeWidth="1.15" strokeLinecap="round" opacity="0.45" />
    </StickerFrame>
  );
}

/** Headset — support */
export function StickerSupport({ size = 24, className = '' }) {
  return (
    <StickerFrame size={size} className={className}>
      <path
        d="M6 14v-2a6 6 0 0112 0v2"
        stroke={S}
        strokeWidth="1.35"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="4" y="13" width="4" height="6" rx="2" fill={S} fillOpacity="0.18" stroke={S} strokeWidth="1.15" />
      <rect x="16" y="13" width="4" height="6" rx="2" fill={S} fillOpacity="0.18" stroke={S} strokeWidth="1.15" />
      <path d="M8 19h8" stroke={S} strokeWidth="1.15" strokeLinecap="round" opacity="0.45" />
    </StickerFrame>
  );
}

/** Small heart — badge accent */
export function StickerHeart({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        d="M8 13.5S3 10 3 6.5a2.5 2.5 0 014.2-1.8A2.8 2.8 0 018 5.8a2.8 2.8 0 01.8-1.1A2.5 2.5 0 0113 6.5C13 10 8 13.5 8 13.5z"
        fill={S}
        fillOpacity="0.35"
        stroke={S}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
