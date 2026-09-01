import Image from "next/image";
import { notFound } from "next/navigation";
import { getAdminInvite } from "@/lib/admin-access";
import { setInvitedAdminPassword } from "../actions";

export const metadata = { title: "Activate Admin Access" };
export const dynamic = "force-dynamic";

export default async function AdminInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await getAdminInvite(token);
  if (!invitation) notFound();

  return <section className="mx-auto max-w-xl wildcat-card rounded-sm p-6 md:p-8">
    <div className="flex items-center gap-4 border-b border-[var(--border)] pb-4">
      <Image src="/brand/whs-logo.png" alt="" width={76} height={58} />
      <div><p className="eyebrow">Administrator invitation</p><h1 className="text-3xl font-black uppercase text-[var(--ink)]">Set your password</h1></div>
    </div>
    <p className="mt-5 font-medium text-[var(--muted)]">Welcome, {invitation.name}. Create a password to activate administrator access for <strong>{invitation.email}</strong>.</p>
    <form action={setInvitedAdminPassword} className="mt-6 grid gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">New password</span><input name="password" type="password" minLength={12} autoComplete="new-password" className="field" required /><small className="text-[var(--muted)]">At least 12 characters.</small></label>
      <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Confirm password</span><input name="confirmPassword" type="password" minLength={12} autoComplete="new-password" className="field" required /></label>
      <button className="min-h-12 rounded-sm bg-[var(--maroon)] px-5 font-black uppercase tracking-wide text-white hover:bg-[var(--maroon-dark)]">Activate admin access</button>
    </form>
  </section>;
}
