import { Toaster as Sonner } from "sonner";
import {
  CheckCircle2,
  CircleAlert,
  CircleX,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      duration={5000}
      gap={10}
      offset="1.25rem"
      icons={{
        success: <CheckCircle2 className="size-4" aria-hidden="true" />,
        error: <CircleX className="size-4" aria-hidden="true" />,
        warning: <TriangleAlert className="size-4" aria-hidden="true" />,
        info: <Info className="size-4" aria-hidden="true" />,
        loading: <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />,
        close: <X className="size-3" aria-hidden="true" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:w-[min(24rem,calc(100vw-2rem))] group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:bg-popover group-[.toaster]:px-4 group-[.toaster]:py-3.5 group-[.toaster]:text-popover-foreground group-[.toaster]:shadow-xl",
          content: "gap-0",
          title: "pr-5 text-sm font-semibold tracking-[-0.01em] text-popover-foreground",
          description: "mt-1 pr-3 text-xs leading-relaxed text-muted-foreground",
          icon: "mr-3 mt-0.5",
          closeButton:
            "!left-auto !right-3 !top-3 !border-border !bg-popover !text-muted-foreground hover:!bg-muted hover:!text-foreground",
          success: "border-l-4 border-l-primary [&_.sonner-icon]:text-primary",
          error: "border-l-4 border-l-destructive [&_.sonner-icon]:text-destructive",
          warning: "border-l-4 border-l-accent [&_.sonner-icon]:text-accent",
          info: "border-l-4 border-l-primary [&_.sonner-icon]:text-primary",
          loading: "border-l-4 border-l-primary [&_.sonner-icon]:text-primary",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
