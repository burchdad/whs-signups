"use client";

import { useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import type { ImportPreviewRow } from "@/lib/import/parser";

type Worksheet = { sheetName: string; headers: string[]; preview: ImportPreviewRow[] };

export function ScheduleImporter({ sports, templates }: { sports: string[]; templates: Array<{ id: string; name: string }> }) {
  const [file, setFile] = useState<File>();
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [sport, setSport] = useState("Volleyball");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const worksheet = worksheets[sheetIndex];
  const publishable = worksheet?.preview.filter((row) => row.errors.length === 0 && row.normalized.isHome) ?? [];

  async function preview() {
    if (!file) return setMessage("Choose an Excel or CSV file first.");
    setBusy(true); setMessage(undefined);
    const data = new FormData(); data.set("file", file);
    const response = await fetch("/api/import/preview", { method: "POST", body: data });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(payload.message ?? "Could not preview the schedule.");
    setWorksheets(payload.worksheets); setSheetIndex(0);
  }

  async function publish() {
    if (publishable.length === 0) return setMessage("There are no valid home events to publish.");
    setBusy(true); setMessage(undefined);
    const response = await fetch("/api/import/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sport, templateId, filename: file?.name, worksheet: worksheet.sheetName, rows: publishable.map((row) => row.normalized) }) });
    const payload = await response.json();
    setBusy(false);
    setMessage(response.ok ? `${payload.created} events published${payload.skipped ? `; ${payload.skipped} duplicates skipped` : ""}.` : payload.message ?? "Could not publish the schedule.");
  }

  return (
    <>
      <p className="eyebrow">Schedule tools</p><h1 className="text-3xl font-black uppercase text-[var(--ink)]">Import schedule</h1>
      <section className="wildcat-card mt-6 rounded-sm p-5">
        <div className="flex items-start gap-3"><Upload className="text-[var(--maroon)]" aria-hidden /><div><h2 className="text-xl font-black uppercase text-[var(--ink)]">Upload Excel or CSV</h2><p className="mt-1 text-sm font-medium text-[var(--muted)]">Dates, opponents, locations, home/away status, and 9th/JV/Varsity times are detected automatically. You review everything before publishing.</p></div></div>
        {message && <p role="status" className="mt-4 rounded-sm bg-[var(--cream)] p-3 font-bold text-[var(--maroon-dark)]">{message}</p>}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5"><span className="font-black uppercase">Schedule file</span><input type="file" accept=".xlsx,.xls,.csv" className="field" onChange={(event) => setFile(event.target.files?.[0])} /></label>
          <label className="grid gap-1.5"><span className="font-black uppercase">Sport</span><select className="field" value={sport} onChange={(event) => setSport(event.target.value)}>{sports.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="grid gap-1.5"><span className="font-black uppercase">Volunteer template</span><select className="field" value={templateId} onChange={(event) => setTemplateId(event.target.value)}><option value="">General volunteer role</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
          {worksheets.length > 1 && <label className="grid gap-1.5"><span className="font-black uppercase">Worksheet</span><select className="field" value={sheetIndex} onChange={(event) => setSheetIndex(Number(event.target.value))}>{worksheets.map((sheet, index) => <option key={sheet.sheetName} value={index}>{sheet.sheetName}</option>)}</select></label>}
        </div>
        <button type="button" onClick={preview} disabled={busy} className="mt-4 min-h-12 rounded-sm bg-[var(--maroon)] px-5 font-black uppercase tracking-wide text-white disabled:opacity-60">{busy ? "Working…" : "Preview import"}</button>
      </section>
      {worksheet && <section className="wildcat-card mt-6 overflow-hidden rounded-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5"><div><h2 className="text-xl font-black uppercase">Review {worksheet.sheetName}</h2><p className="text-sm font-medium text-[var(--muted)]">{publishable.length} valid home events will be published. Away events and rows with errors are excluded.</p></div><button type="button" onClick={publish} disabled={busy || publishable.length === 0} className="min-h-11 rounded-sm bg-[var(--gold)] px-4 font-black uppercase tracking-wide text-black disabled:opacity-50"><CheckCircle2 className="mr-2 inline" size={18} aria-hidden />Publish valid events</button></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-[var(--cream)] text-xs font-black uppercase"><tr><th className="p-3">Row</th><th>Date</th><th>Event</th><th>Location</th><th>Home?</th><th>Times</th><th>Status</th></tr></thead><tbody>{worksheet.preview.map((row) => <tr key={row.rowNumber} className="border-t border-[var(--border)]"><td className="p-3">{row.rowNumber}</td><td>{row.normalized.date ?? "—"}</td><td className="font-bold">{row.normalized.title ?? "—"}</td><td>{row.normalized.location ?? "—"}</td><td>{row.normalized.isHome ? "Yes" : "No"}</td><td>{row.normalized.schedule.map((item) => `${item.label} ${item.time}`).join(", ") || "—"}</td><td className={row.errors.length ? "text-red-700" : row.normalized.isHome ? "text-green-700" : "text-[var(--muted)]"}>{row.errors[0] ?? row.warnings[0] ?? "Ready"}</td></tr>)}</tbody></table></div></section>}
    </>
  );
}
