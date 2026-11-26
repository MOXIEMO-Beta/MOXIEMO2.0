import { createClient } from "npm:@supabase/supabase-js@2";

const VALID_PLANS = ["founding_member", "pro", "enterprise"];

Deno.serve(async (req) => {
  try {
    const hookSecret = Deno.env.get("HOOK_JWT_CLAIMS_SECRET") ?? "";
    if (hookSecret) {
      const authHeader = req.headers.get("authorization") ?? "";
      // Supabase sends the full secret as Bearer token
      if (authHeader !== `Bearer ${hookSecret}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const payload = await req.json();
    const userId = payload?.user_id;

    const claims: Record<string, unknown> = { app_role: "member" };

    if (userId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_admin, plan")
        .eq("id", userId)
        .maybeSingle();

      if (!error && profile) {
        claims.app_role = profile.is_admin === true ? "admin" : "member";
        if (profile.plan && VALID_PLANS.includes(profile.plan)) {
          claims.plan = profile.plan;
        }
      }
    }

    return new Response(JSON.stringify({ claims }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ claims: { app_role: "member" } }), {
      headers: { "Content-Type": "application/json" },
    });
  }
});
