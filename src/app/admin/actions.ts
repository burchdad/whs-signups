"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sendCancellationEmails } from "@/lib/email/service";
import { cancelSignupById, createAdminEvent, createVolunteerTemplate, getSignupContextById, listAdminEvents, saveSportPhoto, updateEventDetails, updateSlotState } from "@/lib/repository";
import { participationAreas, sportsOffered, type SportName } from "@/lib/sports";
import { adminRoles, canManage, canManageAdmins, canManageOrganizationSettings, canManageProgram, canManageProgramPayments, changeAdminPassword, createAdminAccount, createAdminProgram, getAssignableAdminOwner, hasSportAccess, parseEmailList, updateAdminProgramBilling, updateOrganizationEmailSettings, updateProgramNotificationEmails, updateProgramStripeAccount } from "@/lib/admin-access";
import { adminNotificationRecipientsForSport } from "@/lib/admin-access";
import { verifyConnectedStripeAccount } from "@/lib/stripe";

async function requireManager() {
  const session = await requireAdmin();
  if (!canManage(session)) throw new Error("Your account has read-only roster access.");
  return session;
}

async function requireEventAccess(eventId: string) {
  const session = await requireManager();
  const event = (await listAdminEvents(session.allowedSports)).find((item) => item.id === eventId);
  if (!event) throw new Error("You do not have access to this event.");
  return session;
}

export async function saveEventDetails(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await requireEventAccess(id);
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
  const eventId = String(formData.get("eventId") ?? "");
  await requireEventAccess(eventId);
  await updateSlotState({ slotId: String(formData.get("slotId") ?? ""), isOpen: String(formData.get("isOpen")) === "true" });
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
}

export async function cancelSignup(formData: FormData) {
  const session = await requireManager();
  const id = String(formData.get("signupId") ?? "");
  const found = await getSignupContextById(id, session.allowedSports);
  if (!found) throw new Error("You do not have access to this signup.");
  await cancelSignupById(id);
  if (found) await sendCancellationEmails({ ...found, notificationEmails: await adminNotificationRecipientsForSport(found.event.sport) });
  revalidatePath("/admin");
  revalidatePath("/admin/signups");
}

