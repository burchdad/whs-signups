create extension if not exists pgcrypto;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  state text,
  contact_email text,
  reply_to_email text,
  default_location text,
  timezone text not null default 'America/Chicago',
  consent_wording text not null default 'I understand WHSSignups will use my contact information for this volunteer commitment.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organization_admins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table sports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table seasons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  sport_id uuid references sports(id) on delete set null,
  name text not null,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  sport_id uuid references sports(id) on delete set null,
  season_id uuid references seasons(id) on delete set null,
  title text not null,
  slug text not null,
  opponent text,
  event_type text not null default 'Home Game',
  event_date date not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null,
  address text,
  description text,
  home_away text not null default 'home' check (home_away in ('home', 'away', 'neutral')),
  is_published boolean not null default false,
  signup_opens_at timestamptz,
  signup_closes_at timestamptz,
  contact_name text,
  contact_email text,
  is_archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create index events_org_date_idx on events (organization_id, event_date);
create index events_public_idx on events (is_published, is_archived, starts_at);

create table event_schedule_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  label text not null,
  starts_at timestamptz not null,
  sort_order integer not null default 0
);

create table volunteer_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table volunteer_template_slots (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references volunteer_templates(id) on delete cascade,
  name text not null,
  description text,
  category text not null,
  default_capacity integer not null check (default_capacity > 0),
  shift_start_time time,
  shift_end_time time,
  sort_order integer not null default 0,
  instructions text
);

create table volunteer_slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  template_slot_id uuid references volunteer_template_slots(id) on delete set null,
  name text not null,
  description text,
  category text not null,
  shift_start_at timestamptz,
  shift_end_at timestamptz,
  capacity integer not null check (capacity > 0),
  is_open boolean not null default true,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index volunteer_slots_event_idx on volunteer_slots (event_id);

create table signups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  slot_id uuid not null references volunteer_slots(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  normalized_email text not null,
  phone text not null,
  student_name text,
  notes text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'waitlisted', 'removed')),
  confirmation_token_hash text,
  cancellation_token_hash text not null unique,
  consent_at timestamptz not null default now(),
  source text not null default 'public',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index signups_org_email_idx on signups (organization_id, normalized_email);
create index signups_event_idx on signups (event_id);
create index signups_slot_idx on signups (slot_id);
create unique index signups_active_unique_email_slot_idx on signups (slot_id, normalized_email) where status in ('confirmed', 'waitlisted');

create table imports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  filename text not null,
  worksheet_name text,
  status text not null default 'preview' check (status in ('preview', 'published', 'failed')),
  selected_template_id uuid references volunteer_templates(id) on delete set null,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references imports(id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null,
  normalized_data jsonb,
  status text not null check (status in ('valid', 'invalid', 'skipped', 'imported', 'duplicate')),
  errors jsonb not null default '[]',
  warnings jsonb not null default '[]',
  event_id uuid references events(id) on delete set null
);

create table email_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  signup_id uuid references signups(id) on delete set null,
  recipient text not null,
  template text not null,
  status text not null check (status in ('queued', 'sent', 'failed')),
  provider text,
  provider_id text,
  error_message text,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_admins
    where organization_id = org_id and user_id = auth.uid()
  );
$$;

create or replace function create_public_signup(
  p_slot_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_student_name text,
  p_notes text,
  p_confirmation_token_hash text,
  p_cancellation_token_hash text
)
returns signups
language plpgsql
security definer
set search_path = public
as $$
declare
  locked_slot volunteer_slots%rowtype;
  parent_event events%rowtype;
  active_count integer;
  created signups%rowtype;
