import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";

export const metadata = { title: "Booster Club Payment Received" };

export default function BoosterSuccessPage() {
  return <><BrandHeader /><main className="container py-16"><section className="mx-auto max-w-2xl rounded-sm border border-[var(--border)] bg-white p-8 text-center shadow-sm"><CheckCircle2 className="mx-auto text-[#26733a]" size={48} aria-hidden /><p className="eyebrow mt-5">Payment received</p><h1 className="mt-2 text-4xl font-black uppercase text-[var(--ink)]">Welcome to the Booster Club</h1><p className="mt-4 font-medium text-[var(--muted)]">Your signup and payment were submitted. A confirmation will also be sent to your email.</p><Link href="/" className="mt-7 inline-flex min-h-12 items-center rounded-sm bg-[var(--maroon)] px-6 font-black uppercase text-white">Return home</Link></section></main></>;
}
