import { BrandHeader } from "@/components/brand-header";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return <><BrandHeader /><main className="container max-w-3xl py-10"><h1 className="text-3xl font-bold text-[var(--maroon-dark)]">Terms</h1><p className="mt-4 text-[var(--muted)]">Volunteer signups are commitments to support school and community events. Administrators may edit or remove signups when needed for event operations.</p></main></>;
}
