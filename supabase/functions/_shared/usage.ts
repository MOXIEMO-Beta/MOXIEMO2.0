import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type ConsumeResult = {
  allowed: boolean;
  error?: string;
  plan?: string;
  used?: number;
  limit?: number | null;
  month?: string;
};

function clientFromReq(req: Request) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient(url, anon, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { persistSession: false },
  });
}

export async function precheckGeneration(req: Request): Promise<ConsumeResult> {
  const sb = clientFromReq(req);
  const { data, error } = await sb.rpc("consume_generation", {
    p_platform: "precheck",
    p_campaign_id: null,
    p_preview: null,
    p_dry_run: true,
  });
  if (error) {
    console.error("precheck_generation rpc error", error);
    return { allowed: false, error: error.message };
  }
  return data as ConsumeResult;
}

export async function commitGeneration(
  req: Request,
  opts: { platform: string; campaignId?: string | null; preview?: string | null },
): Promise<ConsumeResult> {
  const sb = clientFromReq(req);
  const { data, error } = await sb.rpc("consume_generation", {
    p_platform: opts.platform,
    p_campaign_id: opts.campaignId ?? null,
    p_preview: (opts.preview ?? "").slice(0, 100),
    p_dry_run: false,
  });
  if (error) {
    console.error("commit_generation rpc error", error);
    return { allowed: false, error: error.message };
  }
  return data as ConsumeResult;
}

export function limitErrorResponse(
  corsHeaders: Record<string, string>,
  result: ConsumeResult,
) {
  return new Response(
    JSON.stringify({
      error: "limit_reached",
      plan: result.plan,
      used: result.used,
      limit: result.limit,
      message: "Monthly generation limit reached. Upgrade to keep creating.",
    }),
    { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

export function unauthorizedResponse(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: "unauthorized", message: "Sign in required." }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}