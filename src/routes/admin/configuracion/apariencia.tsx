import { createFileRoute } from "@tanstack/react-router";
import { AppearanceSettings } from "@/components/admin/settings/AppearanceSettings";
import { SettingsPageLayout } from "@/components/admin/shared/SettingsPageLayout";
export const Route = createFileRoute("/admin/configuracion/apariencia")({
  component: () => (
    <SettingsPageLayout
      title="Apariencia y tema"
      description="Configura la identidad visual de AUTEM."
    >
      <AppearanceSettings />
    </SettingsPageLayout>
  ),
});
