begin;

with old_student_slots as (
  select vs.id, vs.event_id
  from volunteer_slots vs
  where vs.category = 'Student Volunteers'
    and vs.name = 'Student Volunteer'
),
student_template as (
  select id, default_capacity
  from volunteer_template_slots
  where template_id = '22222222-2222-4222-8222-222222222223'
    and category = 'Student Volunteers'
  limit 1
),
inserted_student_slots as (
  insert into volunteer_slots (
    event_id, template_slot_id, name, category, shift_start_at, shift_end_at,
    capacity, sort_order, instructions
  )
  select
    esi.event_id,
    st.id,
    'Student Volunteer - ' || esi.label,
    'Student Volunteers',
    esi.starts_at - interval '30 minutes',
    esi.starts_at + interval '60 minutes',
    st.default_capacity,
    esi.sort_order,
    'Student shift begins 30 minutes before the listed game time and runs 1.5 hours.'
  from event_schedule_items esi
  cross join student_template st
  where exists (select 1 from old_student_slots old where old.event_id = esi.event_id)
    and not exists (
      select 1
      from volunteer_slots existing
      where existing.event_id = esi.event_id
        and existing.category = 'Student Volunteers'
        and existing.name = 'Student Volunteer - ' || esi.label
    )
  returning id, event_id, sort_order
),
first_new_student_slot as (
  select distinct on (event_id) id, event_id
  from (
    select id, event_id, sort_order from inserted_student_slots
    union all
    select vs.id, vs.event_id, vs.sort_order
    from volunteer_slots vs
    where vs.category = 'Student Volunteers'
      and vs.name like 'Student Volunteer - %'
  ) candidate
  order by event_id, sort_order, id
)
update signups s
set slot_id = first_new_student_slot.id,
    updated_at = now()
from old_student_slots old
join first_new_student_slot on first_new_student_slot.event_id = old.event_id
where s.slot_id = old.id;

delete from volunteer_slots vs
where vs.category = 'Student Volunteers'
  and vs.name = 'Student Volunteer';

update volunteer_template_slots
set instructions = 'Student shifts begin 30 minutes before the listed game time and run 1.5 hours.'
where template_id = '22222222-2222-4222-8222-222222222223'
  and category = 'Student Volunteers';

commit;
