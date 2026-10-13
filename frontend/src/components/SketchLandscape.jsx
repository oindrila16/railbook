import { TREES, GRASS, DOTS } from './landscape/landscapeData';
import { TRACK_PATHS, TRAINS } from '../data/trainTracks';
import TrackRails from './landscape/TrackRails';
import AnimatedTrain from './landscape/AnimatedTrain';
import {
  GrassTuft,
  Dot,
  MountainRanges,
} from './landscape/LandscapeElements';
import {
  LandscapeWaveTraveler,
  LandscapeBenchTraveler,
  LandscapeTicketBuddy,
} from './characters/CartoonCharacters';

/**
 * Minimal sketch landscape — soft hills, two tracks, light tree accents.
 */
export default function SketchLandscape() {
  return (
    <svg
      className="sketch-landscape h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="paper-grain" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.3" fill="#e4e4e7" opacity="0.25" />
        </pattern>
      </defs>

      <rect width="1440" height="900" fill="#fafafa" />
      <rect width="1440" height="900" fill="url(#paper-grain)" opacity="0.35" />

      <MountainRanges />

      <g fill="none" stroke="#ececee" strokeWidth="1" strokeLinecap="round" opacity="0.9">
        <path d="M-20 620 Q400 590 800 630 T 1460 610" />
        <path d="M-20 700 Q500 680 1000 710 T 1460 695" />
      </g>

      <g fill="none" stroke="#e4e4e7" strokeWidth="0.9" opacity="0.5" className="lb-cloud">
        <path d="M120 90 Q170 65 230 88 Q180 108 120 90" />
      </g>
      <g fill="none" stroke="#e4e4e7" strokeWidth="0.9" opacity="0.45" className="lb-cloud lb-cloud--b">
        <path d="M1050 75 Q1100 50 1160 72 Q1100 92 1050 75" />
      </g>

      {TRACK_PATHS.map((d, i) => (
        <TrackRails key={`track-${i}`} d={d} tieCount={28} opacity={0.55} />
      ))}

      {DOTS.map(([x, y], i) => (
        <Dot key={`dot-${i}`} x={x} y={y} />
      ))}
      {GRASS.map(([x, y], i) => (
        <GrassTuft key={`grass-${i}`} x={x} y={y} s={0.8} />
      ))}

      {TREES.map((entry, i) => {
        const [Component, x, y, s, props] = entry;
        return <Component key={`tree-${i}`} x={x} y={y} s={s} {...(props || {})} />;
      })}

      <LandscapeBenchTraveler x={140} y={580} s={1.1} />
      <LandscapeTicketBuddy x={520} y={600} s={1.05} />
      <LandscapeWaveTraveler x={1180} y={560} s={1.15} flip />

      <g fill="none" stroke="#d4d4d8" strokeWidth="0.8" opacity="0.35">
        <path d="M420 120 q4 -4 8 0" />
        <path d="M920 100 q3 -3 6 0" />
      </g>

      <g className="landscape-trains">
        {TRAINS.map((t, i) => (
          <AnimatedTrain
            key={`train-${i}`}
            pathD={TRACK_PATHS[t.path]}
            duration={t.duration}
            delay={t.delay}
            scale={t.scale}
          />
        ))}
      </g>
    </svg>
  );
}
