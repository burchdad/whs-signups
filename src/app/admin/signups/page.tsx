import Link from "next/link";
import { cancelSignup } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { listAdminSignups } from "@/lib/repository";

export const metadata = { title: "Manage Signups" };
export const dynamic = "force-dynamic";

export default async function AdminSignupsPage() {
  await requireAdmin();
  const signups = await listAdminSignups();
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Volunteer data</p>
          <h1 className="text-3xl font-black uppercase text-[var(--ink)]">Signups</h1>
        </div>
        <Link href="/api/exports/signups" className="min-h-11 rounded-sm bg-[var(--maroon)] px-4 py-2 font-black uppercase tracking-wide text-white hover:bg-[var(--maroon-dark)]">Export CSV</Link>
      </div>
      <section className="wildcat-card mt-6 rounded-sm p-5">
        <input className="field" placeholder="Search by volunteer, email, event, date, or position" />
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-xs font-black uppercase tracking-wide text-[var(--maroon-dark)]"><th className="py-2">Volunteer</th><th>Event</th><th>Position</th><th>Email</th><th>Phone</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>{signups.map((signup) => <tr key={signup.id} className="border-b border-[var(--border)] font-medium"><td className="py-3 font-black text-[var(--ink)]">{signup.firstName} {signup.lastName}</td><td>{signup.eventTitle}</td><td>{signup.slotName}</td><td>{signup.email}</td><td>{signup.phone}</td><td>{signup.status}</td><td>{new Date(signup.createdAt).toLocaleDateString()}</td><td>{["confirmed", "waitlisted"].includes(signup.status) ? <form action={cancelSignup}><input type="hidden" name="signupId" value={signup.id} /><button className="font-black uppercase tracking-wide text-[var(--maroon)]">Cancel</button></form> : null}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}
