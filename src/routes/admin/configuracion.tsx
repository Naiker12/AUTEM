import { Outlet, createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/configuracion")({ component: SettingsPreview });
function SettingsPreview() {
  return (
    <>
      <div role="status" className="mx-5 mt-6 rounded-xl border border-border bg-muted p-4 text-sm">
        Configuración en preparación: estos formularios no están conectados al sitio ni guardan
        cambios. Se habilitarán al conectar autenticación y almacenamiento.
      </div>
      <fieldset disabled className="min-w-0">
        <Outlet />
      </fieldset>
    </>
  );
}
