import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  HandHeart,
  MapPin,
  PartyPopper,
  Search,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { eventOpenPositions, isEventSignupOpen } from "@/lib/availability";
import { listPublicEvents } from "@/lib/repository";
import { sportSlug, sportsOffered } from "@/lib/sports";

export const dynamic = "force-dynamic";

export default async function Home() {
  const events = (await listPublicEvents()).filter((event) => isEventSignupOpen(event));
  const upcomingEvents = events.slice(0, 3);
  const openPositions = events.reduce((total, event) => total + eventOpenPositions(event), 0);
  const activeSports = sportsOffered
    .map((sport) => ({ sport, count: events.filter((event) => event.sport === sport).length }))
    .sort((a, b) => b.count - a.count || a.sport.localeCompare(b.sport));

  return (
    <>
      <BrandHeader />
      <main>
        <section className="home-hero relative isolate overflow-hidden text-white">
          <Image
            src="/brand/wildcats-soccer-celebration.jpg"
            alt="Whitehouse Wildcats soccer players celebrating together"
            fill
            priority
            loading="eager"
            sizes="100vw"
            className="-z-20 object-cover object-[68%_45%]"
          />
          <div className="home-hero-overlay absolute inset-0 -z-10" />
          <div className="container flex min-h-[620px] items-center py-14 sm:min-h-[680px]">
            <div className="max-w-3xl">
              <p className="eyebrow flex items-center gap-2"><Sparkles size={16} aria-hidden /> Whitehouse High School Athletics</p>
              <h1 className="mt-4 text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] sm:text-7xl lg:text-8xl">Show up for<br />the Wildcats.</h1>
              <p className="mt-6 max-w-xl text-lg font-semibold leading-relaxed text-white/88 sm:text-xl">Every home event runs on people who care. Find a spot, lend a hand, and help make game day unforgettable.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/events" className="inline-flex min-h-13 items-center gap-2 rounded-sm bg-[var(--gold)] px-6 font-black uppercase tracking-wide text-black transition hover:-translate-y-0.5 hover:bg-white">
                  Find an opportunity <ArrowRight size={19} aria-hidden />
                </Link>
                <Link href="/sports" className="inline-flex min-h-13 items-center gap-2 rounded-sm border border-white/60 bg-black/20 px-6 font-black uppercase tracking-wide text-white backdrop-blur-sm transition hover:bg-white hover:text-[var(--maroon-dark)]">
                  Browse sports <Trophy size={18} aria-hidden />
                </Link>
              </div>
              <div className="mt-10 flex max-w-2xl flex-wrap gap-x-8 gap-y-4 border-t border-white/30 pt-6">
                <ImpactStat value={sportsOffered.length} label="Wildcat sports" />
                <ImpactStat value={events.length} label="Open events" />
                <ImpactStat value={openPositions} label="Open positions" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-18">
          <div className="container">
            <SectionHeading eyebrow="Coming up next" title="Your next chance to help" description="A few hours can make a big difference for students, coaches, and fans." href="/events" linkLabel="View full schedule" />
            {upcomingEvents.length > 0 ? (
              <div className="mt-7 grid gap-5 lg:grid-cols-3">
                {upcomingEvents.map((event) => {
                  const date = new Date(event.startsAt);
                  const positions = eventOpenPositions(event);
                  return (
                    <Link key={event.id} href={`/events/${event.slug}`} className="wildcat-card group flex min-h-72 flex-col overflow-hidden rounded-sm transition hover:-translate-y-1 hover:border-[var(--gold)] hover:shadow-xl">
                      <div className="flex items-center justify-between bg-[var(--maroon-dark)] px-5 py-4 text-white">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold)]">{date.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "America/Chicago" })}</p>
                          <p className="text-sm font-bold">{date.toLocaleDateString("en-US", { weekday: "long", timeZone: "America/Chicago" })}</p>
                        </div>
                        <CalendarDays size={24} aria-hidden />
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--maroon)]">{event.sport} / {event.eventType}</p>
                        <h3 className="mt-2 text-xl font-black uppercase leading-tight text-[var(--ink)]">{event.title}</h3>
                        <div className="mt-4 grid gap-2 text-sm font-semibold text-[var(--muted)]">
                          <p className="flex items-center gap-2"><MapPin size={16} aria-hidden /> {event.location}</p>
                          <p className="flex items-center gap-2"><Users size={16} aria-hidden /> {positions} open {positions === 1 ? "position" : "positions"}</p>
                        </div>
                        <span className="mt-auto flex items-center gap-2 pt-5 font-black uppercase tracking-wide text-[var(--maroon)]">View positions <ArrowRight className="transition-transform group-hover:translate-x-1" size={18} aria-hidden /></span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-7 rounded-sm border border-[var(--border)] bg-[var(--cream)] p-8 text-center">
                <PartyPopper className="mx-auto text-[var(--maroon)]" size={34} aria-hidden />
                <h3 className="mt-3 text-xl font-black uppercase">New opportunities are coming soon</h3>
                <p className="mt-2 font-medium text-[var(--muted)]">Check back as teams publish their upcoming schedules.</p>
              </div>
            )}
          </div>
        </section>

        <section className="athletic-band py-14 text-white sm:py-18">
          <div className="container">
            <div className="text-center">
              <p className="eyebrow">Three simple steps</p>
              <h2 className="mt-2 text-4xl font-black uppercase tracking-tight">Pick a spot. Join the team.</h2>
              <p className="mx-auto mt-3 max-w-2xl font-medium text-white/75">Signing up is quick, and your confirmation includes everything you need.</p>
            </div>
            <div className="mt-9 grid gap-4 md:grid-cols-3">
              <StepCard number="01" icon={<Search size={24} aria-hidden />} title="Find an event" copy="Browse by sport or date and choose an upcoming home event." />
              <StepCard number="02" icon={<HandHeart size={24} aria-hidden />} title="Choose your role" copy="Select an open position that works for your schedule." />
              <StepCard number="03" icon={<Check size={24} aria-hidden />} title="You're on the roster" copy="Get an instant confirmation and a private link if plans change." />
            </div>
          </div>
        </section>

        <section className="container py-14 sm:py-18">
          <SectionHeading eyebrow="Find your team" title="Sports with opportunities" description="Programs accepting volunteers appear first. Every sport has its own dedicated page." href="/sports" linkLabel="See all sports" />
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeSports.slice(0, 8).map(({ sport, count }, index) => (
              <Link key={sport} href={`/${sportSlug(sport)}`} className={`sport-tile group relative flex min-h-48 flex-col overflow-hidden rounded-sm p-5 ${count > 0 ? "sport-tile-active" : ""}`}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--maroon-dark)] text-[var(--gold)]"><Trophy size={21} aria-hidden /></span>
                <span className="mt-auto text-lg font-black uppercase leading-tight text-[var(--ink)]">{sport}</span>
                <span className="mt-2 flex items-center justify-between text-sm font-bold text-[var(--muted)]">
                  {count > 0 ? `${count} open ${count === 1 ? "event" : "events"}` : "Team page"}
                  <ArrowRight className="text-[var(--maroon)] transition-transform group-hover:translate-x-1" size={18} aria-hidden />
                </span>
                <span className="absolute -right-5 -top-6 select-none text-8xl font-black text-[var(--maroon)]/[0.04]" aria-hidden>{String(index + 1).padStart(2, "0")}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-[var(--cream)] py-14 sm:py-18">
          <div className="container grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="relative min-h-80 overflow-hidden rounded-sm">
              <Image src="/brand/wildcats-soccer-celebration.jpg" alt="Whitehouse Wildcats athletes showing their school spirit" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--maroon-dark)]/65 to-transparent" />
              <p className="absolute bottom-5 left-5 max-w-sm text-2xl font-black uppercase leading-tight text-white">One community.<br />Every Wildcat.</p>
            </div>
            <div>
              <p className="eyebrow">More ways to pitch in</p>
              <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-tight text-[var(--ink)] sm:text-5xl">Back the teams beyond game day.</h2>
              <p className="mt-5 max-w-xl text-lg font-medium leading-relaxed text-[var(--muted)]">The Booster Club connects families, fans, and local supporters with the programs they care about—from spirit wear to sponsorships and volunteer help.</p>
              <Link href="/booster-club" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-sm bg-[var(--maroon)] px-6 font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:bg-[var(--maroon-dark)]">Explore Booster Club <HandHeart size={19} aria-hidden /></Link>
            </div>
          </div>
        </section>

        <section className="bg-[var(--gold)] py-12 text-[var(--ink)]">
          <div className="container flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[var(--maroon-dark)]">The team behind the team</p>
              <h2 className="mt-1 text-3xl font-black uppercase tracking-tight sm:text-4xl">Every game needs someone like you.</h2>
            </div>
            <Link href="/events" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-sm bg-[var(--ink)] px-6 font-black uppercase tracking-wide text-white hover:bg-[var(--maroon-dark)]">Get on the roster <ArrowRight size={19} aria-hidden /></Link>
          </div>
        </section>
      </main>
    </>
  );
}

