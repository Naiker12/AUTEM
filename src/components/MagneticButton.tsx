import { useRef, forwardRef, type ReactNode, type MouseEventHandler, type ComponentPropsWithoutRef } from "react";

interface MagneticButtonProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: MouseEventHandler<HTMLDivElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const MagneticButton = forwardRef<HTMLDivElement, MagneticButtonProps>(
  ({ children, className = "", strength = 0.3, onClick, ...props }, ref) => {
    const innerRef = useRef<HTMLDivElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLDivElement | null>) || innerRef;
    const frameRef = useRef<number>(0);

    const handleMouseMove: MouseEventHandler<HTMLDivElement> = (e) => {
      const el = resolvedRef.current;
      if (!el) return;
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
    };

    const handleMouseLeave = () => {
      const el = resolvedRef.current;
      if (!el) return;
      cancelAnimationFrame(frameRef.current);
      el.style.transform = "translate(0px, 0px)";
    };

    return (
      <div
        ref={resolvedRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        className={`magnetic-btn ${className}`}
        role="button"
        tabIndex={0}
        {...props}
      >
        {children}
      </div>
    );
  },
);

MagneticButton.displayName = "MagneticButton";

export default MagneticButton;
