import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminSessionForUser, authenticateAdmin, type AdminSession } from "./admin-access";

const COOKIE_NAME = "whs_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;
const LEGACY_ID = "bootstrap-super-admin";

export async function requireAdmin() {
  const session = await currentAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function currentAdminSession(): Promise<AdminSession | undefined> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const payload = readSession(token);
  if (!payload) return undefined;
  if (payload.id === LEGACY_ID) return legacySession();
  return adminSessionForUser(payload.id);
}

export async function isAdminAuthenticated() {
  return Boolean(await currentAdminSession());
}

export async function createAdminSession(session: AdminSession) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signSession(session.user.id, session.user.email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function verifyAdminCredentials(email: string, password: string) {
  const databaseUser = await authenticateAdmin(email, password);
  if (databaseUser) return databaseUser;
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword || email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase() || !safeEqual(password, expectedPassword)) return undefined;
  return legacySession();
}

function legacySession(): AdminSession {
  return {
    user: { id: LEGACY_ID, email: process.env.ADMIN_EMAIL || "admin@whssignups.com", name: "School Super Admin", role: "super_admin" },
    organizationId: "11111111-1111-4111-8111-111111111111",
    allowedSports: null,
    programIds: [],
    mustChangePassword: false,
  };
}

function signSession(id: string, email: string) {
  if (!process.env.ADMIN_SESSION_SECRET) throw new Error("Admin authentication is not configured.");
  const body = Buffer.from(JSON.stringify({ id, email, issuedAt: Math.floor(Date.now() / 1000) })).toString("base64url");
  return `${body}.${signature(body)}`;
}

function readSession(token?: string) {
  if (!token || !process.env.ADMIN_SESSION_SECRET) return undefined;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return undefined;
  const body = token.slice(0, separator);
  if (!safeEqual(token.slice(separator + 1), signature(body))) return undefined;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as { id: string; email: string; issuedAt: number };
    if (!payload.id || !Number.isFinite(payload.issuedAt) || Date.now() / 1000 - payload.issuedAt >= MAX_AGE_SECONDS) return undefined;
    return payload;
  } catch { return undefined; }
}

function signature(payload: string) {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET || "").update(payload).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
