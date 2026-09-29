import { createFileRoute } from "@tanstack/react-router";
import { TeamAccessPage } from "@/components/admin/team/TeamAccessPage";

export const Route = createFileRoute("/admin/equipo-accesos")({
  component: TeamAccessPage,
});
