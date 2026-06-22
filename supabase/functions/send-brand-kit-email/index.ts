import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, firstName, pdfBase64 } = await req.json();

    console.log("[brand-kit-email] RESEND_API_KEY present:", !!Deno.env.get("RESEND_API_KEY"));
    console.log("[brand-kit-email] Sending to:", email);

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: true, message: "Missing recipient email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const safeName = (firstName && typeof firstName === "string" ? firstName : "there")
      .replace(/[<>]/g, "")
      .slice(0, 80);

    const resendPayload = {
      from: "MOXIEMO <hello@mail.buildwithmoxiemo.com>",
      reply_to: "hello@buildwithmoxiemo.com",
      to: [email],
      subject: "Your free brand kit from MOXIEMO",
      html: `
        <div style="font-family: Inter, Arial, sans-serif; color:#15171C; background:#F7F5F1; padding:32px;">
          <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e4e5ea; border-radius:12px; padding:32px;">
            <p style="font-size:11px; color:#FF6B5C; letter-spacing:2px; font-weight:700; margin:0 0 14px;">YOUR BRAND KIT</p>
            <h1 style="font-size:26px; line-height:1.15; margin:0 0 16px; color:#15171C;">Hi ${safeName}, your brand kit is attached.</h1>
            <p style="font-size:15px; line-height:1.6; margin:0 0 14px;">Your brand kit is attached. It includes your color palette, typography, and imagery direction — the visual foundation of your brand.</p>
            <p style="font-size:15px; line-height:1.6; margin:0 0 14px;">When you're ready to build the strategy underneath it, MOXIEMO is where that happens.</p>
            <div style="margin:24px 0;">
              <a href="https://buildwithmoxiemo.com/founding" style="display:inline-block; background:#FF6B5C; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:999px; font-weight:600; font-size:14px;">Join the Beta 2.0 list</a>
            </div>
            <p style="font-size:13px; color:#7a7e8c; margin:24px 0 0;">— Karee at MOXIEMO</p>
            <p style="font-size:11px; color:#9aa0ad; margin:20px 0 0; line-height:1.5;">You're receiving this because you downloaded a brand kit at buildwithmoxiemo.com. Unsubscribe anytime by replying STOP.</p>
          </div>
        </div>
      `,
      attachments: pdfBase64
        ? [{ filename: "your-brand-kit.pdf", content: pdfBase64 }]
        : [],
    };

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendRes.json().catch(() => ({}));
    console.log("[brand-kit-email] Resend status:", resendRes.status);
    console.log("[brand-kit-email] Resend response:", JSON.stringify(resendData));

    if (!resendRes.ok) {
      return new Response(
        JSON.stringify({
          error: true,
          message: resendData?.message ?? "Delivery failed",
          code: resendRes.status,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[brand-kit-email] Threw:", err);
    return new Response(
      JSON.stringify({ error: true, message: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});