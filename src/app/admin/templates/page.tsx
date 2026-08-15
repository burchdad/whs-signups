import { requireAdmin } from "@/lib/auth";
import { getTemplates } from "@/lib/repository";
import { createTemplate } from "../actions";

export const metadata = { title: "Volunteer Templates" };
export const dynamic = "force-dynamic";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const templates = await getTemplates();
  const created = (await searchParams).created === "1";
  return (
    <>
      <p className="eyebrow">Position presets</p>
      <h1 className="text-3xl font-black uppercase text-[var(--ink)]">Volunteer templates</h1>
      <p className="mt-2 max-w-3xl font-medium text-[var(--muted)]">Creators can start an event with any template, add custom roles, or use custom roles only.</p>
      {created && <p role="status" className="mt-5 rounded-sm bg-[#f1fbf3] p-3 font-black text-[#225c2d]">Template created.</p>}
      <section className="wildcat-card mt-6 rounded-sm p-5">
        <h2 className="text-xl font-black uppercase text-[var(--ink)]">Create template</h2>
        <form action={createTemplate} className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5"><span className="font-black uppercase">Template name</span><input name="name" className="field" required /></label><label className="grid gap-1.5"><span className="font-black uppercase">Description</span><input name="description" className="field" /></label></div>
          <label className="grid gap-1.5"><span className="font-black uppercase">Roles</span><textarea name="roles" rows={6} className="field" placeholder={"Concession Stand | 4 | Hospitality\nTicket Table | 2 | Admissions"} required /><small className="font-medium text-[var(--muted)]">One per line: Role name | number needed | category</small></label>
          <button className="min-h-11 justify-self-start rounded-sm bg-[var(--maroon)] px-4 font-black uppercase tracking-wide text-white">Save template</button>
        </form>
      </section>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {templates.map((template) => <section key={template.id} className="wildcat-card rounded-sm p-5"><h2 className="text-xl font-black uppercase text-[var(--ink)]">{template.name}</h2><p className="mt-1 text-sm font-medium text-[var(--muted)]">{template.description}</p><ul className="mt-4 grid gap-2 text-sm">{template.slots.map((slot) => <li key={`${slot.name}-${slot.sortOrder}`} className="flex justify-between gap-3 border-b border-[var(--border)] pb-2 font-medium"><span>{slot.name}</span><span className="font-black text-[var(--maroon)]">{slot.capacity}</span></li>)}</ul></section>)}
      </div>
    </>
  );
}
