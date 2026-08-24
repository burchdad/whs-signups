import Link from "next/link";
import { ArrowRight, CalendarDays, Trophy } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { SportPhoto } from "@/components/sport-photo";
import { isEventSignupOpen } from "@/lib/availability";
import { getSportPhotoMap, listPublicEvents } from "@/lib/repository";
import { publicSportsOffered, sportSlug } from "@/lib/sports";

export const metadata = { title: "Sports" };
export const dynamic = "force-dynamic";

export default async function SportsPage() {
  const [publicEvents, photoMap] = await Promise.all([listPublicEvents(), getSportPhotoMap()]);
  const openEvents = publicEvents.filter((event) => isEventSignupOpen(event));
  return (
    <>
      <BrandHeader />
      <main>
        <section className="athletic-band text-white">
          <div className="container py-10 sm:py-12">
            <p className="eyebrow">Whitehouse High School Athletics</p>
            <h1 className="mt-2 text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl">Choose your sport</h1>
            <p className="mt-4 max-w-2xl font-medium text-white/82">Find volunteer events and Booster Club opportunities for every Whitehouse Wildcats program.</p>
          </div>
        </section>
        <section className="container py-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicSportsOffered.map((sport, index) => {
              const eventCount = openEvents.filter((event) => event.sport === sport).length;
              return (
                <article key={sport} className="wildcat-card group overflow-hidden rounded-sm hover:border-[var(--gold)]">
                  {photoMap[sport] ? <SportPhoto images={photoMap[sport]} compact eager={index < 3} /> : <div className="grid aspect-[16/10] place-items-center bg-[var(--maroon-dark)] text-[var(--gold)]"><Trophy size={42} aria-hidden /></div>}
                  <Link href={`/${sportSlug(sport)}`} className="flex min-h-32 flex-col p-5">
                    <div className="flex items-start justify-between gap-4"><h2 className="text-xl font-black uppercase leading-tight text-[var(--ink)]">{sport}</h2><ArrowRight className="shrink-0 text-[var(--maroon)] transition-transform group-hover:translate-x-1" size={20} aria-hidden /></div>
                    <p className="mt-auto flex items-center gap-2 pt-4 text-sm font-bold text-[var(--muted)]"><CalendarDays size={16} aria-hidden />{eventCount > 0 ? `${eventCount} open ${eventCount === 1 ? "event" : "events"}` : "No open events yet"}</p>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
