import { createFileRoute } from "@tanstack/react-router";

import { AdminPasswordRecovery } from "@/components/admin/auth/AdminPasswordRecovery";
import { requestPasswordReset, verifyRecoveryCode } from "@/lib/admin-auth";

export const Route = createFileRoute("/recuperar-acceso")({
  head: () => ({ meta: [{ title: "Recuperar acceso | AUTEM" }] }),
  component: RecoveryAccessRoute,
});

function RecoveryAccessRoute() {
  return (
    <AdminPasswordRecovery onRequestCode={requestPasswordReset} onVerifyCode={verifyRecoveryCode} />
  );
}
