import { useCurrentFrame, interpolate } from 'remotion';
import { colors } from '../utils/colors';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'dark' | 'red' | 'cyan';
}

export function GradientBackground({ children, variant = 'dark' }: GradientBackgroundProps) {
  const frame = useCurrentFrame();

  const gradientPosition = interpolate(frame, [0, 300], [0, 100], {
    extrapolateRight: 'extend',
  });

  const getGradient = () => {
    switch (variant) {
      case 'red':
        return `linear-gradient(135deg, ${colors.background} 0%, #1a0505 50%, ${colors.background} 100%)`;
      case 'cyan':
        return `linear-gradient(135deg, ${colors.background} 0%, #051a1a 50%, ${colors.background} 100%)`;
      default:
        return `linear-gradient(135deg, ${colors.background} 0%, ${colors.backgroundSecondary} 50%, ${colors.background} 100%)`;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: getGradient(),
        backgroundPosition: `${gradientPosition}% ${gradientPosition}%`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
