import { eventOpenPositions, eventStatus, isEventSignupOpen, isSlotAvailable } from "./availability";
import { getPool, hasDatabaseUrl, withTransaction } from "./db";
import { events, organization, sampleSignups, templates } from "./demo-data";
import { createToken, hashToken, verifyToken } from "./tokens";
import type { AdminSignupRow, BoosterClubSignup, BoosterProgram, Signup, VolunteerEvent, VolunteerTemplate } from "./types";
import { normalizeEmail, slugify } from "./utils";
import { isPublicSport } from "./sports";
import type { BoosterClubSignupInput, SignupInput } from "./validation";
import { sportPhotos, sportsOffered, type SportName } from "./sports";
import { ensureKnownSchedules } from "./known-schedules";
import { ensureAdminAccessSchema } from "./admin-access";

export async function listPublicEvents() {
  if (!hasDatabaseUrl()) return events.filter((event) => event.isPublished && !event.isArchived && isPublicSport(event.sport));
  try {
    await ensureKnownSchedules();
    const { rows } = await getPool().query(`
    select
      e.*,
      coalesce(sp.name, '') as sport_name,
      coalesce(se.name, '') as season_name,
      coalesce(
        json_agg(distinct jsonb_build_object(
          'id', esi.id,
          'label', esi.label,
          'startsAt', esi.starts_at,
          'sortOrder', esi.sort_order
        )) filter (where esi.id is not null),
        '[]'
      ) as schedule,
      coalesce(
        (
          select json_agg(jsonb_build_object(
            'id', vs.id,
            'eventId', vs.event_id,
            'name', vs.name,
            'description', vs.description,
            'category', vs.category,
            'shiftStart', vs.shift_start_at,
            'shiftEnd', vs.shift_end_at,
            'capacity', vs.capacity,
            'filled', (select count(*)::int from signups s where s.slot_id = vs.id and s.status = 'confirmed'),
            'isOpen', vs.is_open,
            'isVisible', vs.is_visible,
            'sortOrder', vs.sort_order,
            'instructions', vs.instructions
          ) order by vs.sort_order)
          from volunteer_slots vs
          where vs.event_id = e.id and vs.is_visible
        ),
        '[]'
      ) as slots
    from events e
    left join sports sp on sp.id = e.sport_id
    left join seasons se on se.id = e.season_id
    left join event_schedule_items esi on esi.event_id = e.id
    where e.is_published = true and e.is_archived = false
    group by e.id, sp.name, se.name
    order by e.starts_at asc
    `);
    return rows.map(rowToEvent).filter((event) => isPublicSport(event.sport));
  } catch (error) {
    if (isMissingDatabaseSchema(error)) return events.filter((event) => event.isPublished && !event.isArchived && isPublicSport(event.sport));
    throw error;
  }
}

export async function getPublicEventBySlug(slug: string) {
  const allEvents = await listPublicEvents();
  return allEvents.find((event) => event.slug === slug);
}

export async function getEventAndSlot(slotId: string) {
  const allEvents = await listPublicEvents();
  for (const event of allEvents) {
    const slot = event.slots.find((candidate) => candidate.id === slotId);
    if (slot) return { event, slot };
  }
  return undefined;
}

export async function listAdminEvents(allowedSports: string[] | null = null) {
  const allEvents = await listPublicEvents();
  return allowedSports === null ? allEvents : allEvents.filter((event) => allowedSports.includes(event.sport));
}

