import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Trophy } from "lucide-react";
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
                <Link href="/admin/login" className="inline-flex min-h-12 items-center rounded-sm border border-white/30 px-5 font-black uppercase tracking-wide text-white hover:bg-white/10">
                  Admin login
                </Link>
              </div>
            </div>
            <div className="wildcat-card rounded-sm p-6 text-[var(--foreground)]">
              <div className="flex items-center gap-4 border-b border-[var(--border)] pb-4">
                <Image src="/brand/whs-logo.png" alt="" width={76} height={62} />
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
          <div className="grid gap-4 md:grid-cols-3">{upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)}</div>
        </section>
      </main>
    </>
  );
}
