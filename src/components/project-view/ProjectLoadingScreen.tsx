import { useEffect, useState } from "react";
interface ProjectLoadingScreenProps {
  projectName: string;
  projectLocation?: string;
  onFinish?: () => void;
  minDuration?: number;
  variant?: "default" | "dark-compact";
}
/** Brand entrance, not simulated network progress. */
export default function ProjectLoadingScreen({
  projectName,
  projectLocation,
  onFinish,
  minDuration = 650,
  variant = "default",
}: ProjectLoadingScreenProps) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 0 : minDuration;
    const fadeTimer = window.setTimeout(() => {
      setLeaving(true);
      onFinish?.();
    }, duration);
    const removeTimer = window.setTimeout(() => setVisible(false), duration + (reduced ? 0 : 300));
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [minDuration, onFinish]);
  if (!visible) return null;
  return (
    <div
      className={`project-intro${variant === "dark-compact" ? " project-intro--dark-compact" : ""}`}
      data-leaving={leaving}
      aria-hidden="true"
    >
      <p>AUTEM · Arquitectura y territorio</p>
      <h2>{projectName}</h2>
      <span className="project-intro__line" />
      {projectLocation && <p>{projectLocation}</p>}
    </div>
  );
}
