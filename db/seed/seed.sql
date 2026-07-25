insert into organizations (id, name, city, state, contact_email, reply_to_email, default_location)
values ('11111111-1111-4111-8111-111111111111', 'Whitehouse High School', 'Whitehouse', 'Texas', 'volunteers@whssignups.com', 'volunteers@whssignups.com', 'Whitehouse High School Gym')
on conflict do nothing;

insert into sports (id, organization_id, name)
values ('21111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'Volleyball')
on conflict do nothing;

insert into seasons (id, organization_id, sport_id, name, starts_on, ends_on)
values ('31111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '21111111-1111-4111-8111-111111111111', '2026', '2026-07-01', '2026-11-30')
on conflict do nothing;

insert into volunteer_templates (id, organization_id, name, description)
values
('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111111', 'Volleyball Home Game', 'Standard home-game volunteer needs for volleyball match nights.'),
('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Volleyball Tournament', 'Expanded template for tournament days and multi-match events.')
on conflict do nothing;

insert into volunteer_template_slots (template_id, name, category, default_capacity, sort_order)
values
('22222222-2222-4222-8222-222222222221','Concession Stand - Early Shift','Concessions',3,1),
('22222222-2222-4222-8222-222222222221','Concession Stand - Late Shift','Concessions',3,2),
('22222222-2222-4222-8222-222222222221','Ticket Table','Admissions',2,3),
('22222222-2222-4222-8222-222222222221','Scorebook','Game Support',1,4),
('22222222-2222-4222-8222-222222222221','Line Judge','Game Support',2,5),
('22222222-2222-4222-8222-222222222221','Hospitality','Hospitality',2,6),
('22222222-2222-4222-8222-222222222221','Cleanup Crew','Facilities',3,7),
('22222222-2222-4222-8222-222222222222','Morning Concessions','Concessions',4,1),
('22222222-2222-4222-8222-222222222222','Afternoon Concessions','Concessions',4,2),
('22222222-2222-4222-8222-222222222222','Evening Concessions','Concessions',4,3),
('22222222-2222-4222-8222-222222222222','Admissions','Admissions',3,4),
('22222222-2222-4222-8222-222222222222','Hospitality Room','Hospitality',3,5),
('22222222-2222-4222-8222-222222222222','Court Assistance','Game Support',4,6),
('22222222-2222-4222-8222-222222222222','Cleanup Crew','Facilities',4,7),
('22222222-2222-4222-8222-222222222222','Food or Drink Donations','Donations',10,8);

insert into events (id, organization_id, sport_id, season_id, title, slug, opponent, event_type, event_date, starts_at, ends_at, location, address, description, is_published)
values
('33333333-3333-4333-8333-333333333331','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Whitehouse vs Tyler Legacy','whitehouse-vs-tyler-legacy-2026-08-18','Tyler Legacy','Home Game','2026-08-18','2026-08-18 16:30:00-05','2026-08-18 20:30:00-05','Whitehouse High School Gym','901 E Main St, Whitehouse, TX 75791','Help WHS volleyball host a smooth home-game night.',true),
('33333333-3333-4333-8333-333333333332','11111111-1111-4111-8111-111111111111','21111111-1111-4111-8111-111111111111','31111111-1111-4111-8111-111111111111','Whitehouse vs Hallsville','whitehouse-vs-hallsville-2026-09-01','Hallsville','Home Game','2026-09-01','2026-09-01 16:30:00-05',null,'Whitehouse High School Gym','901 E Main St, Whitehouse, TX 75791','District match volunteer coverage.',true)
on conflict do nothing;

insert into event_schedule_items (event_id, label, starts_at, sort_order)
values
('33333333-3333-4333-8333-333333333331','9th Grade','2026-08-18 16:30:00-05',1),
('33333333-3333-4333-8333-333333333331','JV','2026-08-18 17:30:00-05',2),
('33333333-3333-4333-8333-333333333331','Varsity','2026-08-18 18:30:00-05',3),
('33333333-3333-4333-8333-333333333332','9th Grade','2026-09-01 16:30:00-05',1),
('33333333-3333-4333-8333-333333333332','JV','2026-09-01 17:30:00-05',2),
('33333333-3333-4333-8333-333333333332','Varsity','2026-09-01 18:30:00-05',3);

insert into volunteer_slots (event_id, name, category, shift_start_at, shift_end_at, capacity, sort_order)
values
('33333333-3333-4333-8333-333333333331','Concession Stand - Early Shift','Concessions','2026-08-18 16:00:00-05','2026-08-18 18:00:00-05',3,1),
('33333333-3333-4333-8333-333333333331','Concession Stand - Late Shift','Concessions','2026-08-18 18:00:00-05','2026-08-18 20:30:00-05',3,2),
('33333333-3333-4333-8333-333333333331','Ticket Table','Admissions',null,null,2,3),
('33333333-3333-4333-8333-333333333331','Scorebook','Game Support',null,null,1,4),
('33333333-3333-4333-8333-333333333332','Admissions','Admissions',null,null,2,1),
('33333333-3333-4333-8333-333333333332','Cleanup Crew','Facilities',null,null,3,2);
