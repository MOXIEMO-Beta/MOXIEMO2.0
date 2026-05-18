import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function splitName(full: string): { first: string; last: string } {
  const parts = (full || "").trim().split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") || "" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { name, email, role, website_url, company_name, referral_source } = await req.json();

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: dbError } = await supabase
      .from("waitlist")
      .insert({ name, email, role, website_url, company_name, referral_source });

    if (dbError) {
      if ((dbError as any).code === "23505") {
        return new Response(JSON.stringify({ error: "already_registered" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw dbError;
    }

    console.log("✓ Saved to waitlist:", email);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY missing");
      return new Response(JSON.stringify({ success: true, warning: "saved_but_email_skipped" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { first, last } = splitName(name);
    const submittedAt = new Date().toISOString();

    // Notification email to team only — no confirmation to applicant
    try {
      const adminRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MOXIEMO Founding <hello@mail.buildwithmoxiemo.com>",
          to: ["hello@buildwithmoxiemo.com"],
          subject: `New Founding Member Application — ${first} ${last}`.trim(),
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
              <h2 style="font-size: 18px; margin: 0 0 16px;">New Founding Member Application</h2>
              <table style="font-size: 14px; line-height: 1.8;">
                <tr><td style="padding-right: 16px; color: #666;">First name</td><td>${first || "—"}</td></tr>
                <tr><td style="padding-right: 16px; color: #666;">Last name</td><td>${last || "—"}</td></tr>
                <tr><td style="padding-right: 16px; color: #666;">Email</td><td>${email}</td></tr>
                <tr><td style="padding-right: 16px; color: #666;">Role</td><td>${role ?? "—"}</td></tr>
                <tr><td style="padding-right: 16px; color: #666;">Company</td><td>${company_name ?? "—"}</td></tr>
                <tr><td style="padding-right: 16px; color: #666;">Website</td><td>${website_url ?? "—"}</td></tr>
                <tr><td style="padding-right: 16px; color: #666;">Referral source</td><td>${referral_source ?? "—"}</td></tr>
                <tr><td style="padding-right: 16px; color: #666;">Submitted at</td><td>${submittedAt}</td></tr>
              </table>
            </div>
          `,
        }),
      });
      const adminData = await adminRes.json().catch(() => ({}));
      console.log("Admin email response:", adminRes.status, JSON.stringify(adminData));
      if (!adminRes.ok) {
        console.error("Admin email failed:", adminRes.status, JSON.stringify(adminData));
      }
    } catch (e) {
      console.error("Admin email threw:", e);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("join-waitlist error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
