import { NextResponse } from "next/server";
import { adminSignupsToCsv } from "@/lib/exports";
import { requireAdmin } from "@/lib/auth";
import { listAdminSignups } from "@/lib/repository";

export async function GET() {
  await requireAdmin();
  return new NextResponse(adminSignupsToCsv(await listAdminSignups(5000)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=whs-signups.csv",
    },
  });
}
