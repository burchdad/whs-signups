import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getPool, hasDatabaseUrl } from "./db";
import { normalizeEmail } from "./utils";

export const adminRoles = ["super_admin", "organization_admin", "program_admin", "volunteer_coordinator", "roster_viewer"] as const;
export type AdminRole = (typeof adminRoles)[number];
export type AdminSession = {
  user: { id: string; email: string; name: string; role: AdminRole };
  organizationId: string;
  allowedSports: string[] | null;
  programIds: string[];
  mustChangePassword: boolean;
};

let schemaReady: Promise<void> | undefined;

export function ensureAdminAccessSchema() {
  if (!hasDatabaseUrl()) return Promise.resolve();
  schemaReady ??= (async () => {
    const client = await getPool().connect();
    try {
      await client.query("select pg_advisory_lock(hashtext('whssignups_admin_access'))");
      await client.query(`
        create table if not exists admin_programs (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, name text not null, program_type text not null default 'booster_club', notification_email text, is_active boolean not null default true, created_at timestamptz not null default now(), unique (organization_id, name));
        create table if not exists admin_users (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, email text not null, normalized_email text not null, display_name text not null, password_hash text not null, role text not null, is_active boolean not null default true, must_change_password boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organization_id, normalized_email));
        alter table admin_users add column if not exists invite_token_hash text;
        alter table admin_users add column if not exists invite_expires_at timestamptz;
        alter table admin_users add column if not exists invite_used_at timestamptz;
        create unique index if not exists admin_users_invite_token_idx on admin_users (invite_token_hash) where invite_token_hash is not null;
        create table if not exists admin_program_memberships (admin_user_id uuid not null references admin_users(id) on delete cascade, program_id uuid not null references admin_programs(id) on delete cascade, created_at timestamptz not null default now(), primary key (admin_user_id, program_id));
        create table if not exists admin_program_sports (program_id uuid not null references admin_programs(id) on delete cascade, sport_name text not null, primary key (program_id, sport_name));
        alter table events add column if not exists admin_program_id uuid references admin_programs(id) on delete set null;
        alter table events add column if not exists owner_admin_user_id uuid references admin_users(id) on delete set null;
        alter table admin_programs add column if not exists membership_fee_cents integer not null default 0;
        alter table admin_programs add column if not exists payment_required boolean not null default false;
        alter table admin_programs add column if not exists stripe_price_id text;
        alter table admin_programs add column if not exists stripe_account_id text;
        alter table admin_programs add column if not exists stripe_account_charges_enabled boolean not null default false;
        alter table admin_programs add column if not exists stripe_account_verified_at timestamptz;
        alter table admin_programs add column if not exists notification_emails text[] not null default '{}';
        alter table organizations add column if not exists email_sender_name text not null default 'WHSSignups';
        alter table organizations add column if not exists email_sender_address text;
        alter table organizations add column if not exists default_notification_emails text[] not null default '{}';
        alter table booster_club_signups add column if not exists program_id uuid references admin_programs(id) on delete restrict;
        alter table booster_club_signups add column if not exists program_name text;
        alter table booster_club_signups add column if not exists payment_status text not null default 'not_required';
        alter table booster_club_signups add column if not exists payment_amount_cents integer not null default 0;
        alter table booster_club_signups add column if not exists stripe_checkout_session_id text;
        alter table booster_club_signups add column if not exists stripe_payment_intent_id text;
        alter table booster_club_signups add column if not exists paid_at timestamptz;
        alter table booster_club_signups add column if not exists stripe_account_id text;
        create index if not exists booster_club_signups_program_idx on booster_club_signups (program_id, created_at desc);
        create unique index if not exists booster_club_signups_checkout_session_idx on booster_club_signups (stripe_checkout_session_id) where stripe_checkout_session_id is not null;
        create unique index if not exists admin_programs_stripe_account_unique on admin_programs (stripe_account_id) where stripe_account_id is not null;
        update admin_programs set notification_emails=array[lower(notification_email)] where notification_email is not null and btrim(notification_email)<>'' and cardinality(notification_emails)=0;
      `);
    } finally {
      await client.query("select pg_advisory_unlock(hashtext('whssignups_admin_access'))").catch(() => undefined);
      client.release();
    }
  })().catch((error) => { schemaReady = undefined; throw error; });
  return schemaReady;
}

