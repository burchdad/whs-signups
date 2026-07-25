import { requireAdmin } from "@/lib/auth";
import { getTemplates } from "@/lib/repository";

export const metadata = { title: "Volunteer Templates" };
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  await requireAdmin();
  const templates = await getTemplates();
  return (
    <>
      <p className="eyebrow">Position presets</p>
      <h1 className="text-3xl font-black uppercase text-[var(--ink)]">Volunteer templates</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {templates.map((template) => (
          <section key={template.id} className="wildcat-card rounded-sm p-5">
            <h2 className="text-xl font-black uppercase text-[var(--ink)]">{template.name}</h2>
            <p className="mt-1 text-sm font-medium text-[var(--muted)]">{template.description}</p>
            <ul className="mt-4 grid gap-2 text-sm">{template.slots.map((slot) => <li key={slot.name} className="flex justify-between gap-3 border-b border-[var(--border)] pb-2 font-medium"><span>{slot.name}</span><span className="font-black text-[var(--maroon)]">{slot.capacity}</span></li>)}</ul>
            <button className="mt-5 min-h-11 rounded-sm border border-[var(--border)] px-4 font-black uppercase tracking-wide text-[var(--maroon)] hover:border-[var(--maroon)]">Edit template</button>
          </section>
        ))}
      </div>
    </>
  );
}
