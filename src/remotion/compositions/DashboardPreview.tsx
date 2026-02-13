import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { AnimatedText, GradientBackground } from '../components';
import { colors } from '../utils/colors';

const features = [
  { icon: '1', title: 'Ver Mi Plan', description: 'Accede 24/7' },
  { icon: '2', title: 'Descargar PDF', description: 'Imprimelo cuando quieras' },
  { icon: '3', title: 'Videos Tutoriales', description: 'Aprende la tecnica' },
  { icon: '4', title: 'Soporte WhatsApp', description: 'Resuelve tus dudas' },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = index * 15;

  const scale = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  const translateX = interpolate(frame - delay, [0, 20], [100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: 24,
        background: colors.card,
        borderRadius: 16,
        border: `1px solid ${colors.cyan}30`,
        transform: `scale(${scale}) translateX(${translateX}px)`,
        width: 400,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${colors.cyan}, ${colors.blue})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.white,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {feature.icon}
        </span>
      </div>
      <div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.white,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {feature.title}
        </div>
        <div
          style={{
            fontSize: 16,
            color: colors.gray,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {feature.description}
        </div>
      </div>
    </div>
  );
}

export function DashboardPreview() {
  return (
    <AbsoluteFill>
      <GradientBackground>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 40,
            padding: 60,
          }}
        >
          <AnimatedText
            text="Acompanamiento Completo"
            fontSize={56}
            gradient={[colors.cyan, colors.blue]}
            delay={0}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              marginTop: 40,
            }}
          >
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </AbsoluteFill>
      </GradientBackground>
    </AbsoluteFill>
  );
}
