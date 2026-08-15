"use client";

import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.get("email"), password: formData.get("password") }),
    });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? "Invalid admin credentials.");
      return;
    }
    router.push(payload.redirect || "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {error ? <p role="alert" className="rounded-sm bg-[#fff2f0] p-3 text-sm font-medium text-[var(--maroon-dark)]">{error}</p> : null}
      <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Email</span><input name="email" type="email" className="field" required /></label>
      <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Password</span><input name="password" type="password" className="field" /></label>
      <button disabled={loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[var(--maroon)] px-5 font-black uppercase tracking-wide text-white hover:bg-[var(--maroon-dark)] disabled:opacity-60">
        <LockKeyhole size={18} aria-hidden /> {loading ? "Signing in..." : "Enter admin"}
      </button>
    </form>
  );
}
