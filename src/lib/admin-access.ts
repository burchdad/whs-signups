import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
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
        create table if not exists admin_program_memberships (admin_user_id uuid not null references admin_users(id) on delete cascade, program_id uuid not null references admin_programs(id) on delete cascade, created_at timestamptz not null default now(), primary key (admin_user_id, program_id));
        create table if not exists admin_program_sports (program_id uuid not null references admin_programs(id) on delete cascade, sport_name text not null, primary key (program_id, sport_name));
        alter table events add column if not exists admin_program_id uuid references admin_programs(id) on delete set null;
        alter table events add column if not exists owner_admin_user_id uuid references admin_users(id) on delete set null;
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

export function hasSportAccess(session: AdminSession, sport: string) {
  return session.allowedSports === null || session.allowedSports.includes(sport);
}

export async function listAdminPrograms() {
  await ensureAdminAccessSchema();
  if (!hasDatabaseUrl()) return [];
  const { rows } = await getPool().query(`select p.*, coalesce(array_agg(ps.sport_name order by ps.sport_name) filter (where ps.sport_name is not null), '{}') sports from admin_programs p left join admin_program_sports ps on ps.program_id = p.id group by p.id order by p.name`);
  return rows.map((row) => ({ id: String(row.id), name: String(row.name), type: String(row.program_type), notificationEmail: row.notification_email ? String(row.notification_email) : "", sports: row.sports as string[] }));
}

export async function listAdminAccounts() {
  await ensureAdminAccessSchema();
  if (!hasDatabaseUrl()) return [];
  const { rows } = await getPool().query(`select u.id, u.email, u.display_name, u.role, u.is_active, coalesce(array_agg(p.name order by p.name) filter (where p.id is not null), '{}') programs from admin_users u left join admin_program_memberships m on m.admin_user_id = u.id left join admin_programs p on p.id = m.program_id group by u.id order by u.display_name`);
  return rows.map((row) => ({ id: String(row.id), email: String(row.email), name: String(row.display_name), role: String(row.role), active: Boolean(row.is_active), programs: row.programs as string[] }));
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

export async function createAdminProgram(input: { organizationId: string; name: string; type: string; notificationEmail?: string; sports: string[]; actorId: string }) {
  await ensureAdminAccessSchema();
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const { rows } = await client.query("insert into admin_programs (organization_id, name, program_type, notification_email) values ($1,$2,$3,nullif($4,'')) returning id", [input.organizationId, input.name.trim(), input.type, input.notificationEmail?.trim() || ""]);
    const id = String(rows[0].id);
    for (const sport of input.sports) await client.query("insert into admin_program_sports (program_id, sport_name) values ($1,$2) on conflict do nothing", [id, sport]);
    await client.query("insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata) values ($1,$2,'program.created','admin_program',$3,$4)", [input.organizationId, input.actorId, id, JSON.stringify({ name: input.name, sports: input.sports })]);
    await client.query("commit");
    return id;
  } catch (error) { await client.query("rollback"); throw error; } finally { client.release(); }
}

export async function createAdminAccount(input: { organizationId: string; name: string; email: string; password: string; role: AdminRole; programIds: string[]; actorId: string }) {
  await ensureAdminAccessSchema();
  const { rows } = await getPool().query("insert into admin_users (organization_id,email,normalized_email,display_name,password_hash,role) values ($1,$2,$3,$4,$5,$6) returning id", [input.organizationId, input.email.trim(), normalizeEmail(input.email), input.name.trim(), hashAdminPassword(input.password), input.role]);
  const id = String(rows[0].id);
  for (const programId of input.programIds) await getPool().query("insert into admin_program_memberships (admin_user_id,program_id) values ($1,$2) on conflict do nothing", [id, programId]);
  await getPool().query("insert into audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata) values ($1,$2,'admin.created','admin_user',$3,$4)", [input.organizationId, input.actorId, id, JSON.stringify({ email: input.email, role: input.role })]);
  return id;
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
      select distinct p.notification_email as email from admin_programs p join admin_program_sports ps on ps.program_id=p.id where p.is_active=true and p.notification_email is not null and ps.sport_name=$1
    ) recipients
  `, [sport]);
  return rows.map((row) => String(row.email)).filter(Boolean);
}
