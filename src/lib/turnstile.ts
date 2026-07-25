export async function verifyTurnstile(token?: string, remoteIp?: string) {
  if (!process.env.TURNSTILE_SECRET_KEY) return { ok: true, skipped: true };
  if (!token) return { ok: false, skipped: false, message: "Spam prevention check is required." };
  const formData = new FormData();
  formData.set("secret", process.env.TURNSTILE_SECRET_KEY);
  formData.set("response", token);
  if (remoteIp) formData.set("remoteip", remoteIp);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });
  const payload = (await response.json()) as { success: boolean };
  return payload.success ? { ok: true, skipped: false } : { ok: false, skipped: false, message: "Spam prevention check failed." };
}
