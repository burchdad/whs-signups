import Image from "next/image";
import Link from "next/link";
import { BadgeDollarSign, HandHeart, Shirt, Trophy } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { BoosterClubForm } from "@/components/forms/booster-club-form";
import { sportsOffered, type SportName } from "@/lib/sports";

export const dynamic = "force-dynamic";

export default async function BoosterClubPage({ searchParams }: { searchParams: Promise<{ sport?: string }> }) {
  const { sport } = await searchParams;
  const defaultSports: SportName[] = sport && sportsOffered.includes(sport as SportName) ? [sport as SportName] : ["Volleyball"];
  return (
    <>
      <BrandHeader />
      <main>
        <section className="athletic-band text-white">
          <div className="container grid gap-8 py-10 md:grid-cols-[0.85fr_1.15fr] md:items-center">
            <div className="wildcat-card rounded-sm p-6 text-[var(--foreground)]">
              <div className="flex items-center gap-4">
                <Image src="/brand/whs-logo.png" alt="" width={82} height={68} />
                <div>
                  <p className="eyebrow">Wildcats Booster Club</p>
                  <h1 className="mt-1 text-4xl font-black uppercase leading-none text-[var(--ink)]">Join the support team</h1>
                </div>
              </div>
              <div className="mt-6 grid gap-3 text-sm font-medium text-[var(--muted)]">
                <p>Sign up for Booster Club interest, choose your preferred item, and let WHS know whether you are open to helping with volunteering or sponsorships.</p>
                <Link href="/events" className="font-black uppercase tracking-wide text-[var(--maroon)]">Looking for game volunteer slots?</Link>
              </div>
            </div>
            <div>
              <p className="eyebrow">Whitehouse High School Athletics</p>
              <h2 className="mt-3 max-w-3xl text-5xl font-black uppercase leading-none tracking-tight sm:text-6xl">Built for the people behind the teams.</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: Shirt, label: "Hat or shirt" },
                  { icon: HandHeart, label: "Volunteer interest" },
                  { icon: BadgeDollarSign, label: "Sponsor interest" },
                ].map((item) => (
                  <div key={item.label} className="rounded-sm border border-white/25 bg-black/20 p-4">
                    <item.icon size={24} className="text-[var(--gold)]" aria-hidden />
                    <p className="mt-3 text-sm font-black uppercase tracking-wide">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="container grid gap-8 py-10 lg:grid-cols-[0.75fr_1fr]">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--maroon)]"><Trophy size={16} aria-hidden /> Booster signup</p>
            <h2 className="mt-1 text-3xl font-black uppercase text-[var(--ink)]">Tell us where you fit.</h2>
            <p className="mt-3 font-medium text-[var(--muted)]">For now this is one Booster Club list. Later, this page can grow into multiple Booster Club options without changing the core signup flow.</p>
          </div>
          <BoosterClubForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} defaultSports={defaultSports} />
        </section>
      </main>
    </>
  );
}
