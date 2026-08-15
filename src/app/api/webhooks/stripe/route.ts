import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { markBoosterPaymentFailed, markBoosterPaymentPaid } from "@/lib/repository";
import { constructStripeEvent } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ message: "Missing Stripe signature." }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = constructStripeEvent(await request.text(), signature);
  } catch {
    return NextResponse.json({ message: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    await markBoosterPaymentPaid({ sessionId: session.id, paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id, stripeAccountId: event.account });
  } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
    await markBoosterPaymentFailed((event.data.object as Stripe.Checkout.Session).id, event.account);
  }
  return NextResponse.json({ received: true });
}
