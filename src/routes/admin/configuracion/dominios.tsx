import { createFileRoute } from "@tanstack/react-router";
import { DomainSettings } from "@/components/admin/settings/DomainSettings";
import { SettingsPageLayout } from "@/components/admin/shared/SettingsPageLayout";
export const Route = createFileRoute("/admin/configuracion/dominios")({
  component: () => (
    <SettingsPageLayout
      title="Dominios y SEO"
      description="Administra el dominio y la presencia pública."
    >
      <DomainSettings />
    </SettingsPageLayout>
  ),
});
