const INK = '#232326';
const LINE = '#48484f';
const PAPER = '#fafafa';

/* ─── Trees (reference doodle styles) ─── */

export function TreeRoundSolid({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} strokeLinecap="round">
      <line x1="6" y1="24" x2="6" y2="13" stroke={INK} strokeWidth="1.2" />
      <ellipse cx="6" cy="7" rx="6.5" ry="7.5" fill={INK} />
    </g>
  );
}

export function TreeRoundOutline({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <line x1="6" y1="24" x2="6" y2="13" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
      <ellipse cx="6" cy="7" rx="6.5" ry="7.5" fill={PAPER} stroke={INK} strokeWidth="1" />
    </g>
  );
}

export function TreeRoundLined({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <line x1="6" y1="26" x2="6" y2="11" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
      <ellipse cx="6" cy="7" rx="7" ry="8" fill={PAPER} stroke={INK} strokeWidth="1" />
      <line x1="6" y1="0" x2="6" y2="15" stroke={INK} strokeWidth="0.65" opacity="0.45" />
      <line x1="3.5" y1="5" x2="3.5" y2="11" stroke={INK} strokeWidth="0.5" opacity="0.3" />
      <line x1="8.5" y1="4" x2="8.5" y2="12" stroke={INK} strokeWidth="0.5" opacity="0.3" />
    </g>
  );
}

export function TreeBushy({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <line x1="7" y1="26" x2="7" y2="14" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
      <path
        d="M7 4 C2 8, 1 14, 4 17 C0 19, 2 24, 7 22 C12 24, 14 19, 10 17 C13 14, 12 8, 7 4 Z"
        fill={PAPER}
        stroke={INK}
        strokeWidth="1"
      />
    </g>
  );
}

export function TreePineSolid({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <line x1="7" y1="28" x2="7" y2="15" stroke={INK} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M7 2 L1 15 L13 15 Z" fill={INK} />
    </g>
  );
}

export function TreePineOutline({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} fill={PAPER} stroke={INK} strokeWidth="1">
      <line x1="7" y1="26" x2="7" y2="14" fill="none" strokeLinecap="round" />
      <path d="M7 3 L2 14 L12 14 Z" />
    </g>
  );
}

export function TreeLollipop({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <line x1="4" y1="17" x2="4" y2="10" stroke={LINE} strokeWidth="1" strokeLinecap="round" />
      <circle cx="4" cy="6.5" r="4" fill={PAPER} stroke={INK} strokeWidth="1" />
    </g>
  );
}

export function TreeCluster({ x, y, s = 1, variant = 0 }) {
  const sets =
    variant === 1
      ? [
          [TreeRoundOutline, 0, 0, 0.9],
          [TreePineSolid, 11, 5, 0.75],
          [TreeLollipop, 5, -3, 0.65],
        ]
      : [
          [TreeRoundSolid, 0, 0, 1],
          [TreeRoundLined, 10, 4, 0.8],
        ];
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {sets.map(([T, ox, oy, sc], i) => (
        <g key={i} transform={`translate(${ox},${oy}) scale(${sc})`}>
          <T x={0} y={0} s={1} />
        </g>
      ))}
    </g>
  );
}

export function GrassTuft({ x, y, s = 1 }) {
  return (
    <g
      transform={`translate(${x},${y}) scale(${s})`}
      stroke={LINE}
      strokeWidth="0.85"
      strokeLinecap="round"
      fill="none"
      opacity="0.5"
    >
      <path d="M0 5 L2 0 L4 5" />
    </g>
  );
}

export function Dot({ x, y, r = 1.2 }) {
  return <circle cx={x} cy={y} r={r} fill={LINE} opacity="0.35" />;
}

/* ─── Mountain ranges (layered depth + snow peaks) ─── */

export function MountainRanges() {
  const faint = '#f0f0f2';
  const mid = '#e4e4e7';

  return (
    <g className="mountain-ranges">
      <g fill={faint} stroke="none" opacity="0.7">
        <path d="M0 520 L200 400 L480 460 L720 350 L1000 430 L1280 380 L1440 420 L1440 900 L0 900 Z" />
      </g>
      <g fill="none" stroke={mid} strokeWidth="1" strokeLinejoin="round" opacity="0.5">
        <path d="M0 540 L240 420 L520 500 L800 380 L1100 480 L1440 440" />
      </g>
    </g>
  );
}

function WindowPane({ x, y, w, h }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="0.6" fill="#f8fafc" stroke={INK} strokeWidth="0.85" />
      <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={INK} strokeWidth="0.4" />
      <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke={INK} strokeWidth="0.4" />
    </g>
  );
}

