import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminEvent } from "@/lib/repository";
import { sportsOffered } from "@/lib/sports";

type ImportedRow = { date?: string; opponent?: string; title?: string; location?: string; eventType?: string; isHome?: boolean; schedule?: Array<{ label: string; time: string }>; notes?: string };

export async function POST(request: Request) {
  const session = await requireAdmin();
  const body = await request.json() as { sport?: string; templateId?: string; rows?: ImportedRow[] };
  if (!sportsOffered.includes(body.sport as (typeof sportsOffered)[number])) return NextResponse.json({ message: "Choose a valid sport." }, { status: 400 });
  const rows = (body.rows ?? []).filter((row) => row.isHome && row.date && row.title).slice(0, 500);
  let created = 0; let skipped = 0;
  for (const row of rows) {
    const firstTime = row.schedule?.[0]?.time ?? "17:00";
    try {
      await createAdminEvent({ title: row.title!, sport: body.sport!, opponent: row.opponent, eventDate: row.date!, startsAt: centralIso(row.date!, firstTime), location: row.location || "Whitehouse High School", description: row.notes, contactEmail: session.user.email, templateId: body.templateId || undefined, schedule: row.schedule?.map((item) => ({ label: item.label, startsAt: centralIso(row.date!, item.time) })) });
      created += 1;
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") skipped += 1;
      else throw error;
    }
  }
  return NextResponse.json({ ok: true, created, skipped });
}

function centralIso(date: string, time: string) {
  const desired = Date.parse(`${date}T${time}:00Z`);
  let guess = desired;
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).map((part) => [part.type, part.value]));
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
    guess += desired - represented;
  }
  return new Date(guess).toISOString();
}
