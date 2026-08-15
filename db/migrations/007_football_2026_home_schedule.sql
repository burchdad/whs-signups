begin;

insert into sports (id, organization_id, name)
values ('21111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', 'Football')
on conflict (organization_id, name) do update set name = excluded.name;

insert into seasons (id, organization_id, sport_id, name, starts_on, ends_on)
values ('31111111-1111-4111-8111-111111111112', '11111111-1111-4111-8111-111111111111', (select id from sports where organization_id='11111111-1111-4111-8111-111111111111' and name='Football'), '2026 Football', '2026-08-01', '2026-11-30')
on conflict (organization_id, name) do update set sport_id=excluded.sport_id, starts_on=excluded.starts_on, ends_on=excluded.ends_on;

insert into events (id, organization_id, sport_id, season_id, title, slug, opponent, event_type, event_date, starts_at, location, description, is_published)
values
('44444444-4444-4444-8444-444444444501','11111111-1111-4111-8111-111111111111',(select id from sports where organization_id='11111111-1111-4111-8111-111111111111' and name='Football'),(select id from seasons where organization_id='11111111-1111-4111-8111-111111111111' and name='2026 Football'),'Whitehouse vs. Chapel Hill','whitehouse-football-vs-chapel-hill-2026-08-27','Chapel Hill','Home Game','2026-08-27','2026-08-27 19:30:00-05','Wildcat Stadium','Varsity home game.',true),
('44444444-4444-4444-8444-444444444502','11111111-1111-4111-8111-111111111111',(select id from sports where organization_id='11111111-1111-4111-8111-111111111111' and name='Football'),(select id from seasons where organization_id='11111111-1111-4111-8111-111111111111' and name='2026 Football'),'Whitehouse vs. Lindale','whitehouse-football-vs-lindale-2026-09-03','Lindale','Home Game','2026-09-03','2026-09-03 17:00:00-05','Wildcat Stadium','Freshman and junior varsity home games.',true),
('44444444-4444-4444-8444-444444444503','11111111-1111-4111-8111-111111111111',(select id from sports where organization_id='11111111-1111-4111-8111-111111111111' and name='Football'),(select id from seasons where organization_id='11111111-1111-4111-8111-111111111111' and name='2026 Football'),'Whitehouse vs. Sulphur Springs','whitehouse-football-vs-sulphur-springs-2026-09-11','Sulphur Springs','Home Game','2026-09-11','2026-09-11 19:30:00-05','Wildcat Stadium','Varsity home game.',true),
('44444444-4444-4444-8444-444444444504','11111111-1111-4111-8111-111111111111',(select id from sports where organization_id='11111111-1111-4111-8111-111111111111' and name='Football'),(select id from seasons where organization_id='11111111-1111-4111-8111-111111111111' and name='2026 Football'),'Whitehouse vs. Mt. Pleasant','whitehouse-football-vs-mt-pleasant-2026-09-18','Mt. Pleasant','Home Game','2026-09-18','2026-09-18 19:30:00-05','Wildcat Stadium','Varsity district home game.',true),
('44444444-4444-4444-8444-444444444505','11111111-1111-4111-8111-111111111111',(select id from sports where organization_id='11111111-1111-4111-8111-111111111111' and name='Football'),(select id from seasons where organization_id='11111111-1111-4111-8111-111111111111' and name='2026 Football'),'Whitehouse vs. Nacogdoches','whitehouse-football-vs-nacogdoches-2026-09-24','Nacogdoches','Home Game','2026-09-24','2026-09-24 17:00:00-05','Wildcat Stadium','Freshman and junior varsity district home games.',true),
('44444444-4444-4444-8444-444444444506','11111111-1111-4111-8111-111111111111',(select id from sports where organization_id='11111111-1111-4111-8111-111111111111' and name='Football'),(select id from seasons where organization_id='11111111-1111-4111-8111-111111111111' and name='2026 Football'),'Whitehouse vs. Greenville','whitehouse-football-vs-greenville-2026-10-08','Greenville','Home Game','2026-10-08','2026-10-08 17:00:00-05','Wildcat Stadium','Freshman and junior varsity district home games.',true),
('44444444-4444-4444-8444-444444444507','11111111-1111-4111-8111-111111111111',(select id from sports where organization_id='11111111-1111-4111-8111-111111111111' and name='Football'),(select id from seasons where organization_id='11111111-1111-4111-8111-111111111111' and name='2026 Football'),'Whitehouse vs. Texas High','whitehouse-football-vs-texas-high-2026-10-16','Texas High','Home Game','2026-10-16','2026-10-16 19:30:00-05','Wildcat Stadium','Varsity district home game.',true),
('44444444-4444-4444-8444-444444444508','11111111-1111-4111-8111-111111111111',(select id from sports where organization_id='11111111-1111-4111-8111-111111111111' and name='Football'),(select id from seasons where organization_id='11111111-1111-4111-8111-111111111111' and name='2026 Football'),'Whitehouse vs. Terrell','whitehouse-football-vs-terrell-2026-10-22','Terrell','Home Game','2026-10-22','2026-10-22 17:00:00-05','Wildcat Stadium','Freshman and junior varsity district home games.',true),
('44444444-4444-4444-8444-444444444509','11111111-1111-4111-8111-111111111111',(select id from sports where organization_id='11111111-1111-4111-8111-111111111111' and name='Football'),(select id from seasons where organization_id='11111111-1111-4111-8111-111111111111' and name='2026 Football'),'Whitehouse vs. Hallsville','whitehouse-football-vs-hallsville-2026-10-30','Hallsville','Home Game','2026-10-30','2026-10-30 19:30:00-05','Wildcat Stadium','Varsity district home game.',true),
('44444444-4444-4444-8444-444444444510','11111111-1111-4111-8111-111111111111',(select id from sports where organization_id='11111111-1111-4111-8111-111111111111' and name='Football'),(select id from seasons where organization_id='11111111-1111-4111-8111-111111111111' and name='2026 Football'),'Whitehouse vs. Marshall','whitehouse-football-vs-marshall-2026-11-05','Marshall','Home Game','2026-11-05','2026-11-05 17:00:00-06','Wildcat Stadium','Freshman and junior varsity district home games.',true)
on conflict (id) do update set title=excluded.title, opponent=excluded.opponent, event_date=excluded.event_date, starts_at=excluded.starts_at, location=excluded.location, description=excluded.description, is_published=true, updated_at=now();

