import { createFileRoute } from "@tanstack/react-router"
import { NotificationSettings } from "@/components/admin/settings/NotificationSettings"
import { SettingsPageLayout } from "@/components/admin/shared/SettingsPageLayout"
export const Route = createFileRoute("/admin/configuracion/notificaciones")({ component: () => <SettingsPageLayout title="Notificaciones" description="Decide qué eventos deben avisar al equipo."><NotificationSettings /></SettingsPageLayout> })
