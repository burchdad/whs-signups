import Link from "next/link";
import { eventOpenPositions } from "@/lib/availability";
import { listAdminEvents } from "@/lib/repository";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Manage Events" };

export default async function AdminEventsPage() {
  const events = await listAdminEvents();
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-[var(--maroon-dark)]">Events</h1>
        <Link href="/admin/events/new" className="min-h-11 rounded-md bg-[var(--maroon)] px-4 py-2 font-semibold text-white">Create event</Link>
      </div>
      <div className="mt-5 rounded-lg border border-[var(--border)] bg-white p-4">
        <input placeholder="Search by event, opponent, or location" className="field" />
      </div>
      <div className="mt-5 overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead><tr className="border-b border-[var(--border)]"><th className="p-3">Date</th><th>Event</th><th>Location</th><th>Open</th><th>Status</th><th></th></tr></thead>
          <tbody>{events.map((event) => <tr key={event.id} className="border-b border-[var(--border)]"><td className="p-3">{formatDate(event.startsAt)}</td><td>{event.title}</td><td>{event.location}</td><td>{eventOpenPositions(event)}</td><td>{event.isPublished ? "Published" : "Draft"}</td><td><Link className="font-semibold text-[var(--maroon)]" href={`/admin/events/${event.id}`}>Manage</Link></td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
