create table if not exists sport_media (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  sport_name text not null,
  label text not null default 'Team',
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_data bytea not null,
  sort_order integer not null default 0,
  uploaded_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sport_name, label)
);

create index if not exists sport_media_sport_idx on sport_media (organization_id, sport_name, sort_order);

alter table events add column if not exists contact_name text;
alter table events add column if not exists contact_email text;
alter table events add column if not exists created_by text;

create unique index if not exists email_logs_signup_template_recipient_idx
  on email_logs(signup_id, template, recipient)
  where signup_id is not null;
