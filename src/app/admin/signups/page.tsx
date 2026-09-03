import Link from "next/link";
import { cancelSignup } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { adminSignupFilterQuery, filterAdminSignups, parseAdminSignupFilters } from "@/lib/admin-signup-filters";
import { listAdminSignups } from "@/lib/repository";

export const metadata = { title: "Manage Signups" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminSignupsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireAdmin();
  const filters = parseAdminSignupFilters(await searchParams);
  const allSignups = await listAdminSignups(5000, session.allowedSports);
  const signups = filterAdminSignups(allSignups, filters);
  const exportQuery = adminSignupFilterQuery(filters);
  const sports = [...new Set(allSignups.map((signup) => signup.sport).filter(Boolean))].sort();
  const events = [...new Map(allSignups.map((signup) => [signup.eventId, { id: signup.eventId, title: signup.eventTitle, date: signup.eventDate }])).values()].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  const positions = [...new Set(allSignups.map((signup) => signup.slotName).filter(Boolean))].sort();
  const filtersActive = Boolean(exportQuery);

  return <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">Volunteer data</p><h1 className="text-3xl font-black uppercase text-[var(--ink)]">Signups</h1></div>
      <Link href={`/api/exports/signups${exportQuery ? `?${exportQuery}` : ""}`} className="min-h-11 rounded-sm bg-[var(--maroon)] px-4 py-2 font-black uppercase tracking-wide text-white hover:bg-[var(--maroon-dark)]">Export {filtersActive ? "filtered " : ""}CSV</Link>
    </div>

    <section className="wildcat-card mt-6 rounded-sm p-5">
      <form method="get" className="grid gap-4">
        <label className="grid gap-1"><span className="text-sm font-black uppercase">Search</span><input name="q" className="field" defaultValue={filters.q} placeholder="Volunteer, email, phone, event, date, or position"/></label>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1"><span className="text-sm font-black uppercase">Sport or group</span><select name="sport" className="field" defaultValue={filters.sport}><option value="">All sports and groups</option>{sports.map((sport) => <option key={sport}>{sport}</option>)}</select></label>
          <label className="grid gap-1"><span className="text-sm font-black uppercase">Event</span><select name="event" className="field" defaultValue={filters.event}><option value="">All events</option>{events.map((event) => <option key={event.id} value={event.id}>{event.date} — {event.title}</option>)}</select></label>
          <label className="grid gap-1"><span className="text-sm font-black uppercase">Position</span><select name="position" className="field" defaultValue={filters.position}><option value="">All positions</option>{positions.map((position) => <option key={position}>{position}</option>)}</select></label>
          <label className="grid gap-1"><span className="text-sm font-black uppercase">Status</span><select name="status" className="field" defaultValue={filters.status}><option value="">All statuses</option><option value="confirmed">Confirmed</option><option value="waitlisted">Waitlisted</option><option value="cancelled">Cancelled</option></select></label>
          <label className="grid gap-1"><span className="text-sm font-black uppercase">Event date from</span><input name="from" type="date" className="field" defaultValue={filters.from}/></label>
          <label className="grid gap-1"><span className="text-sm font-black uppercase">Event date through</span><input name="to" type="date" className="field" defaultValue={filters.to}/></label>
        </div>
        <div className="flex flex-wrap items-center gap-3"><button className="min-h-11 rounded-sm bg-[var(--maroon)] px-5 font-black uppercase text-white">Apply filters</button>{filtersActive ? <Link href="/admin/signups" className="min-h-11 rounded-sm border border-[var(--maroon)] px-5 py-2 font-black uppercase text-[var(--maroon)]">Clear filters</Link> : null}<span className="font-semibold text-[var(--muted)]">Showing {signups.length} of {allSignups.length} signups</span></div>
      </form>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead><tr className="border-b border-[var(--border)] text-xs font-black uppercase tracking-wide text-[var(--maroon-dark)]"><th className="py-2">Volunteer</th><th>Sport/group</th><th>Event</th><th>Position</th><th>Email</th><th>Phone</th><th>Status</th><th>Event date</th><th></th></tr></thead>
          <tbody>{signups.map((signup) => <tr key={signup.id} className="border-b border-[var(--border)] font-medium"><td className="py-3 font-black text-[var(--ink)]">{signup.firstName} {signup.lastName}</td><td>{signup.sport}</td><td>{signup.eventTitle}</td><td>{signup.slotName}</td><td>{signup.email}</td><td>{signup.phone}</td><td className="capitalize">{signup.status}</td><td>{new Date(`${signup.eventDate}T12:00:00`).toLocaleDateString()}</td><td>{session.user.role !== "roster_viewer" && ["confirmed", "waitlisted"].includes(signup.status) ? <form action={cancelSignup}><input type="hidden" name="signupId" value={signup.id}/><button className="font-black uppercase tracking-wide text-[var(--maroon)]">Cancel</button></form> : null}</td></tr>)}</tbody>
        </table>
        {signups.length === 0 ? <p className="py-10 text-center font-semibold text-[var(--muted)]">No signups match these filters.</p> : null}
      </div>
    </section>
  </>;
}
