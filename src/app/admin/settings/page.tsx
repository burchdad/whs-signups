import { organization } from "@/lib/repository";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <form className="grid max-w-3xl gap-4 rounded-lg border border-[var(--border)] bg-white p-5">
      <h1 className="text-3xl font-bold text-[var(--maroon-dark)]">Organization settings</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5"><span>Organization name</span><input className="field" defaultValue={organization.name} /></label>
        <label className="grid gap-1.5"><span>Contact email</span><input className="field" defaultValue={organization.contactEmail} /></label>
        <label className="grid gap-1.5"><span>Reply-to email</span><input className="field" defaultValue={organization.contactEmail} /></label>
        <label className="grid gap-1.5"><span>Timezone</span><input className="field" defaultValue="America/Chicago" /></label>
      </div>
      <label className="grid gap-1.5"><span>Default location</span><input className="field" defaultValue="Whitehouse High School Gym" /></label>
      <label className="grid gap-1.5"><span>Default consent wording</span><textarea className="field" rows={3} defaultValue="I understand WHSSignups will use my contact information for this volunteer commitment." /></label>
      <button type="button" className="min-h-12 rounded-md bg-[var(--maroon)] px-5 font-semibold text-white">Save settings</button>
    </form>
  );
}
