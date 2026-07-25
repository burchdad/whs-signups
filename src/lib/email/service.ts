import { Resend } from "resend";
import type { Signup, VolunteerEvent, VolunteerSlot } from "../types";
import type { BoosterClubSignupInput } from "../validation";
import { appUrl, formatDateTime } from "../utils";

let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendSignupEmails(input: {
  signup: Signup;
  event: VolunteerEvent;
  slot: VolunteerSlot;
  cancellationToken: string;
}) {
  const provider = getResend();
  const from = process.env.RESEND_FROM_EMAIL || "WHSSignups <noreply@whssignups.com>";
  const cancelUrl = appUrl(`/cancel/${input.cancellationToken}`);
  const subject = input.signup.status === "waitlisted" ? `You're waitlisted: ${input.event.title}` : `You're signed up: ${input.event.title}`;
  const text = [
    `Hi ${input.signup.firstName},`,
    "",
    input.signup.status === "waitlisted"
      ? `Thank you for joining the waitlist for ${input.slot.name} at ${input.event.title}.`
      : `Thank you for signing up for ${input.slot.name} at ${input.event.title}.`,
    `When: ${formatDateTime(input.event.startsAt)}`,
    `Where: ${input.event.location}`,
    `Cancel if needed: ${cancelUrl}`,
  ].join("\n");

  if (!provider) {
    console.info("[email:fallback]", { to: input.signup.email, subject, text });
    return { provider: "console", status: "queued" as const };
  }

  try {
    await provider.emails.send({ from, to: input.signup.email, subject, text });
    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      await provider.emails.send({
        from,
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `${input.signup.status === "waitlisted" ? "Waitlisted" : "New"} WHSSignups volunteer: ${input.event.title}`,
        text: `${input.signup.firstName} ${input.signup.lastName} is ${input.signup.status} for ${input.slot.name}.`,
      });
    }
    return { provider: "resend", status: "sent" as const };
  } catch (error) {
    console.error("[email:error]", error);
    return { provider: "resend", status: "failed" as const };
  }
}

export async function sendBoosterClubEmails(input: BoosterClubSignupInput) {
  const provider = getResend();
  const from = process.env.RESEND_FROM_EMAIL || "WHSSignups <noreply@whssignups.com>";
  const sports = input.selectedSports.join(", ");
  const subject = "Whitehouse Booster Club signup received";
  const text = [
    `Hi ${input.firstName},`,
    "",
    "Thank you for signing up for Whitehouse Booster Club interest.",
    `Sports: ${sports}`,
    `Item: ${input.gearPreference}`,
    `Open to volunteering: ${input.openToVolunteering}`,
    `Interested in sponsoring: ${input.interestedInSponsoring}`,
  ].join("\n");

  if (!provider) {
    console.info("[email:fallback]", { to: input.email, subject, text });
    return { provider: "console", status: "queued" as const };
  }

  try {
    await provider.emails.send({ from, to: input.email, subject, text });
    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      await provider.emails.send({
        from,
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: "New Booster Club signup",
        text: `${input.firstName} ${input.lastName} joined Booster Club interest.\nSports: ${sports}\nPhone: ${input.phone}\nEmail: ${input.email}`,
      });
    }
    return { provider: "resend", status: "sent" as const };
  } catch (error) {
    console.error("[email:error]", error);
    return { provider: "resend", status: "failed" as const };
  }
}
