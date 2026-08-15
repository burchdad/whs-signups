import { redirect } from "next/navigation";
import { sendCancellationEmails } from "@/lib/email/service";
import { cancelSignupByToken, getCancellationByToken } from "@/lib/repository";
import { adminNotificationRecipientsForSport } from "@/lib/admin-access";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await getCancellationByToken(token);
  await cancelSignupByToken(token);
  if (found) await sendCancellationEmails({ ...found, notificationEmails: await adminNotificationRecipientsForSport(found.event.sport) });
  redirect("/events?cancelled=1");
}
