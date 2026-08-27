begin;

with target_event as (
  update events
  set starts_at = '2026-09-03 09:00:00-05'::timestamptz,
      ends_at = '2026-09-03 15:00:00-05'::timestamptz,
      description = 'Varsity tournament.',
      updated_at = now()
  where slug = 'whitehouse-volleyball-tournament-day-1-2026-09-03'
  returning id
)
delete from event_schedule_items esi
using target_event
where esi.event_id = target_event.id
  and esi.label <> 'Varsity';

with target_event as (
  select id
  from events
  where slug = 'whitehouse-volleyball-tournament-day-1-2026-09-03'
)
insert into event_schedule_items (event_id, label, starts_at, sort_order)
select target_event.id, 'Varsity', '2026-09-03 09:00:00-05'::timestamptz, 1
from target_event
where not exists (
  select 1 from event_schedule_items esi where esi.event_id = target_event.id and esi.label = 'Varsity'
);

with target_event as (
  select id
  from events
  where slug = 'whitehouse-volleyball-tournament-day-1-2026-09-03'
)
update event_schedule_items esi
set starts_at = '2026-09-03 09:00:00-05'::timestamptz,
    sort_order = 1
from target_event
where esi.event_id = target_event.id
  and esi.label = 'Varsity';

with target_event as (
  select id
  from events
  where slug = 'whitehouse-volleyball-tournament-day-1-2026-09-03'
)
update volunteer_slots vs
set is_visible = false,
    is_open = false,
    updated_at = now()
from target_event
where vs.event_id = target_event.id
  and exists (select 1 from signups s where s.slot_id = vs.id);

with target_event as (
  select id
  from events
  where slug = 'whitehouse-volleyball-tournament-day-1-2026-09-03'
)
delete from volunteer_slots vs
using target_event
where vs.event_id = target_event.id
  and not exists (select 1 from signups s where s.slot_id = vs.id);

with target_event as (
  select id
  from events
  where slug = 'whitehouse-volleyball-tournament-day-1-2026-09-03'
),
student_template as (
  select id from volunteer_template_slots where category = 'Student Volunteers' order by sort_order limit 1
),
adult_template as (
  select id from volunteer_template_slots where category = 'Adult Volunteers' order by sort_order limit 1
)
insert into volunteer_slots (event_id, template_slot_id, name, category, shift_start_at, shift_end_at, capacity, sort_order, instructions)
select
  target_event.id,
  slot_def.template_slot_id,
  slot_def.name,
  slot_def.category,
  slot_def.shift_start_at,
  slot_def.shift_end_at,
  slot_def.capacity,
  slot_def.sort_order,
  slot_def.instructions
from target_event
cross join student_template
cross join adult_template
cross join lateral (
  values
    (student_template.id, 'Student Volunteer', 'Student Volunteers', '2026-09-03 09:00:00-05'::timestamptz, '2026-09-03 11:00:00-05'::timestamptz, 2, 1, 'Tournament shift runs 2 hours.'),
    (student_template.id, 'Student Volunteer', 'Student Volunteers', '2026-09-03 11:00:00-05'::timestamptz, '2026-09-03 13:00:00-05'::timestamptz, 2, 2, 'Tournament shift runs 2 hours.'),
    (student_template.id, 'Student Volunteer', 'Student Volunteers', '2026-09-03 13:00:00-05'::timestamptz, '2026-09-03 15:00:00-05'::timestamptz, 2, 3, 'Tournament shift runs 2 hours.'),
    (adult_template.id, 'Adult Volunteer', 'Adult Volunteers', '2026-09-03 09:00:00-05'::timestamptz, '2026-09-03 11:00:00-05'::timestamptz, 1, 101, 'Tournament shift runs 2 hours.'),
    (adult_template.id, 'Adult Volunteer', 'Adult Volunteers', '2026-09-03 11:00:00-05'::timestamptz, '2026-09-03 13:00:00-05'::timestamptz, 1, 102, 'Tournament shift runs 2 hours.'),
    (adult_template.id, 'Adult Volunteer', 'Adult Volunteers', '2026-09-03 13:00:00-05'::timestamptz, '2026-09-03 15:00:00-05'::timestamptz, 1, 103, 'Tournament shift runs 2 hours.')
) as slot_def(template_slot_id, name, category, shift_start_at, shift_end_at, capacity, sort_order, instructions);

commit;
