import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [location.href]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.35s cubic-bezier(0.19, 1, 0.22, 1)",
      }}
    >
      {children}
    </div>
  );
}
