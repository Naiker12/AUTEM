-- Add logo_path to public.projects to allow project-level branding management from admin
alter table public.projects
  add column if not exists logo_path text;

-- Allow 'logo' in project_media media_type check constraint if present
do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'project_media'
      and constraint_name = 'project_media_media_type_check'
  ) then
    alter table public.project_media drop constraint project_media_media_type_check;
    alter table public.project_media add constraint project_media_media_type_check
      check (media_type in ('cover', 'gallery', 'masterplan', 'document', 'tour', 'cad_source', 'masterplan_vector', 'georef', 'logo'));
  end if;
end $$;