function ImpactStat({ value, label }: { value: number; label: string }) {
  return <div><strong className="block text-3xl font-black text-[var(--gold)]">{value}</strong><span className="text-xs font-black uppercase tracking-[0.14em] text-white/70">{label}</span></div>;
}

function SectionHeading({ eyebrow, title, description, href, linkLabel }: { eyebrow: string; title: string; description: string; href: string; linkLabel: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow flex items-center gap-2"><Trophy size={16} aria-hidden /> {eyebrow}</p>
        <h2 className="mt-1 text-3xl font-black uppercase tracking-tight text-[var(--ink)] sm:text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl font-medium text-[var(--muted)]">{description}</p>
      </div>
      <Link href={href} className="inline-flex shrink-0 items-center gap-2 font-black uppercase tracking-wide text-[var(--maroon)] hover:text-[var(--maroon-dark)]">{linkLabel} <ArrowRight size={18} aria-hidden /></Link>
    </div>
  );
}

function StepCard({ number, icon, title, copy }: { number: string; icon: React.ReactNode; title: string; copy: string }) {
  return (
    <article className="relative overflow-hidden rounded-sm border border-white/20 bg-white/8 p-6 backdrop-blur-sm">
      <span className="absolute right-4 top-2 text-6xl font-black text-white/[0.06]" aria-hidden>{number}</span>
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--gold)] text-[var(--maroon-dark)]">{icon}</span>
      <h3 className="mt-5 text-xl font-black uppercase">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-relaxed text-white/72">{copy}</p>
    </article>
  );
}
