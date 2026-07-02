import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function labelFor(row: {
  platform: string;
  connection_type: string | null;
  organization_name: string | null;
  profile_name: string | null;
}) {
  const platformName =
    row.platform === "linkedin" ? "LinkedIn"
      : row.platform === "facebook" ? "Facebook"
      : row.platform === "instagram" ? "Instagram"
      : row.platform;
  if ((row.connection_type ?? "personal") === "company") {
    const org = row.organization_name ?? "your company";
    return `${org}'s ${platformName} Page connection`;
  }
  return `Your personal ${platformName} connection`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = Date.now();
    const windowEnd = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Rows expiring within the next 7 days that we haven't reminded on yet
    // (or whose reminder was cleared by a successful reconnect).
    const { data: rows, error } = await supabase
      .from("social_connections")
      .select("id, user_id, platform, connection_type, organization_name, profile_name, expires_at, reminder_sent_at")
      .not("expires_at", "is", null)
      .lte("expires_at", windowEnd)
      .is("reminder_sent_at", null);
    if (error) throw error;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const results: Array<Record<string, unknown>> = [];

    for (const row of rows ?? []) {
      const { data: userData } = await supabase.auth.admin.getUserById(row.user_id);
      const email = userData?.user?.email;
      if (!email) {
        results.push({ id: row.id, skipped: "no_email" });
        continue;
      }

      const label = labelFor(row as any);
      const expiresMs = new Date(row.expires_at as string).getTime();
      const daysLeft = Math.max(0, Math.ceil((expiresMs - now) / (24 * 60 * 60 * 1000)));
      const expiredCopy = expiresMs <= now
        ? `${label} has expired.`
        : `${label} expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;

      const subject = expiresMs <= now
        ? `${label} has expired`
        : `${label} expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;

      const html = `
        <div style="font-family:Arial,sans-serif;color:#0E0F10;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="margin:0 0 12px;font-size:20px">${expiredCopy}</h2>
          <p style="margin:0 0 16px;color:#4B4A46;line-height:1.5">
            To keep publishing without interruption, reconnect this account in MOXIEMO settings.
          </p>
          <p style="margin:0 0 24px">
            <a href="https://buildwithmoxiemo.com/app/settings#integrations-section"
               style="display:inline-block;background:#E85A46;color:#fff;text-decoration:none;
                      padding:10px 18px;border-radius:6px;font-weight:600">
              Reconnect now
            </a>
          </p>
          <p style="margin:0;color:#9A9896;font-size:12px">— MOXIEMO</p>
        </div>`;

      if (RESEND_API_KEY) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "MOXIEMO <hello@mail.buildwithmoxiemo.com>",
            to: [email],
            subject,
            html,
          }),
        });
        if (!res.ok) {
          const txt = await res.text();
          console.error("resend send failed", row.id, txt);
          results.push({ id: row.id, error: "resend_failed" });
          continue;
        }
      } else {
        console.warn("RESEND_API_KEY missing; skipping actual send for", row.id);
      }

      await supabase
        .from("social_connections")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", row.id);

      results.push({ id: row.id, sent: true, label, daysLeft });
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-social-token-expiry error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});