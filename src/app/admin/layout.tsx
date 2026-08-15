import Link from "next/link";
import Image from "next/image";
import { currentAdminSession } from "@/lib/auth";
import { canManageAdmins } from "@/lib/admin-access";

const nav = [
  ["/admin", "Dashboard"],
  ["/admin/events", "Events"],
  ["/admin/import", "Import"],
  ["/admin/templates", "Templates"],
  ["/admin/photos", "Team Photos"],
  ["/admin/signups", "Signups"],
  ["/admin/booster-club", "Booster Club"],
  ["/admin/settings", "Settings"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await currentAdminSession();
  const visibleNav = session && canManageAdmins(session) ? [...nav, ["/admin/access", "Access"]] : nav;
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-30 border-b border-black/20 bg-[var(--ink)] text-white shadow-lg">
        <div className="bg-[var(--maroon-dark)]">
          <div className="container flex min-h-8 items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.16em] text-white/80">
            <span>Whitehouse signup command center</span>
            <Link href="/" className="text-[var(--gold)] hover:text-white">Public site</Link>
          </div>
        </div>
        <div className="container flex flex-wrap items-center justify-between gap-4 py-3">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="grid h-14 w-16 place-items-center rounded-sm bg-white">
              <Image src="/brand/whs-logo.png" alt="Whitehouse Wildcats logo" width={58} height={44} priority />
            </span>
            <span>
              <span className="block text-2xl font-black uppercase tracking-tight">WHSSignups Admin</span>
              <span className="block text-xs font-black uppercase tracking-[0.18em] text-[var(--gold)]">Wildcats operations</span>
            </span>
          </Link>
          <div className="flex items-center gap-3"><span className="hidden text-right text-xs font-bold text-white/70 sm:block">{session?.user.name}<br/><span className="uppercase text-[var(--gold)]">{session?.user.role.replaceAll("_", " ")}</span></span><form action="/api/admin/logout" method="post">
            <button className="rounded-sm border border-[var(--gold)] px-3 py-2 text-sm font-black uppercase tracking-wide text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black">Logout</button>
          </form></div>
        </div>
        <nav className="container flex gap-2 overflow-x-auto pb-3 text-sm font-black uppercase tracking-wide">
          {visibleNav.map(([href, label]) => <Link key={href} href={href} className="rounded-sm px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">{label}</Link>)}
        </nav>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
