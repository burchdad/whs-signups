import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, HandHeart, Shirt, Trophy } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { EventCard } from "@/components/event-card";
import { listPublicEvents } from "@/lib/repository";
import { sportsOffered } from "@/lib/sports";
import { isEventSignupOpen } from "@/lib/availability";

export const dynamic = "force-dynamic";

export default async function Home() {
  const upcomingEvents = (await listPublicEvents()).filter((event) => isEventSignupOpen(event)).slice(0, 3);
  return (
    <>
      <BrandHeader />
      <main>
        <section className="athletic-band text-white">
          <div className="container grid gap-8 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="eyebrow">Whitehouse High School Athletics</p>
              <h1 className="mt-3 max-w-3xl text-5xl font-black uppercase leading-none tracking-tight sm:text-6xl">Wildcat volunteers, game day ready.</h1>
              <p className="mt-5 max-w-2xl text-lg font-medium text-white/82">Supporting Whitehouse students, teams, and events, one volunteer at a time.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/events" className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-[var(--gold)] px-5 font-black uppercase tracking-wide text-black hover:bg-white">
                  View all events <ArrowRight size={18} aria-hidden />
                </Link>
                <Link href="/booster-club" className="inline-flex min-h-12 items-center gap-2 rounded-sm border border-[var(--gold)] px-5 font-black uppercase tracking-wide text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black">
                  Booster Club <HandHeart size={18} aria-hidden />
                </Link>
                <Link href="/admin/login" className="inline-flex min-h-12 items-center rounded-sm border border-white/30 px-5 font-black uppercase tracking-wide text-white hover:bg-white/10">
                  Admin login
                </Link>
              </div>
              <div className="mt-6 max-w-2xl rounded-sm border border-white/25 bg-black/18 p-3">
                <div className="grid gap-2 text-sm font-black uppercase tracking-wide sm:grid-cols-2" role="tablist" aria-label="Signup type">
                  <Link href="/events" role="tab" aria-selected="true" className="flex min-h-11 items-center justify-center gap-2 rounded-sm bg-white text-[var(--maroon-dark)]">
                    <Trophy size={17} aria-hidden /> Event Volunteers
                  </Link>
                  <Link href="/booster-club" role="tab" aria-selected="false" className="flex min-h-11 items-center justify-center gap-2 rounded-sm border border-white/25 text-white hover:bg-white/10">
                    <Shirt size={17} aria-hidden /> Booster Club
                  </Link>
                </div>
                <form action="/events" className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <label className="sr-only" htmlFor="home-sport">Choose sport</label>
                  <select id="home-sport" name="sport" defaultValue="Volleyball" className="min-h-12 rounded-sm border border-white/20 bg-white px-3 font-black uppercase tracking-wide text-[var(--ink)]">
                    {sportsOffered.map((sport) => <option key={sport} value={sport}>{sport}</option>)}
                  </select>
                  <button className="min-h-12 rounded-sm bg-[var(--gold)] px-5 font-black uppercase tracking-wide text-black hover:bg-white">Find signups</button>
                </form>
              </div>
            </div>
            <div className="wildcat-card rounded-sm p-6 text-[var(--foreground)]">
              <div className="flex items-center gap-4 border-b border-[var(--border)] pb-4">
                <Image src="/brand/whs-logo.png" alt="" width={76} height={58} />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--maroon)]">Volunteer roster</p>
                  <h2 className="text-2xl font-black uppercase">How it works</h2>
                </div>
              </div>
              <ul className="mt-5 grid gap-3 text-sm font-medium text-[var(--muted)]">
                {["Pick a published home event.", "Choose an open volunteer position.", "Submit contact details and receive a confirmation.", "Use your private link if plans change."].map((item) => (
                  <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 text-[var(--maroon)]" size={18} aria-hidden /><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <section className="container py-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--maroon)]"><Trophy size={16} aria-hidden /> Wildcats schedule</p>
              <h2 className="mt-1 text-3xl font-black uppercase text-[var(--ink)]">Upcoming events</h2>
              <p className="font-medium text-[var(--muted)]">Open volunteer opportunities for WHS volleyball.</p>
            </div>
            <Link href="/events" className="font-black uppercase tracking-wide text-[var(--maroon)]">Full schedule</Link>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">{upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)}</div>
          ) : (
            <div className="wildcat-card rounded-sm p-6 font-medium text-[var(--muted)]">No volunteer events are currently open. Check the full schedule for newly published opportunities.</div>
          )}
        </section>
      </main>
    </>
  );
}
