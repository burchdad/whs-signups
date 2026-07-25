import { BrandHeader } from "@/components/brand-header";
import { EventCard } from "@/components/event-card";
import { eventOpenPositions } from "@/lib/availability";
import { listPublicEvents } from "@/lib/repository";

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
        <h1 className="text-3xl font-bold text-[var(--maroon-dark)]">Volunteer events</h1>
        <form className="mt-5 grid gap-3 rounded-lg border border-[var(--border)] bg-white p-4 sm:grid-cols-4">
          <select name="sport" defaultValue={params.sport ?? ""} className="min-h-11 rounded-md border border-[var(--border)] px-3">
            <option value="">All sports</option><option>Volleyball</option>
          </select>
          <select name="type" defaultValue={params.type ?? ""} className="min-h-11 rounded-md border border-[var(--border)] px-3">
            <option value="">All event types</option><option>Home Game</option><option>Tournament</option>
          </select>
          <select name="when" defaultValue={params.when ?? "upcoming"} className="min-h-11 rounded-md border border-[var(--border)] px-3">
            <option value="upcoming">Upcoming</option><option value="past">Past</option>
          </select>
          <select name="availability" defaultValue={params.availability ?? ""} className="min-h-11 rounded-md border border-[var(--border)] px-3">
            <option value="">Open and full</option><option value="open">Open only</option><option value="full">Full only</option>
          </select>
          <button className="min-h-11 rounded-md bg-[var(--maroon)] px-4 font-semibold text-white sm:col-span-4">Apply filters</button>
        </form>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{filtered.map((event) => <EventCard key={event.id} event={event} />)}</div>
      </main>
    </>
  );
}
