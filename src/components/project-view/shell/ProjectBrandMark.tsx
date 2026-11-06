import React from "react";
import { Link } from "@tanstack/react-router";
import AutemBrandIcon from "@/components/brand/AutemBrandIcon";
import { cn } from "@/lib/utils";

interface ProjectBrandMarkProps {
  projectName?: string;
  logoUrl?: string;
  className?: string;
  isDark?: boolean;
  withBackLink?: boolean;
}

export default function ProjectBrandMark({
  projectName = "Villa Paraíso",
  logoUrl,
  className,
  isDark = false,
  withBackLink = true,
}: ProjectBrandMarkProps) {
  const content = (
    <div className={cn("group flex items-center select-none", className)}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={projectName}
          className={cn(
            "h-8 sm:h-9 md:h-10 w-auto max-w-[200px] sm:max-w-[260px] object-contain transition-transform duration-300 group-hover:scale-[1.02]",
            isDark && "brightness-0 invert drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]",
          )}
        />
      ) : (
        <div className="flex items-center gap-2">
          <AutemBrandIcon size={22} />
          <strong className="font-serif text-base sm:text-lg font-medium leading-none tracking-tight text-foreground">
            {projectName}
          </strong>
        </div>
      )}
    </div>
  );

  if (withBackLink) {
    return (
      <Link
        to="/"
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
        aria-label={`Volver al inicio - ${projectName}`}
      >
        {content}
      </Link>
    );
  }

  return content;
}
