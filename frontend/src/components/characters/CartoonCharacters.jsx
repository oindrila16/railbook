/** Chibi mascots — big sparkly eyes, round shapes, pastel blush */

const INK = '#3a3a42';
const INK_LIGHT = '#5c5c68';
const SKIN = '#fff5ed';
const BLUSH = '#ffb4b4';
const SWEATER = '#8eb8c4';
const SCARF = '#c8ebe3';
const COAT = '#6a9aaa';
const HIGHLIGHT = '#ffffff';

function SparkleEye({ cx, cy, r = 5.5, look = 0 }) {
  const pupilX = cx + look;
  return (
    <g>
      <ellipse cx={cx} cy={cy + 0.5} rx={r} ry={r * 1.08} fill={HIGHLIGHT} stroke={INK} strokeWidth="0.9" />
      <circle cx={pupilX} cy={cy + 1} r={r * 0.42} fill={INK} />
      <circle cx={pupilX - 1.2} cy={cy - 0.8} r={r * 0.16} fill={HIGHLIGHT} />
    </g>
  );
}

function Blush({ cx, cy }) {
  return <ellipse cx={cx} cy={cy} rx={4.5} ry={3} fill={BLUSH} opacity="0.55" />;
}

function HappyMouth({ cx, cy, w = 7 }) {
  return (
    <path
      d={`M${cx - w / 2} ${cy} Q${cx} ${cy + 3.5} ${cx + w / 2} ${cy}`}
      fill="none"
      stroke={INK}
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  );
}

function Shadow({ cx, cy, rx, ry = 3 }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={INK} opacity="0.05" />;
}

/** Waving traveller — hero & footer */
export function TravelerWaving({ className = '', size = 96 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 1.2}
      viewBox="0 0 88 106"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <Shadow cx={44} cy={100} rx={24} />
      <ellipse cx="62" cy="78" rx="11" ry="9" fill={SCARF} stroke={INK} strokeWidth="0.85" />
      <rect x="54" y="72" width="16" height="10" rx="3" fill={COAT} stroke={INK} strokeWidth="0.8" />
      <ellipse cx="44" cy="62" rx="16" ry="14" fill={SWEATER} stroke={INK} strokeWidth="0.95" />
      <path d="M36 52 L44 44 L52 52" fill={SCARF} stroke={INK} strokeWidth="0.7" />
      <circle cx="44" cy="28" r="20" fill={SKIN} stroke={INK} strokeWidth="1.1" />
      <Blush cx={32} cy={34} />
      <Blush cx={56} cy={34} />
      <SparkleEye cx={36} cy={26} r={6} look={-0.5} />
      <SparkleEye cx={52} cy={26} r={6} look={0.5} />
      <HappyMouth cx={44} cy={36} w={9} />
      <path
        d="M64 38 C72 30 74 20 68 14"
        fill="none"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="68" cy="12" r="5.5" fill={SKIN} stroke={INK} strokeWidth="0.9" />
      <ellipse cx="22" cy="78" rx="7" ry="5" fill={COAT} stroke={INK} strokeWidth="0.75" />
      <rect x="18" y="74" width="8" height="3" rx="1" fill={INK_LIGHT} />
      <ellipse cx="36" cy="88" rx="6" ry="8" fill={COAT} stroke={INK} strokeWidth="0.8" />
      <ellipse cx="52" cy="88" rx="6" ry="8" fill={COAT} stroke={INK} strokeWidth="0.8" />
    </svg>
  );
}

/** Conductor — help & chat */
export function ConductorBuddy({ className = '', size = 88 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 1.12}
      viewBox="0 0 80 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <Shadow cx={40} cy={86} rx={22} />
      <ellipse cx="40" cy="58" rx="17" ry="15" fill={COAT} stroke={INK} strokeWidth="0.95" />
      <rect x="32" y="52" width="16" height="5" rx="2" fill={SCARF} />
      <circle cx="40" cy="26" r="18" fill={SKIN} stroke={INK} strokeWidth="1.1" />
      <path d="M20 24 L40 10 L60 24 Z" fill={INK} stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
      <rect x="22" y="21" width="36" height="4" rx="1.5" fill={INK_LIGHT} />
      <circle cx="40" cy="8" r="3" fill={SCARF} stroke={INK} strokeWidth="0.6" />
      <Blush cx={28} cy={32} />
      <Blush cx={52} cy={32} />
      <SparkleEye cx={33} cy={26} r={5.5} />
      <SparkleEye cx={47} cy={26} r={5.5} />
      <HappyMouth cx={40} cy={34} w={8} />
      <rect x="50" y="44" width="18" height="12" rx="2.5" fill={SKIN} stroke={INK} strokeWidth="0.85" />
      <path d="M53 48 H65 M53 51 H61" stroke={INK_LIGHT} strokeWidth="0.6" strokeLinecap="round" />
      <ellipse cx="22" cy="72" rx="5" ry="7" fill={COAT} stroke={INK} strokeWidth="0.75" />
      <ellipse cx="58" cy="72" rx="5" ry="7" fill={COAT} stroke={INK} strokeWidth="0.75" />
    </svg>
  );
}

