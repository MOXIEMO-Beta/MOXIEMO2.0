import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendResendEmail } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { feedback_type, message, page_url } = await req.json();
    if (!message || !feedback_type) {
      return new Response(JSON.stringify({ error: "feedback_type and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userEmail = "anonymous";
    let userName = "Anonymous user";
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await supabase.auth.getClaims(token);
      if (claimsData?.claims) {
        userEmail = (claimsData.claims.email as string) || userEmail;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", claimsData.claims.sub)
          .maybeSingle();
        userName = profile?.full_name || userEmail;
      }
    }

    const labelMap: Record<string, string> = {
      bug: "Bug report",
      feature: "Feature request",
      confusing: "Something is confusing",
      love: "I love this",
      general: "General feedback",
    };
    const typeLabel = labelMap[feedback_type] || feedback_type;
    const timestamp = new Date().toISOString();

    const subject = `MOXIEMO Feedback — ${typeLabel} from ${userName}`;
    const html = `
      <h2>New MOXIEMO Feedback</h2>
      <p><strong>Type:</strong> ${typeLabel}</p>
      <p><strong>From:</strong> ${userName} &lt;${userEmail}&gt;</p>
      <p><strong>Timestamp:</strong> ${timestamp}</p>
      ${page_url ? `<p><strong>Page:</strong> ${page_url}</p>` : ""}
      <hr>
      <p style="white-space:pre-wrap">${String(message).replace(/</g, "&lt;")}</p>
    `;

    const { response: res, body: result } = await sendResendEmail("send-feedback-email", {
      to: ["hello@buildwithmoxiemo.com"],
      reply_to: userEmail !== "anonymous" ? userEmail : undefined,
      subject,
      html,
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: result?.message ?? "Resend error", details: result }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});