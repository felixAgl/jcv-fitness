import { AbsoluteFill, useCurrentFrame, interpolate, Img, staticFile } from 'remotion';
import { AnimatedText, GradientBackground } from '../components';
import { colors } from '../utils/colors';

export function LandingShowcase() {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, 60, 200, 300], [1, 1.05, 1.05, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <GradientBackground>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 30,
            padding: 60,
          }}
        >
          <AnimatedText
            text="Plan 100% Personalizado"
            fontSize={64}
            gradient={[colors.cyan, colors.blue]}
            delay={0}
          />

          <div
            style={{
              width: '85%',
              height: '70%',
              borderRadius: 24,
              background: colors.card,
              border: `2px solid ${colors.cyan}30`,
              overflow: 'hidden',
              transform: `scale(${scale})`,
              opacity,
              boxShadow: `0 20px 60px ${colors.cyan}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Placeholder for landing screenshot */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 24,
                  background: `linear-gradient(135deg, ${colors.cyan}, ${colors.blue})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: 'bold',
                    color: colors.background,
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  JCV
                </span>
              </div>
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: colors.white,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                Landing Preview
              </span>
              <span
                style={{
                  fontSize: 18,
                  color: colors.gray,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                (Agrega screenshot en assets/screenshots/landing.png)
              </span>
            </div>
          </div>
        </AbsoluteFill>
      </GradientBackground>
    </AbsoluteFill>
  );
}