export async function getAdminMetrics(allowedSports: string[] | null = null, allowedProgramIds: string[] | null = null) {
  const allEvents = await listAdminEvents(allowedSports);
  const upcoming = allEvents.filter((event) => new Date(event.startsAt) > new Date());
  const baseMetrics = {
    upcomingEvents: upcoming.length,
    openPositions: allEvents.reduce((sum, event) => sum + eventOpenPositions(event), 0),
    filledPositions: allEvents.reduce((sum, event) => sum + event.slots.reduce((slotSum, slot) => slotSum + slot.filled, 0), 0),
    totalSignups: sampleSignups.length,
    attention: allEvents.filter((event) => eventStatus(event) !== "open").length,
    recentSignups: sampleSignups.slice(0, 5),
    boosterSignups: 0,
    boosterVolunteerProspects: 0,
    boosterSponsorProspects: 0,
    topBoosterSports: [] as Array<{ sport: string; count: number }>,
  };
  if (hasDatabaseUrl()) {
    try {
      const [allSignups, booster, recent] = await Promise.all([listAdminSignups(5000, allowedSports), listBoosterClubSignups(5000, allowedSports, allowedProgramIds), listAdminSignups(5, allowedSports)]);
      const sportCounts = new Map<string, number>();
      for (const signup of booster) for (const sport of signup.selectedSports) if (allowedSports === null || allowedSports.includes(sport)) sportCounts.set(sport, (sportCounts.get(sport) ?? 0) + 1);
      return {
        ...baseMetrics,
        totalSignups: allSignups.length,
        recentSignups: recent,
        boosterSignups: booster.length,
        boosterVolunteerProspects: booster.filter((signup) => signup.openToVolunteering).length,
        boosterSponsorProspects: booster.filter((signup) => signup.interestedInSponsoring).length,
        topBoosterSports: [...sportCounts].map(([sport, count]) => ({ sport, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      };
    } catch (error) {
      if (!isMissingDatabaseSchema(error)) throw error;
    }
  }
  return baseMetrics;
}

export async function getTemplates(): Promise<VolunteerTemplate[]> {
  if (!hasDatabaseUrl()) return templates;
  try {
    const { rows } = await getPool().query(`
    select
      vt.id,
      vt.name,
      coalesce(vt.description, '') as description,
      coalesce(json_agg(jsonb_build_object(
        'name', vts.name,
        'category', vts.category,
        'capacity', vts.default_capacity,
        'sortOrder', vts.sort_order
      ) order by vts.sort_order) filter (where vts.id is not null), '[]') as slots
    from volunteer_templates vt
    left join volunteer_template_slots vts on vts.template_id = vt.id
    group by vt.id
    order by vt.name
    `);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      slots: row.slots,
    }));
  } catch (error) {
    if (isMissingDatabaseSchema(error)) return templates;
    throw error;
  }
}

export type SignupResult =
  | { ok: true; signup: Signup; cancellationToken: string }
  | { ok: false; code: "slot_full" | "event_closed" | "slot_closed" | "not_found"; message: string };

export type BoosterClubSignupResult =
  | { ok: true; id: string; program: BoosterProgram }
  | { ok: false; code: "not_ready" | "failed"; message: string };

export async function createSignup(input: SignupInput): Promise<SignupResult> {
  if (hasDatabaseUrl()) {
    try {
      return await withTransaction(async (client) => {
        const { rows } = await client.query(
          `
          select
            vs.*,
            e.organization_id,
            e.id as locked_event_id,
            e.is_published,
            e.is_archived,
            e.starts_at as event_starts_at,
            e.signup_opens_at,
            e.signup_closes_at
          from volunteer_slots vs
          join events e on e.id = vs.event_id
          where vs.id = $1
          for update of vs
          `,
          [input.slotId],
        );
        const row = rows[0];
        if (!row || !row.is_visible) return { ok: false, code: "not_found", message: "That volunteer position could not be found." } as SignupResult;
        if (!row.is_published || row.is_archived || new Date(row.event_starts_at) < new Date()) {
          return { ok: false, code: "event_closed", message: "This event is not currently accepting signups." } as SignupResult;
        }
        if (row.signup_opens_at && new Date(row.signup_opens_at) > new Date()) {
          return { ok: false, code: "event_closed", message: "This event is not currently accepting signups." } as SignupResult;
        }
        if (row.signup_closes_at && new Date(row.signup_closes_at) < new Date()) {
          return { ok: false, code: "event_closed", message: "This event is not currently accepting signups." } as SignupResult;
        }
        if (!row.is_open) return { ok: false, code: "slot_closed", message: "That volunteer position is closed." } as SignupResult;
        const active = await client.query("select count(*)::int as count from signups where slot_id = $1 and status = 'confirmed'", [input.slotId]);
        const status = active.rows[0].count >= row.capacity ? "waitlisted" : "confirmed";
        const cancellationToken = createToken();
        const confirmationToken = createToken();
        const inserted = await client.query(
          `
          insert into signups (
            organization_id, event_id, slot_id, first_name, last_name, email, normalized_email, phone,
            student_name, notes, status, confirmation_token_hash, cancellation_token_hash
          )
          values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          returning *
          `,
          [
            row.organization_id,
            row.locked_event_id,
            input.slotId,
            input.firstName.trim(),
            input.lastName.trim(),
            input.email.trim(),
            normalizeEmail(input.email),
            input.phone.trim(),
            input.studentName || null,
            input.notes || null,
            status,
            hashToken(confirmationToken),
            hashToken(cancellationToken),
          ],
        );
        return { ok: true, signup: rowToSignup(inserted.rows[0]), cancellationToken } as SignupResult;
      });
    } catch (error) {
      if (error instanceof Error) return { ok: false, code: "slot_full", message: friendlySignupError(error.message) };
      return { ok: false, code: "slot_full", message: "We could not complete the signup. Please try again." };
    }
  }

  const found = await getEventAndSlot(input.slotId);
  if (!found) return { ok: false, code: "not_found", message: "That volunteer position could not be found." };
  if (!isEventSignupOpen(found.event)) return { ok: false, code: "event_closed", message: "This event is not currently accepting signups." };
  const status = isSlotAvailable(found.slot) ? "confirmed" : "waitlisted";
  const cancellationToken = createToken();
  return {
    ok: true,
    cancellationToken,
    signup: {
      id: crypto.randomUUID(),
      organizationId: found.event.organizationId,
      eventId: found.event.id,
      slotId: found.slot.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      normalizedEmail: normalizeEmail(input.email),
      phone: input.phone,
      studentName: input.studentName || undefined,
      notes: input.notes || undefined,
      status,
      cancellationTokenHash: hashToken(cancellationToken),
      createdAt: new Date().toISOString(),
    },
  };
}

