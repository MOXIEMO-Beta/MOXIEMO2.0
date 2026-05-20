// Shared helper: notify admin when an Anthropic call hits a critical
// status (429 rate limit / credits exhausted, or 402 payment required).
// Fire-and-forget — never blocks the caller, never throws.

export function notifyAdminCritical(
  req: Request,
  opts: { functionName: string; status: number; detail?: string },
): void {
  try {
    if (opts.status !== 429 && opts.status !== 402) return;
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) return;

    // Best-effort user id extraction from JWT (no validation needed here).
    let userId: string | null = null;
    const auth = req.headers.get("Authorization") || "";
    if (auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      const parts = token.split(".");
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(
            atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
          );
          userId = payload?.sub ?? null;
        } catch { /* ignore */ }
      }
    }

    // Fire and forget.
    fetch(`${supabaseUrl}/functions/v1/notify-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({
        function_name: opts.functionName,
        user_id: userId,
        status: opts.status,
        detail: opts.detail ?? "",
      }),
    }).catch((e) => console.error("notifyAdminCritical fetch failed", e));
  } catch (e) {
    console.error("notifyAdminCritical threw", e);
  }
}