import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendResendEmail } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { waitlist_id, admin_user_id } = await req.json();

    if (!waitlist_id) {
      return new Response(JSON.stringify({ error: "waitlist_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: entry, error: fetchError } = await supabase
      .from("waitlist")
      .select("*")
      .eq("id", waitlist_id)
      .single();

    if (fetchError || !entry) throw new Error("Waitlist entry not found");

    await supabase
      .from("waitlist")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: admin_user_id ?? null,
      })
      .eq("id", waitlist_id);

    const { response: resendResponse, body: resendBody } = await sendResendEmail("approve-waitlist", {
      reply_to: "karee@studiosbagency.com",
      to: [entry.email],
      subject: "You're in — welcome to MOXIEMO 🎉",
      html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
            <h1 style="font-size: 22px; margin: 0 0 16px;">Welcome to MOXIEMO, ${entry.name}.</h1>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
              It was great connecting with you. Your founding member access is ready — here's everything you need to get started.
            </p>
            <div style="background: #f6f6f4; border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 6px; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Your founding member code</p>
              <p style="margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: 1px;">MOXIE2026</p>
              <p style="margin: 0; font-size: 13px; color: #666;">Free forever. This code locks in your founding member status.</p>
            </div>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 12px; font-weight: 600;">Here's how to get started:</p>
            <ol style="font-size: 15px; line-height: 1.7; margin: 0 0 24px; padding-left: 20px;">
              <li>Go to buildwithmoxiemo.com/auth</li>
              <li>Create your account with this email address</li>
              <li>On Step 8, enter your code: <strong>MOXIE2026</strong></li>
              <li>You're in — free, forever</li>
            </ol>
            <p style="margin: 0 0 24px;">
              <a href="https://buildwithmoxiemo.com/auth" style="display: inline-block; background: #111; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Create your account →</a>
            </p>
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 16px;">
              Reply to this email any time — I personally read every message.
            </p>
            <p style="font-size: 15px; margin: 0 0 24px;">— Karee</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #888; line-height: 1.5;">
              MOXIEMO · buildwithmoxiemo.com<br />
              Built by KLMG-US Ltd · Houston, Texas
            </p>
          </div>
        `,
    });

    if (!resendResponse.ok) {
      return new Response(JSON.stringify({ error: "resend_failed", details: resendBody }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("approve-waitlist error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});