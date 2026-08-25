begin;

update volunteer_template_slots
set default_capacity = 2,
    instructions = 'Student volunteer support for one shift.'
where category = 'Student Volunteers';

with target_events as (
  select distinct e.id as event_id, e.starts_at, e.ends_at, vs.template_slot_id
  from events e
  join volunteer_slots vs on vs.event_id = e.id and vs.category = 'Student Volunteers'
),
desired_slots as (
  select
    target_events.event_id,
    target_events.template_slot_id,
    shift_def.sort_order,
    shift_def.shift_start_at,
    shift_def.shift_end_at,
    shift_def.instructions
  from target_events
  cross join lateral (
    values
      (1, target_events.starts_at - interval '30 minutes', target_events.starts_at + interval '60 minutes', 'Early student shift starts 30 minutes before the event and runs 1.5 hours.'),
      (2, target_events.starts_at + interval '60 minutes', coalesce(target_events.ends_at, target_events.starts_at + interval '150 minutes'), 'Late student shift runs from the midpoint through the event end.')
  ) as shift_def(sort_order, shift_start_at, shift_end_at, instructions)
)
insert into volunteer_slots (
  event_id, template_slot_id, name, category, shift_start_at, shift_end_at,
  capacity, sort_order, instructions
)
select
  desired_slots.event_id,
  desired_slots.template_slot_id,
  'Student Volunteer',
  'Student Volunteers',
  desired_slots.shift_start_at,
  desired_slots.shift_end_at,
  2,
  desired_slots.sort_order,
  desired_slots.instructions
from desired_slots
where not exists (
  select 1
  from volunteer_slots existing
  where existing.event_id = desired_slots.event_id
    and existing.category = 'Student Volunteers'
    and (
      (desired_slots.sort_order = 1 and (existing.name = 'Student Volunteer' and existing.sort_order = 1 or existing.name <> 'Student Volunteer' and existing.name not ilike '%varsity%'))
      or (desired_slots.sort_order = 2 and (existing.name = 'Student Volunteer' and existing.sort_order = 2 or existing.name ilike '%varsity%'))
    )
);

create temporary table student_slot_targets on commit drop as
with candidates as (
  select
    vs.id,
    vs.event_id,
    case
      when vs.name = 'Student Volunteer' and vs.sort_order = 2 then 2
      when vs.name ilike '%varsity%' then 2
      else 1
    end as target_sort,
    row_number() over (
      partition by vs.event_id,
      case
        when vs.name = 'Student Volunteer' and vs.sort_order = 2 then 2
        when vs.name ilike '%varsity%' then 2
        else 1
      end
      order by
        case
          when vs.name = 'Student Volunteer' then 0
          when vs.name ilike '%9th%' then 1
          when vs.name ilike '%jv%' then 2
          when vs.name ilike '%varsity%' then 3
          else 4
        end,
        vs.sort_order,
        vs.id
    ) as target_rank
  from volunteer_slots vs
  where vs.category = 'Student Volunteers'
)
select id, event_id, target_sort
from candidates
where target_rank = 1;

update signups s
set slot_id = targets.id,
    updated_at = now()
from volunteer_slots old_slot
join student_slot_targets targets
  on targets.event_id = old_slot.event_id
 and targets.target_sort = case
    when old_slot.name = 'Student Volunteer' and old_slot.sort_order = 2 then 2
    when old_slot.name ilike '%varsity%' then 2
    else 1
  end
where s.slot_id = old_slot.id
  and old_slot.category = 'Student Volunteers'
  and old_slot.id <> targets.id;

delete from volunteer_slots vs
where vs.category = 'Student Volunteers'
  and not exists (
    select 1
    from student_slot_targets targets
    where targets.id = vs.id
  );

update volunteer_slots vs
set name = 'Student Volunteer',
    capacity = 2,
    sort_order = targets.target_sort,
    shift_start_at = case
      when targets.target_sort = 1 then e.starts_at - interval '30 minutes'
      else e.starts_at + interval '60 minutes'
    end,
    shift_end_at = case
      when targets.target_sort = 1 then e.starts_at + interval '60 minutes'
      else coalesce(e.ends_at, e.starts_at + interval '150 minutes')
    end,
    instructions = case
      when targets.target_sort = 1 then 'Early student shift starts 30 minutes before the event and runs 1.5 hours.'
      else 'Late student shift runs from the midpoint through the event end.'
    end,
    updated_at = now()
from student_slot_targets targets
join events e on e.id = targets.event_id
where vs.id = targets.id;

commit;