export function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyAdminPassword(password: string, encoded: string) {
  const [method, salt, expected] = encoded.split(":");
  if (method !== "scrypt" || !salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const target = Buffer.from(expected, "hex");
  return actual.length === target.length && timingSafeEqual(actual, target);
}

export async function authenticateAdmin(email: string, password: string) {
  if (!hasDatabaseUrl()) return undefined;
  await ensureAdminAccessSchema();
  const { rows } = await getPool().query("select * from admin_users where normalized_email = $1 and is_active = true limit 1", [normalizeEmail(email)]);
  const row = rows[0];
  if (!row || !verifyAdminPassword(password, String(row.password_hash))) return undefined;
  return adminSessionForUser(String(row.id));
}

export async function adminSessionForUser(id: string): Promise<AdminSession | undefined> {
  if (!hasDatabaseUrl()) return undefined;
  await ensureAdminAccessSchema();
  const { rows } = await getPool().query(`
    select u.*, coalesce(array_agg(distinct m.program_id::text) filter (where m.program_id is not null), '{}') programs,
      coalesce(array_agg(distinct ps.sport_name) filter (where ps.sport_name is not null), '{}') sports
    from admin_users u
    left join admin_program_memberships m on m.admin_user_id = u.id
    left join admin_program_sports ps on ps.program_id = m.program_id
    where u.id = $1 and u.is_active = true
    group by u.id
  `, [id]);
  const row = rows[0];
  if (!row) return undefined;
  const role = String(row.role) as AdminRole;
  return {
    user: { id: String(row.id), email: String(row.email), name: String(row.display_name), role },
    organizationId: String(row.organization_id),
    allowedSports: ["super_admin", "organization_admin"].includes(role) ? null : (row.sports as string[]),
    programIds: row.programs as string[],
    mustChangePassword: Boolean(row.must_change_password),
  };
}

export function canManage(session: AdminSession) {
  return session.user.role !== "roster_viewer";
}

export function canManageAdmins(session: AdminSession) {
  return session.user.role === "super_admin";
}

export function canManageOrganizationSettings(session: AdminSession) {
  return ["super_admin", "organization_admin"].includes(session.user.role);
}

export function hasSportAccess(session: AdminSession, sport: string) {
  return session.allowedSports === null || session.allowedSports.includes(sport);
}

export async function listAdminPrograms() {
  await ensureAdminAccessSchema();
  if (!hasDatabaseUrl()) return [];
  const { rows } = await getPool().query(`select p.*, coalesce(array_agg(ps.sport_name order by ps.sport_name) filter (where ps.sport_name is not null), '{}') sports from admin_programs p left join admin_program_sports ps on ps.program_id = p.id group by p.id order by p.name`);
  return rows.map((row) => ({ id: String(row.id), name: String(row.name), type: String(row.program_type), notificationEmail: row.notification_email ? String(row.notification_email) : "", notificationEmails: Array.isArray(row.notification_emails) ? row.notification_emails.map(String) : [], sports: row.sports as string[], membershipFeeCents: Number(row.membership_fee_cents ?? 0), paymentRequired: Boolean(row.payment_required), stripePriceId: row.stripe_price_id ? String(row.stripe_price_id) : "", stripeAccountId: row.stripe_account_id ? String(row.stripe_account_id) : "", stripeChargesEnabled: Boolean(row.stripe_account_charges_enabled), stripeAccountVerifiedAt: row.stripe_account_verified_at ? new Date(String(row.stripe_account_verified_at)).toISOString() : undefined }));
}

export async function listAdminProgramsForSession(session: AdminSession) {
  const programs = await listAdminPrograms();
  return session.allowedSports === null ? programs : programs.filter((program) => session.programIds.includes(program.id));
}

export async function listAdminAccounts() {
  await ensureAdminAccessSchema();
  if (!hasDatabaseUrl()) return [];
  const { rows } = await getPool().query(`select u.id, u.email, u.display_name, u.role, u.is_active, u.must_change_password, u.invite_expires_at, u.invite_used_at, coalesce(array_agg(p.name order by p.name) filter (where p.id is not null), '{}') programs from admin_users u left join admin_program_memberships m on m.admin_user_id = u.id left join admin_programs p on p.id = m.program_id group by u.id order by u.display_name`);
  return rows.map((row) => ({ id: String(row.id), email: String(row.email), name: String(row.display_name), role: String(row.role), active: Boolean(row.is_active), mustChangePassword: Boolean(row.must_change_password), inviteExpiresAt: row.invite_expires_at ? new Date(String(row.invite_expires_at)).toISOString() : undefined, inviteUsedAt: row.invite_used_at ? new Date(String(row.invite_used_at)).toISOString() : undefined, programs: row.programs as string[] }));
}

export async function listAssignableAdminAccounts(session: AdminSession) {
  await ensureAdminAccessSchema();
  if (!hasDatabaseUrl()) return [];
  const { rows } = await getPool().query(`
    select distinct u.id, u.email, u.display_name
    from admin_users u
    left join admin_program_memberships m on m.admin_user_id = u.id
    where u.is_active = true and ($1::boolean or m.program_id = any($2::uuid[]))
    order by u.display_name
  `, [session.allowedSports === null, session.programIds]);
  return rows.map((row) => ({ id: String(row.id), email: String(row.email), name: String(row.display_name) }));
}

export async function canAssignAdminOwner(session: AdminSession, targetId: string) {
  if (!targetId || targetId === session.user.id) return true;
  return (await listAssignableAdminAccounts(session)).some((account) => account.id === targetId);
}

export async function getAssignableAdminOwner(session: AdminSession, targetId: string) {
  if (!targetId || targetId === session.user.id) return { id: session.user.id, email: session.user.email, name: session.user.name };
  return (await listAssignableAdminAccounts(session)).find((account) => account.id === targetId);
}

export async function createAdminProgram(input: { organizationId: string; name: string; type: string; notificationEmails?: string[]; sports: string[]; membershipFeeCents?: number; paymentRequired?: boolean; actorId: string }) {
  await ensureAdminAccessSchema();
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const notificationEmails = input.notificationEmails ?? [];
    const { rows } = await client.query("insert into admin_programs (organization_id,name,program_type,notification_email,notification_emails,membership_fee_cents,payment_required) values ($1,$2,$3,$4,$5,$6,$7) returning id", [input.organizationId, input.name.trim(), input.type, notificationEmails[0] ?? null, notificationEmails, input.membershipFeeCents ?? 0, Boolean(input.paymentRequired && (input.membershipFeeCents ?? 0) > 0)]);
    const id = String(rows[0].id);
    for (const sport of input.sports) await client.query("insert into admin_program_sports (program_id, sport_name) values ($1,$2) on conflict do nothing", [id, sport]);
    await client.query("insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata) values ($1,$2,'program.created','admin_program',$3,$4)", [input.organizationId, input.actorId, id, JSON.stringify({ name: input.name, sports: input.sports })]);
    await client.query("commit");
    return id;
  } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
}

