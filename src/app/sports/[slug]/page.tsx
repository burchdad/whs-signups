import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/brand-header";
import { EventCard } from "@/components/event-card";
import { listPublicEvents } from "@/lib/repository";
import { sportFromSlug, sportsOffered } from "@/lib/sports";

export function generateStaticParams() {
  return sportsOffered.map((sport) => ({ slug: sport.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const sport = sportFromSlug((await params).slug);
  return { title: sport ? `${sport} Signups` : "Sport Signups" };
}

export default async function SportPage({ params }: { params: Promise<{ slug: string }> }) {
  const sport = sportFromSlug((await params).slug);
  if (!sport) notFound();
  const events = (await listPublicEvents()).filter((event) => event.sport === sport);
  return (
    <>
      <BrandHeader />
      <main className="container py-8">
        <section className="athletic-band rounded-sm p-6 text-white">
          <p className="eyebrow">Whitehouse Wildcats</p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-none tracking-tight">{sport}</h1>
          <p className="mt-3 font-medium text-white/82">Volunteer events and Booster Club interest for {sport}.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/events?sport=${encodeURIComponent(sport)}`} className="inline-flex min-h-11 items-center rounded-sm bg-[var(--gold)] px-4 font-black uppercase tracking-wide text-black">View events</Link>
            <Link href={`/booster-club?sport=${encodeURIComponent(sport)}`} className="inline-flex min-h-11 items-center rounded-sm border border-[var(--gold)] px-4 font-black uppercase tracking-wide text-[var(--gold)]">Join Booster Club</Link>
          </div>
        </section>
        {events.length > 0 ? <div className="mt-6 grid gap-4 md:grid-cols-2">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : (
          <section className="wildcat-card mt-6 rounded-sm p-6">
            <p className="eyebrow text-[var(--maroon)]">No events posted</p>
            <h2 className="mt-2 text-2xl font-black uppercase text-[var(--ink)]">Booster Club interest is open now.</h2>
            <p className="mt-2 font-medium text-[var(--muted)]">This sport page is ready for schedules as they are added.</p>
          </section>
        )}
      </main>
    </>
  );
}
