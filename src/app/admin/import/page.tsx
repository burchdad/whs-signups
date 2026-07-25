import { Upload } from "lucide-react";

export const metadata = { title: "Import Schedule" };

export default function ImportPage() {
  return (
    <>
      <p className="eyebrow">Schedule tools</p>
      <h1 className="text-3xl font-black uppercase text-[var(--ink)]">Import schedule</h1>
      <section className="wildcat-card mt-6 rounded-sm p-5">
        <div className="flex items-start gap-3">
          <Upload className="text-[var(--maroon)]" aria-hidden />
          <div>
            <h2 className="text-xl font-black uppercase text-[var(--ink)]">Upload Excel or CSV</h2>
            <p className="mt-1 text-sm font-medium text-[var(--muted)]">The parser supports worksheet selection, column normalization, home-game detection, duplicate warnings, row-level errors, and template selection before publish.</p>
          </div>
        </div>
        <form className="mt-5 grid gap-4">
          <input type="file" accept=".xlsx,.xls,.csv" className="field" />
          <select className="field"><option>Apply template: Volleyball Home Game</option><option>Apply template: Volleyball Tournament</option></select>
          <button type="button" className="min-h-12 rounded-sm bg-[var(--maroon)] px-5 font-black uppercase tracking-wide text-white hover:bg-[var(--maroon-dark)]">Preview import</button>
        </form>
      </section>
    </>
  );
}
