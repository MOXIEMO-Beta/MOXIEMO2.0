import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireAuth, unauthorizedResponse } from "../_shared/auth-guard.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Photo = {
  id: number;
  thumbnailUrl: string;
  fullUrl: string;
  photographer: string;
  photographerUrl: string;
  searchTerm: string;
};

async function pexelsSearch(term: string, perPage = 3): Promise<Photo[]> {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(term)}&per_page=${perPage}`,
    { headers: { Authorization: PEXELS_API_KEY } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.photos ?? []).map((p: any) => ({
    id: p.id,
    thumbnailUrl: p.src?.medium,
    fullUrl: p.src?.large2x ?? p.src?.large,
    photographer: p.photographer,
    photographerUrl: p.photographer_url,
    searchTerm: term,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {

  const authUser = await requireAuth(req);
  if (!authUser) return unauthorizedResponse();
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData } = await supabase.auth.getUser(jwt);
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const forceRefresh = Boolean(body?.refresh);

    if (!forceRefresh) {
      const { data: cache } = await supabase
        .from("brand_image_cache")
        .select("images_json, generated_at, search_terms")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cache?.images_json) {
        const ageMs = Date.now() - new Date(cache.generated_at).getTime();
        if (ageMs < 7 * 24 * 60 * 60 * 1000) {
          return new Response(JSON.stringify({
            images: cache.images_json,
            searchTerms: (cache as any).search_terms ?? [],
            cached: true,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const { data: strategy } = await supabase
      .from("strategies")
      .select("enhanced_foundation")
      .eq("user_id", user.id)
      .maybeSingle();

    const ef = (strategy?.enhanced_foundation ?? {}) as any;
    if (!ef || Object.keys(ef).length === 0) {
      return new Response(JSON.stringify({ error: "no_strategy" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aesthetic = ef.visualAesthetic ?? ef.aesthetic ?? ef.brandAesthetic ?? "modern and clean";
    const industry = ef.industry ?? ef.businessType ?? ef.niche ?? "small business";
    const archetype = ef.archetype ?? ef.brandArchetype ?? "creator";

    const prompt = `You are a visual brand consultant. Based on this founder's brand aesthetic, industry, and archetype, generate 3-4 specific, evocative stock photo search terms that would produce genuinely on-brand imagery — not generic stock photography.

Aesthetic: ${aesthetic}
Industry: ${industry}
Archetype: ${archetype}

BAD (too generic): "business woman office"
GOOD (specific, evocative): "modern minimalist workspace natural light"

Return JSON only: { "searchTerms": ["term one", "term two", "term three"] }`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(JSON.stringify({ error: "claude_error", detail: txt }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const json = await resp.json();
    const text: string = json?.content?.[0]?.text ?? "";
    let parsed: any = null;
    try {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : text);
    } catch {
      parsed = { searchTerms: [] };
    }
    const terms: string[] = (Array.isArray(parsed?.searchTerms) ? parsed.searchTerms : [])
      .map((t: any) => String(t ?? "").trim()).filter(Boolean).slice(0, 4);

    if (terms.length === 0) {
      return new Response(JSON.stringify({ error: "no_terms" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const perTerm = terms.length <= 3 ? 3 : 2;
    const grouped = await Promise.all(terms.map((t) => pexelsSearch(t, perTerm)));
    const seen = new Set<number>();
    const images: Photo[] = [];
    grouped.forEach((arr) => {
      arr.forEach((p) => {
        if (seen.has(p.id)) return;
        seen.add(p.id);
        images.push(p);
      });
    });

    await supabase.from("brand_image_cache").upsert(
      { user_id: user.id, images_json: images, search_terms: terms, generated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

    try {
      const { error: consumeError } = await supabase.rpc("consume_generation", {
        p_platform: "brand_images",
        p_campaign_id: null,
        p_preview: "Brand image recommendations refresh",
      });
      if (consumeError) console.warn("consume_generation failed:", consumeError.message);
    } catch (e) {
      console.warn("consume_generation threw:", e);
    }

    return new Response(JSON.stringify({ images, searchTerms: terms, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});