import { BrandHeader } from "@/components/brand-header";

export const metadata = { title: "Admin Login" };

export default function AdminLoginPage() {
  return (
    <>
      <BrandHeader />
      <main className="container py-10">
        <form className="mx-auto grid max-w-md gap-4 rounded-lg border border-[var(--border)] bg-white p-6">
          <h1 className="text-2xl font-bold text-[var(--maroon-dark)]">Admin login</h1>
          <p className="text-sm text-[var(--muted)]">Admin auth is ready for the next pass. This MVP uses server-side admin route boundaries and Railway Postgres for data.</p>
          <label className="grid gap-1.5"><span>Email</span><input type="email" className="field" /></label>
          <label className="grid gap-1.5"><span>Password</span><input type="password" className="field" /></label>
          <button type="button" className="min-h-12 rounded-md bg-[var(--maroon)] px-5 font-semibold text-white">Sign in</button>
        </form>
      </main>
    </>
  );
}
