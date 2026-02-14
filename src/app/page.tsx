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
} from "@/features/landing/components";
import { PricingSection } from "@/features/payment/components";
import { MealPlanSection } from "@/features/meal-plan/components";
import { WorkoutPlanSection } from "@/features/workout-plan/components";
import { mealPlanPhase1 } from "@/features/meal-plan/data/meal-plan-phase1";
import { gymWorkoutPlan, homeWorkoutPlan } from "@/features/workout-plan/data";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <FeaturesGrid />
        <MealPlanSection config={mealPlanPhase1} isPreview />
        <WorkoutPlanSection gymPlan={gymWorkoutPlan} homePlan={homeWorkoutPlan} isPreview />
        <HowItWorks />
        <PDFShowcase />
        <SocialProof />
        <PricingSection />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
