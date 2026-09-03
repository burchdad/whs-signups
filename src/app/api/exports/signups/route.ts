import { NextResponse } from "next/server";
import { adminSignupsToCsv } from "@/lib/exports";
import { requireAdmin } from "@/lib/auth";
import { listAdminSignups } from "@/lib/repository";
import { filterAdminSignups, parseAdminSignupFilters } from "@/lib/admin-signup-filters";

export async function GET(request: Request) {
  const session = await requireAdmin();
  const filters = parseAdminSignupFilters(new URL(request.url).searchParams);
  const signups = filterAdminSignups(await listAdminSignups(5000, session.allowedSports), filters);
  return new NextResponse(adminSignupsToCsv(signups), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=whs-signups.csv",
    },
  });
}
