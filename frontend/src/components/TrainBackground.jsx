import SketchLandscape from './SketchLandscape';

/** Seamless original sketch background — single SVG canvas */
export default function TrainBackground() {
  return (
    <div className="train-bg pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <SketchLandscape />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 68% 48% at 50% 30%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 50%, transparent 75%)',
        }}
      />

      <style>{`
        .lb-cloud {
          animation: cloudFloat 60s ease-in-out infinite;
        }
        .lb-cloud--b { animation-delay: -22s; animation-duration: 68s; }
        .lb-cloud--c { animation-delay: -38s; animation-duration: 52s; }
        .train-smoke circle {
          animation: puff 2.8s ease-in-out infinite;
        }
        .train-smoke circle:nth-child(2) { animation-delay: 0.4s; }
        .train-smoke circle:nth-child(3) { animation-delay: 0.8s; }
        @keyframes cloudFloat {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(14px, -3px); }
        }
        @keyframes puff {
          0%, 100% { opacity: 0.25; transform: translateY(0); }
          50% { opacity: 0.5; transform: translateY(-3px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .landscape-trains,
          .lb-cloud,
          .train-smoke circle { animation: none; }
        }
      `}</style>
    </div>
  );
}
