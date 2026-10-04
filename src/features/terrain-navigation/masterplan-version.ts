import layers from "@/data/villa-paraiso-layers.json";
export const masterplanBounds = layers.dimensions;
/** Identifies the actual vector background rendered by MasterplanSvgViewer. */
export async function renderedMasterplanVersion() {
  const bytes = new TextEncoder().encode(JSON.stringify(layers));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(hash), (v) => v.toString(16).padStart(2, "0")).join("")}`;
}
