import { createFileRoute, Navigate } from "@tanstack/react-router";

/**
 * AUTEM now presents one land development rather than a multi-property catalogue.
 * Keep the legacy URL so existing links land in the immersive lot explorer.
 */
export const Route = createFileRoute("/catalogo")({
  component: CatalogRedirect,
});

function CatalogRedirect() {
  return <Navigate to="/proyecto/$slug" params={{ slug: "lotes-360" }} replace />;
}
