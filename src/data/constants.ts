export const WHATSAPP_NUMBER = "573007200894";
export const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export interface FinishOption {
  id: string;
  label: string;
  color: string;
  material: string;
}

export const FINISHES: FinishOption[] = [
  { id: "nordic", label: "Nórdico", color: "#E5E4E2", material: "Mármol blanco" },
  { id: "walnut", label: "Nogal", color: "#4A3728", material: "Madera oscura" },
  { id: "stone", label: "Piedra", color: "#8D918D", material: "Concreto pulido" },
  { id: "gold", label: "Dorado", color: "#8A6A3B", material: "Latón cepillado" },
];
