import { notFound } from "next/navigation";
import { listAdminEvents } from "@/lib/repository";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Event Detail" };

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = (await listAdminEvents()).find((candidate) => candidate.id === id);
  if (!event) notFound();
  return (
    <>
      <p className="eyebrow">Event command</p>
      <h1 className="text-3xl font-black uppercase text-[var(--ink)]">{event.title}</h1>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
        {["Event details", "Team/game times", "Volunteer slots", "Signups", "Communications", "Audit history"].map((section) => (
          <section key={section} className="wildcat-card rounded-sm p-5">
            <h2 className="text-xl font-black uppercase text-[var(--ink)]">{section}</h2>
            {section === "Team/game times" ? <ul className="mt-3 grid gap-2 text-sm font-medium text-[var(--muted)]">{event.schedule.map((item) => <li key={item.id}>{item.label}: {formatDateTime(item.startsAt)}</li>)}</ul> : null}
            {section === "Volunteer slots" ? <ul className="mt-3 grid gap-2 text-sm font-medium text-[var(--muted)]">{event.slots.map((slot) => <li key={slot.id}>{slot.name}: {slot.filled}/{slot.capacity}</li>)}</ul> : null}
            {!["Team/game times", "Volunteer slots"].includes(section) ? <p className="mt-3 text-sm font-medium text-[var(--muted)]">Ready for Railway Postgres-backed management actions, confirmations, and audit entries.</p> : null}
          </section>
        ))}
      </div>
    </>
  );
}
