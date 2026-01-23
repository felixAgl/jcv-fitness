"use client";

import { cn } from "@/shared/utils/cn";

interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  canProceed: boolean;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  nextLabel?: string;
  backLabel?: string;
}

export function NavigationButtons({
  onBack,
  onNext,
  canProceed,
  isFirstStep = false,
  isLastStep = false,
  nextLabel = "Continuar",
  backLabel = "Atras",
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center justify-between gap-4 pt-6">
      {!isFirstStep && onBack ? (
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "px-6 py-3 rounded-lg font-semibold transition-all duration-300",
            "border border-gray-700 text-gray-300",
            "hover:border-gray-500 hover:text-white hover:bg-gray-800/50"
          )}
        >
          {backLabel}
        </button>
      ) : (
        <div />
      )}

      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={cn(
            "px-8 py-3 rounded-lg font-bold transition-all duration-300",
            "flex items-center gap-2",
            canProceed
              ? isLastStep
                ? "bg-accent-green text-black hover:shadow-lg hover:shadow-accent-green/50"
                : "bg-accent-cyan text-black hover:shadow-lg hover:shadow-accent-cyan/50"
              : "bg-blue-900/60 text-blue-300 border border-blue-600/40 cursor-not-allowed"
          )}
        >
          {isLastStep ? "Finalizar" : nextLabel}
          {!isLastStep && (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
