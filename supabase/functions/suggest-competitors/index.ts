import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { normalizeDomain } from "../_shared/audit-scrape.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BAD_DOMAINS = new Set([
  "facebook.com", "linkedin.com", "twitter.com", "x.com", "instagram.com",
  "youtube.com", "tiktok.com", "wikipedia.org", "reddit.com", "medium.com",
  "yelp.com", "g2.com", "capterra.com", "crunchbase.com", "glassdoor.com",
  "indeed.com", "amazon.com", "pinterest.com", "quora.com", "forbes.com",
  "inc.com", "techcrunch.com", "bloomberg.com", "nytimes.com", "github.com",
]);

async function searchSerper(query: string): Promise<string[]> {
  const key = Deno.env.get("SERPER_API_KEY");
  if (!key) return [];
  try {
    const r = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 20 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return [];
    const data = await r.json();
    const items: any[] = data?.organic ?? [];
    return items.map((i) => i.link).filter(Boolean);
  } catch { return []; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { what_you_do = "", who_you_serve = "", location = "" } = await req.json();
    const key = Deno.env.get("SERPER_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ suggested: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const q = [what_you_do, "for", who_you_serve, location].filter(Boolean).join(" ").trim()
      || [what_you_do, who_you_serve].filter(Boolean).join(" ");
    if (!q) {
      return new Response(JSON.stringify({ suggested: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const urls = await searchSerper(q);
    const seen = new Set<string>();
    const suggested: string[] = [];
    for (const u of urls) {
      const d = normalizeDomain(u);
      if (!d || seen.has(d)) continue;
      if (BAD_DOMAINS.has(d)) continue;
      seen.add(d);
      suggested.push(d);
      if (suggested.length >= 5) break;
    }
    return new Response(JSON.stringify({ suggested }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ suggested: [], error: String(e) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});