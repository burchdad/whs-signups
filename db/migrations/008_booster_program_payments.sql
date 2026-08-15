alter table admin_programs add column if not exists membership_fee_cents integer not null default 0 check (membership_fee_cents >= 0);
alter table admin_programs add column if not exists payment_required boolean not null default false;
alter table admin_programs add column if not exists stripe_price_id text;

alter table booster_club_signups add column if not exists program_id uuid references admin_programs(id) on delete restrict;
alter table booster_club_signups add column if not exists program_name text;
alter table booster_club_signups add column if not exists payment_status text not null default 'not_required' check (payment_status in ('not_required','pending','paid','failed','refunded'));
alter table booster_club_signups add column if not exists payment_amount_cents integer not null default 0 check (payment_amount_cents >= 0);
alter table booster_club_signups add column if not exists stripe_checkout_session_id text;
alter table booster_club_signups add column if not exists stripe_payment_intent_id text;
alter table booster_club_signups add column if not exists paid_at timestamptz;

create index if not exists booster_club_signups_program_idx on booster_club_signups (program_id, created_at desc);
create unique index if not exists booster_club_signups_checkout_session_idx on booster_club_signups (stripe_checkout_session_id) where stripe_checkout_session_id is not null;

insert into admin_programs (organization_id, name, program_type, membership_fee_cents, payment_required)
select id, program.name, 'booster_club', 100, true
from organizations
cross join (values
  ('Whitehouse Community Booster Club'),
  ('Baseball Booster Club'),
  ('Softball Booster Club'),
  ('Cheer Booster Club'),
  ('Dance Booster Club')
) as program(name)
on conflict (organization_id, name) do nothing;

insert into admin_program_sports (program_id, sport_name)
select p.id, mapping.sport_name
from admin_programs p
join (values
  ('Baseball Booster Club', 'Baseball'),
  ('Softball Booster Club', 'Softball'),
  ('Cheer Booster Club', 'Cheerleading (Girls)'),
  ('Dance Booster Club', 'Dance'),
  ('Whitehouse Community Booster Club', 'Basketball (Boys)'),
  ('Whitehouse Community Booster Club', 'Basketball (Girls)'),
  ('Whitehouse Community Booster Club', 'Cross Country (Coed)'),
  ('Whitehouse Community Booster Club', 'Football'),
  ('Whitehouse Community Booster Club', 'Golf (Girls)'),
  ('Whitehouse Community Booster Club', 'Soccer (Boys)'),
  ('Whitehouse Community Booster Club', 'Soccer (Girls)'),
  ('Whitehouse Community Booster Club', 'Swimming and Diving (Coed)'),
  ('Whitehouse Community Booster Club', 'Tennis (Coed)'),
  ('Whitehouse Community Booster Club', 'Track and Field (Boys)'),
  ('Whitehouse Community Booster Club', 'Track and Field (Girls)'),
  ('Whitehouse Community Booster Club', 'Volleyball'),
  ('Whitehouse Community Booster Club', 'Wrestling (Coed)')
) as mapping(program_name, sport_name) on p.name = mapping.program_name
on conflict do nothing;
