export const metadata = { title: "New Event" };

export default function NewEventPage() {
  return (
    <form className="wildcat-card grid max-w-3xl gap-4 rounded-sm p-5">
      <div>
        <p className="eyebrow">Schedule builder</p>
        <h1 className="text-3xl font-black uppercase text-[var(--ink)]">Create event</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Title</span><input className="field" /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Opponent</span><input className="field" /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Date</span><input type="date" className="field" /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Location</span><input className="field" defaultValue="Whitehouse High School Gym" /></label>
      </div>
      <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Description</span><textarea className="field" rows={4} /></label>
      <div className="flex flex-wrap gap-3"><button type="button" className="min-h-11 rounded-sm bg-[var(--maroon)] px-4 font-black uppercase tracking-wide text-white">Save draft</button><button type="button" className="min-h-11 rounded-sm border border-[var(--border)] px-4 font-black uppercase tracking-wide text-[var(--maroon)]">Publish</button></div>
    </form>
  );
}
