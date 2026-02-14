import { AbsoluteFill, Sequence } from 'remotion';
import { AnimatedText, GradientBackground, Logo } from '../components';
import { colors } from '../utils/colors';
import { FPS } from '../utils/timing';

export function HeroIntro() {
  return (
    <AbsoluteFill>
      <GradientBackground variant="cyan">
        <Sequence from={0} durationInFrames={FPS * 5}>
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
              text="TRANSFORMA TU CUERPO"
              fontSize={96}
              gradient={[colors.cyan, colors.blue]}
              delay={0}
            />
            <Logo delay={20} />
          </AbsoluteFill>
        </Sequence>
      </GradientBackground>
    </AbsoluteFill>
  );
}
