import { redirect } from "next/navigation";
import { cancelSignupByToken } from "@/lib/repository";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await cancelSignupByToken(token);
  redirect("/events?cancelled=1");
}
