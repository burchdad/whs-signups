import { requireAdmin } from "@/lib/auth";
import { organization } from "@/lib/repository";
import { canManageProgramPayments, listAdminProgramsForSession } from "@/lib/admin-access";
import { saveMyProgramStripeAccount, updateMyPassword } from "../actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ password?: string; stripe?: string }> }) {
  const session = await requireAdmin();
  const [status, programs] = await Promise.all([searchParams, canManageProgramPayments(session) ? listAdminProgramsForSession(session) : Promise.resolve([])]);
  return (
    <div className="grid max-w-3xl gap-6"><form className="wildcat-card grid gap-4 rounded-sm p-5">
      <div>
        <p className="eyebrow">Admin setup</p>
        <h1 className="text-3xl font-black uppercase text-[var(--ink)]">Organization settings</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Organization name</span><input className="field" defaultValue={organization.name} /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Contact email</span><input className="field" defaultValue={organization.contactEmail} /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Reply-to email</span><input className="field" defaultValue={organization.contactEmail} /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Timezone</span><input className="field" defaultValue="America/Chicago" /></label>
      </div>
      <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Default location</span><input className="field" defaultValue="Whitehouse High School Gym" /></label>
      <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Default consent wording</span><textarea className="field" rows={3} defaultValue="I understand WHSSignups will use my contact information for this volunteer commitment." /></label>
      <button type="button" className="min-h-12 rounded-sm bg-[var(--maroon)] px-5 font-black uppercase tracking-wide text-white hover:bg-[var(--maroon-dark)]">Save settings</button>
    </form>
    {programs.filter((program) => program.type === "booster_club").length > 0 ? <section className="wildcat-card grid gap-4 rounded-sm p-5"><div><p className="eyebrow">Payment routing</p><h2 className="text-2xl font-black uppercase text-[var(--ink)]">Connected Stripe accounts</h2><p className="mt-1 text-sm font-medium text-[var(--muted)]">Only enter an account that has been connected to the WHSSignups Stripe platform. Each account can belong to one Booster Club.</p></div>{status.stripe ? <p role="status" className="rounded-sm bg-[#f1fbf3] p-3 font-black text-[#225c2d]">{status.stripe === "connected" ? "Stripe account verified and ready for payments." : status.stripe === "pending" ? "Stripe account verified. Stripe still needs to enable charges before checkout can use it." : "Stripe account assignment removed."}</p> : null}<div className="grid gap-3">{programs.filter((program) => program.type === "booster_club").map((program) => <form action={saveMyProgramStripeAccount} key={program.id} className="grid gap-3 rounded-sm border border-[var(--border)] p-4"><input type="hidden" name="programId" value={program.id}/><div className="flex flex-wrap items-center justify-between gap-2"><strong className="uppercase text-[var(--ink)]">{program.name}</strong><span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${program.stripeAccountId && program.stripeChargesEnabled ? "bg-[#e8f6eb] text-[#225c2d]" : "bg-[#fff4d8] text-[var(--maroon-dark)]"}`}>{program.stripeAccountId ? program.stripeChargesEnabled ? "Ready" : "Pending Stripe" : "Using test platform"}</span></div><label className="grid gap-1"><span className="text-sm font-black uppercase">Stripe account ID</span><input name="stripeAccountId" className="field font-mono" defaultValue={program.stripeAccountId} placeholder="acct_..." autoComplete="off"/><small className="text-[var(--muted)]">Clear this field and save to remove the assignment.</small></label><button className="min-h-11 justify-self-start rounded-sm bg-[var(--maroon)] px-4 font-black uppercase text-white">Verify and save</button></form>)}</div></section> : null}
    <form action={updateMyPassword} className="wildcat-card grid gap-4 rounded-sm p-5">
      <div><p className="eyebrow">Your account</p><h2 className="text-2xl font-black uppercase text-[var(--ink)]">Change password</h2><p className="mt-1 text-sm font-medium text-[var(--muted)]">Signed in as {session.user.email}</p></div>
      {status.password === "changed" && <p role="status" className="rounded-sm bg-[#f1fbf3] p-3 font-black text-[#225c2d]">Password changed.</p>}
      <label className="grid gap-1"><span className="font-black uppercase">Current password</span><input name="currentPassword" type="password" className="field" required /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1"><span className="font-black uppercase">New password</span><input name="newPassword" type="password" minLength={12} className="field" required /></label><label className="grid gap-1"><span className="font-black uppercase">Confirm password</span><input name="confirmPassword" type="password" minLength={12} className="field" required /></label></div>
      <button className="min-h-12 rounded-sm bg-[var(--maroon)] px-5 font-black uppercase text-white">Update password</button>
    </form></div>
  );
}
