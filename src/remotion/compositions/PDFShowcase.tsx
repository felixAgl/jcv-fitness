import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { AnimatedText, GradientBackground } from '../components';
import { colors } from '../utils/colors';
import { FPS } from '../utils/timing';

// Real content for each PDF page
const pdfPages = [
  {
    title: 'Portada Personalizada',
    description: 'Tu nombre, objetivo y nivel',
    icon: '📋',
    content: [
      { text: 'Juan Carlos Vargas', highlight: true },
      { text: 'Objetivo: Ganar Musculo', highlight: false },
      { text: 'Nivel: Intermedio', highlight: false },
      { text: 'Duracion: 12 semanas', highlight: false },
    ],
  },
  {
    title: 'Plan de Entrenamiento',
    description: 'Ejercicios con series y repeticiones',
    icon: '💪',
    content: [
      { text: 'Sentadilla          4x8-12', highlight: true },
      { text: 'Press Banca         4x8-12', highlight: false },
      { text: 'Peso Muerto         4x6-8', highlight: false },
      { text: 'Dominadas           3x8-10', highlight: false },
      { text: 'Curl Biceps         3x10-12', highlight: false },
    ],
  },
  {
    title: 'Calendario Semanal',
    description: 'Checkboxes de progreso diario',
    icon: '📅',
    content: [
      { text: 'Lun: Pecho + Triceps', highlight: true, check: true },
      { text: 'Mar: Espalda + Biceps', highlight: false, check: true },
      { text: 'Mie: Descanso Activo', highlight: false, check: false },
      { text: 'Jue: Piernas + Core', highlight: false, check: false },
      { text: 'Vie: Hombros + Cardio', highlight: false, check: false },
    ],
  },
  {
    title: 'Plan de Alimentacion',
    description: '5 comidas con macros detallados',
    icon: '🥗',
    content: [
      { text: 'Desayuno: Huevos + Avena', highlight: true, macros: '450 cal' },
      { text: 'Snack: Yogurt + Frutas', highlight: false, macros: '180 cal' },
      { text: 'Almuerzo: Pollo + Arroz', highlight: false, macros: '550 cal' },
      { text: 'Snack: Batido Proteina', highlight: false, macros: '200 cal' },
      { text: 'Cena: Salmon + Verduras', highlight: false, macros: '480 cal' },
    ],
  },
];

type ContentItem = {
  text: string;
  highlight: boolean;
  check?: boolean;
  macros?: string;
};

function PDFPage({ page, index }: { page: (typeof pdfPages)[0]; index: number }) {
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
          width: 420,
          height: 540,
          borderRadius: 16,
          background: colors.white,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          boxShadow: `0 20px 60px ${colors.cyan}40`,
        }}
      >
        {/* Header */}
        <div
          style={{
            width: '100%',
            height: 44,
            borderRadius: 8,
            background: `linear-gradient(90deg, ${colors.cyan}, ${colors.blue})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.white,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            JCV 24 FITNESS
          </span>
        </div>

        {/* Icon */}
        <div style={{ fontSize: 48, marginTop: 4 }}>{page.icon}</div>

        {/* Page title inside PDF */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.background,
            fontFamily: 'Inter, system-ui, sans-serif',
            textAlign: 'center',
          }}
        >
          {page.title}
        </div>

        {/* REAL Content - not placeholders! */}
        <div
          style={{
            flex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 8,
            padding: '0 8px',
          }}
        >
          {page.content.map((item: ContentItem, i: number) => {
            // Animate each line appearing
            const lineDelay = i * 5;
            const lineOpacity = interpolate(frame - lineDelay, [10, 20], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: item.highlight ? `${colors.cyan}15` : `${colors.gray}08`,
                  border: item.highlight ? `1px solid ${colors.cyan}30` : '1px solid transparent',
                  opacity: lineOpacity,
                }}
              >
                {/* Checkbox for calendar */}
                {item.check !== undefined && (
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: `2px solid ${item.check ? colors.green : colors.gray}`,
                      background: item.check ? colors.green : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.check && (
                      <span style={{ color: colors.white, fontSize: 12, fontWeight: 'bold' }}>
                        &#10003;
                      </span>
                    )}
                  </div>
                )}

                {/* Text content */}
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: item.highlight ? 600 : 400,
                    color: colors.background,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    flex: 1,
                  }}
                >
                  {item.text}
                </span>

                {/* Macros badge for meals */}
                {item.macros && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: colors.cyan,
                      background: `${colors.cyan}15`,
                      padding: '2px 8px',
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  >
                    {item.macros}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Label below PDF */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: colors.white,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {page.title}
        </div>
        <div
          style={{
            fontSize: 22,
            color: colors.gray,
            fontFamily: 'Inter, system-ui, sans-serif',
            marginTop: 8,
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
        {/* Fixed title at top */}
        <div
          style={{
            position: 'absolute',
            top: 50,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <AnimatedText
            text="Tu Rutina Profesional Lista"
            fontSize={52}
            gradient={[colors.cyan, colors.blue]}
            delay={0}
          />
        </div>

        {/* PDF pages in center */}
        {pdfPages.map((page, index) => (
          <Sequence key={page.title} from={index * pageDuration} durationInFrames={pageDuration}>
            <AbsoluteFill
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PDFPage page={page} index={index} />
            </AbsoluteFill>
          </Sequence>
        ))}
      </GradientBackground>
    </AbsoluteFill>
  );
}
