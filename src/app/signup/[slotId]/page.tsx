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
        <aside className="rounded-lg border border-[var(--border)] bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--maroon)]">Volunteer signup</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--maroon-dark)]">{slot.name}</h1>
          <dl className="mt-5 grid gap-3 text-sm">
            <div><dt className="font-semibold">Event</dt><dd>{event.title}</dd></div>
            <div><dt className="font-semibold">Date</dt><dd>{formatDateTime(event.startsAt)}</dd></div>
            <div><dt className="font-semibold">Location</dt><dd>{event.location}</dd></div>
            <div><dt className="font-semibold">Availability</dt><dd>{remainingCount(slot)} of {slot.capacity} spots remaining</dd></div>
          </dl>
        </aside>
        <section>
          <SignupForm slotId={slot.id} />
        </section>
      </main>
    </>
  );
}
