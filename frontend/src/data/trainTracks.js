/** Single coordinate system for the seamless landscape SVG */
export const VB = { w: 1440, h: 900 };

/** Two gentle tracks — cleaner background */
export const TRACK_PATHS = [
  'M -60 200 C 280 160, 520 240, 760 190 S 1080 150, 1520 210',
  'M -70 620 C 320 580, 640 660, 960 600 S 1280 560, 1520 640',
];

export const TRAINS = [
  { path: 0, duration: 58, delay: 0, scale: 0.7 },
  { path: 1, duration: 64, delay: 20, scale: 0.68 },
];
