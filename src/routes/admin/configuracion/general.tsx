import { createFileRoute } from "@tanstack/react-router"
import { GeneralSettings } from "@/components/admin/settings/GeneralSettings"
import { SettingsPageLayout } from "@/components/admin/shared/SettingsPageLayout"
export const Route = createFileRoute("/admin/configuracion/general")({ component: () => <SettingsPageLayout title="General de AUTEM" description="Administra los datos institucionales que identifican a AUTEM."><GeneralSettings /></SettingsPageLayout> })
