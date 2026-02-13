import { AbsoluteFill, Sequence } from 'remotion';
import { HeroIntro } from './HeroIntro';
import { ProblemStatement } from './ProblemStatement';
import { LandingShowcase } from './LandingShowcase';
import { WizardTimelapse } from './WizardTimelapse';
import { PDFShowcase } from './PDFShowcase';
import { DashboardPreview } from './DashboardPreview';
import { CTASection } from './CTASection';
import { FRAME_SEQUENCES } from '../utils/timing';

interface PromoVideoProps {
  vertical?: boolean;
}

export function PromoVideo({ vertical = false }: PromoVideoProps) {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Sequence 1: Hook (0-5s) */}
      <Sequence {...FRAME_SEQUENCES.hook}>
        <HeroIntro />
      </Sequence>

      {/* Sequence 2: Problem (5-12s) */}
      <Sequence {...FRAME_SEQUENCES.problem}>
        <ProblemStatement />
      </Sequence>

      {/* Sequence 3: Landing Preview (12-22s) */}
      <Sequence {...FRAME_SEQUENCES.landing}>
        <LandingShowcase />
      </Sequence>

      {/* Sequence 4: Wizard Flow (22-42s) */}
      <Sequence {...FRAME_SEQUENCES.wizard}>
        <WizardTimelapse />
      </Sequence>

      {/* Sequence 5: PDF Generation (42-52s) */}
      <Sequence {...FRAME_SEQUENCES.pdf}>
        <PDFShowcase />
      </Sequence>

      {/* Sequence 6: Dashboard (52-62s) */}
      <Sequence {...FRAME_SEQUENCES.dashboard}>
        <DashboardPreview />
      </Sequence>

      {/* Sequence 7: CTA Final (62-70s) */}
      <Sequence {...FRAME_SEQUENCES.cta}>
        <CTASection />
      </Sequence>
    </AbsoluteFill>
  );
}
