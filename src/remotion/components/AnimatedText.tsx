import { useCurrentFrame, interpolate } from 'remotion';
import { colors } from '../utils/colors';

interface AnimatedTextProps {
  text: string;
  fontSize?: number;
  gradient?: [string, string];
  delay?: number;
  style?: React.CSSProperties;
}

export function AnimatedText({
  text,
  fontSize = 72,
  gradient = [colors.cyan, colors.blue],
  delay = 0,
  style,
}: AnimatedTextProps) {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame - delay, [0, 20], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        fontSize,
        fontWeight: 'bold',
        fontFamily: 'Inter, system-ui, sans-serif',
        background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        opacity,
        transform: `translateY(${translateY}px)`,
        ...style,
      }}
    >
      {text}
    </div>
  );
}
