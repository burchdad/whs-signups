import Image from "next/image";
import Link from "next/link";
import { sportsOffered } from "@/lib/sports";

export function BrandHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/20 bg-[var(--ink)] text-white shadow-lg">
      <div className="bg-[var(--maroon-dark)]">
        <div className="container flex min-h-8 items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em] text-white/80">
          <span>The official volunteer hub of Whitehouse athletics</span>
          <span className="hidden text-[var(--gold)] sm:inline">Wildcats Volleyball 2026</span>
        </div>
      </div>
      <div className="container flex min-h-20 items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-14 w-16 place-items-center rounded-sm bg-white">
            <Image src="/brand/whs-logo.png" alt="Whitehouse Wildcats logo" width={58} height={48} priority />
          </span>
          <div>
            <p className="text-2xl font-black uppercase tracking-tight">WHSSignups</p>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold)]">Whitehouse Wildcats</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-black uppercase tracking-wide md:flex">
          <details className="group relative">
            <summary className="list-none px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white [&::-webkit-details-marker]:hidden">
              Sports
            </summary>
            <div className="absolute left-0 top-full mt-3 grid w-[min(720px,calc(100vw-32px))] grid-cols-2 gap-x-10 rounded-sm border-t-4 border-[var(--gold)] bg-white p-6 text-[var(--maroon-dark)] shadow-2xl">
              {sportsOffered.map((sport) => (
                <Link key={sport} href={`/events?sport=${encodeURIComponent(sport)}`} className="flex min-h-11 items-center justify-between border-b border-[var(--border)] text-sm font-black uppercase hover:text-[var(--maroon)]">
                  <span>{sport}</span>
                  <span className="text-xs italic tracking-normal text-[var(--muted)]">Volunteer</span>
                </Link>
              ))}
            </div>
          </details>
          <Link href="/events" className="px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">Events</Link>
          <Link href="/contact" className="px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">Contact</Link>
          <Link href="/admin" className="rounded-sm border border-[var(--gold)] px-3 py-2 text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
