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
        <section className="athletic-band -mx-4 rounded-sm px-4 py-8 text-white sm:mx-0 sm:px-8">
          <p className="eyebrow">{event.sport} / {event.eventType}</p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-tight sm:text-5xl">{event.title}</h1>
          <p className="mt-3 max-w-3xl font-medium text-white/82">{event.description || "Whitehouse volleyball home event volunteer signup."}</p>
        </section>
        <dl className="wildcat-card mt-5 grid gap-3 rounded-sm p-5 sm:grid-cols-2">
          <div><dt className="text-xs font-black uppercase tracking-wide text-[var(--maroon)]">Date</dt><dd className="mt-1 font-semibold">{formatDateTime(event.startsAt)}</dd></div>
          <div><dt className="text-xs font-black uppercase tracking-wide text-[var(--maroon)]">Location</dt><dd className="mt-1 font-semibold">{event.location}</dd></div>
          <div><dt className="text-xs font-black uppercase tracking-wide text-[var(--maroon)]">Address</dt><dd className="mt-1 font-semibold">{event.address ?? "Whitehouse, Texas"}</dd></div>
          <div><dt className="text-xs font-black uppercase tracking-wide text-[var(--maroon)]">Signup status</dt><dd className="mt-1 font-semibold">{isEventSignupOpen(event) ? "Open" : "Closed"}</dd></div>
        </dl>
        <section className="mt-8">
          <p className="eyebrow text-[var(--maroon)]">Match times</p>
          <h2 className="mt-1 text-2xl font-black uppercase">Team schedule</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {event.schedule.map((item) => <div key={item.id} className="wildcat-card rounded-sm p-4"><p className="font-black uppercase text-[var(--maroon-dark)]">{item.label}</p><p className="font-medium text-[var(--muted)]">{formatDateTime(item.startsAt)}</p></div>)}
          </div>
        </section>
        <section className="mt-8">
          <p className="eyebrow text-[var(--maroon)]">Volunteer roster</p>
          <h2 className="mt-1 text-2xl font-black uppercase">Volunteer positions</h2>
          <div className="mt-4 grid gap-5">
            {[...grouped.entries()].map(([category, slots]) => (
              <div key={category}>
                <h3 className="text-lg font-black uppercase text-[var(--maroon-dark)]">{category}</h3>
                <div className="mt-3 grid gap-3">
                  {slots.map((slot) => {
                    const available = isEventSignupOpen(event) && isSlotAvailable(slot);
                    return (
                      <div key={slot.id} className="wildcat-card grid gap-3 rounded-sm p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                          <p className="font-black uppercase">{slot.name}</p>
                          <p className="text-sm font-medium text-[var(--muted)]">{slot.filled} filled / {remainingCount(slot)} remaining of {slot.capacity}</p>
                        </div>
                        {available ? (
                          <Link href={`/signup/${slot.id}`} className="inline-flex min-h-11 items-center justify-center rounded-sm bg-[var(--maroon)] px-4 font-black uppercase tracking-wide text-white">Sign up</Link>
                        ) : (
                          <span className="inline-flex min-h-11 items-center justify-center rounded-sm bg-[#f1ece8] px-4 font-black uppercase tracking-wide text-[var(--muted)]">Unavailable</span>
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
