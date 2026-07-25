import { eventOpenPositions, eventStatus, isEventSignupOpen, isSlotAvailable } from "./availability";
import { events, organization, sampleSignups, templates } from "./demo-data";
import { getSupabaseAdminClient, hasSupabaseEnv } from "./supabase/clients";
import { createToken, hashToken, verifyToken } from "./tokens";
import type { Signup, VolunteerEvent, VolunteerSlot } from "./types";
import { normalizeEmail } from "./utils";
import type { SignupInput } from "./validation";

export async function listPublicEvents() {
  if (!hasSupabaseEnv()) return events.filter((event) => event.isPublished && !event.isArchived);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("public_events_with_slots");
  if (error) throw error;
  return data as VolunteerEvent[];
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
  return {
    upcomingEvents: upcoming.length,
    openPositions: allEvents.reduce((sum, event) => sum + eventOpenPositions(event), 0),
    filledPositions: allEvents.reduce((sum, event) => sum + event.slots.reduce((slotSum, slot) => slotSum + slot.filled, 0), 0),
    totalSignups: sampleSignups.length,
    attention: allEvents.filter((event) => eventStatus(event) !== "open").length,
    recentSignups: sampleSignups.slice(0, 5),
  };
}

export async function getTemplates() {
  return templates;
}

export type SignupResult =
  | { ok: true; signup: Signup; cancellationToken: string }
  | { ok: false; code: "slot_full" | "event_closed" | "slot_closed" | "not_found"; message: string };

export async function createSignup(input: SignupInput): Promise<SignupResult> {
  if (hasSupabaseEnv()) {
    const supabase = getSupabaseAdminClient();
    const cancellationToken = createToken();
    const confirmationToken = createToken();
    const { data, error } = await supabase.rpc("create_public_signup", {
      p_slot_id: input.slotId,
      p_first_name: input.firstName,
      p_last_name: input.lastName,
      p_email: input.email,
      p_phone: input.phone,
      p_student_name: input.studentName || null,
      p_notes: input.notes || null,
      p_confirmation_token_hash: hashToken(confirmationToken),
      p_cancellation_token_hash: hashToken(cancellationToken),
    });
    if (error) return { ok: false, code: "slot_full", message: friendlySignupError(error.message) };
    return { ok: true, signup: data as Signup, cancellationToken };
  }

  const found = await getEventAndSlot(input.slotId);
  if (!found) return { ok: false, code: "not_found", message: "That volunteer position could not be found." };
  if (!isEventSignupOpen(found.event)) return { ok: false, code: "event_closed", message: "This event is not currently accepting signups." };
  if (!isSlotAvailable(found.slot)) return { ok: false, code: "slot_full", message: "That volunteer position is already full." };
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
      status: "confirmed",
      cancellationTokenHash: hashToken(cancellationToken),
      createdAt: new Date().toISOString(),
    },
  };
}

export async function getCancellationByToken(token: string) {
  if (hasSupabaseEnv()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc("find_signup_by_cancellation_token", { p_token_hash: hashToken(token) });
    if (error) return undefined;
    return data as { signup: Signup; event: VolunteerEvent; slot: VolunteerSlot } | undefined;
  }
  const signup = sampleSignups[0];
  if (!verifyToken(token, signup.cancellationTokenHash)) return undefined;
  const event = events.find((candidate) => candidate.id === signup.eventId);
  const slot = event?.slots.find((candidate) => candidate.id === signup.slotId);
  return event && slot ? { signup, event, slot } : undefined;
}

export async function cancelSignupByToken(token: string) {
  if (hasSupabaseEnv()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc("cancel_signup_by_token", { p_token_hash: hashToken(token) });
    if (error) throw new Error("Invalid or previously used cancellation link.");
    return data;
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
