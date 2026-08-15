import { Resend } from "resend";
import { googleCalendarUrl } from "../calendar";
import type { Signup, VolunteerEvent, VolunteerSlot } from "../types";
import type { BoosterClubSignupInput } from "../validation";
import { appUrl, formatDateTime } from "../utils";

let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function emailLayout(title: string, preview: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head><body style="margin:0;background:#f5f1ed;font-family:Arial,sans-serif;color:#171312"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview)}</div><div style="max-width:620px;margin:0 auto;padding:28px 16px"><div style="background:#43110e;color:#fff;padding:20px 24px;border-top:6px solid #c9a23d"><strong style="font-size:22px">WHSSIGNUPS</strong><div style="color:#c9a23d;font-size:12px;font-weight:bold;letter-spacing:2px">WHITEHOUSE WILDCATS</div></div><div style="background:#fff;padding:28px 24px;border:1px solid #dfd6cf">${body}</div><p style="color:#6d625d;font-size:12px;line-height:1.5">This message was sent by WHSSignups for Whitehouse athletics volunteer coordination.</p></div></body></html>`;
}

function button(label: string, url: string, secondary = false) {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;margin:8px 8px 8px 0;padding:12px 16px;border-radius:3px;background:${secondary ? "#fff8ef" : "#74251f"};border:1px solid #74251f;color:${secondary ? "#74251f" : "#fff"};font-size:13px;font-weight:bold;text-decoration:none;text-transform:uppercase">${escapeHtml(label)}</a>`;
}

function notificationRecipients(event?: VolunteerEvent) {
  return [...new Set([process.env.ADMIN_NOTIFICATION_EMAIL, process.env.ADMIN_EMAIL, event?.contactEmail].filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim().toLowerCase()))];
}

async function send(input: { to: string | string[]; subject: string; text: string; html: string; replyTo?: string; idempotencyKey: string }) {
  const provider = getResend();
  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  if (recipients.length === 0) return { provider: "none", status: "skipped" as const };
  if (!provider) {
    console.info("[email:fallback]", { to: recipients, subject: input.subject, text: input.text });
    return { provider: "console", status: "queued" as const };
  }
  try {
    const result = await provider.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "WHSSignups <noreply@whssignups.com>",
      to: recipients,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    }, { idempotencyKey: input.idempotencyKey });
    if (result.error) throw new Error(result.error.message);
    return { provider: "resend", status: "sent" as const, id: result.data?.id };
  } catch (error) {
    console.error("[email:error]", error);
    return { provider: "resend", status: "failed" as const };
  }
}