/* ─── Cottage — refined sketch home ─── */

export function CottageHouse({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx="20" cy="48" rx="28" ry="4" fill="#e4e4e7" opacity="0.5" />
      <path
        d="M20 48 L20 44 L16 42 L12 44 L8 46"
        fill="none"
        stroke={LINE}
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.4"
      />
      <rect x="1" y="40" width="38" height="5" rx="1" fill="#f4f4f5" stroke={INK} strokeWidth="0.85" />
      <rect x="14" y="38" width="12" height="2" fill="#e4e4e7" stroke={INK} strokeWidth="0.5" />
      <rect x="4" y="18" width="32" height="22" rx="0.5" fill={PAPER} stroke={INK} strokeWidth="1.1" />
      <path d="M-2 18 L20 0 L42 18 Z" fill={INK} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
      <path d="M6 12 L20 2 L34 12" fill="none" stroke="#323238" strokeWidth="0.5" opacity="0.5" />
      <rect x="30" y="-1" width="6" height="14" fill={INK} stroke={INK} strokeWidth="0.6" />
      <rect x="28" y="-3" width="10" height="3" rx="0.8" fill={INK} />
      <g className="house-smoke" fill="none" stroke={INK} strokeWidth="0.8" opacity="0.3">
        <circle cx="34" cy="-6" r="2.2" />
        <circle cx="38" cy="-10" r="1.8" />
        <circle cx="41" cy="-14" r="1.4" />
      </g>
      <WindowPane x={8} y={10} w={6} h={6} />
      <WindowPane x={26} y={10} w={6} h={6} />
      <rect x={7} y="16" width="8" height="2" rx="0.5" fill="#f4f4f5" stroke={INK} strokeWidth="0.5" />
      <rect x={25} y="16" width="8" height="2" rx="0.5" fill="#f4f4f5" stroke={INK} strokeWidth="0.5" />
      <WindowPane x={6} y={26} w={5} h={5} />
      <WindowPane x={29} y={26} w={5} h={5} />
      <rect x="15" y="28" width="10" height="12" rx="1" fill={PAPER} stroke={INK} strokeWidth="1" />
      <path d="M15 28 Q20 24 25 28" fill="none" stroke={INK} strokeWidth="0.9" />
      <circle cx="23" cy="34" r="0.8" fill={INK} />
      <ellipse cx="0" cy="38" rx="4" ry="3" fill="#f4f4f5" stroke={INK} strokeWidth="0.7" />
      <ellipse cx="40" cy="37" rx="4.5" ry="3.5" fill="#f4f4f5" stroke={INK} strokeWidth="0.7" />
    </g>
  );
}

/** Reference steam train: black engine + smoke + 2 carriages */
export function SteamTrainSprite() {
  return (
    <g>
      <g className="train-smoke" fill="none" stroke={INK} strokeWidth="0.7" opacity="0.4">
        <circle cx="6" cy="-2" r="2.2" />
        <circle cx="2" cy="-4" r="1.6" />
        <circle cx="-2" cy="-5" r="1.2" />
      </g>
      <path d="M8 20 L8 11 L11 7 L17 7 L21 9 L30 9 L30 20 Z" fill={INK} />
      <rect x="11" y="3" width="5" height="6" fill={INK} />
      <rect x="12" y="11" width="5" height="4" fill={PAPER} stroke={INK} strokeWidth="0.5" />
      <rect x="19" y="11" width="4" height="4" fill={PAPER} stroke={INK} strokeWidth="0.5" />
      <rect x="33" y="10" width="18" height="10" rx="1.5" fill={PAPER} stroke={INK} strokeWidth="0.9" />
      <rect x="35" y="12" width="5" height="4" fill={PAPER} stroke={INK} strokeWidth="0.4" />
      <rect x="42" y="12" width="5" height="4" fill={PAPER} stroke={INK} strokeWidth="0.4" />
      <rect x="53" y="10" width="16" height="10" rx="1.5" fill={PAPER} stroke={INK} strokeWidth="0.9" />
      <rect x="55" y="12" width="4" height="4" fill={PAPER} stroke={INK} strokeWidth="0.4" />
      <rect x="61" y="12" width="4" height="4" fill={PAPER} stroke={INK} strokeWidth="0.4" />
      {[12, 22, 38, 48, 58, 66].map((cx) => (
        <circle key={cx} cx={cx} cy="22" r="2.8" fill="#323238" stroke={INK} strokeWidth="0.7" />
      ))}
    </g>
  );
}
