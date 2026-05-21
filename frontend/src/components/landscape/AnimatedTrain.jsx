import { useAnimateAlongPath } from '../../hooks/useAnimateAlongPath';
import { SteamTrainSprite } from './LandscapeElements';

/** Train rendered inside the landscape SVG — same coords as tracks */
export default function AnimatedTrain({ pathD, duration, delay = 0, scale = 1 }) {
  const { x, y, rotate, ready } = useAnimateAlongPath(pathD, duration, delay);

  if (!ready) return null;

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale}) translate(-34, -12)`}
    >
      <SteamTrainSprite />
    </g>
  );
}
