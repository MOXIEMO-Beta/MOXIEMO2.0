// Starts an OAuth flow for a social platform and redirects to the provider.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let platform: string | undefined;
    let user_id: string | undefined;

    if (req.method === "GET") {
      const u = new URL(req.url);
      platform = u.searchParams.get("platform") ?? undefined;
      user_id = u.searchParams.get("user_id") ?? undefined;
    } else {
      const body = await req.json().catch(() => ({}));
      platform = body.platform;
      user_id = body.user_id;
    }

    if (!platform || !user_id) {
      return new Response(
        JSON.stringify({ error: "platform and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (platform !== "linkedin") {
      return new Response(
        JSON.stringify({ error: `Platform '${platform}' is not yet supported` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const clientId = Deno.env.get("LINKEDIN_CLIENT_ID");
    const redirectUri = Deno.env.get("LINKEDIN_REDIRECT_URI")?.trim();

    if (!clientId || !redirectUri) {
      return new Response(
        JSON.stringify({ error: "LinkedIn OAuth is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const state = btoa(JSON.stringify({ platform, user_id }));
    const scope = "openid profile email w_member_social";
    const url =
      `https://www.linkedin.com/oauth/v2/authorization` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=${encodeURIComponent(scope)}`;

    // For GET requests, do a real browser redirect.
    if (req.method === "GET") {
      return Response.redirect(url, 302);
    }

    // For POST requests (from the app), return the URL so the client can navigate.
    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("social-oauth-start error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});