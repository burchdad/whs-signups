begin;

insert into organizations (id, name, city, state, contact_email, reply_to_email, default_location)
values ('11111111-1111-4111-8111-111111111111', 'Whitehouse High School', 'Whitehouse', 'Texas', 'volunteers@whssignups.com', 'volunteers@whssignups.com', 'Whitehouse High School')
on conflict do nothing;

insert into sports (id, organization_id, name)
values ('21111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Volleyball')
on conflict do nothing;

insert into seasons (id, organization_id, sport_id, name, starts_on, ends_on)
values ('31111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '21111111-1111-4111-8111-111111111111', '2026', '2026-07-01', '2026-11-30')
on conflict do nothing;

delete from signups where organization_id = '11111111-1111-4111-8111-111111111111';
delete from events where organization_id = '11111111-1111-4111-8111-111111111111';
delete from volunteer_template_slots
where template_id in (
  select id from volunteer_templates where organization_id = '11111111-1111-4111-8111-111111111111'
);
delete from volunteer_templates where organization_id = '11111111-1111-4111-8111-111111111111';

insert into volunteer_templates (id, organization_id, name, description)
values (
  '22222222-2222-4222-8222-222222222223',
  '11111111-1111-4111-8111-111111111111',
  'WHS Volleyball Game Volunteers',
  'Every home event needs six student volunteers and two adult volunteers.'
)
on conflict do nothing;

insert into volunteer_template_slots (template_id, name, category, default_capacity, sort_order, instructions)
values
('22222222-2222-4222-8222-222222222223', 'Student Volunteer', 'Student Volunteers', 6, 1, 'Student volunteer support for the event.'),
('22222222-2222-4222-8222-222222222223', 'Adult Volunteer', 'Adult Volunteers', 2, 2, 'Adult volunteer support for the event.');

insert into events (id, organization_id, sport_id, season_id, title, slug, opponent, event_type, event_date, starts_at, ends_at, location, address, description, is_published)
values
('33333333-3333-4333-8333-333333333401','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Home Scrimmage - Carthage, Bullard & Lindale','home-scrimmage-carthage-bullard-lindale-2026-08-07',null,'Scrimmage','2026-08-07','2026-08-07 09:00:00-05','2026-08-07 13:30:00-05','Whitehouse High School','901 E Main St, Whitehouse, TX 75791','Home scrimmage',true),
('33333333-3333-4333-8333-333333333402','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Home Scrimmage - PT, Bullard & Tyler','home-scrimmage-pt-bullard-tyler-2026-08-08',null,'Scrimmage','2026-08-08','2026-08-08 09:00:00-05','2026-08-08 13:30:00-05','Whitehouse High School','901 E Main St, Whitehouse, TX 75791','Home scrimmage',true),
('33333333-3333-4333-8333-333333333403','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Whitehouse vs. Lufkin','whitehouse-vs-lufkin-2026-09-01','Lufkin','Home Game','2026-09-01','2026-09-01 17:00:00-05','2026-09-01 19:30:00-05','Whitehouse High School','901 E Main St, Whitehouse, TX 75791',null,true),
('33333333-3333-4333-8333-333333333404','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Whitehouse Volleyball Tournament - Day 1','whitehouse-volleyball-tournament-day-1-2026-09-03',null,'Tournament','2026-09-03','2026-09-03 08:00:00-05','2026-09-03 18:00:00-05','Whitehouse High School','901 E Main St, Whitehouse, TX 75791','Varsity tournament; ending time not listed',true),
('33333333-3333-4333-8333-333333333405','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Whitehouse Volleyball Tournament - Day 2','whitehouse-volleyball-tournament-day-2-2026-09-05',null,'Tournament','2026-09-05','2026-09-05 08:00:00-05','2026-09-05 18:00:00-05','Whitehouse High School','901 E Main St, Whitehouse, TX 75791','Varsity tournament; ending time not listed',true),
('33333333-3333-4333-8333-333333333406','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Whitehouse vs. Van','whitehouse-vs-van-2026-09-04','Van','Home Game','2026-09-04','2026-09-04 16:30:00-05','2026-09-04 19:00:00-05','Whitehouse High School','901 E Main St, Whitehouse, TX 75791',null,true),
('33333333-3333-4333-8333-333333333407','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Whitehouse vs. Hallsville','whitehouse-vs-hallsville-2026-09-08','Hallsville','Home Game','2026-09-08','2026-09-08 17:00:00-05','2026-09-08 19:30:00-05','Whitehouse High School','901 E Main St, Whitehouse, TX 75791',null,true),
('33333333-3333-4333-8333-333333333408','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Whitehouse vs. Mt. Pleasant','whitehouse-vs-mt-pleasant-2026-09-18','Mt. Pleasant','Home Game','2026-09-18','2026-09-18 16:30:00-05','2026-09-18 19:00:00-05','Whitehouse High School','901 E Main St, Whitehouse, TX 75791',null,true),
('33333333-3333-4333-8333-333333333409','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Whitehouse vs. Marshall','whitehouse-vs-marshall-2026-10-06','Marshall','Home Game','2026-10-06','2026-10-06 17:00:00-05','2026-10-06 19:30:00-05','Whitehouse High School','901 E Main St, Whitehouse, TX 75791',null,true),
('33333333-3333-4333-8333-333333333410','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Whitehouse vs. Tyler High','whitehouse-vs-tyler-high-2026-10-09','Tyler High','Home Game','2026-10-09','2026-10-09 16:30:00-05','2026-10-09 19:00:00-05','Whitehouse High School','901 E Main St, Whitehouse, TX 75791',null,true),
('33333333-3333-4333-8333-333333333411','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Whitehouse vs. Texas High','whitehouse-vs-texas-high-2026-10-16','Texas High','Home Game','2026-10-16','2026-10-16 16:30:00-05','2026-10-16 19:00:00-05','Whitehouse High School','901 E Main St, Whitehouse, TX 75791',null,true),
('33333333-3333-4333-8333-333333333412','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Whitehouse vs. Nacogdoches','whitehouse-vs-nacogdoches-2026-10-20','Nacogdoches','Home Game','2026-10-20','2026-10-20 17:00:00-05','2026-10-20 19:30:00-05','Whitehouse High School','901 E Main St, Whitehouse, TX 75791',null,true);

insert into event_schedule_items (event_id, label, starts_at, sort_order)
values
('33333333-3333-4333-8333-333333333401','9th Grade','2026-08-07 09:00:00-05',1),('33333333-3333-4333-8333-333333333401','JV','2026-08-07 09:00:00-05',2),('33333333-3333-4333-8333-333333333401','Varsity','2026-08-07 09:00:00-05',3),
('33333333-3333-4333-8333-333333333402','9th Grade','2026-08-08 09:00:00-05',1),('33333333-3333-4333-8333-333333333402','JV','2026-08-08 09:00:00-05',2),('33333333-3333-4333-8333-333333333402','Varsity','2026-08-08 09:00:00-05',3),
('33333333-3333-4333-8333-333333333403','9th Grade','2026-09-01 17:00:00-05',1),('33333333-3333-4333-8333-333333333403','JV','2026-09-01 17:00:00-05',2),('33333333-3333-4333-8333-333333333403','Varsity','2026-09-01 18:00:00-05',3),
('33333333-3333-4333-8333-333333333404','9th Grade','2026-09-03 08:00:00-05',1),('33333333-3333-4333-8333-333333333404','JV','2026-09-03 08:00:00-05',2),('33333333-3333-4333-8333-333333333404','Varsity','2026-09-03 09:00:00-05',3),
('33333333-3333-4333-8333-333333333405','9th Grade','2026-09-05 08:00:00-05',1),('33333333-3333-4333-8333-333333333405','JV','2026-09-05 08:00:00-05',2),('33333333-3333-4333-8333-333333333405','Varsity','2026-09-05 09:00:00-05',3),
('33333333-3333-4333-8333-333333333406','9th Grade','2026-09-04 17:30:00-05',1),('33333333-3333-4333-8333-333333333406','JV','2026-09-04 17:30:00-05',2),('33333333-3333-4333-8333-333333333406','Varsity','2026-09-04 16:30:00-05',3),
('33333333-3333-4333-8333-333333333407','9th Grade','2026-09-08 17:00:00-05',1),('33333333-3333-4333-8333-333333333407','JV','2026-09-08 17:00:00-05',2),('33333333-3333-4333-8333-333333333407','Varsity','2026-09-08 18:00:00-05',3),
('33333333-3333-4333-8333-333333333408','9th Grade','2026-09-18 17:30:00-05',1),('33333333-3333-4333-8333-333333333408','JV','2026-09-18 17:30:00-05',2),('33333333-3333-4333-8333-333333333408','Varsity','2026-09-18 16:30:00-05',3),
('33333333-3333-4333-8333-333333333409','9th Grade','2026-10-06 17:00:00-05',1),('33333333-3333-4333-8333-333333333409','JV','2026-10-06 17:00:00-05',2),('33333333-3333-4333-8333-333333333409','Varsity','2026-10-06 18:00:00-05',3),
('33333333-3333-4333-8333-333333333410','9th Grade','2026-10-09 17:30:00-05',1),('33333333-3333-4333-8333-333333333410','JV','2026-10-09 17:30:00-05',2),('33333333-3333-4333-8333-333333333410','Varsity','2026-10-09 16:30:00-05',3),
('33333333-3333-4333-8333-333333333411','9th Grade','2026-10-16 17:30:00-05',1),('33333333-3333-4333-8333-333333333411','JV','2026-10-16 17:30:00-05',2),('33333333-3333-4333-8333-333333333411','Varsity','2026-10-16 16:30:00-05',3),
('33333333-3333-4333-8333-333333333412','9th Grade','2026-10-20 17:00:00-05',1),('33333333-3333-4333-8333-333333333412','JV','2026-10-20 17:00:00-05',2),('33333333-3333-4333-8333-333333333412','Varsity','2026-10-20 18:00:00-05',3);

insert into volunteer_slots (event_id, template_slot_id, name, category, shift_start_at, shift_end_at, capacity, sort_order, instructions)
select e.id, vts.id, vts.name, vts.category, e.starts_at, e.ends_at, vts.default_capacity, vts.sort_order, vts.instructions
from events e
cross join volunteer_template_slots vts
where e.organization_id = '11111111-1111-4111-8111-111111111111'
  and vts.template_id = '22222222-2222-4222-8222-222222222223';

commit;
