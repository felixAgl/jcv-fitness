"use client";

import { cn } from "@/shared/utils/cn";

interface OptionCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  emoji?: string;
  isSelected: boolean;
  onClick: () => void;
  /** Kept for API compatibility — selection styling is always cyan. */
  color?: string;
  size?: "sm" | "md" | "lg";
}

export function OptionCard({
  title,
  subtitle,
  description,
  emoji,
  isSelected,
  onClick,
  size = "md",
}: OptionCardProps) {
  const selectedClasses =
    "border-accent-cyan bg-accent-cyan/30 ring-2 ring-accent-cyan shadow-lg shadow-accent-cyan/20";

  const unselectedClasses = "border-gray-600 bg-gray-900/80 hover:border-gray-500 hover:bg-gray-800/60";

  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full rounded-xl border-2 transition-all duration-300 text-left",
        "hover:scale-[1.02] active:scale-[0.98]",
        sizeClasses[size],
        isSelected ? selectedClasses : unselectedClasses
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-accent-cyan">
            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        {emoji && (
          <span className="text-3xl" role="img" aria-hidden="true">
            {emoji}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-bold transition-colors",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-lg",
            isSelected ? "text-white" : "text-gray-200"
          )}>
            {title}
          </h3>
          {subtitle && (
            <p className={cn(
              "text-xs font-medium mt-0.5",
              isSelected ? "text-gray-200" : "text-gray-400"
            )}>
              {subtitle}
            </p>
          )}
          {description && (
            <p className={cn(
              "text-sm mt-1 line-clamp-2",
              isSelected ? "text-gray-300" : "text-gray-500"
            )}>
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
