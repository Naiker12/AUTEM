import type { Lot } from "@/data/lots";

export function matchDestinationLots(lots: Lot[], query: string) {
  const number = query.replace(/\D/g, "");
  if (!number) return [];
  const label = (lot: Lot) => String(lot.lotNumber ?? lot.id.replace("L-", ""));
  return lots
    .filter((lot) => lot.centroid && !lot.isReserve && label(lot).includes(number))
    .sort(
      (a, b) =>
        Number(label(b) === number) - Number(label(a) === number) ||
        Number(label(a)) - Number(label(b)),
    )
    .slice(0, 6);
}
