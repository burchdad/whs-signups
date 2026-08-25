begin;

update volunteer_slots vs
set shift_end_at = vs.shift_start_at + interval '2 hours',
    instructions = coalesce(nullif(vs.instructions, ''), 'Adult shift runs 2 hours from the event start time.'),
    updated_at = now()
where vs.category = 'Adult Volunteers'
  and vs.shift_start_at is not null;

update volunteer_template_slots
set instructions = 'Adult shift runs 2 hours from the event start time.'
where category = 'Adult Volunteers';

commit;
