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
    const ZOOM_LINK = "https://scheduler.zoom.us/klmg-ltd/moxie-beta-kickoff";

    // Confirmation email to applicant
    try {
      const applicantRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Karee at MOXIE <hello@mail.buildwithmoxiemo.com>",
          reply_to: "hello@buildwithmoxiemo.com",
          to: [email],
          subject: `You are on the list - one step left, ${first}.`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Hi ${first},</p>
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">You are officially on the MOXIE Founding Member list. Welcome.</p>
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px;">There is one step left to lock in your access: book your personal kickoff call with Karee. This is where we walk through the platform together and get you fully set up.</p>
              <p style="margin: 0 0 24px;">
                <a href="${ZOOM_LINK}" style="display: inline-block; background: #ff6b6b; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Book your kickoff call →</a>
              </p>
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Your founding member access is free forever and your spot is held. But platform access is granted after your kickoff call, so grab a time that works for you.</p>
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">If you have any questions before your call, reply to this email directly.</p>
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">See you soon.</p>
              <p style="font-size: 15px; line-height: 1.6; margin: 0;">Karee<br/>Founder, MOXIE<br/><a href="mailto:hello@buildwithmoxiemo.com" style="color:#ff6b6b;">hello@buildwithmoxiemo.com</a></p>
            </div>
          `,
        }),
      });
      const applicantData = await applicantRes.json().catch(() => ({}));
      console.log("Applicant email response:", applicantRes.status, JSON.stringify(applicantData));
      if (!applicantRes.ok) {
        console.error("Applicant email failed:", applicantRes.status, JSON.stringify(applicantData));
      }
    } catch (e) {
      console.error("Applicant email threw:", e);
    }

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
