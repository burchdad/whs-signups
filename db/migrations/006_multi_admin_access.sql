create table if not exists admin_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  program_type text not null default 'booster_club' check (program_type in ('school','booster_club','sport','band','choir','club','other')),
  notification_email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  normalized_email text not null,
  display_name text not null,
  password_hash text not null,
  role text not null check (role in ('super_admin','organization_admin','program_admin','volunteer_coordinator','roster_viewer')),
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, normalized_email)
);

create table if not exists admin_program_memberships (
  admin_user_id uuid not null references admin_users(id) on delete cascade,
  program_id uuid not null references admin_programs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (admin_user_id, program_id)
);

create table if not exists admin_program_sports (
  program_id uuid not null references admin_programs(id) on delete cascade,
  sport_name text not null,
  primary key (program_id, sport_name)
);

alter table events add column if not exists admin_program_id uuid references admin_programs(id) on delete set null;
alter table events add column if not exists owner_admin_user_id uuid references admin_users(id) on delete set null;

create index if not exists admin_users_email_idx on admin_users(normalized_email);
create index if not exists admin_program_sports_sport_idx on admin_program_sports(sport_name);
create index if not exists events_admin_program_idx on events(admin_program_id);
