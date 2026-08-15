import { Mail } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { organization } from "@/lib/repository";
import { getOrganizationEmailSettings } from "@/lib/admin-access";
import { hasDatabaseUrl } from "@/lib/db";

export const metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = hasDatabaseUrl() ? await getOrganizationEmailSettings() : undefined;
  const contactEmail = settings?.contactEmail || organization.contactEmail;
  return <><BrandHeader /><main className="container max-w-3xl py-10"><h1 className="text-3xl font-bold text-[var(--maroon-dark)]">Contact</h1><p className="mt-4 text-[var(--muted)]">Questions about a volunteer commitment or event setup can go to the WHS volunteer coordinator.</p><a href={`mailto:${contactEmail}`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--maroon)] px-4 font-semibold text-white"><Mail size={18} aria-hidden /> {contactEmail}</a></main></>;
}
