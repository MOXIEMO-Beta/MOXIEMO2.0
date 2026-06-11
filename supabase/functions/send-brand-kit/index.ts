import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = 5;
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  HITS.set(ip, arr);
  return arr.length > MAX_HITS;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    if (rateLimited(ip)) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const first_name = String(body.first_name ?? "").trim().slice(0, 80);
    const last_name = String(body.last_name ?? "").trim().slice(0, 80);
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 254);
    const website_url = String(body.website_url ?? "").trim().slice(0, 500);
    const pdfBase64 = String(body.pdfBase64 ?? "");

    if (!first_name || !last_name) {
      return new Response(JSON.stringify({ error: "missing_name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ error: "invalid_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!pdfBase64 || pdfBase64.length > 8_000_000) {
      return new Response(JSON.stringify({ error: "invalid_pdf" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: dbError } = await supabase.from("brand_kit_leads").insert({
      first_name,
      last_name,
      email,
      website_url: website_url || null,
      source: "brand_kit_tool",
      ip_address: ip,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    });
    if (dbError) {
      console.error("brand_kit_leads insert error:", dbError);
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ success: true, warning: "saved_but_email_skipped" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = "Your brand kit is here";
    const html = `
      <div style="font-family: Inter, Arial, sans-serif; color:#15171C; background:#F7F5F1; padding:32px;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e4e5ea; border-radius:12px; padding:32px;">
          <p style="font-size:11px; color:#FF6B5C; letter-spacing:2px; font-weight:700; margin:0 0 14px;">YOUR BRAND KIT</p>
          <h1 style="font-size:26px; line-height:1.15; margin:0 0 16px; color:#15171C;">Hi ${first_name}, your brand kit is attached.</h1>
          <p style="font-size:15px; line-height:1.6; margin:0 0 14px;">Open the PDF and you will find your colors, your fonts, your logo, and a clean summary you can drop into Canva, hand to a designer, or use to keep everything you make on brand.</p>
          <p style="font-size:15px; line-height:1.6; margin:0 0 14px;">This is the surface of your brand. The strategy underneath is what MOXIEMO builds with you.</p>
          <div style="margin:24px 0;">
            <a href="https://buildwithmoxiemo.com/founding" style="display:inline-block; background:#FF6B5C; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:999px; font-weight:600; font-size:14px;">Join Beta 2.0</a>
          </div>
          <p style="font-size:13px; color:#7a7e8c; margin:24px 0 0;">Karee at MOXIEMO<br/><a href="https://buildwithmoxiemo.com" style="color:#FF6B5C; text-decoration:none;">buildwithmoxiemo.com</a></p>
        </div>
      </div>
    `;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MOXIEMO <hello@mail.buildwithmoxiemo.com>",
          reply_to: "hello@buildwithmoxiemo.com",
          to: [email],
          subject,
          html,
          attachments: [
            {
              filename: "brand-kit.pdf",
              content: pdfBase64,
            },
          ],
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error("Resend error:", res.status, txt);
      }
    } catch (e) {
      console.error("Resend send failed:", e);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-brand-kit error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});