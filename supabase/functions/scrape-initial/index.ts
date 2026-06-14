import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getOrScrape, normalizeDomain } from "../_shared/audit-scrape.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function quickExtract(text: string): Promise<{ brand_name: string; what_you_do: string; who_you_serve: string }> {
  const empty = { brand_name: "", what_you_do: "", who_you_serve: "" };
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || !text.trim()) return empty;
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Extract three short factual fields from a website homepage text. Return strict JSON: {\"brand_name\":\"\",\"what_you_do\":\"\",\"who_you_serve\":\"\"}. Use empty string if not clear. No invention." },
          { role: "user", content: `HOMEPAGE TEXT:\n"""${text.slice(0, 6000)}"""` },
        ],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) return empty;
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    return {
      brand_name: String(parsed.brand_name ?? "").trim(),
      what_you_do: String(parsed.what_you_do ?? "").trim(),
      who_you_serve: String(parsed.who_you_serve ?? "").trim(),
    };
  } catch { return empty; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { url } = await req.json();
    const domain = normalizeDomain(url || "");
    if (!domain) {
      return new Response(JSON.stringify({ error: "invalid_url" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const raw = await getOrScrape(url);
    const homeText = raw.pages[0]?.text ?? "";
    const fields = await quickExtract(homeText);
    return new Response(JSON.stringify({ domain, ...fields }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});