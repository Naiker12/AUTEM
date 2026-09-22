import { properties } from "./properties";
import { getLotsByProject } from "./lots";

// Records configured in the website; not a live commercial database.
export const adminProjects = properties.map((property) => ({
  name: property.name,
  city: property.location,
  lots: getLotsByProject(property.slug).length,
  status: "Configurado",
}));
