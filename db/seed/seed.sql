insert into organizations (id, name, city, state, contact_email, reply_to_email, default_location)
values ('11111111-1111-4111-8111-111111111111', 'Whitehouse High School', 'Whitehouse', 'Texas', 'volunteers@whssignups.com', 'volunteers@whssignups.com', 'Whitehouse High School')
on conflict do nothing;

insert into sports (id, organization_id, name)
values ('21111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Volleyball')
on conflict do nothing;

insert into seasons (id, organization_id, sport_id, name, starts_on, ends_on)
values ('31111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '21111111-1111-4111-8111-111111111111', '2026', '2026-07-01', '2026-11-30')
on conflict do nothing;

\ir ../migrations/002_replace_2026_home_games.sql
\ir ../migrations/003_booster_club_signups.sql
\ir ../migrations/004_booster_club_selected_sports.sql
\ir ../migrations/005_notifications_media_and_flexible_roles.sql
\ir ../migrations/006_multi_admin_access.sql
\ir ../migrations/007_football_2026_home_schedule.sql
\ir ../migrations/008_booster_program_payments.sql
\ir ../migrations/009_connected_stripe_accounts.sql
\ir ../migrations/010_dashboard_email_settings.sql
\ir ../migrations/005_student_shift_windows.sql
