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
    const code = url.searchParams.get("code");
    const stateRaw = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return Response.redirect(appRedirect(`/app/social?error=${encodeURIComponent(error)}`), 302);
    }
    if (!code || !stateRaw) {
      return new Response("Missing code or state", { status: 400, headers: corsHeaders });
    }

    const state = JSON.parse(atob(stateRaw));
    const { platform, user_id } = state ?? {};
    if (!platform || !user_id) {
      return new Response("Invalid state", { status: 400, headers: corsHeaders });
    }

    // Exchange code for token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: Deno.env.get("LINKEDIN_REDIRECT_URI")!,
        client_id: Deno.env.get("LINKEDIN_CLIENT_ID")!,
        client_secret: Deno.env.get("LINKEDIN_CLIENT_SECRET")!,
      }),
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      console.error("LinkedIn token exchange failed", txt);
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

    const { error: upsertErr } = await supabase
      .from("social_connections")
      .upsert(
        {
          user_id,
          platform,
          access_token: token.access_token,
          refresh_token: token.refresh_token ?? null,
          expires_at: token.expires_in
            ? new Date(Date.now() + token.expires_in * 1000).toISOString()
            : null,
          profile_name: profile.name ?? profile.given_name ?? null,
          profile_image: profile.picture ?? null,
        },
        { onConflict: "user_id,platform" },
      );

    if (upsertErr) {
      console.error("upsert error", upsertErr);
      return Response.redirect(appRedirect(`/app/social?error=save_failed`), 302);
    }

    return Response.redirect(appRedirect(`/app/social?connected=${platform}`), 302);
  } catch (err) {
    console.error("social-oauth-callback error", err);
    return Response.redirect(appRedirect(`/app/social?error=callback_failed`), 302);
  }
});