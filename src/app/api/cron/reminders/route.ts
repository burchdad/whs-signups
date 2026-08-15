import { NextRequest, NextResponse } from "next/server";
import { sendVolunteerReminder } from "@/lib/email/service";
import { listVolunteerReminders, recordEmailDelivery } from "@/lib/repository";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reminders = await listVolunteerReminders();
  let sent = 0;
  let failed = 0;
  for (const reminder of reminders) {
    const result = await sendVolunteerReminder(reminder);
    const status = result.status === "sent" ? "sent" : result.status === "queued" ? "queued" : "failed";
    await recordEmailDelivery({
      signupId: reminder.signup.id,
      recipient: reminder.signup.email.toLowerCase(),
      template: "volunteer_reminder",
      status,
      provider: result.provider,
      providerId: "id" in result ? result.id : undefined,
    });
    if (status === "sent") sent += 1;
    if (status === "failed") failed += 1;
  }
  return NextResponse.json({ processed: reminders.length, sent, failed });
}
