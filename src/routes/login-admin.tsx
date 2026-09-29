import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { AdminLogin } from "@/components/admin/auth/AdminLogin";
import { getCurrentAdminAccess, signInToAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/login-admin")({
  head: () => ({
    meta: [{ title: "Login Admin | AUTEM" }],
  }),
  component: LoginAdminRoute,
});

function LoginAdminRoute() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    void getCurrentAdminAccess()
      .then((access) => {
        if (!active) return;
        if (access) {
          void navigate({ to: "/admin", replace: true });
          return;
        }
        setCheckingSession(false);
      })
      .catch(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleSignIn = async (email: string, password: string) => {
    await signInToAdmin(email, password);
    void navigate({ to: "/admin" });
  };

  if (checkingSession) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <LoaderCircle className="size-5 animate-spin text-accent" />
      </main>
    );
  }

  return <AdminLogin onSignIn={handleSignIn} />;
}