export async function listAdminSignups(limit = 200, allowedSports: string[] | null = null): Promise<AdminSignupRow[]> {
  if (!hasDatabaseUrl()) {
    return sampleSignups.slice(0, limit).map((signup) => {
      const event = events.find((candidate) => candidate.id === signup.eventId);
      const slot = event?.slots.find((candidate) => candidate.id === signup.slotId);
      return { ...signup, eventTitle: event?.title ?? "", eventDate: event?.eventDate ?? "", slotName: slot?.name ?? "" };
    });
  }
  try {
    const { rows } = await getPool().query(
      `
      select s.*, e.title as event_title, e.event_date, vs.name as slot_name
      from signups s
      join events e on e.id = s.event_id
      left join sports sp on sp.id = e.sport_id
      join volunteer_slots vs on vs.id = s.slot_id
      where ($2::text[] is null or sp.name = any($2::text[]))
      order by s.created_at desc
      limit $1
      `,
      [limit, allowedSports],
    );
    return rows.map((row) => ({ ...rowToSignup(row), eventTitle: String(row.event_title), eventDate: toDateOnly(row.event_date), slotName: String(row.slot_name) }));
  } catch (error) {
    if (isMissingDatabaseSchema(error)) return [];
    throw error;
  }
}

export async function listBoosterClubSignups(limit = 500, allowedSports: string[] | null = null, allowedProgramIds: string[] | null = null): Promise<BoosterClubSignup[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    await ensureAdminAccessSchema();
    const { rows } = await getPool().query("select * from booster_club_signups where ($2::text[] is null or selected_sports && $2::text[]) and ($3::uuid[] is null or program_id = any($3::uuid[])) order by created_at desc limit $1", [limit, allowedSports, allowedProgramIds]);
    return rows.map(rowToBoosterClubSignup);
  } catch (error) {
    if (isMissingDatabaseSchema(error)) return [];
    throw error;
  }
}

const defaultBoosterPrograms = [
  { name: "Whitehouse Community Booster Club", sports: ["Basketball (Boys)", "Basketball (Girls)", "Cross Country (Coed)", "Football", "Golf (Girls)", "Soccer (Boys)", "Soccer (Girls)", "Swimming and Diving (Coed)", "Tennis (Coed)", "Track and Field (Boys)", "Track and Field (Girls)", "Volleyball", "Wrestling (Coed)"] },
  { name: "Baseball Booster Club", sports: ["Baseball"] },
  { name: "Softball Booster Club", sports: ["Softball"] },
  { name: "Cheer Booster Club", sports: ["Cheerleading (Girls)"] },
  { name: "Dance Booster Club", sports: ["Dance"] },
] as const;

