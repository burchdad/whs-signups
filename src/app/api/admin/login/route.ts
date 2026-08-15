import { NextResponse } from "next/server";
import { createAdminSession, verifyAdminCredentials } from "@/lib/auth";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const clientId = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const current = attempts.get(clientId);
  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { message: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((current.resetAt - now) / 1000)) } },
    );
  }
  const body = await request.json().catch(() => ({}));
  const session = await verifyAdminCredentials(String(body.email ?? ""), String(body.password ?? ""));
  if (!session) {
    attempts.set(clientId, current && current.resetAt > now ? { ...current, count: current.count + 1 } : { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.json({ message: "Invalid admin credentials." }, { status: 401 });
  }
  try {
    await createAdminSession(session);
  } catch {
    return NextResponse.json({ message: "Admin authentication is not configured." }, { status: 503 });
  }
  attempts.delete(clientId);
  return NextResponse.json({ ok: true, redirect: session.mustChangePassword ? "/admin/settings" : "/admin" });
}
