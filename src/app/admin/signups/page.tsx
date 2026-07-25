import Link from "next/link";

export const metadata = { title: "Manage Signups" };

export default function AdminSignupsPage() {
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
        <div className="mt-5 grid gap-3 text-sm font-medium text-[var(--muted)]">
          <p>Admin workflows support manual additions, moves, cancellations, removals, CSV export, and Excel export through the service layer.</p>
          <p>Railway Postgres is connected for live roster data.</p>
        </div>
      </section>
    </>
  );
}
