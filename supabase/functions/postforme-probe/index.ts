// Admin-only Post for Me probe. Read-only: creates connect auth URLs and
// lists connected social accounts. No publishing.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PFM_BASE = "https://api.postforme.dev";

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("POST_FOR_ME_API_KEY");
    if (!apiKey) return json(500, { error: "POST_FOR_ME_API_KEY not configured" });

    // Real auth: verify caller JWT.
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader) return json(401, { error: "Unauthorized" });
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: serviceKey },
    });
    if (!userRes.ok) return json(401, { error: "Unauthorized" });
    const user = await userRes.json();
    const userId = user?.id;
    if (!userId) return json(401, { error: "Unauthorized" });

    // Real role check against profiles.is_admin (server-side).
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();
    if (profErr || !profile?.is_admin) return json(403, { error: "Forbidden" });

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    const pfmHeaders = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (action === "auth_url") {
      const platform = body?.platform as string | undefined;
      if (!platform) return json(400, { error: "platform required" });
      const payload: Record<string, unknown> = {
        platform,
        external_id: body?.external_id ?? `moxie-admin-${userId}`,
        permissions: body?.permissions ?? ["posts", "feeds"],
      };
      if (body?.redirect_url_override) payload.redirect_url_override = body.redirect_url_override;
      const r = await fetch(`${PFM_BASE}/v1/social-accounts/auth-url`, {
        method: "POST",
        headers: pfmHeaders,
        body: JSON.stringify(payload),
      });
      const text = await r.text();
      console.log("[postforme-probe] auth-url", platform, r.status, text);
      if (!r.ok) return json(r.status, { error: "auth_url_failed", status: r.status, body: text });
      return json(200, JSON.parse(text));
    }

    if (action === "list") {
      const r = await fetch(`${PFM_BASE}/v1/social-accounts?limit=100`, { headers: pfmHeaders });
      const text = await r.text();
      console.log("[postforme-probe] list", r.status, text);
      if (!r.ok) return json(r.status, { error: "list_failed", status: r.status, body: text });
      const parsed = JSON.parse(text);
      const rows = Array.isArray(parsed) ? parsed : parsed?.data ?? [];
      const summary = rows.map((a: any) => ({
        id: a.id,
        platform: a.platform,
        username: a.username ?? null,
        name: a.metadata?.name ?? a.metadata?.page_name ?? a.username ?? null,
        status: a.status,
        external_id: a.external_id ?? null,
        access_token_expires_at: a.access_token_expires_at ?? null,
      }));
      console.log("[postforme-probe] summary", JSON.stringify(summary, null, 2));
      return json(200, { count: summary.length, accounts: summary, raw: parsed });
    }

    if (action === "post") {
      const caption = (body?.caption as string | undefined) ?? "MOXIEMO integration test, please ignore";
      const socialAccounts = body?.social_accounts as string[] | undefined;
      const media = body?.media as Array<{ url: string }> | undefined;
      if (!Array.isArray(socialAccounts) || socialAccounts.length === 0) {
        return json(400, { error: "social_accounts required" });
      }
      const payload: Record<string, unknown> = {
        caption,
        social_accounts: socialAccounts,
      };
      if (media && media.length) payload.media = media;
      const r = await fetch(`${PFM_BASE}/v1/social-posts`, {
        method: "POST",
        headers: pfmHeaders,
        body: JSON.stringify(payload),
      });
      const text = await r.text();
      console.log("[postforme-probe] post", r.status, text);
      let parsed: unknown = text;
      try { parsed = JSON.parse(text); } catch { /* keep text */ }
      return json(r.ok ? 200 : r.status, { ok: r.ok, status: r.status, body: parsed });
    }

    if (action === "get_post") {
      const id = body?.id as string | undefined;
      if (!id) return json(400, { error: "id required" });
      const r = await fetch(`${PFM_BASE}/v1/social-posts/${encodeURIComponent(id)}`, { headers: pfmHeaders });
      const text = await r.text();
      console.log("[postforme-probe] get_post", id, r.status, text);
      let parsed: unknown = text;
      try { parsed = JSON.parse(text); } catch { /* keep text */ }
      if (r.status === 404) {
        const r2 = await fetch(`${PFM_BASE}/v1/social-posts?ids=${encodeURIComponent(id)}`, { headers: pfmHeaders });
        const text2 = await r2.text();
        console.log("[postforme-probe] get_post fallback", id, r2.status, text2);
        let parsed2: unknown = text2;
        try { parsed2 = JSON.parse(text2); } catch { /* keep text */ }
        return json(r2.ok ? 200 : r2.status, {
          ok: r2.ok,
          status: r2.status,
          body: parsed2,
          fallback: "list_by_ids",
          primary: { status: r.status, body: parsed },
        });
      }
      return json(r.ok ? 200 : r.status, { ok: r.ok, status: r.status, body: parsed });
    }

    return json(400, { error: "unknown action", allowed: ["auth_url", "list", "post", "get_post"] });
  } catch (err) {
    console.error("[postforme-probe] error", err);
    return json(500, { error: (err as Error).message });
  }
});