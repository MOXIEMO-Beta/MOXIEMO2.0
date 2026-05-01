import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_id, post_id, platform, content } = await req.json();
    if (!user_id || !post_id || !platform || !content) {
      return new Response(
        JSON.stringify({ error: "user_id, post_id, platform, content required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (platform !== "linkedin") {
      return new Response(
        JSON.stringify({ error: `Direct publishing not yet supported for ${platform}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: connection, error: connErr } = await supabase
      .from("social_connections")
      .select("access_token, profile_url")
      .eq("user_id", user_id)
      .eq("platform", "linkedin")
      .maybeSingle();

    if (connErr || !connection?.access_token) {
      return new Response(JSON.stringify({ error: "LinkedIn not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${connection.access_token}` },
    });
    if (!profileRes.ok) {
      const t = await profileRes.text();
      console.error("LinkedIn userinfo error", profileRes.status, t);
      return new Response(JSON.stringify({ error: "LinkedIn auth expired — reconnect your account" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const profile = await profileRes.json();
    const authorUrn = `urn:li:person:${profile.sub}`;

    const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: content },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });

    const result = await postRes.json().catch(() => ({}));
    if (!postRes.ok) {
      console.error("LinkedIn publish error", postRes.status, result);
      return new Response(
        JSON.stringify({ error: result?.message ?? `LinkedIn publish failed (${postRes.status})` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await supabase
      .from("social_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        platform_post_ids: { linkedin: result.id },
      })
      .eq("id", post_id);

    return new Response(JSON.stringify({ success: true, post_id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("publish-social-post error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});