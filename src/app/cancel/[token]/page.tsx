import { BrandHeader } from "@/components/brand-header";
import { getCancellationByToken } from "@/lib/repository";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Cancel Signup" };

export default async function CancelPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await getCancellationByToken(token);
  return (
    <>
      <BrandHeader />
      <main className="container py-10">
        <div className="max-w-2xl rounded-lg border border-[var(--border)] bg-white p-6">
          <h1 className="text-3xl font-bold text-[var(--maroon-dark)]">Cancel volunteer signup</h1>
          {!found ? (
            <p className="mt-3 text-[var(--muted)]">This cancellation link is invalid, expired, or has already been used.</p>
          ) : (
            <>
              <p className="mt-3 text-[var(--muted)]">You are cancelling {found.slot.name} for {found.event.title} on {formatDateTime(found.event.startsAt)}.</p>
              <form action={`/api/cancel/${token}`} method="post" className="mt-5">
                <button className="min-h-12 rounded-md bg-[var(--maroon)] px-5 font-semibold text-white">Confirm cancellation</button>
              </form>
            </>
          )}
        </div>
      </main>
    </>
  );
}
