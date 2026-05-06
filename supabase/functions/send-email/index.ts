import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { subject, body, segment, subscriber_ids } = await req.json();
    if (!subject || !body) {
      return new Response(JSON.stringify({ error: "subject and body are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email_settings, full_name")
      .eq("id", userId)
      .maybeSingle();

    const settings = (profile?.email_settings as Record<string, string> | null) || {};
    const from_name = settings.from_name || profile?.full_name || "MOXIEMO";
    const from_email = settings.from_email;
    const reply_to = settings.reply_to || from_email;

    let query = supabase
      .from("subscribers")
      .select("id, email")
      .eq("user_id", userId)
      .eq("status", "active");

    if (Array.isArray(subscriber_ids) && subscriber_ids.length > 0) {
      query = query.in("id", subscriber_ids);
    } else if (segment && segment !== "all") {
      query = query.contains("tags", [segment]);
    }

    const { data: subscribers } = await query;

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ error: "No subscribers to send to" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Subscribers found:', subscribers?.length ?? 0);
    console.log('From name:', from_name);
    console.log('From email setting:', from_email);
    console.log('Subject:', subject);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");

    const fromHeader = `${from_name} <hello@mail.buildwithmoxiemo.com>`;

    const resendPayload = {
      from: fromHeader,
      to: subscribers.map((s) => s.email),
      subject,
      html: body.replace(/\n/g, "<br>"),
      ...(reply_to ? { reply_to } : {}),
    };
    console.log('Resend payload:', JSON.stringify(resendPayload));

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const result = await res.json();
    console.log('Resend response status:', res.status);
    console.log('Resend response body:', JSON.stringify(result));
    if (!res.ok) {
      return new Response(JSON.stringify({
        error: result?.message ?? result?.name ?? 'Resend API error',
        details: result,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("email_sends").insert({
      user_id: userId,
      subject,
      body,
      sent_at: new Date().toISOString(),
      recipient_count: subscribers.length,
      resend_email_id: result.id || null,
      segment: segment || "all",
      recipient_ids: subscribers.map((s) => s.id),
    });

    return new Response(
      JSON.stringify({ sent_count: subscribers.length, resend_id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});