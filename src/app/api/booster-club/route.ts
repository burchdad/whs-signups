import { NextResponse } from "next/server";
import { sendBoosterClubEmails } from "@/lib/email/service";
import { attachBoosterCheckoutSession, createBoosterClubSignup, listPublicBoosterPrograms } from "@/lib/repository";
import { verifyTurnstile } from "@/lib/turnstile";
import { boosterClubSignupSchema } from "@/lib/validation";
import { adminNotificationRecipientsForProgram } from "@/lib/admin-access";
import { createBoosterCheckout, isStripeConfigured } from "@/lib/stripe";

export async function POST(request: Request) {
  const parsed = boosterClubSignupSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid Booster Club signup." }, { status: 400 });
  const challenge = await verifyTurnstile(parsed.data.turnstileToken, request.headers.get("x-forwarded-for") ?? undefined);
  if (!challenge.ok) return NextResponse.json({ message: challenge.message }, { status: 400 });
  const requestedProgram = (await listPublicBoosterPrograms()).find((program) => program.id === parsed.data.programId);
  if (!requestedProgram) return NextResponse.json({ message: "Choose an active Booster Club." }, { status: 400 });
  if (requestedProgram.paymentRequired && (!isStripeConfigured() || requestedProgram.membershipFeeCents < 1)) return NextResponse.json({ message: "Online payment is not configured for this Booster Club yet. Please contact its administrator." }, { status: 503 });
  const result = await createBoosterClubSignup(parsed.data);
  if (!result.ok) return NextResponse.json({ message: result.message, code: result.code }, { status: result.code === "not_ready" ? 503 : 500 });
  const notificationEmails = await adminNotificationRecipientsForProgram(result.program.id);
  let checkoutUrl: string | undefined;
  if (result.program.paymentRequired && result.program.membershipFeeCents > 0) {
    const checkout = await createBoosterCheckout({ signupId: result.id, program: result.program, email: parsed.data.email, name: `${parsed.data.firstName} ${parsed.data.lastName}` });
    await attachBoosterCheckoutSession(result.id, checkout.id);
    checkoutUrl = checkout.url;
  }
  await sendBoosterClubEmails({ ...parsed.data, programName: result.program.name, signupId: result.id, notificationEmails });
  return NextResponse.json({ ok: true, id: result.id, checkoutUrl });
}
