import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

import AutemBrandIcon from "@/components/AutemBrandIcon";

export function AdminContentTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigationStatus = useRouterState({ select: (state) => state.status });
  const previousPathname = useRef(pathname);
  const [isChangingView, setIsChangingView] = useState(false);

  useEffect(() => {
    if (previousPathname.current === pathname) return;

    previousPathname.current = pathname;
    setIsChangingView(true);
    const timeout = window.setTimeout(() => setIsChangingView(false), 430);

    return () => window.clearTimeout(timeout);
  }, [pathname]);

  const isLoading = isChangingView || navigationStatus === "pending";

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1">
      <div key={pathname} className="admin-view-enter w-full flex-1">
        {children}
      </div>

      {isLoading ? (
        <div
          className="pointer-events-none absolute inset-0 flex min-h-56 items-center justify-center bg-background/55 backdrop-blur-[1px]"
          aria-live="polite"
          aria-label="Cargando vista"
        >
          <AutemBrandIcon size={54} className="admin-view-loader-mark" />
        </div>
      ) : null}
    </div>
  );
}
