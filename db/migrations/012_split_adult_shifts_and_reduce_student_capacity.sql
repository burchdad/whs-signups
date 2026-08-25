begin;

update volunteer_template_slots
set default_capacity = 2,
    instructions = 'Student volunteer support for one listed game.'
where category = 'Student Volunteers';

update volunteer_slots
set capacity = 2,
    updated_at = now()
where category = 'Student Volunteers';

with old_adult_slots as (
  select vs.id, vs.event_id, vs.template_slot_id, vs.shift_start_at
  from volunteer_slots vs
  where vs.category = 'Adult Volunteers'
    and vs.name = 'Adult Volunteer'
),
inserted_adult_slots as (
  insert into volunteer_slots (
    event_id, template_slot_id, name, category, shift_start_at, shift_end_at,
    capacity, sort_order, instructions
  )
  select
    old.event_id,
    old.template_slot_id,
    slot_def.name,
    'Adult Volunteers',
    slot_def.shift_start_at,
    slot_def.shift_end_at,
    1,
    slot_def.sort_order,
    slot_def.instructions
  from old_adult_slots old
  join events e on e.id = old.event_id
  cross join lateral (
    values
      ('Adult Volunteer - Early', e.starts_at - interval '30 minutes', e.starts_at + interval '60 minutes', 100, 'Early adult shift starts 30 minutes before the event and runs 1.5 hours.'),
      ('Adult Volunteer - Late', e.starts_at + interval '60 minutes', e.ends_at, 101, 'Late adult shift runs from the midpoint through the event end.')
  ) as slot_def(name, shift_start_at, shift_end_at, sort_order, instructions)
  where not exists (
    select 1
    from volunteer_slots existing
    where existing.event_id = old.event_id
      and existing.category = 'Adult Volunteers'
      and existing.name = slot_def.name
  )
  returning id, event_id, sort_order
),
first_new_adult_slot as (
  select distinct on (event_id) id, event_id
  from (
    select id, event_id, sort_order from inserted_adult_slots
    union all
    select vs.id, vs.event_id, vs.sort_order
    from volunteer_slots vs
    where vs.category = 'Adult Volunteers'
      and vs.name like 'Adult Volunteer - %'
  ) candidate
  order by event_id, sort_order, id
)
update signups s
set slot_id = first_new_adult_slot.id,
    updated_at = now()
from old_adult_slots old
join first_new_adult_slot on first_new_adult_slot.event_id = old.event_id
where s.slot_id = old.id;

delete from volunteer_slots vs
where vs.category = 'Adult Volunteers'
  and vs.name = 'Adult Volunteer';

update volunteer_slots vs
set capacity = 1,
    shift_start_at = case
      when vs.name = 'Adult Volunteer - Early' then e.starts_at - interval '30 minutes'
      when vs.name = 'Adult Volunteer - Late' then e.starts_at + interval '60 minutes'
      else vs.shift_start_at
    end,
    shift_end_at = case
      when vs.name = 'Adult Volunteer - Early' then e.starts_at + interval '60 minutes'
      when vs.name = 'Adult Volunteer - Late' then e.ends_at
      else vs.shift_end_at
    end,
    instructions = case
      when vs.name = 'Adult Volunteer - Early' then 'Early adult shift starts 30 minutes before the event and runs 1.5 hours.'
      when vs.name = 'Adult Volunteer - Late' then 'Late adult shift runs from the midpoint through the event end.'
      else vs.instructions
    end,
    updated_at = now()
from events e
where e.id = vs.event_id
  and vs.category = 'Adult Volunteers'
  and vs.name in ('Adult Volunteer - Early', 'Adult Volunteer - Late');

update volunteer_template_slots
set default_capacity = 1,
    instructions = 'Adult volunteer support for one shift.'
where category = 'Adult Volunteers';

commit;
