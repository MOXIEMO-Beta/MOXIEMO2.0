import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

// Raw body needed for Stripe signature verification — no CORS headers.
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-04-10",
  });

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const signature = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Bad signature", { status: 400 });
  }

  // Idempotency: skip if we already processed this event.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { error: dedupError } = await supabase.from("webhook_events").insert({
    id:          event.id,
    provider:    "stripe",
    event_type:  event.type,
    payload:     event as unknown as Record<string, unknown>,
  });
  if (dedupError?.code === "23505") {
    // Duplicate — Stripe is retrying an already-processed event.
    return new Response("ok", { status: 200 });
  }

  function planFromMetadata(metadata: Stripe.Metadata): string {
    const p = metadata?.plan ?? "";
    return ["foundation", "growth", "scale", "founding_annual"].includes(p) ? p : "foundation";
  }

  // Write to both profiles (legacy) and accounts (MOX2-3 source of truth).
  // accounts is keyed on stripe_customer_id via profiles.stripe_customer_id join.
  async function syncBilling(
    customerId: string,
    patch: {
      plan?: string;
      stripe_subscription_id?: string | null;
      subscription_status: string;
      current_period_end?: string | null;
    },
  ) {
    // Build account patch before firing both updates in parallel.
    const accountPatch: Record<string, unknown> = {
      subscription_status: patch.subscription_status,
    };
    if (patch.stripe_subscription_id !== undefined) {
      accountPatch.stripe_subscription_id = patch.stripe_subscription_id;
    }
    if (patch.plan) accountPatch.plan = patch.plan;
    if (patch.current_period_end !== undefined) {
      accountPatch.current_period_end = patch.current_period_end;
    }

    // profiles and accounts are independent writes — run in parallel.
    await Promise.all([
      supabase
        .from("profiles")
        .update(patch as Record<string, unknown>)
        .eq("stripe_customer_id", customerId),
      supabase
        .from("accounts")
        .update(accountPatch)
        .eq("stripe_customer_id", customerId),
    ]);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId  = session.metadata?.supabase_user_id;
        const plan    = session.metadata?.plan ?? "foundation";
        const subId   = typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as Stripe.Subscription | null)?.id ?? null;
        const customerId = typeof session.customer === "string"
          ? session.customer
          : (session.customer as Stripe.Customer | null)?.id ?? null;

        if (userId) {
          // profiles + accounts are independent writes — run in parallel.
          await Promise.all([
            supabase.from("profiles").update({
              plan,
              stripe_customer_id:     customerId,
              stripe_subscription_id: subId,
              subscription_status:    "active",
            } as Record<string, unknown>).eq("id", userId),
            customerId
              ? supabase.from("accounts").update({
                  stripe_customer_id:     customerId,
                  stripe_subscription_id: subId,
                  subscription_status:    "active",
                  plan,
                }).eq("owner_id", userId)
              : Promise.resolve(),
          ]);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await syncBilling(sub.customer as string, {
          plan:                   planFromMetadata(sub.metadata),
          stripe_subscription_id: sub.id,
          subscription_status:    sub.status,
          current_period_end:     new Date(sub.current_period_end * 1000).toISOString(),
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncBilling(sub.customer as string, {
          plan:                   "founding_member",
          stripe_subscription_id: null,
          subscription_status:    "canceled",
          current_period_end:     new Date(sub.current_period_end * 1000).toISOString(),
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await syncBilling(invoice.customer as string, {
          subscription_status: "past_due",
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await syncBilling(invoice.customer as string, {
          subscription_status: "active",
        });
        break;
      }

      default:
        // Log unhandled types — do not error; return 200 so Stripe stops retrying.
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`stripe-webhook error on ${event.type}:`, err);
    // Update webhook_events with the error so it's visible in the DB.
    await supabase
      .from("webhook_events")
      .update({ error: String(err) })
      .eq("id", event.id);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
