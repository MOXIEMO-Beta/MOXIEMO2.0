// One-shot: registers the Post for Me webhook and returns the secret so it
// can be stored via the Lovable secrets tool. Delete this function after use.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-guard",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const guard = req.headers.get("x-guard") ?? "";
  const expected = Deno.env.get("PFM_ONESHOT_GUARD") ?? "";
  if (!expected || guard !== expected) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const apiKey = Deno.env.get("POST_FOR_ME_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const webhookUrl = `${supabaseUrl}/functions/v1/postforme-webhook`;
  const r = await fetch("https://api.postforme.dev/v1/webhooks", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      event_types: ["social.post.created", "social.post.updated"],
    }),
  });
  const text = await r.text();
  let parsed: any = text;
  try { parsed = JSON.parse(text); } catch { /* keep text */ }
  return new Response(JSON.stringify({ status: r.status, body: parsed }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});