import { BrandHeader } from "@/components/brand-header";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return <><BrandHeader /><main className="container max-w-3xl py-10"><h1 className="text-3xl font-bold text-[var(--maroon-dark)]">Privacy</h1><p className="mt-4 text-[var(--muted)]">WHSSignups collects volunteer contact information only to coordinate event commitments, confirmations, cancellations, and administrator follow-up. Public pages never expose private volunteer details.</p></main></>;
}