async function ensureDefaultBoosterPrograms() {
  if (!hasDatabaseUrl()) return;
  await ensureAdminAccessSchema();
  const client = await getPool().connect();
  try {
    await client.query("begin");
    for (const program of defaultBoosterPrograms) {
      const { rows } = await client.query("insert into admin_programs (organization_id,name,program_type,membership_fee_cents,payment_required) values ($1,$2,'booster_club',100,true) on conflict (organization_id,name) do update set program_type='booster_club' returning id", [organization.id, program.name]);
      for (const sport of program.sports) await client.query("insert into admin_program_sports (program_id,sport_name) values ($1,$2) on conflict do nothing", [rows[0].id, sport]);
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function listPublicBoosterPrograms(): Promise<BoosterProgram[]> {
  if (!hasDatabaseUrl()) return [];
  await ensureDefaultBoosterPrograms();
  const { rows } = await getPool().query(`select p.id,p.name,p.membership_fee_cents,p.payment_required,p.stripe_account_id,p.stripe_account_charges_enabled,coalesce(array_agg(ps.sport_name order by ps.sport_name) filter (where ps.sport_name is not null),'{}') sports from admin_programs p left join admin_program_sports ps on ps.program_id=p.id where p.program_type='booster_club' and p.is_active=true group by p.id order by p.name`);
  return rows.map((row) => ({ id: String(row.id), name: String(row.name), sports: row.sports as string[], membershipFeeCents: Number(row.membership_fee_cents ?? 0), paymentRequired: Boolean(row.payment_required), stripeAccountId: row.stripe_account_id ? String(row.stripe_account_id) : undefined, stripeChargesEnabled: Boolean(row.stripe_account_charges_enabled) }));
}

export async function updateEventDetails(input: { id: string; title: string; opponent?: string; eventDate: string; startsAt: string; location: string; description?: string; contactName?: string; contactEmail?: string }) {
  if (!hasDatabaseUrl()) return;
  await getPool().query(
    `
    update events
    set title = $2, opponent = nullif($3, ''), event_date = $4::date, starts_at = $5::timestamptz,
        location = $6, description = nullif($7, ''), contact_name = nullif($8, ''), contact_email = nullif($9, ''), updated_at = now()
    where id = $1
    `,
    [input.id, input.title.trim(), input.opponent?.trim() ?? "", input.eventDate, input.startsAt, input.location.trim(), input.description?.trim() ?? "", input.contactName?.trim() ?? "", input.contactEmail?.trim().toLowerCase() ?? ""],
  );
}

export async function updateSlotState(input: { slotId: string; isOpen: boolean }) {
  if (!hasDatabaseUrl()) return;
  await getPool().query("update volunteer_slots set is_open = $2, updated_at = now() where id = $1", [input.slotId, input.isOpen]);
}

export async function cancelSignupById(id: string) {
  if (!hasDatabaseUrl()) return;
  await getPool().query("update signups set status = 'cancelled', cancelled_at = now(), updated_at = now() where id = $1 and status in ('confirmed', 'waitlisted')", [id]);
}

async function ensureSportMediaTable() {
  if (!hasDatabaseUrl()) return;
  const client = await getPool().connect();
  try {
    await client.query("select pg_advisory_lock(hashtext('whssignups_sport_media'))");
    await client.query(`
      create table if not exists sport_media (
        id uuid primary key default gen_random_uuid(),
        organization_id uuid not null references organizations(id) on delete cascade,
        sport_name text not null,
        label text not null default 'Team',
        mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
        file_data bytea not null,
        sort_order integer not null default 0,
        uploaded_by text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        unique (organization_id, sport_name, label)
      )
    `);
  } finally {
    await client.query("select pg_advisory_unlock(hashtext('whssignups_sport_media'))").catch(() => undefined);
    client.release();
  }
}

export async function getSportPhotoMap() {
  const fallback = structuredClone(sportPhotos) as typeof sportPhotos;
  if (!hasDatabaseUrl()) return fallback;
  try {
    await ensureSportMediaTable();
    const { rows } = await getPool().query("select id, sport_name, label from sport_media order by sport_name, sort_order, created_at");
    const managed: typeof sportPhotos = {};
    for (const row of rows) {
      const sport = sportsOffered.find((candidate) => candidate === String(row.sport_name));
      if (!sport) continue;
      (managed[sport] ??= []).push({ src: `/api/sports/media/${row.id}`, alt: `Whitehouse ${sport} ${String(row.label).toLowerCase()} team`, label: String(row.label) });
    }
    return { ...fallback, ...managed };
  } catch (error) {
    if (isMissingDatabaseSchema(error)) return fallback;
    throw error;
  }
}

export async function saveSportPhoto(input: { sport: SportName; label: string; mimeType: string; bytes: Buffer; uploadedBy: string }) {
  if (!hasDatabaseUrl()) throw new Error("Database storage is not configured.");
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(input.mimeType)) throw new Error("Upload a JPEG, PNG, or WebP image.");
  if (input.bytes.length > 5 * 1024 * 1024) throw new Error("Team photos must be 5 MB or smaller.");
  await ensureSportMediaTable();
  await getPool().query(
    `insert into sport_media (organization_id, sport_name, label, mime_type, file_data, sort_order, uploaded_by)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (organization_id, sport_name, label) do update
     set mime_type=excluded.mime_type, file_data=excluded.file_data, uploaded_by=excluded.uploaded_by, updated_at=now()`,
    [organization.id, input.sport, input.label, input.mimeType, input.bytes, input.label === "Girls" ? 2 : 1, input.uploadedBy],
  );
}

export async function getSportPhotoFile(id: string) {
  if (!hasDatabaseUrl()) return undefined;
  try {
    await ensureSportMediaTable();
    const { rows } = await getPool().query("select mime_type, file_data, updated_at from sport_media where id=$1 limit 1", [id]);
    return rows[0] ? { mimeType: String(rows[0].mime_type), bytes: rows[0].file_data as Buffer, updatedAt: toIso(rows[0].updated_at) } : undefined;
  } catch (error) {
    if (isMissingDatabaseSchema(error)) return undefined;
    throw error;
  }
}

export async function getSignupContextById(id: string, allowedSports: string[] | null = null) {
  const signup = (await listAdminSignups(5000, allowedSports)).find((candidate) => candidate.id === id);
  if (!signup) return undefined;
  const event = (await listAdminEvents(allowedSports)).find((candidate) => candidate.id === signup.eventId);
  const slot = event?.slots.find((candidate) => candidate.id === signup.slotId);
  return event && slot ? { signup, event, slot } : undefined;
}

export async function createAdminEvent(input: { title: string; sport: string; opponent?: string; eventDate: string; startsAt: string; location: string; description?: string; contactName?: string; contactEmail?: string; templateId?: string; customSlots?: Array<{ name: string; category: string; capacity: number }>; schedule?: Array<{ label: string; startsAt: string }>; organizationId?: string; programId?: string; ownerAdminUserId?: string; createdBy?: string }) {
  if (!hasDatabaseUrl()) return;
  await withTransaction(async (client) => {
    const orgId = input.organizationId || "11111111-1111-4111-8111-111111111111";
    const sport = await client.query(
      "insert into sports (organization_id, name) values ($1, $2) on conflict (organization_id, name) do update set name = excluded.name returning id",
      [orgId, input.sport],
    );
    const season = await client.query(
      "insert into seasons (organization_id, sport_id, name) values ($1, $2, $3) on conflict (organization_id, name) do update set sport_id = excluded.sport_id returning id",
      [orgId, sport.rows[0].id, "2026 Home Games"],
    );
    const event = await client.query(
      `
      insert into events (organization_id, sport_id, season_id, title, slug, opponent, event_date, starts_at, location, description, contact_name, contact_email, created_by, admin_program_id, owner_admin_user_id, is_published)
      values ($1,$2,$3,$4,$5,$6,$7::date,$8::timestamptz,$9,$10,$11,$12,$13,$14,$15,true)
      returning id
      `,
      [
        orgId,
        sport.rows[0].id,
        season.rows[0].id,
        input.title.trim(),
        `${slugify(input.title)}-${input.eventDate}`,
        input.opponent?.trim() || null,
        input.eventDate,
        input.startsAt,
        input.location.trim(),
        input.description?.trim() || null,
        input.contactName?.trim() || null,
        input.contactEmail?.trim().toLowerCase() || null,
        input.createdBy || input.contactEmail?.trim().toLowerCase() || null,
        input.programId || null,
        input.ownerAdminUserId === "bootstrap-super-admin" ? null : input.ownerAdminUserId || null,
      ],
    );
    const slots: Array<{ name: string; category: string; capacity: number }> = [];
    for (const [index, item] of (input.schedule ?? []).entries()) {
      await client.query("insert into event_schedule_items (event_id,label,starts_at,sort_order) values ($1,$2,$3,$4)", [event.rows[0].id, item.label, item.startsAt, index + 1]);
    }
    if (input.templateId) {
      const templateSlots = await client.query("select name, category, default_capacity as capacity from volunteer_template_slots where template_id=$1 order by sort_order", [input.templateId]);
      slots.push(...templateSlots.rows.map((row) => ({ name: String(row.name), category: String(row.category), capacity: Number(row.capacity) })));
    }
    slots.push(...(input.customSlots ?? []));
    if (slots.length === 0) slots.push({ name: "General Volunteer", category: "Volunteers", capacity: 1 });
    for (const [index, slot] of slots.entries()) {
      if (slot.category === "Student Volunteers") {
        const studentShifts = input.schedule?.length ? input.schedule : [{ label: "Game", startsAt: input.startsAt }];
        for (const [shiftIndex, shift] of studentShifts.entries()) {
          await client.query(
            `
            insert into volunteer_slots (event_id, name, category, shift_start_at, shift_end_at, capacity, sort_order, instructions)
            values ($1,$2,$3,$4::timestamptz - interval '30 minutes',$4::timestamptz + interval '60 minutes',$5,$6,$7)
            `,
            [
              event.rows[0].id,
              `${slot.name} - ${shift.label}`,
              slot.category,
              shift.startsAt,
              slot.capacity,
              index * 10 + shiftIndex + 1,
              "Student shift begins 30 minutes before the listed game time and runs 1.5 hours.",
            ],
          );
        }
      } else if (slot.category === "Adult Volunteers") {
        await client.query(
          `
          insert into volunteer_slots (event_id, name, category, shift_start_at, shift_end_at, capacity, sort_order, instructions)
          values ($1,$2,$3,$4::timestamptz,$4::timestamptz + interval '2 hours',$5,$6,$7)
          `,
          [event.rows[0].id, slot.name, slot.category, input.startsAt, slot.capacity, index + 1, "Adult shift runs 2 hours from the event start time."],
        );
      } else {
        await client.query("insert into volunteer_slots (event_id, name, category, capacity, sort_order) values ($1,$2,$3,$4,$5)", [event.rows[0].id, slot.name, slot.category, slot.capacity, index + 1]);
      }
    }
  });
}

export async function createVolunteerTemplate(input: { name: string; description: string; slots: Array<{ name: string; category: string; capacity: number }> }) {
  if (!hasDatabaseUrl()) return;
  await withTransaction(async (client) => {
    const { rows } = await client.query("insert into volunteer_templates (organization_id,name,description) values ($1,$2,$3) returning id", [organization.id, input.name.trim(), input.description.trim() || null]);
    for (const [index, slot] of input.slots.entries()) {
      await client.query("insert into volunteer_template_slots (template_id,name,category,default_capacity,sort_order) values ($1,$2,$3,$4,$5)", [rows[0].id, slot.name, slot.category, slot.capacity, index + 1]);
    }
  });
}

export async function createBoosterClubSignup(input: BoosterClubSignupInput): Promise<BoosterClubSignupResult> {
  if (!hasDatabaseUrl()) return { ok: false, code: "not_ready", message: "Booster Club signups are not ready yet. Please try again soon." };

  try {
    await ensureDefaultBoosterPrograms();
    const programs = await listPublicBoosterPrograms();
    const program = programs.find((candidate) => candidate.id === input.programId);
    if (!program) return { ok: false, code: "failed", message: "Choose an active Booster Club." };
    const allowedSports = new Set(program.sports);
    if (input.selectedSports.some((sport) => !allowedSports.has(sport))) return { ok: false, code: "failed", message: "One or more selected sports do not belong to that Booster Club." };
    const paymentAmountCents = program.paymentRequired ? program.membershipFeeCents : 0;
    const { rows } = await getPool().query(
      `
      with org as (
        select id
        from organizations
        order by created_at asc
        limit 1
      )
      insert into booster_club_signups (
        organization_id, first_name, last_name, email, normalized_email, phone,
        program_id, program_name, selected_sports, gear_preference, open_to_volunteering, interested_in_sponsoring,
        payment_status, payment_amount_cents, stripe_account_id
      )
      select
        org.id, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      from org
      returning id
      `,
      [
        input.firstName.trim(),
        input.lastName.trim(),
        input.email.trim(),
        normalizeEmail(input.email),
        input.phone.trim(),
        program.id,
        program.name,
        input.selectedSports,
        input.gearPreference,
        input.openToVolunteering === "yes",
        input.interestedInSponsoring === "yes",
        paymentAmountCents > 0 ? "pending" : "not_required",
        paymentAmountCents,
        program.stripeAccountId ?? null,
      ],
    );
    if (!rows[0]) return { ok: false, code: "not_ready", message: "Booster Club signups are not ready yet. Please try again soon." };
    return { ok: true, id: String(rows[0].id), program };
  } catch (error) {
    if (isMissingDatabaseSchema(error)) {
      return { ok: false, code: "not_ready", message: "Booster Club signups are being set up. Please try again soon." };
    }
    return { ok: false, code: "failed", message: "We could not complete the Booster Club signup. Please try again." };
  }
}

export async function attachBoosterCheckoutSession(signupId: string, sessionId: string) {
  await getPool().query("update booster_club_signups set stripe_checkout_session_id=$2, updated_at=now() where id=$1 and payment_status='pending'", [signupId, sessionId]);
}

export async function markBoosterPaymentPaid(input: { sessionId: string; paymentIntentId?: string; stripeAccountId?: string }) {
  if (!hasDatabaseUrl()) return;
  await ensureAdminAccessSchema();
  await getPool().query("update booster_club_signups set payment_status='paid', stripe_payment_intent_id=nullif($2,''), paid_at=coalesce(paid_at,now()), updated_at=now() where stripe_checkout_session_id=$1 and coalesce(stripe_account_id,'')=$3", [input.sessionId, input.paymentIntentId ?? "", input.stripeAccountId ?? ""]);
}

export async function markBoosterPaymentFailed(sessionId: string, stripeAccountId?: string) {
  if (!hasDatabaseUrl()) return;
  await ensureAdminAccessSchema();
  await getPool().query("update booster_club_signups set payment_status='failed', updated_at=now() where stripe_checkout_session_id=$1 and coalesce(stripe_account_id,'')=$2 and payment_status='pending'", [sessionId, stripeAccountId ?? ""]);
}

export async function getCancellationByToken(token: string) {
  if (hasDatabaseUrl()) {
    const { rows } = await getPool().query(
      `
      select s.*, vs.id as slot_id_for_row, e.slug
      from signups s
      join volunteer_slots vs on vs.id = s.slot_id
      join events e on e.id = s.event_id
      where s.cancellation_token_hash = $1 and s.status = 'confirmed'
      limit 1
      `,
      [hashToken(token)],
    );
    if (!rows[0]) return undefined;
    const event = await getPublicEventBySlug(rows[0].slug);
    const slot = event?.slots.find((candidate) => candidate.id === rows[0].slot_id_for_row);
    return event && slot ? { signup: rowToSignup(rows[0]), event, slot } : undefined;
  }
  const signup = sampleSignups[0];
  if (!verifyToken(token, signup.cancellationTokenHash)) return undefined;
  const event = events.find((candidate) => candidate.id === signup.eventId);
  const slot = event?.slots.find((candidate) => candidate.id === signup.slotId);
  return event && slot ? { signup, event, slot } : undefined;
}

export async function listVolunteerReminders() {
  if (!hasDatabaseUrl()) return [];
  const { rows } = await getPool().query(`
    select s.id
    from signups s
    join events e on e.id = s.event_id
    join volunteer_slots vs on vs.id = s.slot_id
    where s.status = 'confirmed'
      and coalesce(vs.shift_start_at, e.starts_at) between now() + interval '20 hours' and now() + interval '28 hours'
      and not exists (
        select 1 from email_logs el
        where el.signup_id = s.id and el.template = 'volunteer_reminder' and el.status = 'sent'
      )
    order by coalesce(vs.shift_start_at, e.starts_at)
    limit 500
  `);
  const reminders: Array<{ signup: Signup; event: VolunteerEvent; slot: VolunteerEvent["slots"][number] }> = [];
  for (const row of rows) {
    const context = await getSignupContextById(String(row.id));
    if (context) reminders.push(context);
  }
  return reminders;
}

export async function recordEmailDelivery(input: { signupId: string; recipient: string; template: string; status: "queued" | "sent" | "failed"; provider?: string; providerId?: string; error?: string }) {
  if (!hasDatabaseUrl()) return;
  await getPool().query(
    `insert into email_logs (organization_id, signup_id, recipient, template, status, provider, provider_id, error_message)
     select organization_id, id, $2, $3, $4, $5, $6, $7 from signups where id = $1
     on conflict (signup_id, template, recipient) where signup_id is not null
     do update set status = excluded.status, provider = excluded.provider, provider_id = excluded.provider_id, error_message = excluded.error_message, created_at = now()`,
    [input.signupId, input.recipient, input.template, input.status, input.provider, input.providerId, input.error],
  );
}

export async function cancelSignupByToken(token: string) {
  if (hasDatabaseUrl()) {
    const { rows } = await getPool().query(
      `
      update signups
      set status = 'cancelled', cancelled_at = now(), updated_at = now()
      where cancellation_token_hash = $1 and status = 'confirmed'
      returning *
      `,
      [hashToken(token)],
    );
    if (!rows[0]) throw new Error("Invalid or previously used cancellation link.");
    return rowToSignup(rows[0]);
  }
  return getCancellationByToken(token);
}

function friendlySignupError(message: string) {
  if (message.includes("slot_full")) return "That volunteer position is already full.";
  if (message.includes("event_closed")) return "This event is not currently accepting signups.";
  if (message.includes("slot_closed")) return "That volunteer position is closed.";
  return "We could not complete the signup. Please try again.";
}

export { organization };

function rowToEvent(row: Record<string, unknown>): VolunteerEvent {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    sport: String(row.sport_name),
    season: String(row.season_name),
    title: String(row.title),
    slug: String(row.slug),
    opponent: optionalString(row.opponent),
    eventType: String(row.event_type),
    eventDate: toDateOnly(row.event_date),
    startsAt: toIso(row.starts_at),
    endsAt: optionalIso(row.ends_at),
    location: String(row.location),
    address: optionalString(row.address),
    description: optionalString(row.description),
    homeAway: row.home_away as VolunteerEvent["homeAway"],
    isPublished: Boolean(row.is_published),
    signupOpensAt: optionalIso(row.signup_opens_at),
    signupClosesAt: optionalIso(row.signup_closes_at),
    contactName: optionalString(row.contact_name),
    contactEmail: optionalString(row.contact_email),
    isArchived: Boolean(row.is_archived),
    schedule: (row.schedule as VolunteerEvent["schedule"]).map((item) => ({ ...item, startsAt: toIso(item.startsAt) })),
    slots: (row.slots as VolunteerEvent["slots"]).map((slot) => ({
      ...slot,
      shiftStart: optionalIso(slot.shiftStart),
      shiftEnd: optionalIso(slot.shiftEnd),
    })),
  };
}

function rowToSignup(row: Record<string, unknown>): Signup {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    eventId: String(row.event_id),
    slotId: String(row.slot_id),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    email: String(row.email),
    normalizedEmail: String(row.normalized_email),
    phone: String(row.phone),
    studentName: optionalString(row.student_name),
    notes: optionalString(row.notes),
    status: row.status as Signup["status"],
    cancellationTokenHash: String(row.cancellation_token_hash),
    createdAt: toIso(row.created_at),
    cancelledAt: optionalIso(row.cancelled_at),
  };
}

function rowToBoosterClubSignup(row: Record<string, unknown>): BoosterClubSignup {
  return {
    id: String(row.id),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    email: String(row.email),
    normalizedEmail: String(row.normalized_email),
    phone: String(row.phone),
    programId: row.program_id ? String(row.program_id) : "",
    programName: row.program_name ? String(row.program_name) : "Legacy Booster Club",
    selectedSports: Array.isArray(row.selected_sports) ? row.selected_sports.map(String) : [],
    gearPreference: row.gear_preference as BoosterClubSignup["gearPreference"],
    openToVolunteering: Boolean(row.open_to_volunteering),
    interestedInSponsoring: Boolean(row.interested_in_sponsoring),
    paymentStatus: String(row.payment_status ?? "not_required") as BoosterClubSignup["paymentStatus"],
    paymentAmountCents: Number(row.payment_amount_cents ?? 0),
    createdAt: toIso(row.created_at),
  };
}

function optionalString(value: unknown) {
  return value ? String(value) : undefined;
}

function toIso(value: unknown) {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function optionalIso(value: unknown) {
  return value ? toIso(value) : undefined;
}

function toDateOnly(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function isMissingDatabaseSchema(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "42P01";
}
