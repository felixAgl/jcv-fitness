import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { colors } from '../utils/colors';

interface LogoProps {
  delay?: number;
}

export function Logo({ delay = 0 }: LogoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  const glowIntensity = Math.sin((frame - delay) * 0.15) * 10 + 20;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${colors.cyan}, ${colors.blue})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 ${glowIntensity}px ${colors.cyan}`,
        }}
      >
        <span
          style={{
            fontSize: 40,
            fontWeight: 'bold',
            color: colors.background,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          JCV
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: colors.white,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          JCV 24 FITNESS
        </span>
        <span
          style={{
            fontSize: 16,
            color: colors.cyan,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Tu transformacion comienza aqui
        </span>
      </div>
    </div>
  );
}