export async function sendSignupEmails(input: { signup: Signup; event: VolunteerEvent; slot: VolunteerSlot; cancellationToken: string }) {
  const cancelUrl = appUrl(`/cancel/${input.cancellationToken}`);
  const calendarUrl = googleCalendarUrl(input.event, input.slot);
  const icsUrl = appUrl(`/api/calendar/${input.event.id}/${input.slot.id}`);
  const waitlisted = input.signup.status === "waitlisted";
  const subject = waitlisted ? `You're waitlisted: ${input.event.title}` : `You're signed up: ${input.event.title}`;
  const text = [
    `Hi ${input.signup.firstName},`, "",
    waitlisted ? `You are on the waitlist for ${input.slot.name} at ${input.event.title}.` : `Your volunteer signup for ${input.slot.name} at ${input.event.title} is confirmed.`,
    `When: ${formatDateTime(input.slot.shiftStart || input.event.startsAt)}`,
    `Where: ${input.event.location}`,
    waitlisted ? "" : `Add to Google Calendar: ${calendarUrl}`,
    waitlisted ? "" : `Download calendar file: ${icsUrl}`,
    `Change of plans? Cancel here: ${cancelUrl}`,
  ].filter(Boolean).join("\n");
  const html = emailLayout(subject, waitlisted ? "Your waitlist request was received." : "Your volunteer spot is confirmed.", `<h1 style="margin-top:0;color:#43110e">${waitlisted ? "You're on the waitlist" : "You're on the roster"}</h1><p>Hi ${escapeHtml(input.signup.firstName)},</p><p>${waitlisted ? `We received your waitlist request for <strong>${escapeHtml(input.slot.name)}</strong>.` : `Thank you for volunteering as <strong>${escapeHtml(input.slot.name)}</strong>.`}</p><div style="background:#fff8ef;border-left:4px solid #c9a23d;padding:14px 16px;margin:20px 0"><strong>${escapeHtml(input.event.title)}</strong><br>${escapeHtml(formatDateTime(input.slot.shiftStart || input.event.startsAt))}<br>${escapeHtml(input.event.location)}</div>${waitlisted ? "" : `<p>${button("Add to Google Calendar", calendarUrl)}${button("Download calendar file", icsUrl, true)}</p>`}<p style="margin-top:24px">Plans changed? ${button("Cancel signup", cancelUrl, true)}</p>`);
  const volunteer = await send({ to: input.signup.email, subject, text, html, replyTo: input.event.contactEmail, idempotencyKey: `signup-volunteer-${input.signup.id}` });

  const recipients = notificationRecipients(input.event).filter((email) => email !== input.signup.email.toLowerCase());
  const adminSubject = `${waitlisted ? "Waitlisted" : "New"} volunteer: ${input.event.title}`;
  const adminText = `${input.signup.firstName} ${input.signup.lastName} is ${input.signup.status} for ${input.slot.name}.\nEmail: ${input.signup.email}\nPhone: ${input.signup.phone}\nEvent: ${input.event.title}\nWhen: ${formatDateTime(input.event.startsAt)}`;
  const adminHtml = emailLayout(adminSubject, `${input.signup.firstName} ${input.signup.lastName} signed up.`, `<h1 style="margin-top:0;color:#43110e">${waitlisted ? "Waitlist signup" : "New volunteer signup"}</h1><p><strong>${escapeHtml(input.signup.firstName)} ${escapeHtml(input.signup.lastName)}</strong> is ${escapeHtml(input.signup.status)} for <strong>${escapeHtml(input.slot.name)}</strong>.</p><p><strong>Event:</strong> ${escapeHtml(input.event.title)}<br><strong>When:</strong> ${escapeHtml(formatDateTime(input.event.startsAt))}<br><strong>Email:</strong> <a href="mailto:${escapeHtml(input.signup.email)}">${escapeHtml(input.signup.email)}</a><br><strong>Phone:</strong> ${escapeHtml(input.signup.phone)}</p>${input.signup.notes ? `<p><strong>Notes:</strong> ${escapeHtml(input.signup.notes)}</p>` : ""}${button("Open admin signups", appUrl("/admin/signups"))}`);
  const owner = await send({ to: recipients, subject: adminSubject, text: adminText, html: adminHtml, replyTo: input.signup.email, idempotencyKey: `signup-owner-${input.signup.id}` });
  return { volunteer, owner };
}

export async function sendCancellationEmails(input: { signup: Signup; event: VolunteerEvent; slot: VolunteerSlot }) {
  const subject = `Signup cancelled: ${input.event.title}`;
  const text = `Hi ${input.signup.firstName},\n\nYour volunteer signup for ${input.slot.name} at ${input.event.title} has been cancelled.\nWhen: ${formatDateTime(input.event.startsAt)}\n\nIf this was a mistake, visit ${appUrl(`/events/${input.event.slug}`)} to sign up again.`;
  const html = emailLayout(subject, "Your volunteer signup was cancelled.", `<h1 style="margin-top:0;color:#43110e">Signup cancelled</h1><p>Hi ${escapeHtml(input.signup.firstName)},</p><p>Your volunteer signup for <strong>${escapeHtml(input.slot.name)}</strong> at <strong>${escapeHtml(input.event.title)}</strong> has been cancelled.</p>${button("View event", appUrl(`/events/${input.event.slug}`))}`);
  const volunteer = await send({ to: input.signup.email, subject, text, html, replyTo: input.event.contactEmail, idempotencyKey: `cancel-volunteer-${input.signup.id}` });
  const recipients = notificationRecipients(input.event).filter((email) => email !== input.signup.email.toLowerCase());
  const owner = await send({ to: recipients, subject: `Volunteer cancelled: ${input.event.title}`, text: `${input.signup.firstName} ${input.signup.lastName} cancelled ${input.slot.name}.`, html: emailLayout("Volunteer cancelled", `${input.signup.firstName} cancelled.`, `<h1 style="margin-top:0;color:#43110e">Volunteer cancellation</h1><p><strong>${escapeHtml(input.signup.firstName)} ${escapeHtml(input.signup.lastName)}</strong> cancelled <strong>${escapeHtml(input.slot.name)}</strong> for ${escapeHtml(input.event.title)}.</p>${button("Open admin signups", appUrl("/admin/signups"))}`), replyTo: input.signup.email, idempotencyKey: `cancel-owner-${input.signup.id}` });
  return { volunteer, owner };
}

