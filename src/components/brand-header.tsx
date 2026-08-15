import Image from "next/image";
import Link from "next/link";

export function BrandHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/20 bg-[var(--ink)] text-white shadow-lg">
      <div className="bg-[var(--maroon-dark)]">
        <div className="container flex min-h-8 items-center text-xs font-black uppercase tracking-[0.16em] text-white/80">
          <span>The official volunteer hub of Whitehouse athletics</span>
        </div>
      </div>
      <div className="container flex min-h-20 items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-14 w-16 place-items-center rounded-sm bg-white">
            <Image src="/brand/whs-logo.png" alt="Whitehouse Wildcats logo" width={58} height={44} priority />
          </span>
          <div>
            <p className="text-2xl font-black uppercase tracking-tight">WHSSignups</p>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--gold)]">Whitehouse Wildcats</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-black uppercase tracking-wide md:flex">
          <Link href="/sports" className="px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">Sports</Link>
          <Link href="/events" className="px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">Events</Link>
          <Link href="/booster-club" className="px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">Booster Club</Link>
          <Link href="/contact" className="px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">Contact</Link>
          <Link href="/admin" className="rounded-sm border border-[var(--gold)] px-3 py-2 text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black">Admin</Link>
        </nav>
        <details className="relative md:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-sm border border-[var(--gold)] px-4 text-sm font-black uppercase tracking-wide text-[var(--gold)] [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <nav className="absolute right-0 top-full mt-3 grid w-56 rounded-sm border-t-4 border-[var(--gold)] bg-white p-2 text-sm font-black uppercase tracking-wide text-[var(--maroon-dark)] shadow-2xl">
            <Link href="/sports" className="min-h-11 border-b border-[var(--border)] px-3 py-3">Sports</Link>
            <Link href="/events" className="min-h-11 border-b border-[var(--border)] px-3 py-3">Events</Link>
            <Link href="/booster-club" className="min-h-11 border-b border-[var(--border)] px-3 py-3">Booster Club</Link>
            <Link href="/contact" className="min-h-11 border-b border-[var(--border)] px-3 py-3">Contact</Link>
            <Link href="/admin" className="min-h-11 px-3 py-3">Admin</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
