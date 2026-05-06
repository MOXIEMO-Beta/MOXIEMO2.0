import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZOOM_LINK = "https://scheduler.zoom.us/klmg-ltd/moxie-beta-kickoff";

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
    console.log("RESEND_API_KEY present:", !!RESEND_API_KEY);
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY missing");
      return new Response(JSON.stringify({ success: true, warning: "saved_but_email_skipped" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Email 1 — Confirmation to applicant
    console.log("Sending confirmation email to:", email);
    try {
      const applicantRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        from: "Karee at MOXIEMO <hello@mail.buildwithmoxie.co>",
        reply_to: "karee@studiosbagency.com",
        to: [email],
        subject: "You're on the MOXIEMO founding member list",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
            <h1 style="font-size: 22px; margin: 0 0 16px;">Hey ${name}, you're on the list.</h1>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
              Thanks for your interest in MOXIEMO. We're personally onboarding every founding member — so the next step is a quick 20-minute call so we can learn about your business and get you set up right.
            </p>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Click below to pick a time that works for you:
            </p>
            <p style="margin: 0 0 24px;">
              <a href="${ZOOM_LINK}" style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Schedule your founding member call →</a>
            </p>
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 24px;">
              Can't find a time? Just reply to this email and we'll work something out.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #888; line-height: 1.5;">
              MOXIEMO · buildwithmoxie.co<br />
              Built by KLMG-US Ltd · Houston, Texas
            </p>
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

    // Email 2 — Internal notification
    console.log("Sending admin notification to: karee@studiosbagency.com");
    try {
      const adminRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        from: "MOXIEMO Waitlist <hello@mail.buildwithmoxie.co>",
        to: ["karee@studiosbagency.com"],
        subject: `New waitlist signup: ${name}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
            <h2 style="font-size: 18px; margin: 0 0 16px;">New founding member application</h2>
            <table style="font-size: 14px; line-height: 1.7;">
              <tr><td style="padding-right: 12px; color: #666;">Name</td><td>${name}</td></tr>
              <tr><td style="padding-right: 12px; color: #666;">Email</td><td>${email}</td></tr>
              <tr><td style="padding-right: 12px; color: #666;">Role</td><td>${role ?? "—"}</td></tr>
              <tr><td style="padding-right: 12px; color: #666;">Company</td><td>${company_name ?? "—"}</td></tr>
              <tr><td style="padding-right: 12px; color: #666;">Website</td><td>${website_url ?? "—"}</td></tr>
              <tr><td style="padding-right: 12px; color: #666;">Heard via</td><td>${referral_source ?? "—"}</td></tr>
            </table>
            <p style="margin-top: 24px;">
              <a href="https://buildwithmoxie.co/admin/waitlist" style="display: inline-block; background: #111; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: 600;">View in admin panel →</a>
            </p>
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