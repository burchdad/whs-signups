import crypto from "node:crypto";

export function createToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verifyToken(token: string, hash: string) {
  return crypto.timingSafeEqual(Buffer.from(hashToken(token)), Buffer.from(hash));
}
