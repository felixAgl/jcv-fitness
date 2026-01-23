"use client";

import { useWizardStore } from "../store/wizard-store";
import { WizardProgress } from "./WizardProgress";
import { StepLevel } from "./StepLevel";
import { StepGoal } from "./StepGoal";
import { StepTime } from "./StepTime";
import { StepEquipment } from "./StepEquipment";
import { StepDuration } from "./StepDuration";
import { StepBodyData } from "./StepBodyData";
import { StepExercises } from "./StepExercises";
import { StepSummary } from "./StepSummary";

const TOTAL_STEPS = 8;

export function WizardContainer() {
  const { currentStep } = useWizardStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepLevel />;
      case 2:
        return <StepGoal />;
      case 3:
        return <StepTime />;
      case 4:
        return <StepEquipment />;
      case 5:
        return <StepDuration />;
      case 6:
        return <StepBodyData />;
      case 7:
        return <StepExercises />;
      case 8:
        return <StepSummary />;
      default:
        return <StepLevel />;
    }
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black">
            <span className="text-accent-cyan">JCV</span>{" "}
            <span className="text-white">FITNESS</span>
          </h1>
          <p className="text-gray-500 text-sm mt-2">Tu transformacion comienza aqui</p>
        </div>

        <WizardProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        <div className="mt-8 bg-gray-950/50 rounded-2xl border border-gray-800 p-6 md:p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
