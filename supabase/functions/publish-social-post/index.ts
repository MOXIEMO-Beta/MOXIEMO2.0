import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    let {
      user_id,
      post_id,
      postId,
      connection_id,
      connectionId,
      platform,
      content,
    } = body ?? {};

    post_id = post_id ?? postId;
    connection_id = connection_id ?? connectionId;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve user via JWT if user_id wasn't sent (preferred path).
    if (!user_id) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const jwt = authHeader.replace(/^Bearer\s+/i, "");
      if (jwt) {
        const { data: u } = await supabase.auth.getUser(jwt);
        user_id = u?.user?.id;
      }
    }

    if (!user_id || !post_id) {
      return json({ error: "post_id and authenticated user required" }, 400);
    }

    // Load the post to derive platform + content if not provided.
    const { data: post, error: postErr } = await supabase
      .from("social_posts")
      .select("id, user_id, platforms, content_by_platform, media_urls")
      .eq("id", post_id)
      .eq("user_id", user_id)
      .maybeSingle();
    if (postErr || !post) return json({ error: "post_not_found" }, 404);

    if (!platform) {
      const raw = (post.platforms ?? [])[0] ?? "linkedin";
      platform = String(raw).toLowerCase() === "twitter" ? "x" : String(raw).toLowerCase();
    }
    if (!content) {
      const cbp = (post.content_by_platform ?? {}) as Record<string, string>;
      content = cbp[platform] ?? cbp[Object.keys(cbp)[0] ?? ""] ?? "";
    }
    if (!content) return json({ error: "post_has_no_content" }, 400);

    if (platform !== "linkedin") {
      return json({ error: `Direct publishing not yet supported for ${platform}` }, 400);
    }

    // Resolve destination connection.
    let connection: any = null;
    if (connection_id) {
      const { data, error } = await supabase
        .from("social_connections")
        .select("*")
        .eq("id", connection_id)
        .eq("user_id", user_id)
        .maybeSingle();
      if (error || !data) return json({ error: "connection_not_found" }, 404);
      connection = data;
    } else {
      const { data: connections, error: connsErr } = await supabase
        .from("social_connections")
        .select("*")
        .eq("user_id", user_id)
        .eq("platform", platform);
      if (connsErr) return json({ error: connsErr.message }, 500);
      if (!connections || connections.length === 0) {
        return json({ error: "no_connection" }, 400);
      }
      if (connections.length > 1) {
        return json({
          error: "multiple_destinations_available",
          connections: connections.map((c: any) => ({
            id: c.id,
            connection_type: c.connection_type,
            organization_name: c.organization_name,
            profile_name: c.profile_name,
          })),
        }, 409);
      }
      connection = connections[0];
    }

    if (!connection.access_token) {
      return json({ error: "LinkedIn auth missing — reconnect your account" }, 401);
    }

    // Build author URN based on connection type.
    let authorUrn: string;
    if (connection.connection_type === "company" && connection.organization_id) {
      authorUrn = `urn:li:organization:${connection.organization_id}`;
    } else {
      const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${connection.access_token}` },
      });
      if (!profileRes.ok) {
        const t = await profileRes.text();
        console.error("LinkedIn userinfo error", profileRes.status, t);
        return json({ error: "LinkedIn auth expired — reconnect your account" }, 401);
      }
      const profile = await profileRes.json();
      authorUrn = `urn:li:person:${profile.sub}`;
    }

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
      return json({ error: result?.message ?? `LinkedIn publish failed (${postRes.status})` }, 500);
    }

    // Merge platform_post_ids so we don't clobber prior successful destinations.
    const { data: existing } = await supabase
      .from("social_posts")
      .select("platform_post_ids")
      .eq("id", post_id)
      .maybeSingle();
    const prevIds = (existing?.platform_post_ids ?? {}) as Record<string, unknown>;
    const key = connection.connection_type === "company"
      ? `linkedin:org:${connection.organization_id}`
      : "linkedin";
    const nextIds = { ...prevIds, [key]: result.id };

    await supabase
      .from("social_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        platform_post_ids: nextIds,
      })
      .eq("id", post_id);

    return json({
      success: true,
      post_id: result.id,
      connection_id: connection.id,
      destination: connection.connection_type === "company"
        ? (connection.organization_name ?? "Company page")
        : (connection.profile_name ?? "Personal"),
    });
  } catch (err) {
    console.error("publish-social-post error", err);
    return json({ error: (err as Error).message }, 500);
  }
});