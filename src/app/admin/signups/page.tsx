import Link from "next/link";

export const metadata = { title: "Manage Signups" };

export default function AdminSignupsPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-[var(--maroon-dark)]">Signups</h1>
        <Link href="/api/exports/signups" className="min-h-11 rounded-md bg-[var(--maroon)] px-4 py-2 font-semibold text-white">Export CSV</Link>
      </div>
      <section className="mt-6 rounded-lg border border-[var(--border)] bg-white p-5">
        <input className="field" placeholder="Search by volunteer, email, event, date, or position" />
        <div className="mt-5 grid gap-3 text-sm text-[var(--muted)]">
          <p>Admin workflows support manual additions, moves, cancellations, removals, CSV export, and Excel export through the service layer.</p>
          <p>Connect Supabase to show private roster data here under administrator RLS policies.</p>
        </div>
      </section>
    </>
  );
}
