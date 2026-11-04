-- Migration: 202611040002_panorama_drone_offsets.sql
-- Agrega columnas offset_east_m y offset_north_m a public.project_panoramas

alter table public.project_panoramas
  add column if not exists offset_east_m double precision not null default 0,
  add column if not exists offset_north_m double precision not null default 0;
