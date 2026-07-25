import { AlertTriangle, CalendarDays, ClipboardList, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminMetrics } from "@/lib/repository";

export const metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();
  const metrics = await getAdminMetrics();
  const cards = [
    ["Upcoming events", metrics.upcomingEvents, CalendarDays],
    ["Open positions", metrics.openPositions, ClipboardList],
    ["Filled positions", metrics.filledPositions, Users],
    ["Needs attention", metrics.attention, AlertTriangle],
  ] as const;
  return (
    <>
      <h1 className="text-3xl font-bold text-[var(--maroon-dark)]">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-lg border border-[var(--border)] bg-white p-5">
            <Icon className="text-[var(--maroon)]" aria-hidden />
            <p className="mt-4 text-3xl font-bold">{value}</p>
            <p className="text-sm text-[var(--muted)]">{label}</p>
          </div>
        ))}
      </div>
      <section className="mt-8 rounded-lg border border-[var(--border)] bg-white p-5">
        <h2 className="text-xl font-semibold">Recent signups</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)]"><th className="py-2">Volunteer</th><th>Email</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{metrics.recentSignups.map((signup) => <tr key={signup.id} className="border-b border-[var(--border)]"><td className="py-3">{signup.firstName} {signup.lastName}</td><td>{signup.email}</td><td>{signup.status}</td><td>{new Date(signup.createdAt).toLocaleDateString()}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}
