import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendResendEmail } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_TIERS = new Set(["foundation", "growth", "scale", "unsure"]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const firstName: string = (body.firstName ?? body.first_name ?? "").toString().trim().slice(0, 120);
    const email: string = (body.email ?? "").toString().trim().toLowerCase().slice(0, 320);
    const role: string | null = body.role ? String(body.role).slice(0, 60) : null;
    const company: string | null = body.company ? String(body.company).slice(0, 200) : null;
    const website: string | null = body.website ? String(body.website).slice(0, 500) : null;
    const referral: string | null = body.referral ? String(body.referral).slice(0, 60) : null;
    let tier: string = (body.tier ?? body.plan ?? "unsure").toString().toLowerCase();
    if (!ALLOWED_TIERS.has(tier)) tier = "unsure";
    const source: string = (body.source ?? "pricing_page").toString().slice(0, 60);

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "valid_email_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let user_id: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      try {
        const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
          headers: { Authorization: authHeader, apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! },
        });
        if (userRes.ok) {
          const u = await userRes.json();
          user_id = u?.id ?? null;
        }
      } catch (_) { /* ignore */ }
    }

    const { error: dbError } = await supabase.from("beta20_founding").insert({
      email,
      first_name: firstName || null,
      role,
      company,
      website,
      tier_interest: tier,
      referral_source: referral,
      source,
      status: "waitlisted",
      user_id,
    });

    if (dbError) {
      if ((dbError as any).code === "23505") {
        return new Response(JSON.stringify({ error: "already_registered" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("beta20 insert error:", dbError);
      return new Response(JSON.stringify({ error: "db_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✓ Saved beta20 founding:", email, tier);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      const first = firstName || "there";
      const submittedAt = new Date().toISOString();

      // Confirmation to applicant
      try {
        await sendResendEmail("join-beta20-founding applicant", {
            reply_to: "hello@buildwithmoxiemo.com",
            to: [email],
            subject: "You are on the Beta 2.0 founding list.",
            html: `
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
                <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${first},</p>
                <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">You are on the list for MOXIEMO Beta 2.0 founding access.</p>
                <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">We will reach out the moment Beta 2.0 founding access opens, before it is available to anyone else. Your 50 percent off rate will be locked in for life once you claim your seat.</p>
                <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Sit tight. We will be in touch.</p>
                <p style="font-size:15px;line-height:1.6;margin:0;">Karee<br/>Founder, MOXIE</p>
              </div>
            `,
        });
      } catch (e) {
        console.error("applicant email failed:", e);
      }

      // Notify team
      try {
        await sendResendEmail("join-beta20-founding admin", {
            to: ["hello@buildwithmoxiemo.com"],
            subject: `New Beta 2.0 Founding signup — ${first} (${tier})`,
            html: `
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
                <h2 style="font-size:18px;margin:0 0 16px;">New Beta 2.0 Founding signup</h2>
                <table style="font-size:14px;line-height:1.8;">
                  <tr><td style="padding-right:16px;color:#666;">First name</td><td>${firstName || "—"}</td></tr>
                  <tr><td style="padding-right:16px;color:#666;">Email</td><td>${email}</td></tr>
                  <tr><td style="padding-right:16px;color:#666;">Role</td><td>${role ?? "—"}</td></tr>
                  <tr><td style="padding-right:16px;color:#666;">Company</td><td>${company ?? "—"}</td></tr>
                  <tr><td style="padding-right:16px;color:#666;">Website</td><td>${website ?? "—"}</td></tr>
                  <tr><td style="padding-right:16px;color:#666;">Tier interest</td><td>${tier}</td></tr>
                  <tr><td style="padding-right:16px;color:#666;">Referral</td><td>${referral ?? "—"}</td></tr>
                  <tr><td style="padding-right:16px;color:#666;">Source</td><td>${source}</td></tr>
                  <tr><td style="padding-right:16px;color:#666;">Submitted at</td><td>${submittedAt}</td></tr>
                </table>
              </div>
            `,
        });
      } catch (e) {
        console.error("admin email failed:", e);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("join-beta20-founding error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});