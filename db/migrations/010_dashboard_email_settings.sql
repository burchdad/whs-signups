alter table organizations add column if not exists email_sender_name text not null default 'WHSSignups';
alter table organizations add column if not exists email_sender_address text;
alter table organizations add column if not exists default_notification_emails text[] not null default '{}';

alter table admin_programs add column if not exists notification_emails text[] not null default '{}';

update admin_programs
set notification_emails = array[lower(notification_email)]
where notification_email is not null
  and btrim(notification_email) <> ''
  and cardinality(notification_emails) = 0;
