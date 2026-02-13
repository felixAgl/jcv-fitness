import { AbsoluteFill, Sequence } from 'remotion';
import { GradientBackground, TypewriterText } from '../components';
import { colors } from '../utils/colors';
import { FPS } from '../utils/timing';

const problems = [
  'Cansado de planes genericos?',
  'Sin saber que comer?',
  'Rutinas que no funcionan?',
];

export function ProblemStatement() {
  return (
    <AbsoluteFill>
      <GradientBackground variant="red">
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 40,
            padding: 80,
          }}
        >
          {problems.map((problem, index) => (
            <Sequence key={problem} from={index * (FPS * 2)} durationInFrames={FPS * 7 - index * FPS * 2}>
              <TypewriterText
                text={problem}
                fontSize={56}
                color={colors.red}
                speed={2}
                delay={0}
              />
            </Sequence>
          ))}
        </AbsoluteFill>
      </GradientBackground>
    </AbsoluteFill>
  );
}
