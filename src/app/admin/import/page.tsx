import { Upload } from "lucide-react";

export const metadata = { title: "Import Schedule" };

export default function ImportPage() {
  return (
    <>
      <h1 className="text-3xl font-bold text-[var(--maroon-dark)]">Import schedule</h1>
      <section className="mt-6 rounded-lg border border-[var(--border)] bg-white p-5">
        <div className="flex items-start gap-3">
          <Upload className="text-[var(--maroon)]" aria-hidden />
          <div>
            <h2 className="text-xl font-semibold">Upload Excel or CSV</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">The parser supports worksheet selection, column normalization, home-game detection, duplicate warnings, row-level errors, and template selection before publish.</p>
          </div>
        </div>
        <form className="mt-5 grid gap-4">
          <input type="file" accept=".xlsx,.xls,.csv" className="field" />
          <select className="field"><option>Apply template: Volleyball Home Game</option><option>Apply template: Volleyball Tournament</option></select>
          <button type="button" className="min-h-12 rounded-md bg-[var(--maroon)] px-5 font-semibold text-white">Preview import</button>
        </form>
      </section>
    </>
  );
}
