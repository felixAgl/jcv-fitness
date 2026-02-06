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
  sm: { width: 60, height: 24 },
  md: { width: 90, height: 36 },
  lg: { width: 135, height: 54 },
  xl: { width: 180, height: 72 },
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
        viewBox="0 0 80 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* J letter */}
        <path
          d="M0 0h16v4H4v20c0 2.5 1.5 4 4 4h8v4H8c-4.5 0-8-3.5-8-8V0z"
          fill={color}
        />
        {/* C letter */}
        <path
          d="M24 0h20v8h-4V4H28v24h12v-4h4v8H24V0z"
          fill={color}
        />
        {/* V letter */}
        <path
          d="M52 0h6l8 22 8-22h6L66 32h-4L48 0h4z"
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
  sm: { width: 36, height: 14 },
  md: { width: 48, height: 19 },
  lg: { width: 64, height: 26 },
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
      viewBox="0 0 80 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* J letter - Modern bold sans-serif */}
      <path
        d="M2 0h10v22c0 3 1.5 5 5 5h1v5h-2c-6 0-9-3.5-9-10V5H2V0z"
        fill={color}
      />
      {/* C letter - Modern bold sans-serif */}
      <path
        d="M26 0h16v5H31v22h11v5H26V0z M42 0h5v11h-5V0z M42 21h5v11h-5V21z"
        fill={color}
        fillRule="evenodd"
      />
      {/* V letter - Modern bold sans-serif */}
      <path
        d="M52 0h5l9 24L75 0h5L68 32h-4L52 0z"
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
        viewBox="0 0 80 32"
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
        {/* J letter - Modern bold sans-serif */}
        <path
          d="M2 0h10v22c0 3 1.5 5 5 5h1v5h-2c-6 0-9-3.5-9-10V5H2V0z"
          fill={color}
          className="group-hover:fill-[url(#jcvGradient)] transition-all duration-300"
        />
        {/* C letter - Modern bold sans-serif */}
        <path
          d="M26 0h16v5H31v22h11v5H26V0z M42 0h5v11h-5V0z M42 21h5v11h-5V21z"
          fill={color}
          fillRule="evenodd"
          className="group-hover:fill-[url(#jcvGradient)] transition-all duration-300"
        />
        {/* V letter - Modern bold sans-serif */}
        <path
          d="M52 0h5l9 24L75 0h5L68 32h-4L52 0z"
          fill={color}
          className="group-hover:fill-[url(#jcvGradient)] transition-all duration-300"
        />
      </svg>
    </div>
  );
}
