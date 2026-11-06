import { useEffect, useState } from "react";

import { requireSupabase } from "@/lib/supabase";

export type SiteMediaRecord = {
  id: string;
  organization_id: string;
  bucket_id: string;
  storage_path: string;
  placement_key: string;
  title: string | null;
  alt_text: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
  is_public: boolean;
  url: string;
};

export type SiteContentRecord = {
  section_key: string;
  content: Record<string, unknown>;
  is_published: boolean;
};

export function publicSiteMediaUrl(storagePath: string) {
  return requireSupabase().storage.from("site-media").getPublicUrl(storagePath).data.publicUrl;
}

export async function listSiteMedia(organizationId?: string): Promise<SiteMediaRecord[]> {
  let request = requireSupabase()
    .from("site_media")
    .select("*")
    .order("placement_key", { ascending: true })
    .order("sort_order", { ascending: true });
  if (organizationId) request = request.eq("organization_id", organizationId);
  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []).map((item) => ({
    ...item,
    url: publicSiteMediaUrl(item.storage_path),
  })) as SiteMediaRecord[];
}

export async function listPublishedSiteContent(): Promise<SiteContentRecord[]> {
  const { data, error } = await requireSupabase()
    .from("site_content")
    .select("section_key, content, is_published")
    .eq("is_published", true);
  if (error) throw error;
  return (data ?? []) as SiteContentRecord[];
}

export function usePublicSiteMedia() {
  const [media, setMedia] = useState<SiteMediaRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void listSiteMedia()
      .then((items) => {
        if (active) setMedia(items);
      })
      .catch((error) => console.warn("No fue posible cargar los medios del sitio:", error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const byPlacement = (placementKey: string, fallback = "") =>
    media.find((item) => item.placement_key === placementKey)?.url ?? fallback;

  return { media, loading, byPlacement };
}
