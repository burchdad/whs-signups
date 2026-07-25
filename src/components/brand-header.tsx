import Image from "next/image";
import Link from "next/link";

export function BrandHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-white/90 backdrop-blur">
      <div className="container flex min-h-20 items-center justify-between gap-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/whs-logo.png" alt="Whitehouse Wildcats logo" width={58} height={48} priority />
          <div>
            <p className="text-xl font-semibold text-[var(--maroon-dark)]">WHSSignups</p>
            <p className="text-sm text-[var(--muted)]">Whitehouse volunteer coordination</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-[var(--muted)] sm:flex">
          <Link href="/events" className="hover:text-[var(--maroon)]">Events</Link>
          <Link href="/contact" className="hover:text-[var(--maroon)]">Contact</Link>
          <Link href="/admin" className="rounded-md border border-[var(--border)] px-3 py-2 hover:border-[var(--maroon)] hover:text-[var(--maroon)]">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
