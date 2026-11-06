import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const FAVORITES_STORAGE_KEY = "autem_favorite_lots";

export function useFavoriteLots() {
  const [favoriteLotIds, setFavoriteLotIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteLotIds));
    } catch {
      /* ignore storage errors */
    }
  }, [favoriteLotIds]);

  const toggleFavorite = useCallback((lotId: string, lotLabel?: string) => {
    setFavoriteLotIds((prev) => {
      const isFav = prev.includes(lotId);
      const next = isFav ? prev.filter((id) => id !== lotId) : [...prev, lotId];
      if (isFav) {
        toast.info(lotLabel ? `Lote ${lotLabel} removido de guardados` : "Lote removido");
      } else {
        toast.success(lotLabel ? `Lote ${lotLabel} guardado en favoritos` : "Lote guardado");
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (lotId: string) => favoriteLotIds.includes(lotId),
    [favoriteLotIds],
  );

  const clearFavorites = useCallback(() => {
    setFavoriteLotIds([]);
    try {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return {
    favoriteLotIds,
    favoritesCount: favoriteLotIds.length,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  };
}
