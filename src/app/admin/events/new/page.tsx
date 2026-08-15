import { requireAdmin } from "@/lib/auth";
import { participationAreas } from "@/lib/sports";
import { getTemplates } from "@/lib/repository";
import { createEvent } from "../../actions";
import { listAdminPrograms, listAssignableAdminAccounts } from "@/lib/admin-access";

export const metadata = { title: "New Event" };

export default async function NewEventPage() {
  const session = await requireAdmin();
  const [templates, programs, owners] = await Promise.all([getTemplates(), listAdminPrograms(), listAssignableAdminAccounts(session)]);
  const sports = session.allowedSports === null ? [...participationAreas] : participationAreas.filter((sport) => session.allowedSports?.includes(sport));
  return (
    <form action={createEvent} className="wildcat-card grid max-w-3xl gap-4 rounded-sm p-5">
      <div>
        <p className="eyebrow">Schedule builder</p>
        <h1 className="text-3xl font-black uppercase text-[var(--ink)]">Create event</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Title</span><input name="title" className="field" required /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Sport or group</span><select name="sport" className="field">{sports.map((sport) => <option key={sport} value={sport}>{sport}</option>)}</select></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Program</span><select name="programId" className="field"><option value="">Default assigned program</option>{programs.filter((program) => session.programIds.includes(program.id) || session.allowedSports === null).map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Opponent</span><input name="opponent" className="field" /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Date</span><input name="eventDate" type="date" className="field" required /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Start time</span><input name="startsAt" type="datetime-local" className="field" required /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Location</span><input name="location" className="field" defaultValue="Whitehouse High School Gym" required /></label>
      </div>
      <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Description</span><textarea name="description" className="field" rows={4} /></label>
      <fieldset className="grid gap-4 rounded-sm border border-[var(--border)] bg-[var(--cream)] p-4 sm:grid-cols-2">
        <legend className="px-2 font-black uppercase tracking-wide text-[var(--maroon)]">Signup form owner</legend>
        <label className="grid gap-1.5 sm:col-span-2"><span className="font-black uppercase tracking-wide">Assigned administrator</span><select name="ownerAdminUserId" className="field"><option value={session.user.id}>Me — {session.user.name}</option>{owners.filter((owner) => owner.id !== session.user.id).map((owner) => <option key={owner.id} value={owner.id}>{owner.name} — {owner.email}</option>)}</select><small className="font-medium text-[var(--muted)]">The assigned person owns this form inside the admin system.</small></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Owner name</span><input name="contactName" className="field" /></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Owner email</span><input name="contactEmail" type="email" className="field" defaultValue={session.user.email} required /><small className="font-medium text-[var(--muted)]">Receives every signup and cancellation for this event.</small></label>
      </fieldset>
      <fieldset className="grid gap-4 rounded-sm border border-[var(--border)] p-4">
        <legend className="px-2 font-black uppercase tracking-wide text-[var(--maroon)]">Volunteer positions</legend>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Start with a template</span><select name="templateId" className="field"><option value="">No template — custom roles only</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
        <label className="grid gap-1.5"><span className="font-black uppercase tracking-wide">Additional custom roles</span><textarea name="customRoles" rows={5} className="field" placeholder={"Concession Stand | 4 | Hospitality\nTicket Table | 2 | Admissions"} /><small className="font-medium text-[var(--muted)]">One role per line: Role name | number needed | category. Custom roles are added to the selected template.</small></label>
      </fieldset>
      <div className="flex flex-wrap gap-3"><button className="min-h-11 rounded-sm bg-[var(--maroon)] px-4 font-black uppercase tracking-wide text-white">Publish event</button></div>
    </form>
  );
}
