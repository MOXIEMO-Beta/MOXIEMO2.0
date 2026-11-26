// Zernio connection manager for all social platforms + SMS.
// Replaces postforme-connect for Meta (FB/IG) and adds X, LinkedIn, SMS.
//
// Actions:
//   auth_url   – initiate OAuth via Zernio, returns { url }
//   sync       – pull connected Zernio accounts and upsert into social_connections
//   disconnect – revoke from Zernio and delete the local row
//
// Supported platforms: linkedin | instagram | facebook | x | sms
// SMS uses Zernio's telephony API (buy/port a number, then enable SMS/WhatsApp).
//
// Env vars required:
//   ZERNIO_API_KEY          – Bearer token for Zernio REST API
//   SUPABASE_URL
//   SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY
//   APP_URL                 – e.g. https://app.buildwithmoxiemo.com (for OAuth redirect)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZERNIO_BASE = "https://zernio.com/api/v1";

// Map MOXIEMO platform names to Zernio's platform slugs
const PLATFORM_MAP: Record<string, string> = {
  linkedin: "linkedin",
  instagram: "instagram",
  facebook: "facebook",
  x: "twitter",
  twitter: "twitter",
  sms: "sms",
};

const SUPPORTED = new Set(Object.keys(PLATFORM_MAP));

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function zernioHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

