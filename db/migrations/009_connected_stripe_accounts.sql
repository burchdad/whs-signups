alter table admin_programs add column if not exists stripe_account_id text;
alter table admin_programs add column if not exists stripe_account_charges_enabled boolean not null default false;
alter table admin_programs add column if not exists stripe_account_verified_at timestamptz;

create unique index if not exists admin_programs_stripe_account_unique
  on admin_programs (stripe_account_id)
  where stripe_account_id is not null;

alter table booster_club_signups add column if not exists stripe_account_id text;
