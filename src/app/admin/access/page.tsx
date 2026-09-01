import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminRoles, canManageAdmins, listAdminAccounts, listAdminPrograms } from "@/lib/admin-access";
import { participationAreas } from "@/lib/sports";
import { addAdminAccount, addAdminProgram, resendAdminInvitation, saveProgramBilling } from "../actions";

export const metadata = { title: "Admin Access" };
export const dynamic = "force-dynamic";

export default async function AccessPage({ searchParams }: { searchParams: Promise<{ account?: string; program?: string; invite?: string }> }) {
  const session = await requireAdmin();
  if (!canManageAdmins(session)) notFound();
  const [programs, accounts, status] = await Promise.all([listAdminPrograms(), listAdminAccounts(), searchParams]);
  return <>
    <p className="eyebrow">People and permissions</p>
    <h1 className="text-3xl font-black uppercase text-[var(--ink)]">Admin access</h1>
    <p className="mt-2 max-w-3xl font-medium text-[var(--muted)]">Create programs first, assign their sports, then give each administrator only the programs and responsibilities they need.</p>
    {(status.account || status.program) && <p role="status" className={`mt-5 rounded-sm p-3 font-black ${status.invite === "failed" ? "bg-[#fff2f0] text-[var(--maroon-dark)]" : "bg-[#f1fbf3] text-[#225c2d]"}`}>{status.invite === "failed" ? "The account was saved, but the invitation email could not be sent. Use Send invitation to try again." : status.account === "invited" ? "A new administrator invitation was sent." : status.account === "created" ? "The administrator was created and an invitation email was sent." : "Access settings saved."}</p>}

    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <section className="wildcat-card rounded-sm p-5">
        <h2 className="text-xl font-black uppercase text-[var(--ink)]">Create program</h2>
        <form action={addAdminProgram} className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1"><span className="font-black uppercase">Name</span><input name="name" className="field" placeholder="Baseball Booster Club" required /></label><label className="grid gap-1"><span className="font-black uppercase">Type</span><select name="type" className="field"><option value="booster_club">Booster Club</option><option value="school">School-wide</option><option value="sport">Sport</option><option value="band">Band</option><option value="choir">Choir</option><option value="club">Club</option><option value="other">Other</option></select></label></div>
          <label className="grid gap-1"><span className="font-black uppercase">Notification email</span><input name="notificationEmail" type="email" className="field" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1"><span className="font-black uppercase">Membership fee</span><input name="membershipFee" type="number" min="0" step="0.01" defaultValue="0" className="field" /></label><label className="flex items-center gap-2 self-end rounded-sm border border-[var(--border)] p-3 font-black uppercase"><input name="paymentRequired" type="checkbox" /> Require Stripe payment</label></div>
          <fieldset><legend className="font-black uppercase">Sports or groups</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{participationAreas.map((sport) => <label key={sport} className="flex items-center gap-2 rounded-sm border border-[var(--border)] p-2 font-medium"><input type="checkbox" name="sports" value={sport} />{sport}</label>)}</div></fieldset>
          <button className="min-h-11 justify-self-start rounded-sm bg-[var(--maroon)] px-4 font-black uppercase text-white">Create program</button>
        </form>
      </section>
      <section className="wildcat-card rounded-sm p-5">
        <h2 className="text-xl font-black uppercase text-[var(--ink)]">Create administrator</h2>
        <form action={addAdminAccount} className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1"><span className="font-black uppercase">Name</span><input name="name" className="field" required /></label><label className="grid gap-1"><span className="font-black uppercase">Email</span><input name="email" type="email" className="field" required /></label></div>
          <label className="grid gap-1"><span className="font-black uppercase">Role</span><select name="role" className="field">{adminRoles.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}</select></label>
          <p className="rounded-sm bg-[#fff8ef] p-3 text-sm font-medium text-[var(--muted)]">The administrator will receive a secure, one-time link to create their own password. The link expires after 72 hours.</p>
          <fieldset><legend className="font-black uppercase">Assigned programs</legend><div className="mt-2 grid gap-2">{programs.map((program) => <label key={program.id} className="flex items-start gap-2 rounded-sm border border-[var(--border)] p-2"><input type="checkbox" name="programIds" value={program.id} className="mt-1"/><span><strong className="block uppercase">{program.name}</strong><small className="text-[var(--muted)]">{program.sports.join(", ") || program.type}</small></span></label>)}</div></fieldset>
          <button className="min-h-11 justify-self-start rounded-sm bg-[var(--maroon)] px-4 font-black uppercase text-white">Create administrator</button>
        </form>
      </section>
    </div>

    <section className="wildcat-card mt-6 rounded-sm p-5"><h2 className="text-xl font-black uppercase text-[var(--ink)]">Booster Club payments</h2><p className="mt-1 text-sm font-medium text-[var(--muted)]">Set the membership amount for each Booster Club. Checkout starts only when payment is required.</p><div className="mt-4 grid gap-3 lg:grid-cols-2">{programs.filter((program) => program.type === "booster_club").map((program) => <form key={program.id} action={saveProgramBilling} className="grid gap-3 rounded-sm border border-[var(--border)] p-4"><input type="hidden" name="programId" value={program.id}/><strong className="uppercase text-[var(--ink)]">{program.name}</strong><label className="grid gap-1"><span className="text-sm font-black uppercase">Membership fee</span><input name="membershipFee" type="number" min="0" step="0.01" defaultValue={(program.membershipFeeCents / 100).toFixed(2)} className="field" /></label><label className="flex items-center gap-2 font-semibold"><input name="paymentRequired" type="checkbox" defaultChecked={program.paymentRequired}/> Require Stripe Checkout</label><button className="min-h-11 justify-self-start rounded-sm bg-[var(--maroon)] px-4 font-black uppercase text-white">Save payment settings</button></form>)}</div></section>

    <section className="wildcat-card mt-6 overflow-x-auto rounded-sm p-5"><h2 className="text-xl font-black uppercase text-[var(--ink)]">Current administrators</h2><table className="mt-4 w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b border-[var(--border)] uppercase text-[var(--maroon-dark)]"><th className="py-2">Administrator</th><th>Role</th><th>Programs</th><th>Status</th><th>Access email</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id} className="border-b border-[var(--border)]"><td className="py-3"><strong className="block">{account.name}</strong>{account.email}</td><td className="uppercase">{account.role.replaceAll("_", " ")}</td><td>{account.programs.join(", ") || "School-wide"}</td><td>{!account.active ? "Disabled" : account.mustChangePassword ? "Awaiting activation" : "Active"}</td><td>{account.active && account.mustChangePassword ? <form action={resendAdminInvitation}><input type="hidden" name="userId" value={account.id}/><button className="rounded-sm border border-[var(--maroon)] px-3 py-2 font-black uppercase text-[var(--maroon)] hover:bg-[var(--maroon)] hover:text-white">{account.inviteExpiresAt ? "Resend invitation" : "Send invitation"}</button></form> : <span className="text-[var(--muted)]">Password set</span>}</td></tr>)}</tbody></table></section>
  </>;
}
