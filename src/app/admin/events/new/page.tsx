import { requireAdmin } from "@/lib/auth";
import { sportsOffered } from "@/lib/sports";
import { createEvent } from "../../actions";

export const metadata = { title: "New Event" };

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <form action={createEvent} className="wildcat-card grid max-w-3xl gap-4 rounded-sm p-5">
      <div>
        <p className="eyebrow">Schedule builder</p>
        <h1 className="text-3xl font-black uppercase text-[var(--ink)]">Create event</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Title</span><input name="title" className="field" required /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Sport</span><select name="sport" className="field" defaultValue="Volleyball">{sportsOffered.map((sport) => <option key={sport} value={sport}>{sport}</option>)}</select></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Opponent</span><input name="opponent" className="field" /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Date</span><input name="eventDate" type="date" className="field" required /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Start time</span><input name="startsAt" type="datetime-local" className="field" required /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Location</span><input name="location" className="field" defaultValue="Whitehouse High School Gym" required /></label>
      </div>
      <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Description</span><textarea name="description" className="field" rows={4} /></label>
      <div className="flex flex-wrap gap-3"><button className="min-h-11 rounded-sm bg-[var(--maroon)] px-4 font-black uppercase tracking-wide text-white">Publish event</button></div>
    </form>
  );
}
