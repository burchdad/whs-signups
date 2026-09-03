import Link from "next/link";
import { cancelSignup } from "../actions";
import { requireAdmin } from "@/lib/auth";
import { adminSignupFilterQuery, filterAdminSignups, parseAdminSignupFilters, type AdminSignupFilters, type AdminSignupSort } from "@/lib/admin-signup-filters";
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

function SortableHeader({ label, field, filters, className = "px-3 py-3" }: { label: string; field: AdminSignupSort; filters: AdminSignupFilters; className?: string }) {
  const active = filters.sort === field;
  const nextDirection = active && filters.direction === "asc" ? "desc" : "asc";
  const href = `/admin/signups?${adminSignupFilterQuery({ ...filters, sort: field, direction: nextDirection })}`;
  return <th className={className} aria-sort={active ? filters.direction === "asc" ? "ascending" : "descending" : "none"}><Link href={href} className="inline-flex items-center gap-1.5 hover:text-[var(--maroon)]" title={`Sort ${label} ${nextDirection === "asc" ? "ascending" : "descending"}`}>{label}<span aria-hidden className={active ? "text-[var(--maroon)]" : "text-[var(--muted)]"}>{active ? filters.direction === "asc" ? "▲" : "▼" : "↕"}</span></Link></th>;
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

    <section className="wildcat-card mt-6 rounded-sm p-6">
      <form method="get" className="grid gap-4">
        <label className="grid gap-1"><span className="text-sm font-black uppercase">Search</span><input name="q" className="field" defaultValue={filters.q} placeholder="Volunteer, email, phone, event, date, or position"/></label>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MultiFilter label="Sport or group" name="sport" options={sports.map((sport) => ({ value: sport, label: sport }))} selected={filters.sports} allLabel="All sports and groups"/>
          <MultiFilter label="Event" name="event" options={events.map((event) => ({ value: event.id, label: `${event.date} — ${event.title}` }))} selected={filters.events} allLabel="All events"/>
          <MultiFilter label="Position" name="position" options={positions.map((position) => ({ value: position, label: position }))} selected={filters.positions} allLabel="All positions"/>
          <MultiFilter label="Status" name="status" options={[{ value: "confirmed", label: "Confirmed" }, { value: "waitlisted", label: "Waitlisted" }, { value: "cancelled", label: "Cancelled" }]} selected={filters.statuses} allLabel="All statuses"/>
          <label className="grid gap-1"><span className="text-sm font-black uppercase">Event date from</span><input name="from" type="date" className="field" defaultValue={filters.from}/></label>
          <label className="grid gap-1"><span className="text-sm font-black uppercase">Event date through</span><input name="to" type="date" className="field" defaultValue={filters.to}/></label>
          <div className="grid grid-cols-2 gap-3 md:hidden"><label className="grid gap-1"><span className="text-sm font-black uppercase">Sort by</span><select name="sort" className="field" defaultValue={filters.sort}><option value="">Newest signup</option><option value="volunteer">Volunteer</option><option value="event">Event</option><option value="position">Position</option><option value="email">Email</option><option value="eventDate">Event date</option></select></label><label className="grid gap-1"><span className="text-sm font-black uppercase">Direction</span><select name="direction" className="field" defaultValue={filters.direction}><option value="asc">Ascending</option><option value="desc">Descending</option></select></label></div>
        </div>
        <div className="flex flex-wrap items-center gap-3"><button className="min-h-11 rounded-sm bg-[var(--maroon)] px-5 font-black uppercase text-white">Apply filters</button>{filtersActive ? <Link href="/admin/signups" className="min-h-11 rounded-sm border border-[var(--maroon)] px-5 py-2 font-black uppercase text-[var(--maroon)]">Clear filters</Link> : null}<span className="font-semibold text-[var(--muted)]">Showing {signups.length} of {allSignups.length} signups</span></div>
      </form>

      <div className="mt-7 hidden overflow-x-auto pb-2 md:block">
        <table className="w-full min-w-[1180px] table-fixed text-left text-sm xl:min-w-0">
          <colgroup><col className="w-[12%]"/><col className="w-[9%]"/><col className="w-[18%]"/><col className="w-[13%]"/><col className="w-[18%]"/><col className="w-[10%]"/><col className="w-[8%]"/><col className="w-[8%]"/><col className="w-[4%]"/></colgroup>
          <thead><tr className="border-b border-[var(--border)] text-xs font-black uppercase tracking-wide text-[var(--maroon-dark)]"><SortableHeader label="Volunteer" field="volunteer" filters={filters} className="px-3 py-3 pl-0"/><th className="px-3 py-3">Sport/group</th><SortableHeader label="Event" field="event" filters={filters}/><SortableHeader label="Position" field="position" filters={filters}/><SortableHeader label="Email" field="email" filters={filters}/><th className="px-3 py-3">Phone</th><th className="px-3 py-3">Status</th><SortableHeader label="Event date" field="eventDate" filters={filters}/><th className="py-3 pl-3"></th></tr></thead>
          <tbody>{signups.map((signup) => <tr key={signup.id} className="border-b border-[var(--border)] align-top font-medium"><td className="px-3 py-4 pl-0 font-black leading-5 text-[var(--ink)]">{signup.firstName} {signup.lastName}</td><td className="px-3 py-4 leading-5">{signup.sport}</td><td className="px-3 py-4 leading-5">{signup.eventTitle}</td><td className="px-3 py-4 leading-5">{signup.slotName}</td><td className="px-3 py-4 leading-5"><span className="break-all">{signup.email}</span></td><td className="px-3 py-4 leading-5">{signup.phone}</td><td className="px-3 py-4 capitalize leading-5">{signup.status}</td><td className="whitespace-nowrap px-3 py-4 leading-5">{new Date(`${signup.eventDate}T12:00:00`).toLocaleDateString()}</td><td className="py-4 pl-3">{session.user.role !== "roster_viewer" && ["confirmed", "waitlisted"].includes(signup.status) ? <form action={cancelSignup}><input type="hidden" name="signupId" value={signup.id}/><button className="font-black uppercase tracking-wide text-[var(--maroon)]">Cancel</button></form> : null}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="mt-6 grid gap-4 md:hidden">{signups.map((signup) => <article key={signup.id} className="rounded-sm border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3"><div><p className="text-xs font-black uppercase tracking-wide text-[var(--maroon)]">{signup.sport}</p><h2 className="mt-1 text-lg font-black text-[var(--ink)]">{signup.firstName} {signup.lastName}</h2></div><span className="rounded-full bg-[#fff8ef] px-3 py-1 text-xs font-black uppercase text-[var(--maroon-dark)]">{signup.status}</span></div>
        <dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-xs font-black uppercase text-[var(--muted)]">Event</dt><dd className="mt-1 font-semibold">{signup.eventTitle}</dd></div><div className="grid grid-cols-2 gap-3"><div><dt className="text-xs font-black uppercase text-[var(--muted)]">Position</dt><dd className="mt-1 font-semibold">{signup.slotName}</dd></div><div><dt className="text-xs font-black uppercase text-[var(--muted)]">Event date</dt><dd className="mt-1 font-semibold">{new Date(`${signup.eventDate}T12:00:00`).toLocaleDateString()}</dd></div></div><div><dt className="text-xs font-black uppercase text-[var(--muted)]">Email</dt><dd className="mt-1 break-all"><a href={`mailto:${signup.email}`} className="text-[var(--maroon)] underline">{signup.email}</a></dd></div><div><dt className="text-xs font-black uppercase text-[var(--muted)]">Phone</dt><dd className="mt-1"><a href={`tel:${signup.phone}`} className="text-[var(--maroon)] underline">{signup.phone}</a></dd></div></dl>
        {session.user.role !== "roster_viewer" && ["confirmed", "waitlisted"].includes(signup.status) ? <form action={cancelSignup} className="mt-4 border-t border-[var(--border)] pt-3"><input type="hidden" name="signupId" value={signup.id}/><button className="font-black uppercase tracking-wide text-[var(--maroon)]">Cancel signup</button></form> : null}
      </article>)}</div>
      {signups.length === 0 ? <p className="py-10 text-center font-semibold text-[var(--muted)]">No signups match these filters.</p> : null}
    </section>
  </>;
}
