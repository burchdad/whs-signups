import { redirect } from "next/navigation";
import { sendCancellationEmails, sendSignupEmails } from "@/lib/email/service";
import { cancelSignupByToken, getCancellationByToken, getSignupContextById } from "@/lib/repository";
import { adminNotificationRecipientsForSport } from "@/lib/admin-access";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await getCancellationByToken(token);
  const result = await cancelSignupByToken(token);
  if (found) await sendCancellationEmails({ ...found, notificationEmails: await adminNotificationRecipientsForSport(found.event.sport) });
  if ("promoted" in result && result.promoted) {
    const promoted = await getSignupContextById(result.promoted.signup.id);
    if (promoted) await sendSignupEmails({ signup: result.promoted.signup, event: promoted.event, slot: promoted.slot, cancellationToken: result.promoted.cancellationToken, notificationEmails: await adminNotificationRecipientsForSport(promoted.event.sport) });
  }
  redirect("/events?cancelled=1");
}
