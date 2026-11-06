-- Leads CRM and Follow-up Events Migration
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  lot_id uuid references public.lots(id) on delete set null,
  lot_external_id text,
  lot_number integer,
  intent text not null default 'reserve' check (intent in ('reserve', 'info', 'visit')),
  full_name text not null check (char_length(trim(full_name)) > 0),
  phone text not null check (char_length(trim(phone)) > 0),
  email text,
  message text,
  visit_date date,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'visit_scheduled', 'negotiating', 'reserved', 'won', 'lost')),
  assigned_to uuid,
  consent_at timestamptz not null default now(),
  source text default 'plano',
  utm jsonb not null default '{}'::jsonb,
  next_followup_at timestamptz,
  last_contact_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_id uuid,
  kind text not null check (kind in ('created', 'note', 'call', 'whatsapp', 'email', 'status_change', 'lot_change')),
  body text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists leads_project_status_idx on public.leads (project_id, status);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists lead_events_lead_idx on public.lead_events (lead_id, created_at desc);

-- RLS setup
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;

-- Public/anonymous can ONLY insert leads (with valid consent)
drop policy if exists "public can insert leads" on public.leads;
create policy "public can insert leads"
  on public.leads
  for insert
  to anon, authenticated
  with check (true);

-- Authenticated organization members can view leads
drop policy if exists "members can view organization leads" on public.leads;
create policy "members can view organization leads"
  on public.leads
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members membership
      where membership.organization_id = leads.organization_id
        and membership.user_id = auth.uid()
    )
  );

-- Managers can update leads
drop policy if exists "managers can update organization leads" on public.leads;
create policy "managers can update organization leads"
  on public.leads
  for update
  to authenticated
  using (public.can_manage_organization(organization_id))
  with check (public.can_manage_organization(organization_id));

-- Managers can delete leads
drop policy if exists "managers can delete organization leads" on public.leads;
create policy "managers can delete organization leads"
  on public.leads
  for delete
  to authenticated
  using (public.can_manage_organization(organization_id));

-- Lead events policies
drop policy if exists "members can view lead events" on public.lead_events;
create policy "members can view lead events"
  on public.lead_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.leads
      join public.organization_members membership on membership.organization_id = leads.organization_id
      where leads.id = lead_events.lead_id
        and membership.user_id = auth.uid()
    )
  );

drop policy if exists "members can insert lead events" on public.lead_events;
create policy "members can insert lead events"
  on public.lead_events
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.leads
      join public.organization_members membership on membership.organization_id = leads.organization_id
      where leads.id = lead_events.lead_id
        and membership.user_id = auth.uid()
    )
  );

