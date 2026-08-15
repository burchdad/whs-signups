import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, HandHeart, Shirt, Trophy } from "lucide-react";
import { redirect } from "next/navigation";
import { BrandHeader } from "@/components/brand-header";
import { sportSlug, sportsOffered } from "@/lib/sports";

export const dynamic = "force-dynamic";

async function openSport(formData: FormData) {
  "use server";
  const selectedSport = String(formData.get("sport") ?? "");
  const sport = sportsOffered.find((candidate) => candidate === selectedSport);
  if (!sport) redirect("/");
  redirect(`/${sportSlug(sport)}`);
}

export default function Home() {
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
                <form action={openSport} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <label className="sr-only" htmlFor="home-sport">Choose sport</label>
                  <select id="home-sport" name="sport" defaultValue="" required className="min-h-12 rounded-sm border border-white/20 bg-white px-3 font-black uppercase tracking-wide text-[var(--ink)]">
                    <option value="" disabled>Choose a sport</option>
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
              <h2 className="mt-1 text-3xl font-black uppercase text-[var(--ink)]">Choose your sport</h2>
              <p className="font-medium text-[var(--muted)]">Open a dedicated team page for volunteer events and Booster Club opportunities.</p>
            </div>
            <Link href="/events" className="font-black uppercase tracking-wide text-[var(--maroon)]">Full schedule</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sportsOffered.map((sport) => (
              <Link key={sport} href={`/${sportSlug(sport)}`} className="wildcat-card flex min-h-20 items-center justify-between rounded-sm p-4 font-black uppercase text-[var(--ink)] hover:border-[var(--gold)] hover:text-[var(--maroon)]">
                <span>{sport}</span><ArrowRight size={18} aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
