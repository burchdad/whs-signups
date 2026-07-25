alter table booster_club_signups
  add column if not exists selected_sports text[] not null default '{}';

create index if not exists booster_club_signups_selected_sports_idx on booster_club_signups using gin (selected_sports);