export async function createEvent(formData: FormData) {
  const session = await requireManager();
  const sport = String(formData.get("sport") ?? "Volleyball");
  if (!hasSportAccess(session, sport)) throw new Error("You do not have access to this sport.");
  const ownerAdminUserId = String(formData.get("ownerAdminUserId") ?? session.user.id);
  const assignedOwner = await getAssignableAdminOwner(session, ownerAdminUserId);
  if (!assignedOwner) throw new Error("You cannot assign that form owner.");
  await createAdminEvent({
    title: String(formData.get("title") ?? ""),
    sport,
    opponent: String(formData.get("opponent") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    location: String(formData.get("location") ?? ""),
    description: String(formData.get("description") ?? ""),
    contactName: ownerAdminUserId === session.user.id ? String(formData.get("contactName") ?? assignedOwner.name) : assignedOwner.name,
    contactEmail: ownerAdminUserId === session.user.id ? String(formData.get("contactEmail") ?? assignedOwner.email) : assignedOwner.email,
    templateId: String(formData.get("templateId") ?? "") || undefined,
    customSlots: parseRoleLines(String(formData.get("customRoles") ?? "")),
    organizationId: session.organizationId,
    programId: String(formData.get("programId") ?? "") || session.programIds[0],
    ownerAdminUserId,
    createdBy: session.user.email,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function createTemplate(formData: FormData) {
  await requireManager();
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
  const session = await requireManager();
  const sport = String(formData.get("sport") ?? "");
  if (!sportsOffered.includes(sport as SportName)) throw new Error("Choose a valid sport.");
  if (!hasSportAccess(session, sport)) throw new Error("You do not have access to this sport.");
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

export async function addAdminProgram(formData: FormData) {
  const session = await requireAdmin();
  if (!canManageAdmins(session)) throw new Error("Only the Super Admin can manage programs.");
  const sports = formData.getAll("sports").map(String).filter((sport) => participationAreas.includes(sport as (typeof participationAreas)[number]));
  const fee = Math.max(0, Math.round(Number(formData.get("membershipFee") ?? 0) * 100));
  await createAdminProgram({ organizationId: session.organizationId, name: String(formData.get("name") ?? ""), type: String(formData.get("type") ?? "booster_club"), notificationEmails: parseEmailList(String(formData.get("notificationEmail") ?? "")), sports, membershipFeeCents: fee, paymentRequired: String(formData.get("paymentRequired")) === "on", actorId: session.user.id });
  revalidatePath("/admin/access");
  redirect("/admin/access?program=created");
}

export async function saveProgramBilling(formData: FormData) {
  const session = await requireAdmin();
  if (!canManageAdmins(session)) throw new Error("Only the Super Admin can manage program payments.");
  const membershipFeeCents = Math.max(0, Math.round(Number(formData.get("membershipFee") ?? 0) * 100));
  await updateAdminProgramBilling({ programId: String(formData.get("programId") ?? ""), membershipFeeCents, paymentRequired: String(formData.get("paymentRequired")) === "on", actorId: session.user.id, organizationId: session.organizationId });
  revalidatePath("/admin/access");
  redirect("/admin/access?program=updated");
}

export async function addAdminAccount(formData: FormData) {
  const session = await requireAdmin();
  if (!canManageAdmins(session)) throw new Error("Only the Super Admin can manage accounts.");
  const role = String(formData.get("role") ?? "volunteer_coordinator");
  if (!adminRoles.includes(role as (typeof adminRoles)[number])) throw new Error("Choose a valid role.");
  const password = String(formData.get("temporaryPassword") ?? "");
  if (password.length < 12) throw new Error("Temporary passwords must contain at least 12 characters.");
  await createAdminAccount({ organizationId: session.organizationId, name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? ""), password, role: role as (typeof adminRoles)[number], programIds: formData.getAll("programIds").map(String), actorId: session.user.id });
  revalidatePath("/admin/access");
  redirect("/admin/access?account=created");
}

export async function updateMyPassword(formData: FormData) {
  const session = await requireAdmin();
  const next = String(formData.get("newPassword") ?? "");
  if (next !== String(formData.get("confirmPassword") ?? "")) throw new Error("The new passwords do not match.");
  await changeAdminPassword({ userId: session.user.id, currentPassword: String(formData.get("currentPassword") ?? ""), newPassword: next });
  redirect("/admin/settings?password=changed");
}

export async function saveMyProgramStripeAccount(formData: FormData) {
  const session = await requireAdmin();
  const programId = String(formData.get("programId") ?? "");
  if (!canManageProgramPayments(session) || !(await canManageProgram(session, programId))) throw new Error("You cannot change payment settings for that program.");
  const requestedAccountId = String(formData.get("stripeAccountId") ?? "").trim();
  if (!requestedAccountId) {
    await updateProgramStripeAccount({ programId, stripeAccountId: undefined, chargesEnabled: false, actorId: session.user.id, organizationId: session.organizationId });
    revalidatePath("/admin/settings");
    redirect("/admin/settings?stripe=cleared");
  }
  const account = await verifyConnectedStripeAccount(requestedAccountId);
  await updateProgramStripeAccount({ programId, stripeAccountId: account.id, chargesEnabled: account.chargesEnabled, actorId: session.user.id, organizationId: session.organizationId });
  revalidatePath("/admin/settings");
  redirect(`/admin/settings?stripe=${account.chargesEnabled ? "connected" : "pending"}`);
}

function isEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

export async function saveOrganizationEmailSettings(formData: FormData) {
  const session = await requireAdmin();
  if (!canManageOrganizationSettings(session)) throw new Error("Only organization administrators can change organization email settings.");
  const senderName = String(formData.get("senderName") ?? "").trim();
  const senderAddress = String(formData.get("senderAddress") ?? "").trim().toLowerCase();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim().toLowerCase();
  const replyToEmail = String(formData.get("replyToEmail") ?? "").trim().toLowerCase();
  const defaultNotificationEmails = parseEmailList(String(formData.get("defaultNotificationEmails") ?? ""));
  if (!senderName || !isEmail(senderAddress) || !isEmail(contactEmail) || !isEmail(replyToEmail) || defaultNotificationEmails.some((email) => !isEmail(email))) throw new Error("Enter valid organization email settings.");
  const configuredFrom = process.env.RESEND_FROM_EMAIL || "WHSSignups <noreply@whssignups.com>";
  const configuredAddress = configuredFrom.match(/<([^>]+)>/)?.[1] || configuredFrom;
  const verifiedDomain = configuredAddress.split("@")[1]?.toLowerCase();
  if (!verifiedDomain || senderAddress.split("@")[1] !== verifiedDomain) throw new Error(`Sender address must use the verified ${verifiedDomain || "email"} domain.`);
  await updateOrganizationEmailSettings({ organizationId: session.organizationId, senderName, senderAddress, contactEmail, replyToEmail, defaultNotificationEmails, actorId: session.user.id });
  revalidatePath("/admin/settings");
  redirect("/admin/settings?email=organization");
}

export async function saveProgramNotificationEmails(formData: FormData) {
  const session = await requireAdmin();
  const programId = String(formData.get("programId") ?? "");
  if (!canManage(session) || !(await canManageProgram(session, programId))) throw new Error("You cannot change notifications for that program.");
  const notificationEmails = parseEmailList(String(formData.get("notificationEmails") ?? ""));
  if (notificationEmails.some((email) => !isEmail(email))) throw new Error("Enter valid notification email addresses.");
  await updateProgramNotificationEmails({ programId, notificationEmails, actorId: session.user.id, organizationId: session.organizationId });
  revalidatePath("/admin/settings");
  redirect("/admin/settings?email=program");
}
