import { notFound } from "next/navigation";
import { addScheduleItem, addVolunteerSlot, deleteVolunteerSlot, removeScheduleItem, saveEventDetails, saveScheduleItem, saveVolunteerSlot } from "../../actions";
import { requireAdmin } from "@/lib/auth";
import { listAdminEvents } from "@/lib/repository";
import { isoToCentralLocalInput } from "@/lib/utils";

export const metadata = { title: "Event Detail" };

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  const event = (await listAdminEvents(session.allowedSports)).find((candidate) => candidate.id === id);
  if (!event) notFound();
  const startsAtLocal = isoToCentralLocalInput(event.startsAt);
  const nextScheduleSort = Math.max(0, ...event.schedule.map((item) => item.sortOrder)) + 1;
  const nextSlotSort = Math.max(0, ...event.slots.map((slot) => slot.sortOrder)) + 1;
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
        <section className="wildcat-card rounded-sm p-5">
          <h2 className="text-xl font-black uppercase text-[var(--ink)]">Team/game times</h2>
          <div className="mt-4 grid gap-4">
            {event.schedule.map((item) => (
              <div key={item.id} className="rounded-sm border border-[var(--border)] p-3">
                <form action={saveScheduleItem} className="grid gap-3">
                  <input type="hidden" name="eventId" value={event.id} />
                  <input type="hidden" name="scheduleItemId" value={item.id} />
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_5rem]">
                    <label className="grid gap-1"><span className="text-xs font-black uppercase">Team</span><input name="label" className="field" defaultValue={item.label} required /></label>
                    <label className="grid gap-1"><span className="text-xs font-black uppercase">Game time</span><input name="startsAt" type="datetime-local" className="field" defaultValue={isoToCentralLocalInput(item.startsAt)} required /></label>
                    <label className="grid gap-1"><span className="text-xs font-black uppercase">Sort</span><input name="sortOrder" type="number" className="field" defaultValue={item.sortOrder} /></label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-sm bg-[var(--maroon)] px-3 py-2 text-xs font-black uppercase tracking-wide text-white">Save time</button>
                    <button formAction={removeScheduleItem} className="rounded-sm border border-[var(--border)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--maroon)]">Remove</button>
                  </div>
                </form>
              </div>
            ))}
            <form action={addScheduleItem} className="rounded-sm border border-dashed border-[var(--border)] p-3">
              <input type="hidden" name="eventId" value={event.id} />
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_5rem]">
                <label className="grid gap-1"><span className="text-xs font-black uppercase">New team</span><input name="label" className="field" placeholder="Varsity" required /></label>
                <label className="grid gap-1"><span className="text-xs font-black uppercase">Game time</span><input name="startsAt" type="datetime-local" className="field" defaultValue={startsAtLocal} required /></label>
                <label className="grid gap-1"><span className="text-xs font-black uppercase">Sort</span><input name="sortOrder" type="number" className="field" defaultValue={nextScheduleSort} /></label>
              </div>
              <button className="mt-3 rounded-sm border border-[var(--gold)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--maroon)]">Add time</button>
            </form>
          </div>
        </section>
        <section className="wildcat-card rounded-sm p-5 lg:col-span-2">
          <h2 className="text-xl font-black uppercase text-[var(--ink)]">Volunteer slots</h2>
          <div className="mt-4 grid gap-4">
            {event.slots.map((slot) => (
              <div key={slot.id} className="rounded-sm border border-[var(--border)] p-3">
                <form action={saveVolunteerSlot} className="grid gap-3">
                  <input type="hidden" name="eventId" value={event.id} />
                  <input type="hidden" name="slotId" value={slot.id} />
                  <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_0.5fr_0.5fr]">
                    <label className="grid gap-1"><span className="text-xs font-black uppercase">Name</span><input name="name" className="field" defaultValue={slot.name} required /></label>
                    <label className="grid gap-1"><span className="text-xs font-black uppercase">Category</span><input name="category" className="field" defaultValue={slot.category} required /></label>
                    <label className="grid gap-1"><span className="text-xs font-black uppercase">Capacity</span><input name="capacity" type="number" min={Math.max(1, slot.filled)} className="field" defaultValue={slot.capacity} required /></label>
                    <label className="grid gap-1"><span className="text-xs font-black uppercase">Sort</span><input name="sortOrder" type="number" className="field" defaultValue={slot.sortOrder} /></label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1"><span className="text-xs font-black uppercase">Shift start</span><input name="shiftStart" type="datetime-local" className="field" defaultValue={slot.shiftStart ? isoToCentralLocalInput(slot.shiftStart) : ""} /></label>
                    <label className="grid gap-1"><span className="text-xs font-black uppercase">Shift end</span><input name="shiftEnd" type="datetime-local" className="field" defaultValue={slot.shiftEnd ? isoToCentralLocalInput(slot.shiftEnd) : ""} /></label>
                  </div>
                  <label className="grid gap-1"><span className="text-xs font-black uppercase">Instructions</span><textarea name="instructions" rows={2} className="field" defaultValue={slot.instructions ?? ""} /></label>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-4 text-sm font-black uppercase text-[var(--muted)]">
                      <span>{slot.filled}/{slot.capacity} filled</span>
                      <label className="inline-flex items-center gap-2"><input name="isOpen" type="checkbox" defaultChecked={slot.isOpen} /> Open</label>
                      <label className="inline-flex items-center gap-2"><input name="isVisible" type="checkbox" defaultChecked={slot.isVisible} /> Visible</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-sm bg-[var(--maroon)] px-3 py-2 text-xs font-black uppercase tracking-wide text-white">Save slot</button>
                      <button formAction={deleteVolunteerSlot} className="rounded-sm border border-[var(--border)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--maroon)]">Remove</button>
                    </div>
                  </div>
                </form>
              </div>
            ))}
            <form action={addVolunteerSlot} className="rounded-sm border border-dashed border-[var(--border)] p-3">
              <input type="hidden" name="eventId" value={event.id} />
              <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_0.5fr_0.5fr]">
                <label className="grid gap-1"><span className="text-xs font-black uppercase">New slot</span><input name="name" className="field" placeholder="Student Volunteer" required /></label>
                <label className="grid gap-1"><span className="text-xs font-black uppercase">Category</span><input name="category" className="field" defaultValue="Volunteers" required /></label>
                <label className="grid gap-1"><span className="text-xs font-black uppercase">Capacity</span><input name="capacity" type="number" min={1} className="field" defaultValue={1} required /></label>
                <label className="grid gap-1"><span className="text-xs font-black uppercase">Sort</span><input name="sortOrder" type="number" className="field" defaultValue={nextSlotSort} /></label>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-1"><span className="text-xs font-black uppercase">Shift start</span><input name="shiftStart" type="datetime-local" className="field" defaultValue={startsAtLocal} /></label>
                <label className="grid gap-1"><span className="text-xs font-black uppercase">Shift end</span><input name="shiftEnd" type="datetime-local" className="field" /></label>
              </div>
              <label className="mt-3 grid gap-1"><span className="text-xs font-black uppercase">Instructions</span><textarea name="instructions" rows={2} className="field" /></label>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-4 text-sm font-black uppercase text-[var(--muted)]">
                  <label className="inline-flex items-center gap-2"><input name="isOpen" type="checkbox" defaultChecked /> Open</label>
                  <label className="inline-flex items-center gap-2"><input name="isVisible" type="checkbox" defaultChecked /> Visible</label>
                </div>
                <button className="rounded-sm border border-[var(--gold)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--maroon)]">Add slot</button>
              </div>
            </form>
          </div>
        </section>
        {["Signups", "Communications", "Audit history"].map((section) => (
          <section key={section} className="wildcat-card rounded-sm p-5">
            <h2 className="text-xl font-black uppercase text-[var(--ink)]">{section}</h2>
            <p className="mt-3 text-sm font-medium text-[var(--muted)]">Ready for Railway Postgres-backed management actions, confirmations, and audit entries.</p>
          </section>
        ))}
      </div>
    </>
  );
}
