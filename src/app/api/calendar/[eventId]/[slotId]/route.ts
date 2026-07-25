import { NextResponse } from "next/server";
import { createIcs } from "@/lib/calendar";
import { listPublicEvents } from "@/lib/repository";

export async function GET(_: Request, { params }: { params: Promise<{ eventId: string; slotId: string }> }) {
  const { eventId, slotId } = await params;
  const event = (await listPublicEvents()).find((candidate) => candidate.id === eventId);
  const slot = event?.slots.find((candidate) => candidate.id === slotId);
  if (!event || !slot) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(createIcs(event, slot), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-${slot.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics"`,
    },
  });
}
