import Link from "next/link";
import { BrandHeader } from "@/components/brand-header";
import { EventCard } from "@/components/event-card";
import { eventOpenPositions } from "@/lib/availability";
import { listPublicEvents } from "@/lib/repository";
import { sportsOffered } from "@/lib/sports";

export const metadata = { title: "Events" };

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const events = await listPublicEvents();
  const filtered = events.filter((event) => {
    if (params.sport && event.sport !== params.sport) return false;
    if (params.type && event.eventType !== params.type) return false;
    if (params.availability === "open" && eventOpenPositions(event) === 0) return false;
    if (params.availability === "full" && eventOpenPositions(event) > 0) return false;
    if (params.when === "past") return new Date(event.startsAt) < new Date();
    return new Date(event.startsAt) >= new Date();
  });
  return (
    <>
      <BrandHeader />
      <main className="container py-8">
        <p className="eyebrow text-[var(--maroon)]">Whitehouse athletics</p>
        <h1 className="mt-1 text-4xl font-black uppercase text-[var(--ink)]">Volunteer schedule</h1>
        <form className="wildcat-card mt-5 grid gap-3 rounded-sm p-4 sm:grid-cols-4">
          <select name="sport" defaultValue={params.sport ?? ""} className="min-h-11 rounded-sm border border-[var(--border)] px-3 font-semibold">
            <option value="">All sports</option>
            {sportsOffered.map((sport) => <option key={sport} value={sport}>{sport}</option>)}
          </select>
          <select name="type" defaultValue={params.type ?? ""} className="min-h-11 rounded-sm border border-[var(--border)] px-3 font-semibold">
            <option value="">All event types</option><option>Home Game</option><option>Tournament</option>
          </select>
          <select name="when" defaultValue={params.when ?? "upcoming"} className="min-h-11 rounded-sm border border-[var(--border)] px-3 font-semibold">
            <option value="upcoming">Upcoming</option><option value="past">Past</option>
          </select>
          <select name="availability" defaultValue={params.availability ?? ""} className="min-h-11 rounded-sm border border-[var(--border)] px-3 font-semibold">
            <option value="">Open and full</option><option value="open">Open only</option><option value="full">Full only</option>
          </select>
          <button className="min-h-11 rounded-sm bg-[var(--maroon)] px-4 font-black uppercase tracking-wide text-white sm:col-span-4">Apply filters</button>
        </form>
        {filtered.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">{filtered.map((event) => <EventCard key={event.id} event={event} />)}</div>
        ) : (
          <section className="wildcat-card mt-6 rounded-sm p-8">
            <p className="eyebrow text-[var(--maroon)]">No posted signups yet</p>
            <h2 className="mt-2 text-2xl font-black uppercase text-[var(--ink)]">No volunteer events match that sport.</h2>
            <p className="mt-2 font-medium text-[var(--muted)]">Volleyball signups are live now. More Whitehouse sports can be added when their volunteer schedules are ready.</p>
            <Link href="/events?sport=Volleyball" className="mt-5 inline-flex min-h-11 items-center rounded-sm bg-[var(--maroon)] px-4 font-black uppercase tracking-wide text-white">View volleyball</Link>
          </section>
        )}
      </main>
    </>
  );
}
