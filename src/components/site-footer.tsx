import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-black/15 bg-[var(--ink)] text-white">
      <div className="container flex flex-col gap-3 py-6 text-sm font-medium sm:flex-row sm:items-center sm:justify-between">
        <p>WHSSignups · Whitehouse community signup coordination</p>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2 font-black uppercase tracking-wide text-[var(--gold)]">
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
