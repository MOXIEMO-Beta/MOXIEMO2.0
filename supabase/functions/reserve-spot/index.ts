import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const BUSINESS_TYPES = [
  "Service business",
  "Product business",
  "Consultant / freelancer",
  "Agency",
  "Creator / personal brand",
];

// Stripped-down email template — inline styles only, single column, 600px max.
function confirmationHtml(sessionPicked: string | null): string {
  const sessionLine = sessionPicked
    ? `<p style="margin:0 0 16px">Your session: <strong>${sessionPicked}</strong></p>`
    : "";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4efe5;font-family:'Helvetica Neue',Arial,sans-serif;color:#13130f">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe5;padding:40px 0">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
      <tr><td style="background:#13130f;padding:28px 36px;border-radius:12px 12px 0 0">
        <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:800;font-size:22px;letter-spacing:-0.5px;color:#f4efe5">MOXIEMO</span>
      </td></tr>
      <tr><td style="background:#ffffff;padding:36px;border-radius:0 0 12px 12px">
        <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:#13130f;line-height:1.2">Your spot is reserved.</h1>
        ${sessionLine}
        <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3a3a30">
          You are not charged — this is a reservation only. Founding member seats open
          <strong>December 15, 2026</strong>. When your session is confirmed you will get
          a calendar invite with the Zoom link.
        </p>
        <p style="margin:0 0 32px;font-size:15px;line-height:1.65;color:#3a3a30">
          Questions? Reply to this email or reach us at
          <a href="mailto:hello@buildwithmoxiemo.com" style="color:#ef6f53">hello@buildwithmoxiemo.com</a>.
        </p>
        <p style="margin:0;font-size:14px;color:#3a3a30">— The MOXIEMO team</p>
        <hr style="border:none;border-top:1px solid #e8e4dd;margin:32px 0">
        <p style="margin:0;font-size:11px;color:#9a9890;line-height:1.6">
          KLMG US Ltd · 2727 San Felipe Rd., Suite 217, Houston, TX 77063<br>
          To cancel your reservation, email hello@buildwithmoxiemo.com.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { email, business_type, goal, session_picked, session_time, visitor_id, utm } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return json({ error: "Valid email required" }, 400);
    }
    if (business_type && !BUSINESS_TYPES.includes(business_type)) {
      return json({ error: "Invalid business type" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotency: return success silently if same email already reserved.
    // Prevents double-tap or network-retry duplicates filling the table.
    const { data: existing } = await supabase
      .from("reservations")
      .select("id, confirmation_sent_at")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return json({ ok: true, duplicate: true });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { error: insertError } = await supabase.from("reservations").insert({
      email:         normalizedEmail,
      business_type: business_type ?? null,
      goal:          goal ?? null,
      session_picked: session_picked ?? null,
      session_time:  session_time ?? null,
      visitor_id:    visitor_id ?? null,
      utm_source:    utm?.source   ?? null,
      utm_medium:    utm?.medium   ?? null,
      utm_campaign:  utm?.campaign ?? null,
      utm_content:   utm?.content  ?? null,
      utm_term:      utm?.term     ?? null,
    });

    if (insertError) {
      console.error("reserve-spot insert error:", JSON.stringify(insertError));
      return json({ error: "Could not save reservation" }, 500);
    }

    // Send confirmation email via Resend and record the timestamp.
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    let emailDispatched = false;

    if (RESEND_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:    "MOXIE <hello@buildwithmoxiemo.com>",
            to:      [normalizedEmail],
            subject: "Your spot is reserved — MOXIEMO",
            html:    confirmationHtml(session_picked ?? null),
          }),
        });

        if (res.ok) {
          emailDispatched = true;
        } else {
          const errBody = await res.text();
          console.error("Resend non-2xx:", res.status, errBody);
        }
      } catch (emailErr) {
        console.error("Resend fetch error:", emailErr);
      }
    }

    // Record confirmation dispatch time so admins can see it in WaitlistAdmin.
    if (emailDispatched) {
      await supabase
        .from("reservations")
        .update({ confirmation_sent_at: new Date().toISOString() })
        .eq("email", normalizedEmail);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("reserve-spot unhandled error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
