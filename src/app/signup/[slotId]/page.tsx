import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/brand-header";
import { SignupForm } from "@/components/forms/signup-form";
import { remainingCount } from "@/lib/availability";
import { getEventAndSlot } from "@/lib/repository";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Sign Up" };

export default async function SignupPage({ params }: { params: Promise<{ slotId: string }> }) {
  const { slotId } = await params;
  const found = await getEventAndSlot(slotId);
  if (!found) notFound();
  const { event, slot } = found;
  return (
    <>
      <BrandHeader />
      <main className="container grid gap-6 py-8 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="athletic-band rounded-sm p-5 text-white">
          <p className="eyebrow">Volunteer signup</p>
          <h1 className="mt-2 text-3xl font-black uppercase text-white">{slot.name}</h1>
          <dl className="mt-5 grid gap-3 text-sm">
            <div><dt className="font-black uppercase text-[var(--gold)]">Event</dt><dd className="font-medium text-white/86">{event.title}</dd></div>
            <div><dt className="font-black uppercase text-[var(--gold)]">Date</dt><dd className="font-medium text-white/86">{formatDateTime(event.startsAt)}</dd></div>
            <div><dt className="font-black uppercase text-[var(--gold)]">Location</dt><dd className="font-medium text-white/86">{event.location}</dd></div>
            {slot.shiftStart ? <div><dt className="font-black uppercase text-[var(--gold)]">Shift</dt><dd className="font-medium text-white/86">{formatDateTime(slot.shiftStart)}{slot.shiftEnd ? ` - ${new Date(slot.shiftEnd).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" })}` : ""}</dd></div> : null}
            <div><dt className="font-black uppercase text-[var(--gold)]">Availability</dt><dd className="font-medium text-white/86">{remainingCount(slot)} of {slot.capacity} spots remaining{remainingCount(slot) === 0 ? " / waitlist available" : ""}</dd></div>
          </dl>
        </aside>
        <section>
          <SignupForm slotId={slot.id} turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
        </section>
      </main>
    </>
  );
}