// Extract profile name from a Zernio account object
function profileName(a: any): string | null {
  return (
    a.metadata?.name ??
    a.metadata?.page_name ??
    a.metadata?.username ??
    a.username ??
    a.display_name ??
    null
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const apiKey = Deno.env.get("ZERNIO_API_KEY");
    if (!apiKey) return json(500, { error: "ZERNIO_API_KEY not configured" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const appUrl = Deno.env.get("APP_URL") ?? "https://app.buildwithmoxiemo.com";

    const authHeader = req.headers.get("authorization") ?? "";
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
    const platform = String(body?.platform ?? "").toLowerCase();
    const zh = zernioHeaders(apiKey);

    // ── auth_url ──────────────────────────────────────────────────────────────
    if (action === "auth_url") {
      if (!SUPPORTED.has(platform)) {
        return json(400, { error: `unsupported_platform: ${platform}` });
      }

      if (platform === "sms") {
        // SMS is not OAuth — user buys/ports a number in Settings.
        // Return a URL to the SMS setup flow inside MOXIEMO.
        return json(200, { url: `${appUrl}/app/settings?tab=sms`, sms: true });
      }

      const zernioPlatform = PLATFORM_MAP[platform];
      const redirectUri = `${appUrl}/app/social?connected=${platform}`;

      const r = await fetch(`${ZERNIO_BASE}/connect/${zernioPlatform}/authorize`, {
        method: "POST",
        headers: zh,
        body: JSON.stringify({
          redirect_uri: redirectUri,
          // Pass user-scoped metadata so we can match accounts on sync
          state: btoa(JSON.stringify({ user_id: userId, platform })),
        }),
      });

      const text = await r.text();
      console.log("[zernio-connect] auth_url", platform, r.status, text);
      if (!r.ok) return json(r.status, { error: `Zernio auth_url failed (${r.status})`, detail: text });

      let parsed: any = {};
      try { parsed = JSON.parse(text); } catch { /* ignore */ }

      const url = parsed?.url ?? parsed?.auth_url ?? parsed?.authorization_url;
      if (!url) return json(500, { error: "No auth URL returned from Zernio" });

      return json(200, { url });
    }

    // ── sync ──────────────────────────────────────────────────────────────────
    if (action === "sync") {
      // Fetch all accounts from Zernio, filter to those tagged with this user's
      // metadata, and upsert into social_connections.
      const r = await fetch(`${ZERNIO_BASE}/accounts?limit=100`, { headers: zh });
      const text = await r.text();
      if (!r.ok) return json(r.status, { error: `Zernio accounts fetch failed (${r.status})` });

      const parsed = JSON.parse(text);
      const rows: any[] = Array.isArray(parsed) ? parsed : parsed?.data ?? [];

      // Filter: Zernio accounts whose metadata.moxie_user_id matches this user
      const mine = rows.filter((a: any) => a.metadata?.moxie_user_id === userId);
      const upserted: Array<{ platform: string; profile_name: string | null }> = [];

      for (const a of mine) {
        const zernioPlatform = String(a.platform ?? "").toLowerCase();
        // Reverse-map from Zernio slug to MOXIEMO name
        const moxiePlatform = zernioPlatform === "twitter" ? "x" : zernioPlatform;
        if (!SUPPORTED.has(moxiePlatform)) continue;

        const pName = profileName(a);
        const externalId = String(a.id ?? "");

        const { data: existing } = await admin
          .from("social_connections")
          .select("id")
          .eq("user_id", userId)
          .eq("platform", moxiePlatform)
          .eq("connection_type", "personal")
          .maybeSingle();

        const row = {
          user_id: userId,
          platform: moxiePlatform,
          connection_type: "personal",
          organization_id: a.metadata?.organization_id ?? null,
          organization_name: a.metadata?.organization_name ?? null,
          external_provider: "zernio",
          external_account_id: externalId,
          profile_name: pName,
          profile_image: a.metadata?.picture ?? a.avatar_url ?? null,
          access_token: null, // Zernio holds the token server-side
          refresh_token: null,
          expires_at: a.token_expires_at ?? null,
          reminder_sent_at: null,
        };

        if (existing?.id) {
          await admin.from("social_connections").update(row).eq("id", existing.id);
        } else {
          await admin.from("social_connections").insert(row);
        }
        upserted.push({ platform: moxiePlatform, profile_name: pName });
      }

      return json(200, { count: upserted.length, accounts: upserted });
    }

    // ── disconnect ────────────────────────────────────────────────────────────
    if (action === "disconnect") {
      if (!SUPPORTED.has(platform)) {
        return json(400, { error: `unsupported_platform: ${platform}` });
      }

      const { data: conn } = await admin
        .from("social_connections")
        .select("id, external_account_id, external_provider")
        .eq("user_id", userId)
        .eq("platform", platform)
        .eq("connection_type", "personal")
        .maybeSingle();

      if (!conn) return json(200, { ok: true, already_disconnected: true });

      // Revoke from Zernio if we have the account ID
      if (conn.external_provider === "zernio" && conn.external_account_id) {
        const r = await fetch(
          `${ZERNIO_BASE}/accounts/${encodeURIComponent(conn.external_account_id)}`,
          { method: "DELETE", headers: zh },
        );
        if (!r.ok && r.status !== 404) {
          console.warn("[zernio-connect] delete failed", r.status);
        }
      }

      await admin.from("social_connections").delete().eq("id", conn.id);
      return json(200, { ok: true });
    }

    // ── sms_buy_number ────────────────────────────────────────────────────────
    // Buy a Zernio phone number for the user (US 10DLC for Twilio-equivalent SMS).
    if (action === "sms_buy_number") {
      const areaCode = String(body?.area_code ?? "");
      const r = await fetch(`${ZERNIO_BASE}/phone-numbers`, {
        method: "POST",
        headers: zh,
        body: JSON.stringify({
          area_code: areaCode || undefined,
          capabilities: ["sms", "voice"],
          metadata: { moxie_user_id: userId },
        }),
      });
      const text = await r.text();
      if (!r.ok) return json(r.status, { error: `Could not provision number (${r.status})`, detail: text });
      let parsed: any = {};
      try { parsed = JSON.parse(text); } catch { /* ignore */ }

      // Store phone number in social_connections as "sms" platform
      const phoneNumber = parsed?.phone_number ?? parsed?.number;
      if (phoneNumber) {
        await admin.from("social_connections").upsert({
          user_id: userId,
          platform: "sms",
          connection_type: "personal",
          external_provider: "zernio",
          external_account_id: parsed.id,
          profile_name: phoneNumber,
          access_token: null,
          refresh_token: null,
        }, { onConflict: "user_id,platform,connection_type" });
      }

      return json(200, { ok: true, phone_number: phoneNumber, number_id: parsed.id });
    }

    return json(400, { error: "unknown_action" });
  } catch (err) {
    console.error("[zernio-connect] error", err);
    return json(500, { error: (err as Error).message });
  }
});
