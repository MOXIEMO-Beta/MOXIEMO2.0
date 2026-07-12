// Public webhook receiver for Post for Me post-status events. Maps the
// incoming event back to a social_posts row via pfm_post_id and updates the
// user-facing status. Runs with verify_jwt = false because the caller is Post
// for Me, not a MOXIEMO user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Post for Me sends "status" values that we normalize onto our own set.
function mapStatus(input: string | undefined): { status: string; publishedAt: string | null } | null {
  const s = String(input ?? "").toLowerCase();
  const now = new Date().toISOString();
  if (["published", "posted", "success", "succeeded", "completed"].includes(s)) {
    return { status: "published", publishedAt: now };
  }
  if (["failed", "error", "errored", "rejected"].includes(s)) {
    return { status: "failed", publishedAt: null };
  }
  if (["publishing", "processing", "queued", "in_progress"].includes(s)) {
    return { status: "publishing", publishedAt: null };
  }
  if (["scheduled"].includes(s)) {
    return { status: "scheduled", publishedAt: null };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json().catch(() => ({} as any));
    console.log("[postforme-webhook] event", JSON.stringify(body));

    const eventData = body?.data ?? body ?? {};
    const pfmPostId: string | undefined =
      eventData.id ?? eventData.post_id ?? eventData.social_post_id ?? body?.post_id;

    // Some webhooks include a per-account status array. Reduce it to the worst
    // outcome: any failure wins, otherwise the newest state.
    const accountResults: any[] = Array.isArray(eventData.social_accounts)
      ? eventData.social_accounts
      : Array.isArray(eventData.results)
        ? eventData.results
        : [];

    let rawStatus: string | undefined = eventData.status ?? body?.status;
    let externalIds: Record<string, string> = {};
    let errorText: string | null = null;
    if (accountResults.length) {
      const failed = accountResults.find((a) => /fail|error|reject/i.test(a?.status ?? ""));
      if (failed) {
        rawStatus = failed.status;
        errorText =
          failed.error ??
          failed.error_message ??
          failed.errors?.[0]?.message ??
          "Post for Me reported a publish failure.";
      } else {
        rawStatus = accountResults[accountResults.length - 1]?.status ?? rawStatus;
      }
      for (const a of accountResults) {
        const platform = String(a.platform ?? "").toLowerCase();
        const extId = a.platform_post_id ?? a.external_post_id ?? a.id;
        if (platform && extId) externalIds[platform] = String(extId);
      }
    }

    if (!errorText) {
      errorText =
        eventData.error ??
        eventData.error_message ??
        eventData.errors?.[0]?.message ??
        null;
    }

    if (!pfmPostId) {
      console.warn("[postforme-webhook] missing pfm post id");
      return json(200, { ok: true, skipped: "no_post_id" });
    }
    const mapped = mapStatus(rawStatus);
    if (!mapped) {
      console.warn("[postforme-webhook] unknown status", rawStatus);
      return json(200, { ok: true, skipped: "unknown_status" });
    }

    const { data: post } = await admin
      .from("social_posts")
      .select("id, platform_post_ids")
      .eq("pfm_post_id", pfmPostId)
      .maybeSingle();
    if (!post) {
      console.warn("[postforme-webhook] no local post for pfm id", pfmPostId);
      return json(200, { ok: true, skipped: "no_local_post" });
    }

    const nextIds: Record<string, unknown> = {
      ...(post.platform_post_ids as Record<string, unknown> ?? {}),
      pfm: {
        pfm_post_id: pfmPostId,
        status: mapped.status,
        error: errorText,
        externals: externalIds,
        received_at: new Date().toISOString(),
      },
      ...Object.fromEntries(Object.entries(externalIds).map(([p, id]) => [p, id])),
    };

    const update: Record<string, unknown> = {
      status: mapped.status,
      platform_post_ids: nextIds,
    };
    if (mapped.publishedAt) update.published_at = mapped.publishedAt;
    await admin.from("social_posts").update(update).eq("id", post.id);
    return json(200, { ok: true, id: post.id, status: mapped.status });
  } catch (err) {
    console.error("[postforme-webhook] error", err);
    return json(500, { error: (err as Error).message });
  }
});