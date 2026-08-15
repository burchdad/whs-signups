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
  }, input.program.stripeAccountId ? { stripeAccount: input.program.stripeAccountId } : undefined);
  if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
  return { id: session.id, url: session.url };
}

export async function verifyConnectedStripeAccount(accountId: string) {
  if (!/^acct_[A-Za-z0-9]+$/.test(accountId)) throw new Error("Enter a valid Stripe account ID beginning with acct_.");
  const account = await stripeClient().accounts.retrieve(accountId);
  if (account.controller?.is_controller === false) throw new Error("That Stripe account is not connected to this platform.");
  return { id: account.id, chargesEnabled: account.charges_enabled, detailsSubmitted: account.details_submitted };
}

export function constructStripeEvent(body: string, signature: string) {
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter((secret): secret is string => Boolean(secret));
  if (secrets.length === 0) throw new Error("Stripe webhook verification is not configured.");
  for (const secret of secrets) {
    try { return stripeClient().webhooks.constructEvent(body, signature, secret); } catch { /* Try the other signed endpoint. */ }
  }
  throw new Error("Invalid Stripe signature.");
}
