import { NextResponse } from "next/server";
import { sampleSignups, events } from "@/lib/demo-data";
import { signupsToCsv } from "@/lib/exports";

export function GET() {
  return new NextResponse(signupsToCsv(events, sampleSignups), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=whs-signups.csv",
    },
  });
}