export async function sendVolunteerReminder(input: { signup: Signup; event: VolunteerEvent; slot: VolunteerSlot }) {
  const calendarUrl = googleCalendarUrl(input.event, input.slot);
  const icsUrl = appUrl(`/api/calendar/${input.event.id}/${input.slot.id}`);
  const subject = `Reminder: ${input.event.title} is tomorrow`;
  const text = `Hi ${input.signup.firstName},\n\nThis is a reminder that you are volunteering as ${input.slot.name} tomorrow.\nWhen: ${formatDateTime(input.slot.shiftStart || input.event.startsAt)}\nWhere: ${input.event.location}\nAdd to Google Calendar: ${calendarUrl}\nDownload calendar file: ${icsUrl}`;
  const html = emailLayout(subject, "Your volunteer shift is tomorrow.", `<h1 style="margin-top:0;color:#43110e">See you tomorrow</h1><p>Hi ${escapeHtml(input.signup.firstName)},</p><p>This is a reminder that you are volunteering as <strong>${escapeHtml(input.slot.name)}</strong>.</p><div style="background:#fff8ef;border-left:4px solid #c9a23d;padding:14px 16px;margin:20px 0"><strong>${escapeHtml(input.event.title)}</strong><br>${escapeHtml(formatDateTime(input.slot.shiftStart || input.event.startsAt))}<br>${escapeHtml(input.event.location)}</div><p>${button("Add to Google Calendar", calendarUrl)}${button("Download calendar file", icsUrl, true)}</p>`);
  return send({ to: input.signup.email, subject, text, html, replyTo: input.event.contactEmail, idempotencyKey: `reminder-volunteer-${input.signup.id}` });
}

export async function sendBoosterClubEmails(input: BoosterClubSignupInput & { signupId?: string }) {
  const sports = input.selectedSports.join(", ");
  const subject = "Whitehouse Booster Club signup received";
  const text = `Hi ${input.firstName},\n\nThank you for signing up for Whitehouse Booster Club interest.\nSports: ${sports}\nItem: ${input.gearPreference}\nOpen to volunteering: ${input.openToVolunteering}\nInterested in sponsoring: ${input.interestedInSponsoring}`;
  const html = emailLayout(subject, "Your Booster Club signup was received.", `<h1 style="margin-top:0;color:#43110e">Welcome to the team behind the team</h1><p>Hi ${escapeHtml(input.firstName)},</p><p>We received your Booster Club signup and will follow up as opportunities become available.</p><p><strong>Sports:</strong> ${escapeHtml(sports)}<br><strong>Booster item:</strong> ${escapeHtml(input.gearPreference)}</p>${button("Visit Booster Club", appUrl("/booster-club"))}`);
  const key = input.signupId ?? `${input.email}-${Date.now()}`;
  const volunteer = await send({ to: input.email, subject, text, html, idempotencyKey: `booster-volunteer-${key}` });
  const recipients = notificationRecipients().filter((email) => email !== input.email.toLowerCase());
  const owner = await send({ to: recipients, subject: "New Booster Club signup", text: `${input.firstName} ${input.lastName} joined Booster Club interest.\nSports: ${sports}\nPhone: ${input.phone}\nEmail: ${input.email}`, html: emailLayout("New Booster Club signup", `${input.firstName} ${input.lastName} joined.`, `<h1 style="margin-top:0;color:#43110e">New Booster Club signup</h1><p><strong>${escapeHtml(input.firstName)} ${escapeHtml(input.lastName)}</strong> joined Booster Club interest.</p><p><strong>Sports:</strong> ${escapeHtml(sports)}<br><strong>Email:</strong> <a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a><br><strong>Phone:</strong> ${escapeHtml(input.phone)}<br><strong>Open to volunteering:</strong> ${escapeHtml(input.openToVolunteering)}<br><strong>Interested in sponsoring:</strong> ${escapeHtml(input.interestedInSponsoring)}</p>${button("Open Booster signups", appUrl("/admin/booster-club"))}`), replyTo: input.email, idempotencyKey: `booster-owner-${key}` });
  return { volunteer, owner };
}
