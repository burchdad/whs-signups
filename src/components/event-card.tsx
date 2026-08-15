import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { eventOpenPositions, eventStatus } from "@/lib/availability";
import type { VolunteerEvent } from "@/lib/types";

const statusLabels = {
  open: "Open",
  full: "Full",
  closed: "Closed",
  draft: "Draft",
};

export function EventCard({ event }: { event: VolunteerEvent }) {
  const status = eventStatus(event);
  const openPositions = eventOpenPositions(event);
  const date = new Date(event.startsAt);
  return (
    <article className="wildcat-card overflow-hidden rounded-sm">
      <div className="grid grid-cols-[88px_1fr]">
        <div className="bg-[var(--maroon-dark)] p-4 text-center text-white">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold)]">
            {date.toLocaleDateString("en-US", { month: "short", timeZone: "America/Chicago" })}
          </p>
          <p className="mt-1 text-4xl font-black leading-none">{date.toLocaleDateString("en-US", { day: "numeric", timeZone: "America/Chicago" })}</p>
          <p className="mt-1 text-xs font-bold uppercase text-white/70">{date.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Chicago" })}</p>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--maroon)]">{event.sport} / {event.eventType}</p>
              <h2 className="mt-1 text-xl font-black uppercase leading-snug text-[var(--ink)]">{event.title}</h2>
            </div>
            <span className="rounded-sm bg-[var(--gold)] px-3 py-1 text-xs font-black uppercase tracking-wide text-black">{statusLabels[status]}</span>
          </div>
          <dl className="mt-4 grid gap-2 text-sm font-medium text-[var(--muted)]">
            <div className="flex items-center gap-2"><MapPin size={16} aria-hidden /> <dt className="sr-only">Location</dt><dd>{event.location}</dd></div>
            <div className="flex items-center gap-2"><Users size={16} aria-hidden /> <dt className="sr-only">Availability</dt><dd>{status === "closed" ? "Signups closed" : `${openPositions} open volunteer ${openPositions === 1 ? "position" : "positions"}`}</dd></div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            {event.schedule.map((item) => (
              <span key={item.id} className="rounded-sm border border-[var(--border)] bg-[var(--cream)] px-2.5 py-1 text-xs font-bold uppercase text-[var(--muted)]">{item.label}: {new Date(item.startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" })}</span>
            ))}
          </div>
          <Link href={`/events/${event.slug}`} className="mt-5 inline-flex min-h-11 items-center rounded-sm bg-[var(--maroon)] px-4 font-black uppercase tracking-wide text-white hover:bg-[var(--maroon-dark)]">
            View positions
          </Link>
        </div>
      </div>
    </article>
  );
}
