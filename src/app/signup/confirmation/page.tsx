import Link from "next/link";
import { BrandHeader } from "@/components/brand-header";
import { googleCalendarUrl } from "@/lib/calendar";
import { getEventAndSlot } from "@/lib/repository";

export const metadata = { title: "Signup Confirmed" };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ slot?: string; status?: string }> }) {
  const { slot, status } = await searchParams;
  const found = slot ? await getEventAndSlot(slot) : undefined;
  const waitlisted = status === "waitlisted";
  return (
    <>
      <BrandHeader />
      <main className="container py-10">
        <div className="wildcat-card max-w-2xl rounded-sm p-6">
          <p className="eyebrow text-[var(--maroon)]">{waitlisted ? "Waitlisted" : "Confirmed"}</p>
          <h1 className="mt-2 text-3xl font-black uppercase text-[var(--ink)]">{waitlisted ? "You are on the waitlist." : "Thank you for volunteering."}</h1>
          <p className="mt-3 font-medium text-[var(--muted)]">{waitlisted ? "That position is currently full. WHS will follow up if a spot opens." : "Your commitment is confirmed. Check your email for event details and your private cancellation link."}</p>
          {found ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {!waitlisted ? <Link href={`/api/calendar/${found.event.id}/${found.slot.id}`} className="inline-flex min-h-11 items-center rounded-sm border border-[var(--border)] px-4 font-black uppercase tracking-wide">Download calendar file</Link> : null}
              {!waitlisted ? <Link href={googleCalendarUrl(found.event, found.slot)} className="inline-flex min-h-11 items-center rounded-sm bg-[var(--maroon)] px-4 font-black uppercase tracking-wide text-white">Add to Google Calendar</Link> : null}
              <Link href={`/events/${found.event.slug}`} className="inline-flex min-h-11 items-center rounded-sm border border-[var(--border)] px-4 font-black uppercase tracking-wide">Back to event</Link>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
