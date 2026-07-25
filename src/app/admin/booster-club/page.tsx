import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listBoosterClubSignups } from "@/lib/repository";

export const metadata = { title: "Booster Club Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBoosterClubPage() {
  await requireAdmin();
  const signups = await listBoosterClubSignups();
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Booster roster</p>
          <h1 className="text-3xl font-black uppercase text-[var(--ink)]">Booster Club</h1>
        </div>
        <Link href="/api/exports/booster-club" className="min-h-11 rounded-sm bg-[var(--maroon)] px-4 py-2 font-black uppercase tracking-wide text-white hover:bg-[var(--maroon-dark)]">Export CSV</Link>
      </div>
      <section className="wildcat-card mt-6 rounded-sm p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs font-black uppercase tracking-wide text-[var(--maroon-dark)]">
                <th className="py-2">Name</th><th>Email</th><th>Phone</th><th>Sports</th><th>Item</th><th>Volunteer</th><th>Sponsor</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((signup) => (
                <tr key={signup.id} className="border-b border-[var(--border)] font-medium">
                  <td className="py-3 font-black text-[var(--ink)]">{signup.firstName} {signup.lastName}</td>
                  <td>{signup.email}</td>
                  <td>{signup.phone}</td>
                  <td>{signup.selectedSports.join(", ")}</td>
                  <td className="capitalize">{signup.gearPreference}</td>
                  <td>{signup.openToVolunteering ? "Yes" : "No"}</td>
                  <td>{signup.interestedInSponsoring ? "Yes" : "No"}</td>
                  <td>{new Date(signup.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
