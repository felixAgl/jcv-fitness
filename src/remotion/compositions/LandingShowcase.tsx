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

          {/* Landing mockup with real features */}
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
              flexDirection: 'column',
              padding: 40,
            }}
          >
            {/* Browser bar mockup */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 30,
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: colors.red }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: colors.orange }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: colors.green }} />
              <div
                style={{
                  flex: 1,
                  height: 28,
                  borderRadius: 6,
                  background: `${colors.gray}20`,
                  marginLeft: 20,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 12,
                }}
              >
                <span style={{ fontSize: 14, color: colors.gray, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  jcv24fitness.com
                </span>
              </div>
            </div>

            {/* Hero mockup */}
            <div style={{ display: 'flex', flex: 1, gap: 30 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 'bold',
                    color: colors.white,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    lineHeight: 1.2,
                  }}
                >
                  Transforma tu cuerpo con <span style={{ color: colors.cyan }}>JCV</span>
                </div>
                <div style={{ fontSize: 18, color: colors.gray, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Plan personalizado en minutos
                </div>
                <div
                  style={{
                    padding: '12px 24px',
                    background: `linear-gradient(90deg, ${colors.cyan}, ${colors.blue})`,
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: colors.background,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    width: 'fit-content',
                  }}
                >
                  COMENZAR AHORA
                </div>
              </div>
              {/* Features list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
                {['Alimentacion personalizada', 'Rutinas por objetivo', 'Seguimiento semanal'].map((feature) => (
                  <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: colors.cyan, fontSize: 18 }}>&#10003;</span>
                    <span style={{ color: colors.white, fontSize: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </GradientBackground>
    </AbsoluteFill>
  );
}
