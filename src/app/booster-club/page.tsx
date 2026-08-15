import Image from "next/image";
import Link from "next/link";
import { BadgeDollarSign, HandHeart, Shirt, Trophy } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { BoosterClubForm } from "@/components/forms/booster-club-form";
import { listPublicBoosterPrograms } from "@/lib/repository";
import { participationAreas, type ParticipationArea } from "@/lib/sports";

export const dynamic = "force-dynamic";

export default async function BoosterClubPage({ searchParams }: { searchParams: Promise<{ sport?: string; checkout?: string }> }) {
  const [{ sport, checkout }, programs] = await Promise.all([searchParams, listPublicBoosterPrograms()]);
  const defaultProgram = programs.find((program) => sport && program.sports.includes(sport)) ?? programs.find((program) => program.name === "Whitehouse Community Booster Club") ?? programs[0];
  const defaultSports: ParticipationArea[] = (sport && defaultProgram?.sports.includes(sport) ? [sport] : defaultProgram?.sports.slice(0, 1) ?? []).filter((item): item is ParticipationArea => participationAreas.includes(item as ParticipationArea));
  return (
    <>
      <BrandHeader />
      <main>
        <section className="athletic-band text-white">
          <div className="container grid gap-8 py-10 md:grid-cols-[0.85fr_1.15fr] md:items-center">
            <div className="wildcat-card rounded-sm p-6 text-[var(--foreground)]">
              <div className="flex items-center gap-4">
                <Image src="/brand/whs-logo.png" alt="" width={82} height={63} />
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
              <p className="eyebrow">Whitehouse community programs</p>
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
            <p className="mt-3 font-medium text-[var(--muted)]">Choose the exact Booster Club you are joining. Your signup, payment, administrator access, and roster export will stay with that organization.</p>
            {checkout === "cancelled" ? <p role="status" className="mt-4 rounded-sm bg-[#fff8e8] p-3 font-semibold text-[var(--maroon-dark)]">Checkout was cancelled. Your signup is saved as payment pending; submit again when you are ready to pay.</p> : null}
          </div>
          {programs.length > 0 ? <BoosterClubForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} programs={programs} defaultProgramId={defaultProgram?.id} defaultSports={defaultSports} /> : <p className="rounded-sm border border-[var(--border)] bg-white p-5 font-semibold text-[var(--muted)]">Booster Club enrollment is being prepared. Please check back soon.</p>}
        </section>
      </main>
    </>
  );
}
