import { useEffect, useRef, useState } from 'react';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Smooth motion along an SVG path (same coordinate space as landscape SVG).
 */
export function useAnimateAlongPath(pathD, durationSec, delaySec = 0) {
  const [state, setState] = useState({ x: 0, y: 0, rotate: 0, ready: false });
  const angleRef = useRef(0);

  useEffect(() => {
    if (!pathD) return undefined;

    const pathEl = document.createElementNS(SVG_NS, 'path');
    pathEl.setAttribute('d', pathD);
    const length = pathEl.getTotalLength();
    if (!length) return undefined;

    const durationMs = durationSec * 1000;
    const startAt = performance.now() - delaySec * 1000;
    let frameId;

    const tick = (now) => {
      const elapsed = (now - startAt) % durationMs;
      const t = elapsed / durationMs;
      const dist = t * length;
      const lookAhead = Math.min(14, length * 0.025);
      const p = pathEl.getPointAtLength(dist);
      const ahead = pathEl.getPointAtLength(Math.min(dist + lookAhead, length));
      const targetAngle = (Math.atan2(ahead.y - p.y, ahead.x - p.x) * 180) / Math.PI;

      angleRef.current += (targetAngle - angleRef.current) * 0.12;

      setState({
        x: p.x,
        y: p.y,
        rotate: angleRef.current,
        ready: true,
      });
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [pathD, durationSec, delaySec]);

  return state;
}
