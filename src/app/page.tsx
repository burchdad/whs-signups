import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { EventCard } from "@/components/event-card";
import { listPublicEvents } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const upcomingEvents = (await listPublicEvents()).slice(0, 3);
  return (
    <>
      <BrandHeader />
      <main>
        <section className="border-b border-[var(--border)] bg-[#fff8f3]">
          <div className="container grid gap-8 py-12 md:grid-cols-[1.15fr_0.85fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--maroon)]">Whitehouse High School</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-[var(--maroon-dark)] sm:text-5xl">WHSSignups</h1>
              <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">Supporting Whitehouse students, teams, and events, one volunteer at a time.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/events" className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[var(--maroon)] px-5 font-semibold text-white hover:bg-[var(--maroon-dark)]">
                  View all events <ArrowRight size={18} aria-hidden />
                </Link>
                <Link href="/admin/login" className="inline-flex min-h-12 items-center rounded-md border border-[var(--border)] bg-white px-5 font-semibold text-[var(--maroon-dark)] hover:border-[var(--maroon)]">
                  Admin login
                </Link>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">How volunteering works</h2>
              <ul className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
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
              <h2 className="text-2xl font-semibold">Upcoming events</h2>
              <p className="text-[var(--muted)]">Open volunteer opportunities for WHS activities.</p>
            </div>
            <Link href="/events" className="font-semibold text-[var(--maroon)]">All events</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">{upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)}</div>
        </section>
      </main>
    </>
  );
}
