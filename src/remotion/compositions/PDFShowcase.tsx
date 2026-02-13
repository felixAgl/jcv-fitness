import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { AnimatedText, GradientBackground } from '../components';
import { colors } from '../utils/colors';
import { FPS } from '../utils/timing';

const pdfPages = [
  { title: 'Portada Personalizada', description: 'Con tu nombre y objetivos' },
  { title: 'Plan de Entrenamiento', description: 'Rutinas detalladas por dia' },
  { title: 'Calendario de Progreso', description: 'Seguimiento semanal' },
  { title: 'Plan Nutricional', description: '5 comidas diarias' },
];

function PDFPage({ page, index }: { page: typeof pdfPages[0]; index: number }) {
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

  const rotateY = interpolate(frame, [0, 15], [90, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 30,
        transform: `scale(${scale}) perspective(1000px) rotateY(${rotateY}deg)`,
      }}
    >
      {/* PDF Page mockup */}
      <div
        style={{
          width: 400,
          height: 560,
          borderRadius: 16,
          background: colors.white,
          padding: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          boxShadow: `0 20px 60px ${colors.cyan}30`,
        }}
      >
        {/* Header */}
        <div
          style={{
            width: '100%',
            height: 60,
            borderRadius: 8,
            background: `linear-gradient(90deg, ${colors.cyan}, ${colors.blue})`,
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
            JCV 24 FITNESS
          </span>
        </div>

        {/* Content placeholder */}
        <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                width: `${80 - i * 10}%`,
                height: 16,
                borderRadius: 4,
                background: i === 0 ? colors.cyan : `${colors.gray}40`,
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 36,
            fontWeight: 'bold',
            color: colors.white,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {page.title}
        </div>
        <div
          style={{
            fontSize: 24,
            color: colors.gray,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {page.description}
        </div>
      </div>
    </div>
  );
}

export function PDFShowcase() {
  const pageDuration = FPS * 2.5; // 2.5 seconds per page

  return (
    <AbsoluteFill>
      <GradientBackground variant="cyan">
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
            text="Tu Rutina Profesional Lista"
            fontSize={52}
            gradient={[colors.cyan, colors.blue]}
            delay={0}
          />

          {pdfPages.map((page, index) => (
            <Sequence key={page.title} from={index * pageDuration} durationInFrames={pageDuration}>
              <AbsoluteFill
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: 60,
                }}
              >
                <PDFPage page={page} index={index} />
              </AbsoluteFill>
            </Sequence>
          ))}
        </AbsoluteFill>
      </GradientBackground>
    </AbsoluteFill>
  );
}
