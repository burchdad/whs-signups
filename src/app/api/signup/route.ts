import { NextResponse } from "next/server";
import { sendSignupEmails } from "@/lib/email/service";
import { createSignup, getEventAndSlot } from "@/lib/repository";
import { verifyTurnstile } from "@/lib/turnstile";
import { signupSchema } from "@/lib/validation";
import { adminNotificationRecipientsForSport } from "@/lib/admin-access";

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid signup." }, { status: 400 });
  const challenge = await verifyTurnstile(parsed.data.turnstileToken, request.headers.get("x-forwarded-for") ?? undefined);
  if (!challenge.ok) return NextResponse.json({ message: challenge.message }, { status: 400 });
  const result = await createSignup(parsed.data);
  if (!result.ok) return NextResponse.json({ message: result.message, code: result.code }, { status: result.code === "not_found" ? 404 : 409 });
  const found = await getEventAndSlot(parsed.data.slotId);
  if (found) await sendSignupEmails({ signup: result.signup, event: found.event, slot: found.slot, cancellationToken: result.cancellationToken, notificationEmails: await adminNotificationRecipientsForSport(found.event.sport) });
  return NextResponse.json({ ok: true, eventSlug: found?.event.slug, slotId: parsed.data.slotId, status: result.signup.status });
}