/** Round ticket blob mascot */
export function TicketMascot({ className = '', size = 72, mood = 'happy' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 76 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <Shadow cx={38} cy={70} rx={20} />
      <ellipse cx="38" cy="40" rx="28" ry="26" fill={SKIN} stroke={INK} strokeWidth="1.05" />
      <Blush cx={24} cy={44} />
      <Blush cx={52} cy={44} />
      <SparkleEye cx={28} cy="36" r={6} look={mood === 'curious' ? -1 : 0} />
      <SparkleEye cx={48} cy="36" r={6} look={mood === 'curious' ? 1 : 0} />
      {mood === 'curious' ? (
        <circle cx={38} cy={44} r={2} fill={INK} />
      ) : (
        <HappyMouth cx={38} cy={44} w={8} />
      )}
      <rect x="46" y="48" width="20" height="14" rx="3" fill={SCARF} stroke={INK} strokeWidth="0.8" />
      <circle cx="52" cy="54" r="1.5" fill={INK_LIGHT} opacity="0.5" />
      <ellipse cx="14" cy="54" rx="6" ry="4" fill={SWEATER} stroke={INK} strokeWidth="0.7" />
      <ellipse cx="62" cy="54" rx="6" ry="4" fill={SWEATER} stroke={INK} strokeWidth="0.7" />
      {mood === 'curious' && (
        <text x="8" y="28" fontSize="10" fill={INK_LIGHT} opacity="0.4">
          ?
        </text>
      )}
    </svg>
  );
}

/** Bench sitter */
export function BenchTraveler({ className = '', size = 80 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 0.9}
      viewBox="0 0 92 82"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <Shadow cx={46} cy={76} rx={28} />
      <rect x="6" y="54" width="80" height="7" rx="3" fill={SCARF} stroke={INK} strokeWidth="0.85" />
      <rect x="12" y="61" width="5" height="9" rx="1" fill={INK_LIGHT} />
      <rect x="75" y="61" width="5" height="9" rx="1" fill={INK_LIGHT} />
      <ellipse cx="46" cy="42" rx="18" ry="16" fill={SKIN} stroke={INK} strokeWidth="1" />
      <Blush cx={36} cy={46} />
      <Blush cx={56} cy={46} />
      <SparkleEye cx={40} cy={38} r={5} />
      <SparkleEye cx={52} cy={38} r={5} />
      <HappyMouth cx={46} cy={48} w={7} />
      <path d="M32 54 Q46 50 60 54" fill={SWEATER} stroke={INK} strokeWidth="0.85" />
      <ellipse cx="58" cy="52" rx="8" ry="6" fill={COAT} stroke={INK} strokeWidth="0.75" />
    </svg>
  );
}

/** Chat avatar — conductor chibi face */
export function ChatMascotFace({ className = '', size = 40 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="22" cy="24" r="15" fill={SKIN} stroke={INK} strokeWidth="0.95" />
      <path d="M8 22 L22 10 L36 22 Z" fill={INK} strokeLinejoin="round" />
      <rect x="10" y="19" width="24" height="3.5" rx="1.2" fill={INK_LIGHT} />
      <Blush cx={14} cy={28} />
      <Blush cx={30} cy={28} />
      <SparkleEye cx={16} cy={24} r={4} />
      <SparkleEye cx={28} cy={24} r={4} />
      <HappyMouth cx={22} cy={30} w={6} />
    </svg>
  );
}

/* ─── Landscape sprites ─── */

