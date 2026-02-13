import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { AnimatedText, GradientBackground } from '../components';
import { colors } from '../utils/colors';
import { FPS } from '../utils/timing';

const wizardSteps = [
  { title: 'Nivel de Experiencia', icon: '1', color: colors.green },
  { title: 'Tu Objetivo', icon: '2', color: colors.orange },
  { title: 'Datos Corporales', icon: '3', color: colors.blue },
  { title: 'Ejercicios Favoritos', icon: '4', color: colors.cyan },
  { title: 'Alimentos Preferidos', icon: '5', color: colors.green },
  { title: 'Plan Listo!', icon: '6', color: colors.cyan },
];

function WizardStep({ step, index }: { step: typeof wizardSteps[0]; index: number }) {
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

  const glowIntensity = Math.sin(frame * 0.15) * 10 + 20;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 30,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${step.color}, ${colors.blue})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 ${glowIntensity}px ${step.color}`,
        }}
      >
        <span
          style={{
            fontSize: 56,
            fontWeight: 'bold',
            color: colors.white,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {step.icon}
        </span>
      </div>
      <span
        style={{
          fontSize: 48,
          fontWeight: 'bold',
          color: colors.white,
          fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        {step.title}
      </span>
    </div>
  );
}

export function WizardTimelapse() {
  const stepDuration = FPS * 3; // 3 seconds per step

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
          }}
        >
          <AnimatedText
            text="Personaliza tu Plan"
            fontSize={56}
            gradient={[colors.cyan, colors.blue]}
            delay={0}
            style={{ marginBottom: 20 }}
          />

          {wizardSteps.map((step, index) => (
            <Sequence key={step.title} from={index * stepDuration} durationInFrames={stepDuration}>
              <AbsoluteFill
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: 100,
                }}
              >
                <WizardStep step={step} index={index} />
              </AbsoluteFill>
            </Sequence>
          ))}

          {/* Progress indicator */}
          <ProgressBar />
        </AbsoluteFill>
      </GradientBackground>
    </AbsoluteFill>
  );
}

function ProgressBar() {
  const frame = useCurrentFrame();
  const totalSteps = wizardSteps.length;
  const stepDuration = FPS * 3;
  const totalDuration = totalSteps * stepDuration;

  const progress = interpolate(frame, [0, totalDuration], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: '10%',
        width: '80%',
        height: 8,
        borderRadius: 4,
        background: colors.card,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${colors.cyan}, ${colors.blue})`,
          borderRadius: 4,
        }}
      />
    </div>
  );
}
