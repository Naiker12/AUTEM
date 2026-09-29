-- Compatibility migration for a pre-existing public.projects table.
-- Adds catalog fields without deleting or replacing existing projects.

alter table public.projects
  add column if not exists property_type text not null default 'terreno',
  add column if not exists location text not null default '',
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists price_label text,
  add column if not exists price_from_cop bigint,
  add column if not exists area_label text,
  add column if not exists description text,
  add column if not exists long_description text,
  add column if not exists features jsonb not null default '[]'::jsonb,
  add column if not exists cover_path text,
  add column if not exists masterplan_path text,
  add column if not exists masterplan_version text,
  add column if not exists tour_url text,
  add column if not exists published_at timestamptz;

alter table public.projects
  drop constraint if exists projects_price_from_cop_check,
  add constraint projects_price_from_cop_check check (price_from_cop is null or price_from_cop >= 0),
  drop constraint if exists projects_features_array_check,
  add constraint projects_features_array_check check (jsonb_typeof(features) = 'array');

create unique index if not exists projects_organization_slug_unique
  on public.projects (organization_id, slug);

create index if not exists projects_public_lookup_idx
  on public.projects (slug)
  where status = 'published';
