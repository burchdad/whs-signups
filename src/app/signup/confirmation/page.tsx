import Link from "next/link";
import { BrandHeader } from "@/components/brand-header";
import { googleCalendarUrl } from "@/lib/calendar";
import { getEventAndSlot } from "@/lib/repository";

export const metadata = { title: "Signup Confirmed" };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ slot?: string }> }) {
  const { slot } = await searchParams;
  const found = slot ? await getEventAndSlot(slot) : undefined;
  return (
    <>
      <BrandHeader />
      <main className="container py-10">
        <div className="max-w-2xl rounded-lg border border-[var(--border)] bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--maroon)]">Confirmed</p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--maroon-dark)]">Thank you for volunteering.</h1>
          <p className="mt-3 text-[var(--muted)]">A confirmation email will be sent when email credentials are configured. In development, email details are logged safely to the console.</p>
          {found ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/api/calendar/${found.event.id}/${found.slot.id}`} className="inline-flex min-h-11 items-center rounded-md border border-[var(--border)] px-4 font-semibold">Download calendar file</Link>
              <Link href={googleCalendarUrl(found.event, found.slot)} className="inline-flex min-h-11 items-center rounded-md bg-[var(--maroon)] px-4 font-semibold text-white">Add to Google Calendar</Link>
              <Link href={`/events/${found.event.slug}`} className="inline-flex min-h-11 items-center rounded-md border border-[var(--border)] px-4 font-semibold">Back to event</Link>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
