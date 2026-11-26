// Zernio webhook receiver.
// Verifies HMAC-SHA256 signature (X-Zernio-Signature header) then handles:
//   post.published         – mark social_post as published
//   post.failed            – mark social_post as failed
//   post.partial           – mark social_post as partial (some platforms succeeded)
//   account.connected      – upsert social_connections row
//   account.disconnected   – delete social_connections row
//
// Env vars required:
//   ZERNIO_WEBHOOK_SECRET  – from Zernio dashboard webhook settings
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function verifySignature(req: Request, rawBody: string): Promise<boolean> {
  const secret = Deno.env.get("ZERNIO_WEBHOOK_SECRET");
  if (!secret) return true; // skip verification when not configured (dev only)

  const sig = req.headers.get("x-zernio-signature") ?? "";
  if (!sig) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const rawBody = await req.text();

  if (!(await verifySignature(req, rawBody))) {
    console.warn("[zernio-webhook] signature mismatch");
    return json(401, { error: "invalid_signature" });
  }

  let event: any;
  try { event = JSON.parse(rawBody); } catch {
    return json(400, { error: "invalid_json" });
  }

  const eventType: string = req.headers.get("x-zernio-event") ?? event?.type ?? "";
  const eventId: string = req.headers.get("x-zernio-event-id") ?? event?.id ?? "";

  console.log("[zernio-webhook]", eventType, eventId);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ── post.published ──────────────────────────────────────────────────────────
  if (eventType === "post.published" || eventType === "post.platform.published") {
    const externalPostId = event?.data?.id ?? event?.post_id;
    const zernioPlatform = String(event?.data?.platform ?? event?.platform ?? "").toLowerCase();
    const publishedAt = event?.data?.published_at ?? new Date().toISOString();

    if (!externalPostId) return json(200, { ok: true });

    // Find the social_post by zernio_post_id stored in platform_post_ids
    const { data: posts } = await admin
      .from("social_posts")
      .select("id, platform_post_ids")
      .contains("platform_post_ids", { zernio_post_id: externalPostId });

    for (const post of posts ?? []) {
      const prevIds = (post.platform_post_ids ?? {}) as Record<string, unknown>;
      const moxiePlatform = zernioPlatform === "twitter" ? "x" : zernioPlatform;
      const nextIds = {
        ...prevIds,
        [moxiePlatform]: event?.data?.platform_post_id ?? externalPostId,
        zernio_post_id: externalPostId,
      };
      await admin
        .from("social_posts")
        .update({ status: "published", published_at: publishedAt, platform_post_ids: nextIds })
        .eq("id", post.id);
    }

    return json(200, { ok: true });
  }

  // ── post.failed ─────────────────────────────────────────────────────────────
  if (eventType === "post.failed") {
    const externalPostId = event?.data?.id ?? event?.post_id;
    if (!externalPostId) return json(200, { ok: true });

    const { data: posts } = await admin
      .from("social_posts")
      .select("id")
      .contains("platform_post_ids", { zernio_post_id: externalPostId });

    for (const post of posts ?? []) {
      await admin
        .from("social_posts")
        .update({ status: "failed" })
        .eq("id", post.id);
    }

    return json(200, { ok: true });
  }

  // ── account.connected ────────────────────────────────────────────────────────
  if (eventType === "account.connected") {
    const account = event?.data ?? {};
    const zernioPlatform = String(account.platform ?? "").toLowerCase();
    const moxiePlatform = zernioPlatform === "twitter" ? "x" : zernioPlatform;
    const userId: string | undefined = account.metadata?.moxie_user_id;
    if (!userId) return json(200, { ok: true }); // not our account

    const pName =
      account.metadata?.name ??
      account.metadata?.page_name ??
      account.username ??
      null;

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
      external_provider: "zernio",
      external_account_id: String(account.id ?? ""),
      profile_name: pName,
      profile_image: account.metadata?.picture ?? account.avatar_url ?? null,
      access_token: null,
      refresh_token: null,
      expires_at: account.token_expires_at ?? null,
      reminder_sent_at: null,
      organization_id: account.metadata?.organization_id ?? null,
      organization_name: account.metadata?.organization_name ?? null,
    };

    if (existing?.id) {
      await admin.from("social_connections").update(row).eq("id", existing.id);
    } else {
      await admin.from("social_connections").insert(row);
    }

    return json(200, { ok: true });
  }

  // ── account.disconnected ─────────────────────────────────────────────────────
  if (eventType === "account.disconnected") {
    const externalId = String(event?.data?.id ?? "");
    if (externalId) {
      await admin
        .from("social_connections")
        .delete()
        .eq("external_account_id", externalId)
        .eq("external_provider", "zernio");
    }
    return json(200, { ok: true });
  }

  // Unknown event types are acknowledged silently (do not 4xx — Zernio retries)
  return json(200, { ok: true, skipped: eventType });
});