export async function updateAdminProgramBilling(input: { programId: string; membershipFeeCents: number; paymentRequired: boolean; stripePriceId?: string; actorId: string; organizationId: string }) {
  await ensureAdminAccessSchema();
  await getPool().query(
    "update admin_programs set membership_fee_cents=$2, payment_required=$3, stripe_price_id=nullif($4,'') where id=$1 and organization_id=$5",
    [input.programId, input.membershipFeeCents, input.paymentRequired && input.membershipFeeCents > 0, input.stripePriceId?.trim() ?? "", input.organizationId],
  );
  await getPool().query("insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata) values ($1,$2,'program.billing_updated','admin_program',$3,$4)", [input.organizationId, input.actorId, input.programId, JSON.stringify({ membershipFeeCents: input.membershipFeeCents, paymentRequired: input.paymentRequired })]);
}

export function canManageProgramPayments(session: AdminSession) {
  return ["super_admin", "organization_admin", "program_admin"].includes(session.user.role);
}

export async function canManageProgram(session: AdminSession, programId: string) {
  return session.allowedSports === null || session.programIds.includes(programId);
}

export async function updateProgramStripeAccount(input: { programId: string; stripeAccountId?: string; chargesEnabled: boolean; actorId: string; organizationId: string }) {
  await ensureAdminAccessSchema();
  try {
    await getPool().query(
      "update admin_programs set stripe_account_id=nullif($2,''), stripe_account_charges_enabled=$3, stripe_account_verified_at=case when nullif($2,'') is null then null else now() end where id=$1 and organization_id=$4",
      [input.programId, input.stripeAccountId?.trim() ?? "", input.chargesEnabled, input.organizationId],
    );
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") throw new Error("That Stripe account is already assigned to another program.");
    throw error;
  }
  await getPool().query("insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata) values ($1,$2,'program.stripe_account_updated','admin_program',$3,$4)", [input.organizationId, input.actorId, input.programId, JSON.stringify({ stripeAccountId: input.stripeAccountId || null, chargesEnabled: input.chargesEnabled })]);
}

