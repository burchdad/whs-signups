create extension if not exists pgcrypto;

create table if not exists organizations (
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

create table if not exists sports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  sport_id uuid references sports(id) on delete set null,
  name text not null,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists events (
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
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create index if not exists events_org_date_idx on events (organization_id, event_date);
create index if not exists events_public_idx on events (is_published, is_archived, starts_at);

create table if not exists event_schedule_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  label text not null,
  starts_at timestamptz not null,
  sort_order integer not null default 0
);

create table if not exists volunteer_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists volunteer_template_slots (
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

create table if not exists volunteer_slots (
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

create index if not exists volunteer_slots_event_idx on volunteer_slots (event_id);

create table if not exists signups (
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

create index if not exists signups_org_email_idx on signups (organization_id, normalized_email);
create index if not exists signups_event_idx on signups (event_id);
create index if not exists signups_slot_idx on signups (slot_id);
create unique index if not exists signups_active_unique_email_slot_idx on signups (slot_id, normalized_email) where status in ('confirmed', 'waitlisted');

create table if not exists imports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  filename text not null,
  worksheet_name text,
  status text not null default 'preview' check (status in ('preview', 'published', 'failed')),
  selected_template_id uuid references volunteer_templates(id) on delete set null,
  published_at timestamptz,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists import_rows (
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

create table if not exists email_logs (
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

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_user_id text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
