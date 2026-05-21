import { useMemo } from 'react';
import { samplePath } from '../../utils/pathSamples';

const RAIL = '#323238';
const TIE = '#7a7a85';
const OFFSET = 3.5;

/** Twin rails + sleeper ties along a smooth path */
export default function TrackRails({ d, tieCount = 36, opacity = 0.7 }) {
  const ties = useMemo(() => samplePath(d, tieCount), [d, tieCount]);

  return (
    <g className="track-rails" opacity={opacity}>
      <path
        d={d}
        fill="none"
        stroke={RAIL}
        strokeWidth="1.15"
        strokeLinecap="round"
        transform={`translate(0, ${-OFFSET})`}
      />
      <path
        d={d}
        fill="none"
        stroke={RAIL}
        strokeWidth="1.15"
        strokeLinecap="round"
        transform={`translate(0, ${OFFSET})`}
      />
      {ties.map((t, i) => {
        const perp = t.angle + Math.PI / 2;
        const half = 5;
        const x1 = t.x - Math.cos(perp) * half;
        const y1 = t.y - Math.sin(perp) * half;
        const x2 = t.x + Math.cos(perp) * half;
        const y2 = t.y + Math.sin(perp) * half;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={TIE}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.65"
          />
        );
      })}
    </g>
  );
}
