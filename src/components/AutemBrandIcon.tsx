interface AutemBrandIconProps {
  size?: number;
  className?: string;
}

/**
 * Brand icon for AUTEM featuring the signature architectural 'A' mark.
 */
export default function AutemBrandIcon({ size = 32, className = "" }: AutemBrandIconProps) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-accent to-amber-600 text-stone-950 font-serif font-black shadow-md shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={Math.round(size * 0.65)}
        height={Math.round(size * 0.65)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 3L3.5 20.5H7.8L9.8 16H14.2L16.2 20.5H20.5L12 3ZM12 8.8L13.5 12.8H10.5L12 8.8Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
