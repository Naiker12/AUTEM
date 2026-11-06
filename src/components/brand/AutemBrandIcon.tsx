import { useId } from "react";

interface AutemBrandIconProps {
  size?: number;
  className?: string;
}

/** Animated architectural monogram used consistently across AUTEM surfaces. */
export default function AutemBrandIcon({ size = 32, className = "" }: AutemBrandIconProps) {
  const gradientId = useId().replaceAll(":", "");

  return (
    <span
      className={`autem-mark inline-flex shrink-0 items-center justify-center text-accent ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 52 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full overflow-visible"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="8"
            y1="5"
            x2="44"
            y2="43"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#E4C273" />
            <stop offset="0.5" stopColor="#C5A059" />
            <stop offset="1" stopColor="#8E682B" />
          </linearGradient>
          <filter id={`${gradientId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          className="autem-mark__outline"
          d="M5 40L25.8 5L47 40H38.4L25.9 19.2L13.7 40H5Z"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path
          className="autem-mark__horizon"
          d="M9.5 39.8C14.6 30.3 20.1 27.3 25.9 27.3C31.7 27.3 37.4 30.3 42.5 39.8"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.1"
          strokeLinecap="round"
        />
        <path
          className="autem-mark__core"
          d="M18.4 39.6C20.4 34.7 22.9 32.7 25.9 32.7C28.9 32.7 31.6 34.7 33.6 39.6"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.1"
          strokeLinecap="round"
        />
        <path
          className="autem-mark__scan"
          d="M10 40H42"
          stroke="#F2D58B"
          strokeWidth="1.2"
          strokeLinecap="round"
          filter={`url(#${gradientId}-glow)`}
        />
      </svg>
    </span>
  );
}
