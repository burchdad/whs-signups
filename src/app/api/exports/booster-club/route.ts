import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { boosterClubToCsv } from "@/lib/exports";
import { listBoosterClubSignups } from "@/lib/repository";

export async function GET() {
  await requireAdmin();
  return new NextResponse(boosterClubToCsv(await listBoosterClubSignups(5000)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=whs-booster-club.csv",
    },
  });
}
