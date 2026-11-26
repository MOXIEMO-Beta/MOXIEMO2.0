import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Price IDs — set these in Supabase secrets or hardcode after creating in Stripe dashboard
const PRICE_IDS: Record<string, string> = {
  foundation:      Deno.env.get("STRIPE_PRICE_FOUNDATION")      ?? "",
  growth:          Deno.env.get("STRIPE_PRICE_GROWTH")           ?? "",
  scale:           Deno.env.get("STRIPE_PRICE_SCALE")            ?? "",
  founding_annual: Deno.env.get("STRIPE_PRICE_FOUNDING_ANNUAL")  ?? "",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { plan, coupon_code } = await req.json().catch(() => ({}));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve user from JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Not authenticated" }, 401);

    const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt);
    if (authErr || !user) return json({ error: "Not authenticated" }, 401);

    const priceId = PRICE_IDS[plan];
    if (!priceId) return json({ error: `Unknown plan: ${plan}` }, 400);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-04-10",
    });

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, full_name")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("profiles").update({ stripe_customer_id: customerId } as any).eq("id", user.id);
    }

    const appUrl = Deno.env.get("APP_URL") ?? "https://app.buildwithmoxiemo.com";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/app/settings?upgraded=1`,
      cancel_url:  `${appUrl}/pricing`,
      metadata: { supabase_user_id: user.id, plan },
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan },
      },
    };

    if (coupon_code) {
      // Founding coupon — price locked for life
      const promos = await stripe.promotionCodes.list({ code: coupon_code, active: true, limit: 1 });
      if (promos.data.length > 0) {
        sessionParams.discounts = [{ promotion_code: promos.data[0].id }];
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return json({ url: session.url });

  } catch (err) {
    console.error("stripe-checkout error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