export function LandscapeWaveTraveler({ x, y, s = 1, flip = false }) {
  const scale = flip ? `scale(${-s}, ${s})` : `scale(${s})`;
  return (
    <g transform={`translate(${x},${y}) ${scale}`} className="lb-character lb-character--wave">
      <ellipse cx="0" cy="46" rx="12" ry="2" fill={INK} opacity="0.06" />
      <ellipse cx="0" cy="22" rx="9" ry="8" fill={SWEATER} stroke={INK} strokeWidth="0.75" />
      <circle cx="0" cy="8" r="8" fill={SKIN} stroke={INK} strokeWidth="0.8" />
      <ellipse cx="-4" cy="10" rx="2" ry="1.2" fill={BLUSH} opacity="0.5" />
      <ellipse cx="4" cy="10" rx="2" ry="1.2" fill={BLUSH} opacity="0.5" />
      <circle cx="-2.5" cy="7" r="1.8" fill="#fff" stroke={INK} strokeWidth="0.5" />
      <circle cx="-2.2" cy="7.3" r="0.7" fill={INK} />
      <circle cx="2.5" cy="7" r="1.8" fill="#fff" stroke={INK} strokeWidth="0.5" />
      <circle cx="2.8" cy="7.3" r="0.7" fill={INK} />
      <path d="M-2 11 Q0 12.5 2 11" fill="none" stroke={INK} strokeWidth="0.65" strokeLinecap="round" />
      <path
        d="M9 10 Q15 4 12 -2"
        fill="none"
        stroke={INK}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="-3" r="3.5" fill={SKIN} stroke={INK} strokeWidth="0.6" />
    </g>
  );
}

export function LandscapeBenchTraveler({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} className="lb-character">
      <rect x="-18" y="20" width="36" height="3" rx="1.5" fill={SCARF} stroke={INK} strokeWidth="0.6" />
      <circle cx="0" cy="7" r="7" fill={SKIN} stroke={INK} strokeWidth="0.75" />
      <ellipse cx="-3" cy="9" rx="1.8" ry="1" fill={BLUSH} opacity="0.5" />
      <ellipse cx="3" cy="9" rx="1.8" ry="1" fill={BLUSH} opacity="0.5" />
      <circle cx="-2" cy="6.5" r="1.4" fill="#fff" stroke={INK} strokeWidth="0.45" />
      <circle cx="-1.7" cy="6.7" r="0.55" fill={INK} />
      <circle cx="2" cy="6.5" r="1.4" fill="#fff" stroke={INK} strokeWidth="0.45" />
      <circle cx="2.3" cy="6.7" r="0.55" fill={INK} />
      <path d="M-1.5 9.5 Q0 10.5 1.5 9.5" fill="none" stroke={INK} strokeWidth="0.55" strokeLinecap="round" />
      <ellipse cx="0" cy="15" rx="8" ry="5" fill={SWEATER} stroke={INK} strokeWidth="0.65" />
    </g>
  );
}

export function LandscapeTicketBuddy({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} className="lb-character lb-character--bob">
      <ellipse cx="0" cy="18" rx="11" ry="10" fill={SKIN} stroke={INK} strokeWidth="0.75" />
      <ellipse cx="-3" cy="19" rx="2" ry="1.2" fill={BLUSH} opacity="0.5" />
      <ellipse cx="3" cy="19" rx="2" ry="1.2" fill={BLUSH} opacity="0.5" />
      <circle cx="-2.5" cy="16" r="1.5" fill="#fff" stroke={INK} strokeWidth="0.45" />
      <circle cx="-2.2" cy="16.2" r="0.6" fill={INK} />
      <circle cx="2.5" cy="16" r="1.5" fill="#fff" stroke={INK} strokeWidth="0.45" />
      <circle cx="2.8" cy="16.2" r="0.6" fill={INK} />
      <path d="M-2 19.5 Q0 20.5 2 19.5" fill="none" stroke={INK} strokeWidth="0.55" strokeLinecap="round" />
      <rect x="5" y="15" width="9" height="6" rx="1.5" fill={SCARF} stroke={INK} strokeWidth="0.55" />
      <ellipse cx="-7" cy="20" rx="3" ry="2" fill={SWEATER} stroke={INK} strokeWidth="0.45" />
      <ellipse cx="7" cy="20" rx="3" ry="2" fill={SWEATER} stroke={INK} strokeWidth="0.45" />
    </g>
  );
}
