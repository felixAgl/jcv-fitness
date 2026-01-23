"use client";

import { cn } from "@/shared/utils/cn";

interface OptionCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  emoji?: string;
  isSelected: boolean;
  onClick: () => void;
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
  color = "cyan",
  size = "md",
}: OptionCardProps) {
  const colorClasses = {
    cyan: "border-accent-cyan/50 bg-accent-cyan/10",
    red: "border-accent-red/50 bg-accent-red/10",
    green: "border-accent-green/50 bg-accent-green/10",
    blue: "border-accent-blue/50 bg-accent-blue/10",
    yellow: "border-yellow-500/50 bg-yellow-500/10",
    purple: "border-purple-500/50 bg-purple-500/10",
    orange: "border-orange-500/50 bg-orange-500/10",
    pink: "border-pink-500/50 bg-pink-500/10",
  };

  const selectedColorClasses = {
    cyan: "border-accent-cyan bg-accent-cyan/20 ring-2 ring-accent-cyan",
    red: "border-accent-red bg-accent-red/20 ring-2 ring-accent-red",
    green: "border-accent-green bg-accent-green/20 ring-2 ring-accent-green",
    blue: "border-accent-blue bg-accent-blue/20 ring-2 ring-accent-blue",
    yellow: "border-yellow-500 bg-yellow-500/20 ring-2 ring-yellow-500",
    purple: "border-purple-500 bg-purple-500/20 ring-2 ring-purple-500",
    orange: "border-orange-500 bg-orange-500/20 ring-2 ring-orange-500",
    pink: "border-pink-500 bg-pink-500/20 ring-2 ring-pink-500",
  };

  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const colorKey = color as keyof typeof colorClasses;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full rounded-xl border-2 transition-all duration-300 text-left",
        "hover:scale-[1.02] active:scale-[0.98]",
        sizeClasses[size],
        isSelected
          ? selectedColorClasses[colorKey] || selectedColorClasses.cyan
          : colorClasses[colorKey] || colorClasses.cyan,
        !isSelected && "border-gray-700/50 bg-gray-900/50 hover:border-gray-600"
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            color === "cyan" && "bg-accent-cyan",
            color === "red" && "bg-accent-red",
            color === "green" && "bg-accent-green",
            color === "blue" && "bg-accent-blue",
            !["cyan", "red", "green", "blue"].includes(color) && "bg-accent-cyan"
          )}>
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
