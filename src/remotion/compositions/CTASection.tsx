import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { AnimatedText, GradientBackground, Logo } from '../components';
import { colors } from '../utils/colors';

function PricingCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  const glowIntensity = Math.sin(frame * 0.1) * 10 + 20;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        padding: 40,
        background: colors.card,
        borderRadius: 24,
        border: `2px solid ${colors.cyan}`,
        transform: `scale(${scale})`,
        boxShadow: `0 0 ${glowIntensity}px ${colors.cyan}`,
        position: 'relative',
      }}
    >
      {/* Popular badge */}
      <div
        style={{
          position: 'absolute',
          top: -16,
          right: -16,
          padding: '8px 20px',
          background: `linear-gradient(90deg, ${colors.orange}, ${colors.red})`,
          borderRadius: 20,
          fontSize: 14,
          fontWeight: 'bold',
          color: colors.white,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        MAS POPULAR
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: colors.cyan,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        Plan Mensual
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            color: colors.white,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          $29,900
        </span>
        <span
          style={{
            fontSize: 24,
            color: colors.gray,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          COP/mes
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginTop: 10,
        }}
      >
        {['Plan personalizado', 'PDF descargable', 'Soporte WhatsApp', 'Videos tutoriales'].map((feature) => (
          <div
            key={feature}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 18,
              color: colors.white,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <span style={{ color: colors.green }}>&#10003;</span>
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
}

function CTAButton() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - 30,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  const gradientPosition = (frame * 2) % 200;

  return (
    <div
      style={{
        padding: '24px 60px',
        background: `linear-gradient(90deg, ${colors.cyan} ${gradientPosition - 100}%, ${colors.blue} ${gradientPosition}%, ${colors.cyan} ${gradientPosition + 100}%)`,
        borderRadius: 16,
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.background,
        fontFamily: 'Inter, system-ui, sans-serif',
        transform: `scale(${scale})`,
        cursor: 'pointer',
      }}
    >
      COMENZAR AHORA
    </div>
  );
}

export function CTASection() {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <GradientBackground variant="cyan">
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 50,
            opacity,
          }}
        >
          <PricingCard />
          <CTAButton />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              marginTop: 20,
            }}
          >
            <Logo delay={60} />
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: colors.cyan,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              jcv24fitness.com
            </div>
          </div>
        </AbsoluteFill>
      </GradientBackground>
    </AbsoluteFill>
  );
}
