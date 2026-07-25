export const metadata = { title: "New Event" };

export default function NewEventPage() {
  return (
    <form className="grid max-w-3xl gap-4 rounded-lg border border-[var(--border)] bg-white p-5">
      <h1 className="text-3xl font-bold text-[var(--maroon-dark)]">Create event</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5"><span>Title</span><input className="field" /></label>
        <label className="grid gap-1.5"><span>Opponent</span><input className="field" /></label>
        <label className="grid gap-1.5"><span>Date</span><input type="date" className="field" /></label>
        <label className="grid gap-1.5"><span>Location</span><input className="field" defaultValue="Whitehouse High School Gym" /></label>
      </div>
      <label className="grid gap-1.5"><span>Description</span><textarea className="field" rows={4} /></label>
      <div className="flex flex-wrap gap-3"><button type="button" className="min-h-11 rounded-md bg-[var(--maroon)] px-4 font-semibold text-white">Save draft</button><button type="button" className="min-h-11 rounded-md border border-[var(--border)] px-4 font-semibold">Publish</button></div>
    </form>
  );
}
