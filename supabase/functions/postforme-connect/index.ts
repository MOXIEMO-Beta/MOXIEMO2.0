// Server-side Post for Me connection manager for the signed-in user.
// Actions:
//   auth_url    -> POST /v1/social-accounts/auth-url, returns redirect URL
//   sync        -> GET /v1/social-accounts and upserts spc_ ids into
//                  public.social_connections scoped to the caller
//   disconnect  -> DELETE /v1/social-accounts/{id} then delete the row
// Every call is authenticated with the caller JWT; spc_ ids are always
// filtered by the app-owned external_id so a user only ever sees their own.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PFM_BASE = "https://api.postforme.dev";
const PROVIDER = "postforme";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function externalIdFor(userId: string) {
  return `moxie-user-${userId}`;
}

function humanPfmError(text: string): string {
  const lower = text.toLowerCase();
  // Try to pull the real message field out of the PFM error body so the UI can
  // show what Post for Me actually said instead of a generic fallback.
  let pfmMessage = "";
  try {
    const parsed = JSON.parse(text);
    pfmMessage = String(parsed?.message ?? parsed?.error ?? "").trim();
  } catch { /* not JSON */ }
  if (
    lower.includes("instagram_business_account") ||
    lower.includes("professional") ||
    lower.includes("not a business")
  ) {
    return "This Instagram account is not a Business or Creator account linked to a Facebook Page. Convert it to a Professional account in the Instagram app and link a Facebook Page you administer, then try again.";
  }
  if (lower.includes("page") && lower.includes("permission")) {
    return "We could not access a Facebook Page you administer. Make sure the account you connected has admin rights on a Facebook Page.";
  }
  if (pfmMessage) return pfmMessage;
  return "Post for Me could not complete the connection. Please try again.";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("POST_FOR_ME_API_KEY");
    if (!apiKey) return json(500, { error: "POST_FOR_ME_API_KEY not configured" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader) return json(401, { error: "unauthorized" });
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return json(401, { error: "unauthorized" });

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");

    const pfmHeaders = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (action === "auth_url") {
      const platform = String(body?.platform ?? "");
      if (!["facebook", "instagram"].includes(platform)) {
        return json(400, { error: "unsupported_platform" });
      }
      const payload: Record<string, unknown> = {
        platform,
        external_id: externalIdFor(userId),
        permissions: ["posts"],
      };
      // Post for Me requires connection_type inside platform_data.instagram.
      // We want Business or Creator Instagram accounts linked to a Facebook
      // Page, which uses the "facebook" connection type. Facebook itself does
      // not need the field.
      if (platform === "instagram") {
        payload.platform_data = {
          instagram: { connection_type: "facebook" },
        };
      }
      // Do NOT pass redirect_url_override. Post for Me interprets this as the
      // Meta OAuth redirect_uri, which must remain the Post for Me hosted
      // callback (app.postforme.dev/callback/proj_.../<platform>/account).
      // The final bounce back into MOXIEMO is configured on the Post for Me
      // project itself.
      const serializedPayload = JSON.stringify(payload);
      console.log(
        "[postforme-connect] auth_url outbound serialized request",
        JSON.stringify({
          platform,
          url: `${PFM_BASE}/v1/social-accounts/auth-url`,
          body: serializedPayload,
          connection_type: (payload.platform_data as any)?.instagram?.connection_type ?? null,
          has_connection_type_facebook: serializedPayload.includes('"connection_type":"facebook"'),
        }),
      );
      const r = await fetch(`${PFM_BASE}/v1/social-accounts/auth-url`, {
        method: "POST",
        headers: pfmHeaders,
        body: serializedPayload,
      });
      const text = await r.text();
      console.log(
        "[postforme-connect] auth_url response",
        JSON.stringify({ platform, status: r.status, body: text }),
      );
      if (!r.ok) {
        console.error("[postforme-connect] auth_url failed", r.status, text);
        return json(r.status, { error: humanPfmError(text), pfm_status: r.status, pfm_body: text });
      }
      let parsed: any = {};
      try { parsed = JSON.parse(text); } catch { /* ignore */ }
      const url = parsed?.url ?? parsed?.auth_url ?? parsed?.data?.url;
      if (!url) return json(500, { error: "auth_url_missing" });
      try {
        const host = new URL(url).host;
        console.log("[postforme-connect] auth_url host", host, "platform", platform);
      } catch { /* ignore */ }
      return json(200, { url });

    }

    if (action === "sync") {
      // Pull every account and keep only rows whose external_id matches the
      // caller. Never store or return anything scoped to another user.
      const r = await fetch(`${PFM_BASE}/v1/social-accounts?limit=100`, { headers: pfmHeaders });
      const text = await r.text();
      if (!r.ok) {
        console.error("[postforme-connect] sync list failed", r.status, text);
        return json(r.status, { error: humanPfmError(text) });
      }
      const parsed = JSON.parse(text);
      const rows: any[] = Array.isArray(parsed) ? parsed : parsed?.data ?? [];
      const mine = rows.filter((a) => a.external_id === externalIdFor(userId));
      const upserted: Array<{ platform: string; profile_name: string | null; external_account_id: string }> = [];

      for (const a of mine) {
        const platform = String(a.platform ?? "").toLowerCase();
        if (!["facebook", "instagram"].includes(platform)) continue;
        const spcId = String(a.id ?? "");
        if (!spcId.startsWith("spc_")) continue;
        const profileName = a.metadata?.name ?? a.metadata?.page_name ?? a.username ?? null;

        // (user_id, platform) is unique when connection_type = 'personal', so
        // select-then-insert/update.
        const { data: existing } = await admin
          .from("social_connections")
          .select("id")
          .eq("user_id", userId)
          .eq("platform", platform)
          .eq("connection_type", "personal")
          .maybeSingle();
        const row = {
          user_id: userId,
          platform,
          connection_type: "personal",
          organization_id: null,
          external_provider: PROVIDER,
          external_account_id: spcId,
          profile_name: profileName,
          profile_image: a.metadata?.picture ?? null,
          access_token: null,
          refresh_token: null,
          expires_at: a.access_token_expires_at ?? null,
          reminder_sent_at: null,
        };
        if (existing?.id) {
          await admin.from("social_connections").update(row).eq("id", existing.id);
        } else {
          await admin.from("social_connections").insert(row);
        }
        upserted.push({ platform, profile_name: profileName, external_account_id: spcId });
      }
      return json(200, { count: upserted.length, accounts: upserted });
    }

    if (action === "disconnect") {
      const platform = String(body?.platform ?? "");
      if (!["facebook", "instagram"].includes(platform)) {
        return json(400, { error: "unsupported_platform" });
      }
      const { data: conn } = await admin
        .from("social_connections")
        .select("id, external_account_id, external_provider")
        .eq("user_id", userId)
        .eq("platform", platform)
        .eq("connection_type", "personal")
        .maybeSingle();
      if (!conn) return json(200, { ok: true, already_disconnected: true });

      if (conn.external_provider === PROVIDER && conn.external_account_id) {
        const r = await fetch(
          `${PFM_BASE}/v1/social-accounts/${encodeURIComponent(conn.external_account_id)}`,
          { method: "DELETE", headers: pfmHeaders },
        );
        if (!r.ok && r.status !== 404) {
          const text = await r.text();
          console.warn("[postforme-connect] pfm delete failed", r.status, text);
        }
      }
      await admin.from("social_connections").delete().eq("id", conn.id);
      return json(200, { ok: true });
    }

    return json(400, { error: "unknown_action" });
  } catch (err) {
    console.error("[postforme-connect] error", err);
    return json(500, { error: (err as Error).message });
  }
});