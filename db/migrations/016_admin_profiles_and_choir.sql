alter table admin_users add column if not exists phone text;

insert into admin_programs (organization_id,name,program_type)
values ('11111111-1111-4111-8111-111111111111','Choir Booster Club','booster_club')
on conflict (organization_id,name) do update set program_type='booster_club';

insert into admin_program_sports (program_id,sport_name)
select id,'Choir' from admin_programs
where organization_id='11111111-1111-4111-8111-111111111111' and name='Choir Booster Club'
on conflict do nothing;

update admin_users set role='program_admin',updated_at=now()
where normalized_email='emilymillanes@gmail.com';

insert into admin_program_memberships (admin_user_id,program_id)
select u.id,p.id from admin_users u join admin_programs p on p.organization_id=u.organization_id
where u.normalized_email='emilymillanes@gmail.com'
  and p.name in ('Whitehouse Community Booster Club','Choir Booster Club')
on conflict do nothing;
