import { createFileRoute } from "@tanstack/react-router";
import { IntegrationSettings } from "@/components/admin/settings/IntegrationSettings";
import { SettingsPageLayout } from "@/components/admin/shared/SettingsPageLayout";
export const Route = createFileRoute("/admin/configuracion/integraciones")({
  component: () => (
    <SettingsPageLayout title="Integraciones" description="Conecta servicios externos autorizados.">
      <IntegrationSettings />
    </SettingsPageLayout>
  ),
});
