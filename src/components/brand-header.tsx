import Image from "next/image";
import Link from "next/link";

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
        <nav className="hidden items-center gap-1 text-sm font-black uppercase tracking-wide sm:flex">
          <Link href="/events" className="px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">Events</Link>
          <Link href="/contact" className="px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">Contact</Link>
          <Link href="/admin" className="rounded-sm border border-[var(--gold)] px-3 py-2 text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
