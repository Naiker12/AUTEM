-- =============================================================================
-- Migración aditiva: Versionado, borradores y publicación para Calibrador 360°
-- NO borra ni pisa lot_overrides ni control_points existentes.
-- =============================================================================

alter table public.project_panoramas
  add column if not exists version integer not null default 1,
  add column if not exists published_config jsonb,
  add column if not exists published_overrides jsonb,
  add column if not exists draft_config jsonb,
  add column if not exists draft_overrides jsonb,
  add column if not exists version_history jsonb not null default '[]'::jsonb;

comment on column public.project_panoramas.version is
  'Contador incremental de versión para control optimista y auditoría de calibración 360.';
comment on column public.project_panoramas.published_config is
  'Configuración de cámara 360 publicada para el visor público.';
comment on column public.project_panoramas.published_overrides is
  'Overrides por lote publicados para el visor público.';
comment on column public.project_panoramas.draft_config is
  'Borrador de configuración de cámara 360 guardado desde el Calibrador.';
comment on column public.project_panoramas.draft_overrides is
  'Borrador de overrides por lote guardado desde el Calibrador.';
comment on column public.project_panoramas.version_history is
  'Historial de las últimas 10 versiones (draft/published) para restauración en 1 clic.';

