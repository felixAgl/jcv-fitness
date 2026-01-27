"use client";

interface JCVLogoProps {
  variant?: "white" | "black" | "blue" | "gray" | "cyan";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const COLORS = {
  white: "#FFFFFF",
  black: "#1A1A1A",
  blue: "#2563EB",
  gray: "#8B8B8B",
  cyan: "#22D3EE",
};

const SIZES = {
  sm: { width: 80, height: 24 },
  md: { width: 120, height: 36 },
  lg: { width: 180, height: 54 },
  xl: { width: 240, height: 72 },
};

export function JCVLogo({
  variant = "cyan",
  size = "md",
  className = "",
  showText = false
}: JCVLogoProps) {
  const color = COLORS[variant];
  const { width, height } = SIZES[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 240 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* J letter */}
        <path
          d="M8 8h40v12H32v24c0 8-4 12-12 12H8v-12h8c4 0 4-2 4-4V20H8V8z"
          fill={color}
        />
        {/* Horizontal line under J connecting to C */}
        <path
          d="M8 44h16c8 0 16 8 16 16v4H28v-4c0-4-4-8-8-8H8v-8z"
          fill={color}
        />
        {/* C letter */}
        <path
          d="M60 20h60v12H72v20h48v12H60V20z"
          fill={color}
        />
        {/* V letter */}
        <path
          d="M140 20l30 44h-16l-22-32-22 32h-16l30-44h16z"
          fill={color}
        />
        {/* Extended V right stroke */}
        <path
          d="M170 20h40l-20 30v-12l8-12h-28z"
          fill={color}
        />
      </svg>
      {showText && (
        <span
          className="font-bold tracking-wider"
          style={{ color, fontSize: height * 0.5 }}
        >
          FITNESS
        </span>
      )}
    </div>
  );
}

// Simplified inline logo for smaller spaces
const MINI_SIZES = {
  sm: { width: 36, height: 12 },
  md: { width: 48, height: 16 },
  lg: { width: 64, height: 21 },
};

export function JCVLogoMini({
  variant = "cyan",
  size = "md",
  className = ""
}: { variant?: "white" | "black" | "blue" | "gray" | "cyan"; size?: "sm" | "md" | "lg"; className?: string }) {
  const color = COLORS[variant];
  const { width, height } = MINI_SIZES[size];

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 48 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 2h8v3H6v5c0 2-1 3-3 3H2v-3h2c1 0 1-0.5 1-1V5H2V2z"
        fill={color}
      />
      <path
        d="M2 10h4c2 0 4 2 4 4v1H7v-1c0-1-1-2-2-2H2v-2z"
        fill={color}
      />
      <path
        d="M14 5h12v3H17v4h9v3H14V5z"
        fill={color}
      />
      <path
        d="M32 5l6 10h-3l-4-7-4 7h-3l6-10h2z"
        fill={color}
      />
      <path
        d="M38 5h8l-4 6v-2l2-3h-6z"
        fill={color}
      />
    </svg>
  );
}

// Animated logo for special sections
export function JCVLogoAnimated({
  variant = "cyan",
  size = "lg",
  className = ""
}: JCVLogoProps) {
  const color = COLORS[variant];
  const { width, height } = SIZES[size];

  return (
    <div className={`group ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 240 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-all duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="jcvGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>
        {/* J letter */}
        <path
          d="M8 8h40v12H32v24c0 8-4 12-12 12H8v-12h8c4 0 4-2 4-4V20H8V8z"
          fill={color}
          className="group-hover:fill-[url(#jcvGradient)] transition-all duration-300"
        />
        <path
          d="M8 44h16c8 0 16 8 16 16v4H28v-4c0-4-4-8-8-8H8v-8z"
          fill={color}
          className="group-hover:fill-[url(#jcvGradient)] transition-all duration-300"
        />
        {/* C letter */}
        <path
          d="M60 20h60v12H72v20h48v12H60V20z"
          fill={color}
          className="group-hover:fill-[url(#jcvGradient)] transition-all duration-300"
        />
        {/* V letter */}
        <path
          d="M140 20l30 44h-16l-22-32-22 32h-16l30-44h16z"
          fill={color}
          className="group-hover:fill-[url(#jcvGradient)] transition-all duration-300"
        />
        <path
          d="M170 20h40l-20 30v-12l8-12h-28z"
          fill={color}
          className="group-hover:fill-[url(#jcvGradient)] transition-all duration-300"
        />
      </svg>
    </div>
  );
}
