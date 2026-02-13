import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { GradientBackground } from '../components';
import { colors } from '../utils/colors';
import { FPS } from '../utils/timing';

const problems = [
  { text: 'Cansado de planes genericos?', emoji: '😩' },
  { text: 'Sin saber que comer?', emoji: '🍔' },
  { text: 'Rutinas que no funcionan?', emoji: '💪' },
];

// Each problem gets ~2.3 seconds (7 seconds total / 3 problems)
const PROBLEM_DURATION = Math.floor((FPS * 7) / 3);

function ProblemText({ text, emoji }: { text: string; emoji: string }) {
  const frame = useCurrentFrame();

  // Fade in for first 10 frames, stay, fade out last 10 frames
  const opacity = interpolate(
    frame,
    [0, 10, PROBLEM_DURATION - 15, PROBLEM_DURATION - 5],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Scale animation
  const scale = interpolate(
    frame,
    [0, 15],
    [0.8, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <span style={{ fontSize: 80 }}>{emoji}</span>
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          fontFamily: 'Inter, system-ui, sans-serif',
          color: colors.white,
          textAlign: 'center',
          textShadow: `0 0 40px ${colors.red}`,
          maxWidth: 900,
          lineHeight: 1.2,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function ProblemStatement() {
  return (
    <AbsoluteFill>
      <GradientBackground variant="red">
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Each problem shows ONE AT A TIME, sequentially */}
          {problems.map((problem, index) => (
            <Sequence
              key={problem.text}
              from={index * PROBLEM_DURATION}
              durationInFrames={PROBLEM_DURATION}
            >
              <AbsoluteFill
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ProblemText text={problem.text} emoji={problem.emoji} />
              </AbsoluteFill>
            </Sequence>
          ))}
        </AbsoluteFill>
      </GradientBackground>
    </AbsoluteFill>
  );
}
