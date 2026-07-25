import { eventOpenPositions, eventStatus, isEventSignupOpen, isSlotAvailable } from "./availability";
import { getPool, hasDatabaseUrl, withTransaction } from "./db";
import { events, organization, sampleSignups, templates } from "./demo-data";
import { createToken, hashToken, verifyToken } from "./tokens";
import type { AdminSignupRow, BoosterClubSignup, Signup, VolunteerEvent, VolunteerTemplate } from "./types";
import { normalizeEmail, slugify } from "./utils";
import type { BoosterClubSignupInput, SignupInput } from "./validation";

export async function listPublicEvents() {
  if (!hasDatabaseUrl()) return events.filter((event) => event.isPublished && !event.isArchived);
  try {
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
    return rows.map(rowToEvent);
  } catch (error) {
    if (isMissingDatabaseSchema(error)) return events.filter((event) => event.isPublished && !event.isArchived);
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

export async function listAdminEvents() {
  return listPublicEvents();
}

export async function getAdminMetrics() {
  const allEvents = await listAdminEvents();
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
      const [eventSignupTotal, total, volunteer, sponsor, sports, recent] = await Promise.all([
        getPool().query("select count(*)::int as count from signups"),
        getPool().query("select count(*)::int as count from booster_club_signups"),
        getPool().query("select count(*)::int as count from booster_club_signups where open_to_volunteering"),
        getPool().query("select count(*)::int as count from booster_club_signups where interested_in_sponsoring"),
        getPool().query("select sport, count(*)::int as count from booster_club_signups, unnest(selected_sports) sport group by sport order by count desc, sport asc limit 5"),
        listAdminSignups(5),
      ]);
      return {
        ...baseMetrics,
        totalSignups: eventSignupTotal.rows[0]?.count ?? recent.length,
        recentSignups: recent,
        boosterSignups: total.rows[0]?.count ?? 0,
        boosterVolunteerProspects: volunteer.rows[0]?.count ?? 0,
        boosterSponsorProspects: sponsor.rows[0]?.count ?? 0,
        topBoosterSports: sports.rows.map((row) => ({ sport: String(row.sport), count: Number(row.count) })),
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
  | { ok: true; id: string }
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

export async function listAdminSignups(limit = 200): Promise<AdminSignupRow[]> {
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
      join volunteer_slots vs on vs.id = s.slot_id
      order by s.created_at desc
      limit $1
      `,
      [limit],
    );
    return rows.map((row) => ({ ...rowToSignup(row), eventTitle: String(row.event_title), eventDate: toDateOnly(row.event_date), slotName: String(row.slot_name) }));
  } catch (error) {
    if (isMissingDatabaseSchema(error)) return [];
    throw error;
  }
}

export async function listBoosterClubSignups(limit = 500): Promise<BoosterClubSignup[]> {
  if (!hasDatabaseUrl()) return [];
  try {
    const { rows } = await getPool().query("select * from booster_club_signups order by created_at desc limit $1", [limit]);
    return rows.map(rowToBoosterClubSignup);
  } catch (error) {
    if (isMissingDatabaseSchema(error)) return [];
    throw error;
  }
}

export async function updateEventDetails(input: { id: string; title: string; opponent?: string; eventDate: string; startsAt: string; location: string; description?: string }) {
  if (!hasDatabaseUrl()) return;
  await getPool().query(
    `
    update events
    set title = $2, opponent = nullif($3, ''), event_date = $4::date, starts_at = $5::timestamptz,
        location = $6, description = nullif($7, ''), updated_at = now()
    where id = $1
    `,
    [input.id, input.title.trim(), input.opponent?.trim() ?? "", input.eventDate, input.startsAt, input.location.trim(), input.description?.trim() ?? ""],
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

export async function createAdminEvent(input: { title: string; sport: string; opponent?: string; eventDate: string; startsAt: string; location: string; description?: string }) {
  if (!hasDatabaseUrl()) return;
  await withTransaction(async (client) => {
    const orgId = "11111111-1111-4111-8111-111111111111";
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
      insert into events (organization_id, sport_id, season_id, title, slug, opponent, event_date, starts_at, location, description, is_published)
      values ($1,$2,$3,$4,$5,$6,$7::date,$8::timestamptz,$9,$10,true)
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
      ],
    );
    await client.query(
      `
      insert into volunteer_slots (event_id, name, category, capacity, sort_order)
      values ($1, 'Student Volunteer', 'Student Volunteers', 6, 1), ($1, 'Adult Volunteer', 'Adult Volunteers', 2, 2)
      `,
      [event.rows[0].id],
    );
  });
}

export async function createBoosterClubSignup(input: BoosterClubSignupInput): Promise<BoosterClubSignupResult> {
  if (!hasDatabaseUrl()) return { ok: true, id: crypto.randomUUID() };

  try {
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
        selected_sports, gear_preference, open_to_volunteering, interested_in_sponsoring
      )
      select
        org.id, $1, $2, $3, $4, $5, $6, $7, $8, $9
      from org
      returning id
      `,
      [
        input.firstName.trim(),
        input.lastName.trim(),
        input.email.trim(),
        normalizeEmail(input.email),
        input.phone.trim(),
        input.selectedSports,
        input.gearPreference,
        input.openToVolunteering === "yes",
        input.interestedInSponsoring === "yes",
      ],
    );
    if (!rows[0]) return { ok: false, code: "not_ready", message: "Booster Club signups are not ready yet. Please try again soon." };
    return { ok: true, id: String(rows[0].id) };
  } catch (error) {
    if (isMissingDatabaseSchema(error)) {
      return { ok: false, code: "not_ready", message: "Booster Club signups are being set up. Please try again soon." };
    }
    return { ok: false, code: "failed", message: "We could not complete the Booster Club signup. Please try again." };
  }
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
    selectedSports: Array.isArray(row.selected_sports) ? row.selected_sports.map(String) : [],
    gearPreference: row.gear_preference as BoosterClubSignup["gearPreference"],
    openToVolunteering: Boolean(row.open_to_volunteering),
    interestedInSponsoring: Boolean(row.interested_in_sponsoring),
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
