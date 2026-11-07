import { useCallback, useRef, useState } from "react";
import type { PanoramaCameraConfig, PanoramaControlPoint, PanoramaLotOverride } from "../types";

export interface PanoramaEditorSnapshot {
  config: PanoramaCameraConfig;
  overrides: Record<string, PanoramaLotOverride>;
  controlPoints: PanoramaControlPoint[];
  description?: string;
}

const MAX_UNDO_STEPS = 60;

export function useUndoHistory(initialState: PanoramaEditorSnapshot) {
  const [past, setPast] = useState<PanoramaEditorSnapshot[]>([]);
  const [future, setFuture] = useState<PanoramaEditorSnapshot[]>([]);
  const currentRef = useRef<PanoramaEditorSnapshot>(initialState);

  const syncCurrent = useCallback((state: PanoramaEditorSnapshot) => {
    currentRef.current = state;
  }, []);

  const pushSnapshot = useCallback((prevState: PanoramaEditorSnapshot, description?: string) => {
    const cloned: PanoramaEditorSnapshot = {
      config: structuredClone(prevState.config),
      overrides: structuredClone(prevState.overrides),
      controlPoints: structuredClone(prevState.controlPoints),
      description,
    };
    setPast((prev) => {
      const next = [...prev, cloned];
      return next.length > MAX_UNDO_STEPS ? next.slice(next.length - MAX_UNDO_STEPS) : next;
    });
    setFuture([]);
  }, []);

  const undo = useCallback(
    (currentState: PanoramaEditorSnapshot): PanoramaEditorSnapshot | null => {
      if (past.length === 0) return null;
      const previous = past[past.length - 1];
      const nextPast = past.slice(0, -1);
      const clonedCurrent: PanoramaEditorSnapshot = {
        config: structuredClone(currentState.config),
        overrides: structuredClone(currentState.overrides),
        controlPoints: structuredClone(currentState.controlPoints),
      };
      setPast(nextPast);
      setFuture((f) => [clonedCurrent, ...f].slice(0, MAX_UNDO_STEPS));
      currentRef.current = previous;
      return previous;
    },
    [past],
  );

  const redo = useCallback(
    (currentState: PanoramaEditorSnapshot): PanoramaEditorSnapshot | null => {
      if (future.length === 0) return null;
      const nextState = future[0];
      const nextFuture = future.slice(1);
      const clonedCurrent: PanoramaEditorSnapshot = {
        config: structuredClone(currentState.config),
        overrides: structuredClone(currentState.overrides),
        controlPoints: structuredClone(currentState.controlPoints),
      };
      setFuture(nextFuture);
      setPast((p) => [...p, clonedCurrent].slice(-MAX_UNDO_STEPS));
      currentRef.current = nextState;
      return nextState;
    },
    [future],
  );

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undoCount: past.length,
    redoCount: future.length,
    pushSnapshot,
    undo,
    redo,
    syncCurrent,
    clearHistory,
  };
}