export function parseEmailList(value: string) {
  return [...new Set(value.split(/[;,\n]/).map((email) => email.trim().toLowerCase()).filter(Boolean))];
}

export async function getOrganizationEmailSettings(organizationId = "11111111-1111-4111-8111-111111111111") {
  await ensureAdminAccessSchema();
  const { rows } = await getPool().query("select email_sender_name,email_sender_address,default_notification_emails,contact_email,reply_to_email from organizations where id=$1", [organizationId]);
  const row = rows[0] ?? {};
  return {
    senderName: String(row.email_sender_name || "WHSSignups"),
    senderAddress: row.email_sender_address ? String(row.email_sender_address) : "",
    defaultNotificationEmails: Array.isArray(row.default_notification_emails) ? row.default_notification_emails.map(String) : [],
    contactEmail: row.contact_email ? String(row.contact_email) : "",
    replyToEmail: row.reply_to_email ? String(row.reply_to_email) : "",
  };
}

export async function updateOrganizationEmailSettings(input: { organizationId: string; senderName: string; senderAddress: string; defaultNotificationEmails: string[]; contactEmail: string; replyToEmail: string; actorId: string }) {
  await ensureAdminAccessSchema();
  await getPool().query("update organizations set email_sender_name=$2,email_sender_address=nullif($3,''),default_notification_emails=$4,contact_email=nullif($5,''),reply_to_email=nullif($6,''),updated_at=now() where id=$1", [input.organizationId, input.senderName.trim(), input.senderAddress.trim().toLowerCase(), input.defaultNotificationEmails, input.contactEmail.trim().toLowerCase(), input.replyToEmail.trim().toLowerCase()]);
  await getPool().query("insert into audit_logs (organization_id,actor_user_id,action,entity_type,entity_id,metadata) values ($1,$2,'organization.email_settings_updated','organization',$1,$3)", [input.organizationId, input.actorId, JSON.stringify({ senderName: input.senderName, senderAddress: input.senderAddress, defaultNotificationEmails: input.defaultNotificationEmails })]);
}

export async function updateProgramNotificationEmails(input: { programId: string; notificationEmails: string[]; actorId: string; organizationId: string }) {
  await ensureAdminAccessSchema();
  await getPool().query("update admin_programs set notification_emails=$2,notification_email=$3 where id=$1 and organization_id=$4", [input.programId, input.notificationEmails, input.notificationEmails[0] ?? null, input.organizationId]);
  await getPool().query("insert into audit_logs (organization_id,actor_user_id,action,entity_type,entity_id,metadata) values ($1,$2,'program.notification_emails_updated','admin_program',$3,$4)", [input.organizationId, input.actorId, input.programId, JSON.stringify({ notificationEmails: input.notificationEmails })]);
}

export async function adminNotificationRecipientsForProgram(programId: string) {
  if (!hasDatabaseUrl()) return [];
  await ensureAdminAccessSchema();
  const { rows } = await getPool().query(`
    select email from (
      select distinct u.email from admin_users u left join admin_program_memberships m on m.admin_user_id=u.id where u.is_active=true and (u.role in ('super_admin','organization_admin') or m.program_id=$1)
      union
      select unnest(p.notification_emails) as email from admin_programs p where p.id=$1 and p.is_active=true
      union
      select unnest(o.default_notification_emails) as email from organizations o join admin_programs p on p.organization_id=o.id where p.id=$1
    ) recipients
  `, [programId]);
  return rows.map((row) => String(row.email)).filter(Boolean);
}

export function hashAdminInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminInvite(input: { userId: string; organizationId: string; actorId: string }) {
  await ensureAdminAccessSchema();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const unusablePassword = hashAdminPassword(randomBytes(32).toString("base64url"));
  const { rows } = await getPool().query("update admin_users set password_hash=$1, invite_token_hash=$2, invite_expires_at=$3, invite_used_at=null, must_change_password=true, updated_at=now() where id=$4 and organization_id=$5 and is_active=true returning id,email,display_name", [unusablePassword, hashAdminInviteToken(token), expiresAt, input.userId, input.organizationId]);
  if (!rows[0]) throw new Error("Administrator account not found.");
  await getPool().query("insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata) values ($1,$2,'admin.invitation_created','admin_user',$3,$4)", [input.organizationId, input.actorId, input.userId, JSON.stringify({ expiresAt: expiresAt.toISOString() })]);
  return { userId: String(rows[0].id), email: String(rows[0].email), name: String(rows[0].display_name), token, expiresAt };
}

