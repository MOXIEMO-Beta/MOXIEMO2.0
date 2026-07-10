import { sendResendEmail } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { function_name, user_id, status, detail } = await req.json().catch(() => ({}));
    const timestamp = new Date().toISOString();
    const subject = "MOXIEMO API Alert — Credits exhausted";
    const text = [
      `Timestamp: ${timestamp}`,
      `User ID: ${user_id ?? "unknown"}`,
      `Function: ${function_name ?? "unknown"}`,
      `Upstream status: ${status ?? "unknown"}`,
      detail ? `Detail: ${String(detail).slice(0, 500)}` : "",
    ].filter(Boolean).join("\n");

    const html = `
      <h2>MOXIEMO API Alert — Credits exhausted</h2>
      <p><strong>Timestamp:</strong> ${timestamp}</p>
      <p><strong>User ID:</strong> ${user_id ?? "unknown"}</p>
      <p><strong>Function:</strong> ${function_name ?? "unknown"}</p>
      <p><strong>Upstream status:</strong> ${status ?? "unknown"}</p>
      ${detail ? `<pre>${String(detail).slice(0, 1000)}</pre>` : ""}
    `;

    const { response: resp } = await sendResendEmail("notify-admin", {
      to: ["hello@buildwithmoxiemo.com"],
      subject,
      text,
      html,
    });

    if (!resp.ok) {
      console.error("notify-admin resend error", resp.status);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-admin error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});