import { NextResponse } from "next/server";
import { sendBoosterClubEmails } from "@/lib/email/service";
import { createBoosterClubSignup } from "@/lib/repository";
import { verifyTurnstile } from "@/lib/turnstile";
import { boosterClubSignupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = boosterClubSignupSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid Booster Club signup." }, { status: 400 });
  const challenge = await verifyTurnstile(parsed.data.turnstileToken, request.headers.get("x-forwarded-for") ?? undefined);
  if (!challenge.ok) return NextResponse.json({ message: challenge.message }, { status: 400 });
  const result = await createBoosterClubSignup(parsed.data);
  if (!result.ok) return NextResponse.json({ message: result.message, code: result.code }, { status: result.code === "not_ready" ? 503 : 500 });
  await sendBoosterClubEmails(parsed.data);
  return NextResponse.json({ ok: true, id: result.id });
}
