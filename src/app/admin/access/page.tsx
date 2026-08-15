import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminRoles, canManageAdmins, listAdminAccounts, listAdminPrograms } from "@/lib/admin-access";
import { participationAreas } from "@/lib/sports";
import { addAdminAccount, addAdminProgram } from "../actions";

export const metadata = { title: "Admin Access" };
export const dynamic = "force-dynamic";

export default async function AccessPage({ searchParams }: { searchParams: Promise<{ account?: string; program?: string }> }) {
  const session = await requireAdmin();
  if (!canManageAdmins(session)) notFound();
  const [programs, accounts, status] = await Promise.all([listAdminPrograms(), listAdminAccounts(), searchParams]);
  return <>
    <p className="eyebrow">People and permissions</p>
    <h1 className="text-3xl font-black uppercase text-[var(--ink)]">Admin access</h1>
    <p className="mt-2 max-w-3xl font-medium text-[var(--muted)]">Create programs first, assign their sports, then give each administrator only the programs and responsibilities they need.</p>
    {(status.account || status.program) && <p role="status" className="mt-5 rounded-sm bg-[#f1fbf3] p-3 font-black text-[#225c2d]">Access settings saved.</p>}

    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <section className="wildcat-card rounded-sm p-5">
        <h2 className="text-xl font-black uppercase text-[var(--ink)]">Create program</h2>
        <form action={addAdminProgram} className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1"><span className="font-black uppercase">Name</span><input name="name" className="field" placeholder="Baseball Booster Club" required /></label><label className="grid gap-1"><span className="font-black uppercase">Type</span><select name="type" className="field"><option value="booster_club">Booster Club</option><option value="school">School-wide</option><option value="sport">Sport</option><option value="band">Band</option><option value="choir">Choir</option><option value="club">Club</option><option value="other">Other</option></select></label></div>
          <label className="grid gap-1"><span className="font-black uppercase">Notification email</span><input name="notificationEmail" type="email" className="field" /></label>
          <fieldset><legend className="font-black uppercase">Sports or groups</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{participationAreas.map((sport) => <label key={sport} className="flex items-center gap-2 rounded-sm border border-[var(--border)] p-2 font-medium"><input type="checkbox" name="sports" value={sport} />{sport}</label>)}</div></fieldset>
          <button className="min-h-11 justify-self-start rounded-sm bg-[var(--maroon)] px-4 font-black uppercase text-white">Create program</button>
        </form>
      </section>
      <section className="wildcat-card rounded-sm p-5">
        <h2 className="text-xl font-black uppercase text-[var(--ink)]">Create administrator</h2>
        <form action={addAdminAccount} className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1"><span className="font-black uppercase">Name</span><input name="name" className="field" required /></label><label className="grid gap-1"><span className="font-black uppercase">Email</span><input name="email" type="email" className="field" required /></label></div>
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1"><span className="font-black uppercase">Role</span><select name="role" className="field">{adminRoles.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}</select></label><label className="grid gap-1"><span className="font-black uppercase">Temporary password</span><input name="temporaryPassword" type="password" minLength={12} className="field" required /><small className="text-[var(--muted)]">At least 12 characters.</small></label></div>
          <fieldset><legend className="font-black uppercase">Assigned programs</legend><div className="mt-2 grid gap-2">{programs.map((program) => <label key={program.id} className="flex items-start gap-2 rounded-sm border border-[var(--border)] p-2"><input type="checkbox" name="programIds" value={program.id} className="mt-1"/><span><strong className="block uppercase">{program.name}</strong><small className="text-[var(--muted)]">{program.sports.join(", ") || program.type}</small></span></label>)}</div></fieldset>
          <button className="min-h-11 justify-self-start rounded-sm bg-[var(--maroon)] px-4 font-black uppercase text-white">Create administrator</button>
        </form>
      </section>
    </div>

    <section className="wildcat-card mt-6 overflow-x-auto rounded-sm p-5"><h2 className="text-xl font-black uppercase text-[var(--ink)]">Current administrators</h2><table className="mt-4 w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b border-[var(--border)] uppercase text-[var(--maroon-dark)]"><th className="py-2">Administrator</th><th>Role</th><th>Programs</th><th>Status</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id} className="border-b border-[var(--border)]"><td className="py-3"><strong className="block">{account.name}</strong>{account.email}</td><td className="uppercase">{account.role.replaceAll("_", " ")}</td><td>{account.programs.join(", ") || "School-wide"}</td><td>{account.active ? "Active" : "Disabled"}</td></tr>)}</tbody></table></section>
  </>;
}
