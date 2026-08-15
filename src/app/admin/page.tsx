import { AlertTriangle, BadgeDollarSign, CalendarDays, ClipboardList, HandHeart, Shirt, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminMetrics } from "@/lib/repository";

export const metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await requireAdmin();
  const metrics = await getAdminMetrics(session.allowedSports, session.allowedSports === null ? null : session.programIds);
  const cards = [
    ["Upcoming events", metrics.upcomingEvents, CalendarDays],
    ["Open positions", metrics.openPositions, ClipboardList],
    ["Filled positions", metrics.filledPositions, Users],
    ["Needs attention", metrics.attention, AlertTriangle],
    ["Booster signups", metrics.boosterSignups, Shirt],
    ["Volunteer prospects", metrics.boosterVolunteerProspects, HandHeart],
    ["Sponsor prospects", metrics.boosterSponsorProspects, BadgeDollarSign],
  ] as const;
  return (
    <>
      <div className="athletic-band rounded-sm p-6 text-white">
        <p className="eyebrow">Whitehouse community signups</p>
        <h1 className="mt-2 text-4xl font-black uppercase leading-none tracking-tight">Admin dashboard</h1>
        <p className="mt-3 font-medium text-white/82">Track upcoming home events, open volunteer positions, and roster activity for {session.allowedSports === null ? "all programs" : session.allowedSports.join(", ") || "your assigned programs"}.</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <div key={label} className="wildcat-card rounded-sm p-5">
            <Icon className="text-[var(--maroon)]" aria-hidden />
            <p className="mt-4 text-4xl font-black text-[var(--ink)]">{value}</p>
            <p className="text-sm font-black uppercase tracking-wide text-[var(--muted)]">{label}</p>
          </div>
        ))}
      </div>
      {metrics.topBoosterSports.length > 0 ? (
        <section className="wildcat-card mt-8 rounded-sm p-5">
          <h2 className="text-xl font-black uppercase text-[var(--ink)]">Top Booster sports</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {metrics.topBoosterSports.map((sport) => (
              <div key={sport.sport} className="rounded-sm border border-[var(--border)] bg-[var(--cream)] p-3">
                <p className="font-black uppercase text-[var(--maroon-dark)]">{sport.sport}</p>
                <p className="text-sm font-medium text-[var(--muted)]">{sport.count} interested</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section className="wildcat-card mt-8 rounded-sm p-5">
        <h2 className="text-xl font-black uppercase text-[var(--ink)]">Recent signups</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr className="border-b border-[var(--border)] text-xs font-black uppercase tracking-wide text-[var(--maroon-dark)]"><th className="py-2">Volunteer</th><th>Email</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{metrics.recentSignups.map((signup) => <tr key={signup.id} className="border-b border-[var(--border)] font-medium"><td className="py-3">{signup.firstName} {signup.lastName}</td><td>{signup.email}</td><td>{signup.status}</td><td>{new Date(signup.createdAt).toLocaleDateString()}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}
