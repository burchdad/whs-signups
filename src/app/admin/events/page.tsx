import Link from "next/link";
import { eventOpenPositions } from "@/lib/availability";
import { requireAdmin } from "@/lib/auth";
import { listAdminEvents } from "@/lib/repository";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Manage Events" };
export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const session = await requireAdmin();
  const events = await listAdminEvents(session.allowedSports);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Admin roster</p>
          <h1 className="text-3xl font-black uppercase text-[var(--ink)]">Events</h1>
        </div>
        {session.user.role !== "roster_viewer" ? <Link href="/admin/events/new" className="min-h-11 rounded-sm bg-[var(--maroon)] px-4 py-2 font-black uppercase tracking-wide text-white hover:bg-[var(--maroon-dark)]">Create event</Link> : null}
      </div>
      <div className="wildcat-card mt-5 rounded-sm p-4">
        <input placeholder="Search by event, opponent, or location" className="field" />
      </div>
      <div className="wildcat-card mt-5 overflow-x-auto rounded-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead><tr className="border-b border-[var(--border)] text-xs font-black uppercase tracking-wide text-[var(--maroon-dark)]"><th className="p-3">Date</th><th>Event</th><th>Location</th><th>Open</th><th>Status</th><th></th></tr></thead>
          <tbody>{events.map((event) => <tr key={event.id} className="border-b border-[var(--border)] font-medium"><td className="p-3">{formatDate(event.startsAt)}</td><td className="font-black text-[var(--ink)]">{event.title}</td><td>{event.location}</td><td>{eventOpenPositions(event)}</td><td>{event.isPublished ? "Published" : "Draft"}</td><td><Link className="font-black uppercase tracking-wide text-[var(--maroon)]" href={`/admin/events/${event.id}`}>Manage</Link></td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
