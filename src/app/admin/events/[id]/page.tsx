import { notFound } from "next/navigation";
import { saveEventDetails, setSlotOpen } from "../../actions";
import { requireAdmin } from "@/lib/auth";
import { listAdminEvents } from "@/lib/repository";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Event Detail" };

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  const event = (await listAdminEvents(session.allowedSports)).find((candidate) => candidate.id === id);
  if (!event) notFound();
  const startsAtLocal = event.startsAt.slice(0, 16);
  return (
    <>
      <p className="eyebrow">Event command</p>
      <h1 className="text-3xl font-black uppercase text-[var(--ink)]">{event.title}</h1>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="wildcat-card rounded-sm p-5">
          <h2 className="text-xl font-black uppercase text-[var(--ink)]">Event details</h2>
          <form action={saveEventDetails} className="mt-4 grid gap-3">
            <input type="hidden" name="id" value={event.id} />
            <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Title</span><input name="title" className="field" defaultValue={event.title} required /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Opponent</span><input name="opponent" className="field" defaultValue={event.opponent ?? ""} /></label>
              <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Date</span><input name="eventDate" type="date" className="field" defaultValue={event.eventDate} required /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Start time</span><input name="startsAt" type="datetime-local" className="field" defaultValue={startsAtLocal} required /></label>
              <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Location</span><input name="location" className="field" defaultValue={event.location} required /></label>
            </div>
            <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Description</span><textarea name="description" rows={3} className="field" defaultValue={event.description ?? ""} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Signup owner name</span><input name="contactName" className="field" defaultValue={event.contactName ?? ""} /></label>
              <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Signup owner email</span><input name="contactEmail" type="email" className="field" defaultValue={event.contactEmail ?? ""} /><small className="font-medium text-[var(--muted)]">Receives signups and cancellations.</small></label>
            </div>
            <button className="min-h-11 rounded-sm bg-[var(--maroon)] px-4 font-black uppercase tracking-wide text-white">Save event</button>
          </form>
        </section>
        {["Team/game times", "Volunteer slots", "Signups", "Communications", "Audit history"].map((section) => (
          <section key={section} className="wildcat-card rounded-sm p-5">
            <h2 className="text-xl font-black uppercase text-[var(--ink)]">{section}</h2>
            {section === "Team/game times" ? <ul className="mt-3 grid gap-2 text-sm font-medium text-[var(--muted)]">{event.schedule.map((item) => <li key={item.id}>{item.label}: {formatDateTime(item.startsAt)}</li>)}</ul> : null}
            {section === "Volunteer slots" ? <ul className="mt-3 grid gap-2 text-sm font-medium text-[var(--muted)]">{event.slots.map((slot) => <li key={slot.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-2"><span>{slot.name}: {slot.filled}/{slot.capacity} / {slot.isOpen ? "Open" : "Closed"}</span><form action={setSlotOpen}><input type="hidden" name="eventId" value={event.id} /><input type="hidden" name="slotId" value={slot.id} /><input type="hidden" name="isOpen" value={slot.isOpen ? "false" : "true"} /><button className="rounded-sm border border-[var(--border)] px-3 py-1 font-black uppercase tracking-wide text-[var(--maroon)]">{slot.isOpen ? "Close" : "Reopen"}</button></form></li>)}</ul> : null}
            {!["Team/game times", "Volunteer slots"].includes(section) ? <p className="mt-3 text-sm font-medium text-[var(--muted)]">Ready for Railway Postgres-backed management actions, confirmations, and audit entries.</p> : null}
          </section>
        ))}
      </div>
    </>
  );
}
