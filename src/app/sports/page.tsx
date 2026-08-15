import Link from "next/link";
import { ArrowRight, CalendarDays, Trophy } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { isEventSignupOpen } from "@/lib/availability";
import { listPublicEvents } from "@/lib/repository";
import { sportSlug, sportsOffered } from "@/lib/sports";

export const metadata = { title: "Sports" };
export const dynamic = "force-dynamic";

export default async function SportsPage() {
  const openEvents = (await listPublicEvents()).filter((event) => isEventSignupOpen(event));
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
            {sportsOffered.map((sport) => {
              const eventCount = openEvents.filter((event) => event.sport === sport).length;
              return (
                <Link key={sport} href={`/${sportSlug(sport)}`} className="wildcat-card group flex min-h-44 flex-col rounded-sm p-5 hover:border-[var(--gold)]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="grid h-11 w-11 place-items-center rounded-sm bg-[var(--maroon-dark)] text-[var(--gold)]"><Trophy size={21} aria-hidden /></span>
                    <ArrowRight className="text-[var(--maroon)] transition-transform group-hover:translate-x-1" size={20} aria-hidden />
                  </div>
                  <h2 className="mt-5 text-xl font-black uppercase leading-tight text-[var(--ink)]">{sport}</h2>
                  <p className="mt-auto flex items-center gap-2 pt-4 text-sm font-bold text-[var(--muted)]"><CalendarDays size={16} aria-hidden />{eventCount > 0 ? `${eventCount} open ${eventCount === 1 ? "event" : "events"}` : "No open events yet"}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
