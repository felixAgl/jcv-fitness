import {
  Header,
  Hero,
  Footer,
  ProblemSection,
  FeaturesGrid,
  HowItWorks,
  SocialProof,
  FAQ,
  PDFShowcase,
  TransformationGallery,
  StickyCTABar,
} from "@/features/landing/components";
import { PricingSection } from "@/features/payment/components";
import { MealPlanSection } from "@/features/meal-plan/components";
import { WorkoutPlanSection } from "@/features/workout-plan/components";
import { mealPlanPhase1 } from "@/features/meal-plan/data/meal-plan-phase1";
import { gymWorkoutPlan, homeWorkoutPlan } from "@/features/workout-plan/data";

function SectionDivider() {
  return (
    <div className="w-full flex justify-center py-2">
      <div className="w-2/3 max-w-2xl h-px bg-gradient-to-r from-transparent via-accent-cyan/30 to-transparent" />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SectionDivider />
        <ProblemSection />
        <SectionDivider />
        <FeaturesGrid />
        <SectionDivider />
        <MealPlanSection config={mealPlanPhase1} isPreview />
        <SectionDivider />
        <WorkoutPlanSection gymPlan={gymWorkoutPlan} homePlan={homeWorkoutPlan} isPreview />
        <SectionDivider />
        <HowItWorks />
        <SectionDivider />
        <PDFShowcase />
        <SectionDivider />
        <SocialProof />
        <SectionDivider />
        <TransformationGallery />
        <SectionDivider />
        <PricingSection />
        <SectionDivider />
        <FAQ />
      </main>
      <Footer />
      <StickyCTABar />
    </>
  );
}