insert into event_schedule_items (event_id,label,starts_at,sort_order)
select id,'Varsity',starts_at,1 from events where id in ('44444444-4444-4444-8444-444444444501','44444444-4444-4444-8444-444444444503','44444444-4444-4444-8444-444444444504','44444444-4444-4444-8444-444444444507','44444444-4444-4444-8444-444444444509')
and not exists (select 1 from event_schedule_items esi where esi.event_id=events.id and esi.label='Varsity');

insert into event_schedule_items (event_id,label,starts_at,sort_order)
select id,'Freshman',starts_at,1 from events where id in ('44444444-4444-4444-8444-444444444502','44444444-4444-4444-8444-444444444505','44444444-4444-4444-8444-444444444506','44444444-4444-4444-8444-444444444508','44444444-4444-4444-8444-444444444510')
and not exists (select 1 from event_schedule_items esi where esi.event_id=events.id and esi.label='Freshman');

insert into event_schedule_items (event_id,label,starts_at,sort_order)
select id,'Junior Varsity',starts_at + interval '90 minutes',2 from events where id in ('44444444-4444-4444-8444-444444444502','44444444-4444-4444-8444-444444444505','44444444-4444-4444-8444-444444444506','44444444-4444-4444-8444-444444444508','44444444-4444-4444-8444-444444444510')
and not exists (select 1 from event_schedule_items esi where esi.event_id=events.id and esi.label='Junior Varsity');

insert into volunteer_slots (event_id,name,category,shift_start_at,capacity,sort_order,instructions)
select e.id,'Game Day Volunteer','Football Volunteers',e.starts_at,12,1,'Your coordinator will provide the specific assignment before game day.'
from events e
where e.id between '44444444-4444-4444-8444-444444444501' and '44444444-4444-4444-8444-444444444510'
and not exists (select 1 from volunteer_slots vs where vs.event_id=e.id);

commit;
