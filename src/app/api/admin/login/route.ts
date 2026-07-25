import { NextResponse } from "next/server";
import { createAdminSession, verifyAdminCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!verifyAdminCredentials(String(body.email ?? ""), String(body.password ?? ""))) {
    return NextResponse.json({ message: "Invalid admin credentials." }, { status: 401 });
  }
  await createAdminSession();
  return NextResponse.json({ ok: true });
}
