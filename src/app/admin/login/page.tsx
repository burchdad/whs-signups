import Image from "next/image";
import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";

export const metadata = { title: "Admin Login" };

export default function AdminLoginPage() {
  return (
    <section className="athletic-band rounded-sm text-white">
      <div className="grid gap-8 p-6 md:grid-cols-[0.9fr_1.1fr] md:p-10">
        <div>
          <p className="eyebrow">Admin access</p>
          <h1 className="mt-3 text-5xl font-black uppercase leading-none tracking-tight">Wildcats control room.</h1>
          <p className="mt-4 max-w-xl font-medium text-white/82">Manage events, volunteer slots, imports, and roster exports from the same WHS-branded workspace.</p>
          <div className="mt-6 flex items-center gap-3 rounded-sm border border-white/25 bg-black/20 p-4">
            <ShieldCheck className="text-[var(--gold)]" aria-hidden />
            <p className="text-sm font-black uppercase tracking-wide">Railway Postgres backed admin tools</p>
          </div>
        </div>
        <form className="wildcat-card grid gap-4 rounded-sm p-6 text-[var(--foreground)]">
          <div className="flex items-center gap-4 border-b border-[var(--border)] pb-4">
            <Image src="/brand/whs-logo.png" alt="" width={76} height={62} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--maroon)]">Secure entry</p>
              <h2 className="text-2xl font-black uppercase">Admin login</h2>
            </div>
          </div>
          <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Email</span><input type="email" className="field" /></label>
          <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Password</span><input type="password" className="field" /></label>
          <Link href="/admin" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[var(--maroon)] px-5 font-black uppercase tracking-wide text-white hover:bg-[var(--maroon-dark)]">
            <LockKeyhole size={18} aria-hidden /> Enter admin
          </Link>
          <p className="text-sm font-medium text-[var(--muted)]">Credential verification can be connected when you are ready to enforce staff accounts.</p>
        </form>
      </div>
    </section>
  );
}
