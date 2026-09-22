import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AdminLogin } from "@/components/admin/auth/AdminLogin";

export const Route = createFileRoute("/login-admin")({
  head: () => ({
    meta: [{ title: "Login Admin | AUTEM" }],
  }),
  component: LoginAdminRoute,
});

function LoginAdminRoute() {
  const navigate = useNavigate();

  const handleSignIn = () => {
    sessionStorage.setItem("autem-admin-demo-access", "true");
    void navigate({ to: "/admin" });
  };

  return <AdminLogin onSignIn={handleSignIn} />;
}
