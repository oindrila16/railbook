const SVG_NS = 'http://www.w3.org/2000/svg';

/** Sample points along an SVG path for ties / alignment */
export function samplePath(d, count = 40) {
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  const length = path.getTotalLength();
  if (!length) return [];

  return Array.from({ length: count }, (_, i) => {
    const dist = (i / (count - 1)) * length;
    const p = path.getPointAtLength(dist);
    const ahead = path.getPointAtLength(Math.min(dist + 6, length));
    const angle = Math.atan2(ahead.y - p.y, ahead.x - p.x);
    return { x: p.x, y: p.y, angle };
  });
}

export function getPathLength(d) {
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  return path.getTotalLength();
}
