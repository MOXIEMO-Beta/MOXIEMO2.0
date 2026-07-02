import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function appRedirect(path: string): string {
  // Prefer an explicit app URL if provided; fall back to the Lovable-published URL.
  const explicit = Deno.env.get("APP_URL");
  if (explicit) return `${explicit.replace(/\/$/, "")}${path}`;
  return `https://moxie-grow-platform.lovable.app${path}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const isPost = req.method === "POST";
    let code: string | null = null;
    let stateRaw: string | null = null;
    let error: string | null = null;

    if (isPost) {
      const body = await req.json().catch(() => ({}));
      code = body.code ?? null;
      stateRaw = body.state ?? null;
      error = body.error ?? null;
    } else {
      code = url.searchParams.get("code");
      stateRaw = url.searchParams.get("state");
      error = url.searchParams.get("error");
    }

    const jsonResp = (status: number, payload: Record<string, unknown>) =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    if (error) {
      if (isPost) return jsonResp(400, { ok: false, error });
      return Response.redirect(appRedirect(`/app/social?error=${encodeURIComponent(error)}`), 302);
    }
    if (!code || !stateRaw) {
      if (isPost) return jsonResp(400, { ok: false, error: "missing_code_or_state" });
      return new Response("Missing code or state", { status: 400, headers: corsHeaders });
    }

    const state = JSON.parse(atob(stateRaw));
    const { platform, user_id: stateUserId, redirect_uri: stateRedirectUri } = state ?? {};
    if (!platform) {
      if (isPost) return jsonResp(400, { ok: false, error: "invalid_state" });
      return new Response("Invalid state", { status: 400, headers: corsHeaders });
    }

    // Derive the MOXIEMO user from the caller's JWT (never trust the state
    // param). Fall back to the state's user_id only for the legacy GET-redirect
    // path where LinkedIn calls the function directly with no auth header.
    const authHeader = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;
    if (authHeader) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: userData } = await userClient.auth.getUser();
      userId = userData.user?.id ?? null;
    }
    if (!userId) userId = stateUserId ?? null;
    if (!userId) {
      if (isPost) return jsonResp(401, { ok: false, error: "unauthorized" });
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const redirectUri = (stateRedirectUri ?? Deno.env.get("LINKEDIN_REDIRECT_URI") ?? "").trim();

    // Exchange code for token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: Deno.env.get("LINKEDIN_CLIENT_ID")!,
        client_secret: Deno.env.get("LINKEDIN_CLIENT_SECRET")!,
      }),
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      console.error("LinkedIn token exchange failed", txt);
      if (isPost) return jsonResp(400, { ok: false, error: "token_exchange_failed" });
      return Response.redirect(appRedirect(`/app/social?error=token_exchange_failed`), 302);
    }
    const token = await tokenRes.json();

    // Get LinkedIn profile
    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const profile = profileRes.ok ? await profileRes.json() : {};

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // The unique index on social_connections is an expression index
    // (user_id, platform, connection_type, COALESCE(organization_id,'')),
    // which onConflict column-lists can't target. Do select-then-update/insert.
    const row = {
      user_id: userId,
      platform,
      connection_type: "personal" as const,
      organization_id: null as string | null,
      access_token: token.access_token,
      refresh_token: token.refresh_token ?? null,
      expires_at: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
      profile_name: profile.name ?? profile.given_name ?? null,
      profile_image: profile.picture ?? null,
      reminder_sent_at: null,
    };

    const { data: existing, error: selErr } = await supabase
      .from("social_connections")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", platform)
      .eq("connection_type", "personal")
      .is("organization_id", null)
      .maybeSingle();

    let upsertErr: { message?: string } | null = selErr ?? null;
    if (!upsertErr) {
      if (existing?.id) {
        const { error } = await supabase
          .from("social_connections")
          .update(row)
          .eq("id", existing.id);
        upsertErr = error ?? null;
      } else {
        const { error } = await supabase.from("social_connections").insert(row);
        upsertErr = error ?? null;
      }
    }

    if (upsertErr) {
      console.error("save error", upsertErr);
      const detail = upsertErr.message ?? "save_failed";
      if (isPost) return jsonResp(500, { ok: false, error: "save_failed", detail });
      return Response.redirect(
        appRedirect(`/app/social?error=save_failed&detail=${encodeURIComponent(detail)}`),
        302,
      );
    }

    if (isPost) return jsonResp(200, { ok: true, platform });
    return Response.redirect(appRedirect(`/app/social?connected=${platform}`), 302);
  } catch (err) {
    console.error("social-oauth-callback error", err);
    if (req.method === "POST") {
      return new Response(JSON.stringify({ ok: false, error: "callback_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return Response.redirect(appRedirect(`/app/social?error=callback_failed`), 302);
  }
});