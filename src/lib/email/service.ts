import { Resend } from "resend";
import type { Signup, VolunteerEvent, VolunteerSlot } from "../types";
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
  const subject = `You're signed up: ${input.event.title}`;
  const text = [
    `Hi ${input.signup.firstName},`,
    "",
    `Thank you for signing up for ${input.slot.name} at ${input.event.title}.`,
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
        subject: `New WHSSignups volunteer: ${input.event.title}`,
        text: `${input.signup.firstName} ${input.signup.lastName} signed up for ${input.slot.name}.`,
      });
    }
    return { provider: "resend", status: "sent" as const };
  } catch (error) {
    console.error("[email:error]", error);
    return { provider: "resend", status: "failed" as const };
  }
}
