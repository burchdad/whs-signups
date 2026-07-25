import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/brand-header";
import { isEventSignupOpen, isSlotAvailable, remainingCount } from "@/lib/availability";
import { createIcs, googleCalendarUrl } from "@/lib/calendar";
import { getPublicEventBySlug } from "@/lib/repository";
import { formatDateTime } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);
  if (!event) notFound();
  const grouped = event.slots.filter((slot) => slot.isVisible).reduce((groups, slot) => {
    const slots = groups.get(slot.category) ?? [];
    slots.push(slot);
    groups.set(slot.category, slots);
    return groups;
  }, new Map<string, typeof event.slots>());
  return (
    <>
      <BrandHeader />
      <main className="container py-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--maroon)]">{event.sport} · {event.eventType}</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--maroon-dark)]">{event.title}</h1>
        <p className="mt-3 text-[var(--muted)]">{event.description}</p>
        <dl className="mt-5 grid gap-3 rounded-lg border border-[var(--border)] bg-white p-5 sm:grid-cols-2">
          <div><dt className="font-semibold">Date</dt><dd>{formatDateTime(event.startsAt)}</dd></div>
          <div><dt className="font-semibold">Location</dt><dd>{event.location}</dd></div>
          <div><dt className="font-semibold">Address</dt><dd>{event.address ?? "Whitehouse, Texas"}</dd></div>
          <div><dt className="font-semibold">Signup status</dt><dd>{isEventSignupOpen(event) ? "Open" : "Closed"}</dd></div>
        </dl>
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Team schedule</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {event.schedule.map((item) => <div key={item.id} className="rounded-lg border border-[var(--border)] bg-white p-4"><p className="font-semibold">{item.label}</p><p className="text-[var(--muted)]">{formatDateTime(item.startsAt)}</p></div>)}
          </div>
        </section>
        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Volunteer positions</h2>
          <div className="mt-4 grid gap-5">
            {[...grouped.entries()].map(([category, slots]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-[var(--maroon-dark)]">{category}</h3>
                <div className="mt-3 grid gap-3">
                  {slots.map((slot) => {
                    const available = isEventSignupOpen(event) && isSlotAvailable(slot);
                    return (
                      <div key={slot.id} className="grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                          <p className="font-semibold">{slot.name}</p>
                          <p className="text-sm text-[var(--muted)]">{slot.filled} filled · {remainingCount(slot)} remaining of {slot.capacity}</p>
                        </div>
                        {available ? (
                          <Link href={`/signup/${slot.id}`} className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--maroon)] px-4 font-semibold text-white">Sign up</Link>
                        ) : (
                          <span className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#f1ece8] px-4 font-semibold text-[var(--muted)]">Unavailable</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
        {event.slots[0] ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Event", name: event.title, startDate: event.startsAt, location: event.location, url: `/events/${event.slug}`, description: event.description, calendar: createIcs(event, event.slots[0]), googleCalendar: googleCalendarUrl(event, event.slots[0]) }) }} /> : null}
      </main>
    </>
  );
}
