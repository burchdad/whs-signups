alter table admin_users add column if not exists invite_token_hash text;
alter table admin_users add column if not exists invite_expires_at timestamptz;
alter table admin_users add column if not exists invite_used_at timestamptz;

create unique index if not exists admin_users_invite_token_idx
  on admin_users (invite_token_hash)
  where invite_token_hash is not null;
