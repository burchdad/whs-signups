import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "whs_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!isValidAdminSession(token)) redirect("/admin/login");
  return {
    user: { id: "railway-admin", email: process.env.ADMIN_EMAIL || "admin@whssignups.com" },
    organizationId: "11111111-1111-4111-8111-111111111111",
  };
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function verifyAdminCredentials(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL || "admin@whssignups.com";
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase()) return false;
  if (!expectedPassword) return true;
  return safeEqual(password, expectedPassword);
}

function signSession() {
  const payload = `${process.env.ADMIN_EMAIL || "admin@whssignups.com"}:${Math.floor(Date.now() / 1000)}`;
  return `${payload}.${signature(payload)}`;
}

function isValidAdminSession(token?: string) {
  if (!token) return false;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return false;
  const payload = token.slice(0, separator);
  const sig = token.slice(separator + 1);
  if (!safeEqual(sig, signature(payload))) return false;
  const issuedAt = Number(payload.split(":").at(-1));
  return Number.isFinite(issuedAt) && Date.now() / 1000 - issuedAt < MAX_AGE_SECONDS;
}

function signature(payload: string) {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET || "dev-whs-admin-session").update(payload).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
