import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getOrScrape, deterministicFacts, lightScrape, normalizeDomain,
} from "../_shared/audit-scrape.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SIGNAL_SYSTEM = `You read raw data scraped from a brand's website and output a structured set of signals
that describe what is on the site. You describe, you do not evaluate. Do not score, rank,
or judge quality. Do not assign tiers. Another system does the judging. Your only job is to
turn raw page data into concise, accurate, evidence-bound signal fields.

RULES
- Describe only what is present in the provided data. If something is absent or unclear,
  use null or "not found". Never invent.
- Keep each field short and factual. Preserve specifics that matter, especially the actual
  homepage headline text and each competitor's actual headline and first line, so they can
  be quoted later.
- Booleans are strictly true or false based on the data.
- For model_type, infer from the signals. founder_led if a single named person clearly
  fronts the brand: a personal name as the brand, a founder photo and bio, first-person
  voice, a linked personal profile. business_model if it presents as a company or team with
  no single face. ambiguous if genuinely unclear.
- Do not fill the findability fields ranks_for_name, ranks_for_category, or
  ai_answer_presence. Those are set by a separate probe. You may describe seo_basics and
  local_signals from what you see.

OUTPUT
Return only JSON with this shape, nothing else:
{
  "signals": {
    "positioning": { "homepage_headline": null, "homepage_subhead": null, "named_audience": false, "stated_stance": false, "stance_detail": null },
    "messaging": { "tagline": null, "value_prop": null, "pillars": [], "tone_consistency": null },
    "brand_story": { "about_present": false, "narrative_vs_bio": null, "story_detail": null, "homepage_story_cues": false },
    "purpose": { "mission_present": false, "mission_detail": null, "values_specificity": null },
    "visual_identity": { "logo_present": false, "palette_discipline": null, "font_system": null, "imagery": null, "cross_page_consistency": null },
    "face_of_the_brand": { "named_founder_on_site": false, "about_person_section": false, "personal_brand_link": null, "bylines": false, "consistent_persona": null },
    "content_consistency": { "blog_present": false, "blog_recency": null, "case_studies_present": false, "social_rhythm": null, "newsletter_capture": false },
    "findability": { "seo_basics": null, "ranks_for_name": false, "ranks_for_category": null, "ai_answer_presence": null, "local_signals": null }
  },
  "competitor_signals": [ { "domain": "", "headline": "", "stance": "" } ],
  "model_type": "founder_led | business_model | ambiguous"
}`;

function stripFences(t: string): string {
  return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

async function callExtractor(userPayload: any): Promise<any | null> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return null;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      temperature: 0.2,
      system: SIGNAL_SYSTEM,
      messages: [{ role: "user", content: JSON.stringify(userPayload) }],
    }),
  });
  if (!r.ok) {
    console.warn("extractor anthropic error", r.status, await r.text());
    return null;
  }
  const data = await r.json();
  const text: string = data?.content?.[0]?.text ?? "";
  try { return JSON.parse(stripFences(text)); } catch {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  }
}

async function findabilityProbe(brandName: string, primaryDomain: string): Promise<{
  ranks_for_name: boolean | "not assessed";
  ranks_for_category: string | "not assessed";
  ai_answer_presence: string;
}> {
  const key = Deno.env.get("SERPER_API_KEY");
  if (!key || !brandName) {
    return { ranks_for_name: "not assessed" as const, ranks_for_category: "not assessed", ai_answer_presence: "not assessed" };
  }
  try {
    const r = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q: brandName, num: 10 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return { ranks_for_name: "not assessed", ranks_for_category: "not assessed", ai_answer_presence: "not assessed" };
    const data = await r.json();
    const items: any[] = data?.organic ?? [];
    const ranks_for_name = items.slice(0, 3).some((i) => normalizeDomain(i.link || "") === primaryDomain);
    return {
      ranks_for_name,
      ranks_for_category: "not assessed",
      ai_answer_presence: "not assessed",
    };
  } catch {
    return { ranks_for_name: "not assessed", ranks_for_category: "not assessed", ai_answer_presence: "not assessed" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const url: string = body?.url ?? "";
    const inputs: any = body?.inputs ?? {};
    if (!url) {
      return new Response(JSON.stringify({ error: "url required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Primary scrape (cached)
    const raw = await getOrScrape(url);
    const facts = await deterministicFacts(raw);

    // 2. Competitors light scrape (parallel)
    const competitors: string[] = Array.isArray(inputs?.competitors)
      ? inputs.competitors.filter((c: any) => typeof c === "string" && c.trim()).slice(0, 5)
      : [];
    const compResults = await Promise.all(competitors.map((c) => lightScrape(c).catch(() => null)));
    const compBrief = compResults.filter(Boolean);

    // 3. Signal extractor
    const extractorInput = {
      primary: {
        url: raw.url,
        domain: raw.domain,
        pages: raw.pages.map((p) => ({
          url: p.url, title: p.title, h1: p.h1, text: p.text.slice(0, 4000),
        })),
        deterministic: facts,
      },
      competitors: compBrief,
      inputs,
    };
    const extracted = await callExtractor(extractorInput);

    // 4. Low-data heuristic
    const low_data =
      !raw.fetch_ok ||
      raw.pages.length < 2 ||
      facts.total_word_count < 500;

    // 5. Findability probe
    const brandName = (inputs?.brand_name || extracted?.signals?.messaging?.tagline || raw.domain || "").toString();
    const probe = await findabilityProbe(brandName, raw.domain);

    // Assemble signals from extractor with deterministic overrides
    const baseSignals = extracted?.signals ?? {};
    const signals = {
      ...baseSignals,
      visual_identity: {
        ...(baseSignals.visual_identity ?? {}),
        logo_present: facts.logo_present,
      },
      content_consistency: {
        ...(baseSignals.content_consistency ?? {}),
        blog_present: facts.blog_present,
        blog_recency: facts.blog_latest_date ?? baseSignals.content_consistency?.blog_recency ?? null,
        newsletter_capture: facts.newsletter_capture,
      },
      face_of_the_brand: {
        ...(baseSignals.face_of_the_brand ?? {}),
        named_founder_on_site: facts.named_person.detected || !!(baseSignals.face_of_the_brand?.named_founder_on_site),
        about_person_section: facts.named_person.about_person_section || !!(baseSignals.face_of_the_brand?.about_person_section),
        personal_brand_link: facts.named_person.personal_profile_links[0] ?? baseSignals.face_of_the_brand?.personal_brand_link ?? null,
      },
      findability: {
        ...(baseSignals.findability ?? {}),
        seo_basics: baseSignals.findability?.seo_basics
          ?? (facts.seo.title && facts.seo.meta_description ? "title and meta description present" : "title or meta description missing"),
        ranks_for_name: probe.ranks_for_name as any,
        ranks_for_category: probe.ranks_for_category as any,
        ai_answer_presence: probe.ai_answer_presence,
        local_signals: baseSignals.findability?.local_signals ?? null,
      },
    };

    const payload = {
      inputs,
      model_type: extracted?.model_type ?? "ambiguous",
      low_data,
      signals,
      competitor_signals: extracted?.competitor_signals ?? compBrief.map((c) => ({
        domain: c!.domain, headline: c!.h1 ?? c!.title ?? "", stance: c!.first_line ?? "",
      })),
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});