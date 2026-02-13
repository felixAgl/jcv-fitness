import { useCurrentFrame } from 'remotion';
import { colors } from '../utils/colors';

interface TypewriterTextProps {
  text: string;
  fontSize?: number;
  color?: string;
  speed?: number;
  delay?: number;
  style?: React.CSSProperties;
}

export function TypewriterText({
  text,
  fontSize = 48,
  color = colors.white,
  speed = 2,
  delay = 0,
  style,
}: TypewriterTextProps) {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - delay);
  const charsToShow = Math.floor(adjustedFrame / speed);
  const displayText = text.slice(0, charsToShow);

  const showCursor = adjustedFrame % 20 < 10;

  return (
    <div
      style={{
        fontSize,
        fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        color,
        ...style,
      }}
    >
      {displayText}
      {charsToShow < text.length && showCursor && (
        <span style={{ color: colors.cyan }}>|</span>
      )}
    </div>
  );
}
