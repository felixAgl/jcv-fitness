import { Header, Hero, Footer } from "@/features/landing/components";
import { MealPlanSection } from "@/features/meal-plan/components";
import { WorkoutPlanSection } from "@/features/workout-plan/components";
import { PricingSection } from "@/features/payment/components";
import { mealPlanPhase1 } from "@/features/meal-plan/data/meal-plan-phase1";
import { gymWorkoutPlan, homeWorkoutPlan } from "@/features/workout-plan/data";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <MealPlanSection config={mealPlanPhase1} />
        <WorkoutPlanSection gymPlan={gymWorkoutPlan} homePlan={homeWorkoutPlan} />
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}
