create table if not exists booster_club_signups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  normalized_email text not null,
  phone text not null,
  gear_preference text not null check (gear_preference in ('hat', 'shirt')),
  open_to_volunteering boolean not null,
  interested_in_sponsoring boolean not null,
  consent_at timestamptz not null default now(),
  source text not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booster_club_signups_org_email_idx on booster_club_signups (organization_id, normalized_email);
create index if not exists booster_club_signups_created_at_idx on booster_club_signups (created_at desc);
