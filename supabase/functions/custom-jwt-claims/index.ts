import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const payload = await req.json();
  const userId = payload?.user_id;

  const claims: Record<string, unknown> = {};

  if (userId) {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, plan")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.is_admin) {
      claims.app_role = "admin";
    } else {
      claims.app_role = "member";
    }

    if (profile?.plan) {
      claims.plan = profile.plan;
    }
  }

  return new Response(JSON.stringify({ claims }), {
    headers: { "Content-Type": "application/json" },
  });
});
