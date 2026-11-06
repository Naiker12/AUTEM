import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ContainerProps = HTMLAttributes<HTMLDivElement>;

/** Shared editorial alignment rail for full-width AUTEM sections. */
export default function Container({ className, ...props }: ContainerProps) {
  return <div className={cn("mx-auto w-full max-w-[1440px]", className)} {...props} />;
}