begin
  select * into locked_slot from volunteer_slots where id = p_slot_id for update;
  if not found or not locked_slot.is_visible then
    raise exception 'slot_closed';
  end if;

  select * into parent_event from events where id = locked_slot.event_id;
  if not parent_event.is_published or parent_event.is_archived or parent_event.starts_at < now()
    or (parent_event.signup_opens_at is not null and parent_event.signup_opens_at > now())
    or (parent_event.signup_closes_at is not null and parent_event.signup_closes_at < now()) then
    raise exception 'event_closed';
  end if;

  if not locked_slot.is_open then
    raise exception 'slot_closed';
  end if;

  select count(*) into active_count from signups where slot_id = p_slot_id and status = 'confirmed';
  if active_count >= locked_slot.capacity then
    raise exception 'slot_full';
  end if;

  insert into signups (
    organization_id, event_id, slot_id, first_name, last_name, email, normalized_email, phone,
    student_name, notes, confirmation_token_hash, cancellation_token_hash
  ) values (
    parent_event.organization_id, parent_event.id, p_slot_id, trim(p_first_name), trim(p_last_name),
    trim(p_email), lower(trim(p_email)), trim(p_phone), nullif(trim(coalesce(p_student_name, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''), p_confirmation_token_hash, p_cancellation_token_hash
  ) returning * into created;

  return created;
end;
$$;

create or replace function cancel_signup_by_token(p_token_hash text)
returns signups
language plpgsql
security definer
set search_path = public
as $$
declare
  updated signups%rowtype;
begin
  update signups
  set status = 'cancelled', cancelled_at = now(), updated_at = now()
  where cancellation_token_hash = p_token_hash and status = 'confirmed'
  returning * into updated;
  if not found then
    raise exception 'invalid_cancellation_token';
  end if;
  return updated;
end;
$$;

create or replace function find_signup_by_cancellation_token(p_token_hash text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'signup', to_jsonb(s),
    'event', to_jsonb(e),
    'slot', to_jsonb(vs)
  )
  from signups s
  join events e on e.id = s.event_id
  join volunteer_slots vs on vs.id = s.slot_id
  where s.cancellation_token_hash = p_token_hash and s.status = 'confirmed'
  limit 1;
$$;

create or replace function public_events_with_slots()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(event_payload order by (event_payload->>'startsAt')), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', e.id,
      'organizationId', e.organization_id,
      'sport', coalesce(sp.name, ''),
      'season', coalesce(se.name, ''),
      'title', e.title,
      'slug', e.slug,
      'opponent', e.opponent,
      'eventType', e.event_type,
      'eventDate', e.event_date,
      'startsAt', e.starts_at,
      'endsAt', e.ends_at,
      'location', e.location,
      'address', e.address,
      'description', e.description,
      'homeAway', e.home_away,
      'isPublished', e.is_published,
      'signupOpensAt', e.signup_opens_at,
      'signupClosesAt', e.signup_closes_at,
      'contactName', e.contact_name,
      'contactEmail', e.contact_email,
      'isArchived', e.is_archived,
      'schedule', coalesce((
        select jsonb_agg(jsonb_build_object('id', esi.id, 'label', esi.label, 'startsAt', esi.starts_at, 'sortOrder', esi.sort_order) order by esi.sort_order)
        from event_schedule_items esi
        where esi.event_id = e.id
      ), '[]'::jsonb),
      'slots', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', vs.id,
          'eventId', vs.event_id,
          'name', vs.name,
          'description', vs.description,
          'category', vs.category,
          'shiftStart', vs.shift_start_at,
          'shiftEnd', vs.shift_end_at,
          'capacity', vs.capacity,
          'filled', (select count(*) from signups s where s.slot_id = vs.id and s.status = 'confirmed'),
          'isOpen', vs.is_open,
          'isVisible', vs.is_visible,
          'sortOrder', vs.sort_order,
          'instructions', vs.instructions
        ) order by vs.sort_order)
        from volunteer_slots vs
        where vs.event_id = e.id and vs.is_visible
      ), '[]'::jsonb)
    ) as event_payload
    from events e
    left join sports sp on sp.id = e.sport_id
    left join seasons se on se.id = e.season_id
    where e.is_published and not e.is_archived
  ) payloads;
$$;

alter table organizations enable row level security;
alter table organization_admins enable row level security;
alter table sports enable row level security;
alter table seasons enable row level security;
alter table events enable row level security;
alter table event_schedule_items enable row level security;
alter table volunteer_templates enable row level security;
alter table volunteer_template_slots enable row level security;
alter table volunteer_slots enable row level security;
alter table signups enable row level security;
alter table imports enable row level security;
alter table import_rows enable row level security;
alter table email_logs enable row level security;
alter table audit_logs enable row level security;

create policy "public read published events" on events for select using (is_published and not is_archived);
create policy "admin manage events" on events for all using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));
create policy "public read schedule for published events" on event_schedule_items for select using (exists (select 1 from events e where e.id = event_id and e.is_published and not e.is_archived));
create policy "admin manage schedule" on event_schedule_items for all using (exists (select 1 from events e where e.id = event_id and is_org_admin(e.organization_id)));
create policy "public read visible slots for published events" on volunteer_slots for select using (is_visible and exists (select 1 from events e where e.id = event_id and e.is_published and not e.is_archived));
create policy "admin manage slots" on volunteer_slots for all using (exists (select 1 from events e where e.id = event_id and is_org_admin(e.organization_id)));
create policy "admin read signups" on signups for select using (is_org_admin(organization_id));
create policy "admin manage signups" on signups for all using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));
create policy "admin manage organizations" on organizations for all using (is_org_admin(id)) with check (is_org_admin(id));
create policy "admin read membership" on organization_admins for select using (is_org_admin(organization_id));
create policy "admin manage sports" on sports for all using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));
create policy "admin manage seasons" on seasons for all using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));
create policy "admin manage templates" on volunteer_templates for all using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));
create policy "admin manage template slots" on volunteer_template_slots for all using (exists (select 1 from volunteer_templates t where t.id = template_id and is_org_admin(t.organization_id)));
create policy "admin manage imports" on imports for all using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));
create policy "admin manage import rows" on import_rows for all using (exists (select 1 from imports i where i.id = import_id and is_org_admin(i.organization_id)));
create policy "admin read email logs" on email_logs for select using (organization_id is null or is_org_admin(organization_id));
create policy "admin read audit logs" on audit_logs for select using (is_org_admin(organization_id));
