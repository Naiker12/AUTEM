import type {
  PanoramaCameraConfig,
  PanoramaControlPoint,
  PanoramaLotOverride,
  PanoramaVersionSnapshot,
} from "../types";

const DRAFT_STORAGE_KEY_PREFIX = "autem:panorama360:draft:";
const VERSIONS_STORAGE_KEY_PREFIX = "autem:panorama360:versions:";
const PREVIEW_DRAFT_STORAGE_KEY_PREFIX = "autem:panorama360:preview-draft:";
const MAX_VERSION_SNAPSHOTS = 10;

export interface LocalPanoramaDraft {
  slug: string;
  savedAt: string;
  version: number;
  config: PanoramaCameraConfig;
  overrides: Record<string, PanoramaLotOverride>;
  controlPoints: PanoramaControlPoint[];
}

export function saveLocalPanoramaDraft(draft: LocalPanoramaDraft): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    window.localStorage.setItem(`${DRAFT_STORAGE_KEY_PREFIX}${draft.slug}`, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function loadLocalPanoramaDraft(slug: string): LocalPanoramaDraft | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(`${DRAFT_STORAGE_KEY_PREFIX}${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalPanoramaDraft;
    if (!parsed || typeof parsed !== "object" || !parsed.config) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLocalPanoramaDraft(slug: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(`${DRAFT_STORAGE_KEY_PREFIX}${slug}`);
  } catch {
    // Ignore storage errors
  }
}

export function setPreviewDraftEnabled(slug: string, enabled: boolean): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (enabled) {
      window.localStorage.setItem(`${PREVIEW_DRAFT_STORAGE_KEY_PREFIX}${slug}`, "1");
    } else {
      window.localStorage.removeItem(`${PREVIEW_DRAFT_STORAGE_KEY_PREFIX}${slug}`);
    }
  } catch {
    // Ignore storage errors
  }
}

export function isPreviewDraftEnabled(slug: string): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    return window.localStorage.getItem(`${PREVIEW_DRAFT_STORAGE_KEY_PREFIX}${slug}`) === "1";
  } catch {
    return false;
  }
}

export function loadLocalVersionHistory(slug: string): PanoramaVersionSnapshot[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = window.localStorage.getItem(`${VERSIONS_STORAGE_KEY_PREFIX}${slug}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PanoramaVersionSnapshot[]) : [];
  } catch {
    return [];
  }
}

export function appendVersionSnapshot(
  existing: PanoramaVersionSnapshot[],
  snapshot: Omit<PanoramaVersionSnapshot, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
  slug?: string,
): PanoramaVersionSnapshot[] {
  const entry: PanoramaVersionSnapshot = {
    id: snapshot.id ?? `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    version: snapshot.version,
    status: snapshot.status,
    createdAt: snapshot.createdAt ?? new Date().toISOString(),
    createdBy: snapshot.createdBy,
    note: snapshot.note,
    config: structuredClone(snapshot.config),
    overrides: structuredClone(snapshot.overrides),
    controlPoints: structuredClone(snapshot.controlPoints),
  };

  const next = [entry, ...existing].slice(0, MAX_VERSION_SNAPSHOTS);
  if (slug) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(`${VERSIONS_STORAGE_KEY_PREFIX}${slug}`, JSON.stringify(next));
      }
    } catch {
      // Ignore quota errors
    }
  }
  return next;
}
