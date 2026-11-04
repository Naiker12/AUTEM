-- Migration: 202611040001_project_panoramas.sql
-- Tabla de configuración y calibración de panoramas 360° por proyecto

create table if not exists public.project_panoramas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  slug text not null default 'main',
  label text not null default 'Localización 360°',
  enabled boolean not null default true,

  -- Imágenes en el bucket project-360 (<project_id>/panoramas/...)
  desktop_image_path text not null,
  mobile_image_path text,
  preview_image_path text,

  -- Recorte equirectangular (valores para 8192x4096)
  full_width integer not null default 8192,
  full_height integer not null default 4096,
  cropped_width integer not null default 8192,
  cropped_height integer not null default 2790,
  cropped_x integer not null default 0,
  cropped_y integer not null default 1294,

  -- Posición y orientación del dron
  camera_lat double precision not null,
  camera_lng double precision not null,
  height_above_ground_m double precision not null default 186,
  yaw_offset_deg double precision not null default 174.8,
  pitch_tilt_deg double precision not null default -0.5,
  roll_tilt_deg double precision not null default 0.4,

  -- Límites de cámara
  min_pitch_deg double precision not null default -89.5,
  max_pitch_deg double precision not null default 33.1,
  default_yaw_deg double precision not null default 8,
  default_pitch_deg double precision not null default -32,

  -- Puntos de control usados para calibrar y overrides por lote
  control_points jsonb not null default '[]'::jsonb,
  lot_overrides jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, slug)
);

alter table public.project_panoramas enable row level security;

create policy "project_panoramas_public_read"
on public.project_panoramas for select
to anon, authenticated
using (
  enabled = true
  and exists (
    select 1 from public.projects p
    where p.id = project_panoramas.project_id
      and p.visibility = 'publico'
      and p.status = 'publicado'
  )
);

create policy "project_panoramas_admin_all"
on public.project_panoramas for all
to authenticated
using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

