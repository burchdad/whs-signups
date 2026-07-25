import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { eventOpenPositions, eventStatus } from "@/lib/availability";
import type { VolunteerEvent } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const statusLabels = {
  open: "Open",
  full: "Full",
  closed: "Closed",
  draft: "Draft",
};

export function EventCard({ event }: { event: VolunteerEvent }) {
  const status = eventStatus(event);
  return (
    <article className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--maroon)]">{event.sport} · {event.eventType}</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">{event.title}</h2>
        </div>
        <span className="rounded-full bg-[#f4ebe7] px-3 py-1 text-sm font-semibold text-[var(--maroon-dark)]">{statusLabels[status]}</span>
      </div>
      <dl className="mt-4 grid gap-2 text-sm text-[var(--muted)]">
        <div className="flex items-center gap-2"><CalendarDays size={16} aria-hidden /> <dt className="sr-only">Date</dt><dd>{formatDate(event.startsAt)}</dd></div>
        <div className="flex items-center gap-2"><MapPin size={16} aria-hidden /> <dt className="sr-only">Location</dt><dd>{event.location}</dd></div>
        <div className="flex items-center gap-2"><Users size={16} aria-hidden /> <dt className="sr-only">Open positions</dt><dd>{eventOpenPositions(event)} open volunteer positions</dd></div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        {event.schedule.map((item) => (
          <span key={item.id} className="rounded-md bg-[#f8f2ee] px-2.5 py-1 text-xs text-[var(--muted)]">{item.label}: {new Date(item.startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" })}</span>
        ))}
      </div>
      <Link href={`/events/${event.slug}`} className="mt-5 inline-flex min-h-11 items-center rounded-md bg-[var(--maroon)] px-4 font-semibold text-white hover:bg-[var(--maroon-dark)]">
        View positions
      </Link>
    </article>
  );
}
