import Link from "next/link";
import { cancelSignup } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { adminSignupFilterQuery, filterAdminSignups, parseAdminSignupFilters } from "@/lib/admin-signup-filters";
import { listAdminSignups } from "@/lib/repository";

export const metadata = { title: "Manage Signups" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function MultiFilter({ label, name, options, selected, allLabel }: { label: string; name: string; options: Array<{ value: string; label: string }>; selected: string[]; allLabel: string }) {
  return <fieldset className="grid gap-1">
    <legend className="text-sm font-black uppercase">{label}</legend>
    <details className="relative rounded-sm border border-[var(--border)] bg-white">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 font-semibold"><span className="truncate">{selected.length ? `${selected.length} selected` : allLabel}</span><span aria-hidden>▾</span></summary>
      <div className="absolute left-0 right-0 z-20 max-h-72 overflow-y-auto border border-[var(--border)] bg-white p-2 shadow-xl">
        {options.map((option) => <label key={option.value} className="flex cursor-pointer items-start gap-2 rounded-sm p-2 hover:bg-[#fff8ef]"><input type="checkbox" name={name} value={option.value} defaultChecked={selected.includes(option.value)} className="mt-1"/><span className="text-sm font-medium">{option.label}</span></label>)}
      </div>
    </details>
  </fieldset>;
}

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
          <MultiFilter label="Sport or group" name="sport" options={sports.map((sport) => ({ value: sport, label: sport }))} selected={filters.sports} allLabel="All sports and groups"/>
          <MultiFilter label="Event" name="event" options={events.map((event) => ({ value: event.id, label: `${event.date} — ${event.title}` }))} selected={filters.events} allLabel="All events"/>
          <MultiFilter label="Position" name="position" options={positions.map((position) => ({ value: position, label: position }))} selected={filters.positions} allLabel="All positions"/>
          <MultiFilter label="Status" name="status" options={[{ value: "confirmed", label: "Confirmed" }, { value: "waitlisted", label: "Waitlisted" }, { value: "cancelled", label: "Cancelled" }]} selected={filters.statuses} allLabel="All statuses"/>
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
