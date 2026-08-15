import Stripe from "stripe";
import { appUrl } from "./utils";
import type { BoosterProgram } from "./types";

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function stripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Stripe Checkout is not configured.");
  return new Stripe(secret);
}

export async function createBoosterCheckout(input: { signupId: string; program: BoosterProgram; email: string; name: string }) {
  const stripe = stripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    client_reference_id: input.signupId,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: input.program.membershipFeeCents,
        product_data: { name: `${input.program.name} membership`, description: `Booster Club signup for ${input.name}` },
      },
    }],
    metadata: { boosterSignupId: input.signupId, programId: input.program.id, programName: input.program.name },
    payment_intent_data: { metadata: { boosterSignupId: input.signupId, programId: input.program.id } },
    success_url: appUrl(`/booster-club/success?session_id={CHECKOUT_SESSION_ID}`),
    cancel_url: appUrl("/booster-club?checkout=cancelled"),
  });
  if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
  return { id: session.id, url: session.url };
}

export function constructStripeEvent(body: string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Stripe webhook verification is not configured.");
  return stripeClient().webhooks.constructEvent(body, signature, secret);
}