export async function createAdminAccount(input: { organizationId: string; name: string; email: string; role: AdminRole; programIds: string[]; actorId: string }) {
  await ensureAdminAccessSchema();
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const unusablePassword = hashAdminPassword(randomBytes(32).toString("base64url"));
    const { rows } = await client.query("insert into admin_users (organization_id,email,normalized_email,display_name,password_hash,role) values ($1,$2,$3,$4,$5,$6) returning id", [input.organizationId, input.email.trim(), normalizeEmail(input.email), input.name.trim(), unusablePassword, input.role]);
    const id = String(rows[0].id);
    for (const programId of input.programIds) await client.query("insert into admin_program_memberships (admin_user_id,program_id) values ($1,$2) on conflict do nothing", [id, programId]);
    await client.query("insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata) values ($1,$2,'admin.created','admin_user',$3,$4)", [input.organizationId, input.actorId, id, JSON.stringify({ email: input.email, role: input.role })]);
    await client.query("commit");
    return id;
  } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
}

export async function getAdminInvite(token: string) {
  if (!hasDatabaseUrl() || !token) return undefined;
  await ensureAdminAccessSchema();
  const { rows } = await getPool().query("select id,email,display_name,invite_expires_at from admin_users where invite_token_hash=$1 and is_active=true and invite_used_at is null and invite_expires_at > now() limit 1", [hashAdminInviteToken(token)]);
  const row = rows[0];
  return row ? { userId: String(row.id), email: String(row.email), name: String(row.display_name), expiresAt: new Date(String(row.invite_expires_at)).toISOString() } : undefined;
}

export async function acceptAdminInvite(input: { token: string; newPassword: string }) {
  if (input.newPassword.length < 12) throw new Error("Passwords must contain at least 12 characters.");
  await ensureAdminAccessSchema();
  const { rows } = await getPool().query("update admin_users set password_hash=$1, must_change_password=false, invite_used_at=now(), invite_token_hash=null, updated_at=now() where invite_token_hash=$2 and is_active=true and invite_used_at is null and invite_expires_at > now() returning id,organization_id", [hashAdminPassword(input.newPassword), hashAdminInviteToken(input.token)]);
  if (!rows[0]) throw new Error("This invitation is invalid or has expired.");
  await getPool().query("insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata) values ($1,$2,'admin.invitation_accepted','admin_user',$2,'{}')", [rows[0].organization_id, rows[0].id]);
}

export async function changeAdminPassword(input: { userId: string; currentPassword: string; newPassword: string }) {
  if (input.userId === "bootstrap-super-admin") throw new Error("Change the bootstrap password in the hosting environment settings.");
  await ensureAdminAccessSchema();
  const { rows } = await getPool().query("select password_hash from admin_users where id=$1 and is_active=true", [input.userId]);
  if (!rows[0] || !verifyAdminPassword(input.currentPassword, String(rows[0].password_hash))) throw new Error("The current password is incorrect.");
  if (input.newPassword.length < 12) throw new Error("New passwords must contain at least 12 characters.");
  await getPool().query("update admin_users set password_hash=$2, must_change_password=false, updated_at=now() where id=$1", [input.userId, hashAdminPassword(input.newPassword)]);
}

export async function adminNotificationRecipientsForSport(sport: string) {
  if (!hasDatabaseUrl()) return [];
  await ensureAdminAccessSchema();
  const { rows } = await getPool().query(`
    select email from (
      select distinct u.email from admin_users u left join admin_program_memberships m on m.admin_user_id=u.id left join admin_program_sports ps on ps.program_id=m.program_id where u.is_active=true and (u.role in ('super_admin','organization_admin') or ps.sport_name=$1)
      union
      select unnest(p.notification_emails) as email from admin_programs p join admin_program_sports ps on ps.program_id=p.id where p.is_active=true and ps.sport_name=$1
      union
      select unnest(o.default_notification_emails) as email from organizations o where exists (select 1 from admin_programs p join admin_program_sports ps on ps.program_id=p.id where p.organization_id=o.id and p.is_active=true and ps.sport_name=$1)
    ) recipients
  `, [sport]);
  return rows.map((row) => String(row.email)).filter(Boolean);
}
