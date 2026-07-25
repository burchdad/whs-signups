import { getTemplates } from "@/lib/repository";

export const metadata = { title: "Volunteer Templates" };

export default async function TemplatesPage() {
  const templates = await getTemplates();
  return (
    <>
      <h1 className="text-3xl font-bold text-[var(--maroon-dark)]">Volunteer templates</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {templates.map((template) => (
          <section key={template.id} className="rounded-lg border border-[var(--border)] bg-white p-5">
            <h2 className="text-xl font-semibold">{template.name}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{template.description}</p>
            <ul className="mt-4 grid gap-2 text-sm">{template.slots.map((slot) => <li key={slot.name} className="flex justify-between gap-3 border-b border-[var(--border)] pb-2"><span>{slot.name}</span><span className="font-semibold">{slot.capacity}</span></li>)}</ul>
            <button className="mt-5 min-h-11 rounded-md border border-[var(--border)] px-4 font-semibold">Edit template</button>
          </section>
        ))}
      </div>
    </>
  );
}
