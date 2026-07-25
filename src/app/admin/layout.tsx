import Link from "next/link";
import Image from "next/image";

const nav = [
  ["/admin", "Dashboard"],
  ["/admin/events", "Events"],
  ["/admin/import", "Import"],
  ["/admin/templates", "Templates"],
  ["/admin/signups", "Signups"],
  ["/admin/settings", "Settings"],
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbf7f4]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="container flex flex-wrap items-center justify-between gap-4 py-4">
          <Link href="/admin" className="flex items-center gap-3">
            <Image src="/brand/whs-logo.png" alt="Whitehouse Wildcats logo" width={44} height={36} />
            <span className="text-lg font-semibold text-[var(--maroon-dark)]">WHSSignups Admin</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-[var(--maroon)]">Public site</Link>
        </div>
        <nav className="container flex gap-2 overflow-x-auto pb-3">
          {nav.map(([href, label]) => <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[#f3e9e3] hover:text-[var(--maroon)]">{label}</Link>)}
        </nav>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
