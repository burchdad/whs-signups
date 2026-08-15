"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sendCancellationEmails } from "@/lib/email/service";
import { cancelSignupById, createAdminEvent, createVolunteerTemplate, getSignupContextById, saveSportPhoto, updateEventDetails, updateSlotState } from "@/lib/repository";
import { sportsOffered, type SportName } from "@/lib/sports";

export async function saveEventDetails(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await updateEventDetails({
    id,
    title: String(formData.get("title") ?? ""),
    opponent: String(formData.get("opponent") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    location: String(formData.get("location") ?? ""),
    description: String(formData.get("description") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
  });
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);
}

export async function setSlotOpen(formData: FormData) {
  await requireAdmin();
  const eventId = String(formData.get("eventId") ?? "");
  await updateSlotState({ slotId: String(formData.get("slotId") ?? ""), isOpen: String(formData.get("isOpen")) === "true" });
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
}

export async function cancelSignup(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("signupId") ?? "");
  const found = await getSignupContextById(id);
  await cancelSignupById(id);
  if (found) await sendCancellationEmails(found);
  revalidatePath("/admin");
  revalidatePath("/admin/signups");
}

export async function createEvent(formData: FormData) {
  const session = await requireAdmin();
  await createAdminEvent({
    title: String(formData.get("title") ?? ""),
    sport: String(formData.get("sport") ?? "Volleyball"),
    opponent: String(formData.get("opponent") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    location: String(formData.get("location") ?? ""),
    description: String(formData.get("description") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? session.user.email),
    templateId: String(formData.get("templateId") ?? "") || undefined,
    customSlots: parseRoleLines(String(formData.get("customRoles") ?? "")),
  });
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function createTemplate(formData: FormData) {
  await requireAdmin();
  const slots = parseRoleLines(String(formData.get("roles") ?? ""));
  if (slots.length === 0) throw new Error("Add at least one role to the template.");
  await createVolunteerTemplate({ name: String(formData.get("name") ?? ""), description: String(formData.get("description") ?? ""), slots });
  revalidatePath("/admin/templates");
  redirect("/admin/templates?created=1");
}

function parseRoleLines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 30).map((line) => {
    const [nameRaw, capacityRaw, categoryRaw] = line.split("|").map((part) => part.trim());
    const capacity = Math.min(500, Math.max(1, Number.parseInt(capacityRaw || "1", 10) || 1));
    const name = nameRaw.slice(0, 100);
    if (!name) throw new Error("Every custom role needs a name.");
    return { name, capacity, category: (categoryRaw || "Volunteers").slice(0, 100) };
  });
}

export async function uploadSportPhoto(formData: FormData) {
  const session = await requireAdmin();
  const sport = String(formData.get("sport") ?? "");
  if (!sportsOffered.includes(sport as SportName)) throw new Error("Choose a valid sport.");
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a team photo.");
  const requestedLabel = String(formData.get("label") ?? "Team");
  const label = sport === "Wrestling (Coed)" && ["Boys", "Girls"].includes(requestedLabel) ? requestedLabel : "Team";
  await saveSportPhoto({ sport: sport as SportName, label, mimeType: file.type, bytes: Buffer.from(await file.arrayBuffer()), uploadedBy: session.user.email });
  revalidatePath("/");
  revalidatePath("/sports");
  revalidatePath(`/${sport.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`);
  revalidatePath("/admin/photos");
  redirect("/admin/photos?uploaded=1");
}
