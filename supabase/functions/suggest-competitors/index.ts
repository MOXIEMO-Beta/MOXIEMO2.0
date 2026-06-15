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
  // Podcast hosts
  "redcircle.com", "ivypodcast.com", "buzzsprout.com", "libsyn.com",
  "anchor.fm", "podbean.com", "simplecast.com", "transistor.fm",
  "spotify.com", "apple.com", "podcasts.apple.com", "soundcloud.com",
  // Link-in-bio & scheduling
  "linktr.ee", "beacons.ai", "linkin.bio", "later.com", "buffer.com",
  "hootsuite.com", "calendly.com", "cal.com", "savvycal.com",
  // App stores / generic platforms
  "play.google.com", "apps.apple.com", "producthunt.com", "notion.so",
  "substack.com", "wordpress.com", "wix.com", "squarespace.com",
  "shopify.com", "webflow.com", "canva.com", "figma.com",
  // News / PR / directories
  "prnewswire.com", "businesswire.com", "yelp.co.uk", "trustpilot.com",
  "clutch.co", "thumbtack.com", "houzz.com",
]);

type SerperItem = { link: string; title?: string; snippet?: string };

// Detect referral/tracking/affiliate URLs that must never count as competitors.
const REF_PATH_RE = /\/(?:ref|refer|referral|aff|affiliate|invite|partners?|share)(?:\/|$|\?)/i;
const REF_SUBDOMAIN_RE = /^(?:ref|refer|referral|go|track|click|aff|affiliate|share|link|partners?|invite)\./i;
const TRACKING_PARAMS = ["ref", "ref_src", "referral", "aff", "affiliate", "fpr", "via", "partner"];

function isReferralLink(rawLink: string): boolean {
  try {
    const u = new URL(rawLink);
    if (REF_SUBDOMAIN_RE.test(u.hostname)) return true;
    if (REF_PATH_RE.test(u.pathname)) return true;
    for (const k of u.searchParams.keys()) {
      const lk = k.toLowerCase();
      if (lk.startsWith("utm_")) return true;
      if (TRACKING_PARAMS.includes(lk)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function resolveRedirect(rawLink: string): Promise<string> {
  try {
    const r = await fetch(rawLink, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MoxiemoAudit/1.0)" },
    });
    return r.url || rawLink;
  } catch {
    return rawLink;
  }
}

async function searchSerper(query: string): Promise<SerperItem[]> {
  const key = Deno.env.get("SERPER_API_KEY");
  if (!key) return [];
  try {
    const r = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 10 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return [];
    const data = await r.json();
    const items: any[] = data?.organic ?? [];
    return items
      .map((i) => ({ link: i.link, title: i.title, snippet: i.snippet }))
      .filter((i) => Boolean(i.link));
  } catch { return []; }
}

function stripFences(t: string): string {
  return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

async function callClaude(system: string, user: string, maxTokens = 400): Promise<string | null> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return null;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: maxTokens,
        temperature: 0.2,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
      console.warn("claude error", r.status, await r.text());
      return null;
    }
    const data = await r.json();
    return data?.content?.[0]?.text ?? null;
  } catch (e) {
    console.warn("claude throw", String(e));
    return null;
  }
}

async function buildQueries(ctx: {
  brand_name: string; what_you_do: string; who_you_serve: string; location: string;
}): Promise<string[]> {
  const system = `You build Google search queries that surface direct competitors of a business.
A direct competitor is a similar kind of business serving a similar kind of customer.
Return strictly JSON: {"queries": ["...", "..."]} with one or two queries.
Queries should describe the category and customer (for example "restaurant brand strategy agency"),
not the brand name. No quotes, no site: operators, no boolean syntax. Lowercase, plain words.`;
  const user = JSON.stringify(ctx);
  const txt = await callClaude(system, user, 300);
  const fallback = [[ctx.what_you_do, "for", ctx.who_you_serve, ctx.location].filter(Boolean).join(" ").trim()].filter(Boolean);
  if (!txt) return fallback;
  try {
    const parsed = JSON.parse(stripFences(txt));
    const qs: string[] = Array.isArray(parsed?.queries) ? parsed.queries.filter((q: any) => typeof q === "string" && q.trim()) : [];
    return qs.slice(0, 2).length ? qs.slice(0, 2) : fallback;
  } catch {
    return fallback;
  }
}

function isSelfDomain(candidate: string, own: string): boolean {
  if (!own) return false;
  if (candidate === own) return true;
  return candidate.endsWith("." + own);
}

async function rankCandidates(
  ctx: any,
  candidates: { domain: string; title?: string; snippet?: string }[],
): Promise<string[]> {
  if (candidates.length === 0) return [];
  const system = `You filter a list of candidate domains down to GENUINE DIRECT competitors of a given business.
A direct competitor is a similar kind of business serving a similar kind of customer with a similar offer.
You may ONLY choose domains from the provided list. Do not invent or modify domains.

EXCLUDE aggressively:
- Platforms, tools, marketplaces, directories, news outlets, social networks, blogs.
- Adjacent-category businesses that happen to share a keyword but solve a different job. For example,
  an email-to-calendar tool is NOT competing with an event ticketing platform; a calendar app is NOT
  competing with a project management suite; a brand strategy consultancy is NOT competing with a
  logo-design freelancer marketplace.
- Referral, affiliate, or tracking domains.

Prefer truthful scarcity. If only one or two domains are genuine peers, return only those. If none qualify,
return {"domains": []}. Do not pad the list to reach 5.

Return strictly JSON: {"domains": ["a.com", "b.com"]} ranked best first, maximum 5.`;
  const user = JSON.stringify({ brand: ctx, candidates });
  const txt = await callClaude(system, user, 500);
  if (!txt) return [];
  let parsed: any;
  try { parsed = JSON.parse(stripFences(txt)); }
  catch {
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return [];
    try { parsed = JSON.parse(m[0]); } catch { return []; }
  }
  const allowed = new Set(candidates.map((c) => c.domain));
  const out: string[] = [];
  for (const d of (parsed?.domains ?? [])) {
    if (typeof d !== "string") continue;
    const norm = normalizeDomain(d);
    if (allowed.has(norm) && !out.includes(norm)) out.push(norm);
    if (out.length >= 5) break;
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const what_you_do: string = body?.what_you_do ?? "";
    const who_you_serve: string = body?.who_you_serve ?? "";
    const location: string = body?.location ?? "";
    const brand_name: string = body?.brand_name ?? "";
    const url: string = body?.url ?? "";
    const ownDomain = normalizeDomain(url);

    const key = Deno.env.get("SERPER_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ suggested: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!what_you_do && !who_you_serve && !brand_name) {
      return new Response(JSON.stringify({ suggested: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const queries = await buildQueries({ brand_name, what_you_do, who_you_serve, location });
    const results: SerperItem[] = [];
    for (const q of queries) {
      const items = await searchSerper(q);
      results.push(...items);
    }

    // Resolve referral / redirect links to their real destinations.
    const resolved = await Promise.all(
      results.map(async (it) => {
        if (!it.link) return it;
        if (isReferralLink(it.link)) {
          const real = await resolveRedirect(it.link);
          if (isReferralLink(real)) return null; // still a ref/affiliate after follow
          return { ...it, link: real };
        }
        return it;
      }),
    );

    // Deterministic filter
    const seen = new Set<string>();
    const candidates: { domain: string; title?: string; snippet?: string }[] = [];
    for (const it of resolved) {
      if (!it) continue;
      const d = normalizeDomain(it.link);
      if (!d || seen.has(d)) continue;
      if (BAD_DOMAINS.has(d)) continue;
      if (isSelfDomain(d, ownDomain)) continue;
      // Skip anything still ref-shaped after resolution.
      try {
        const u = new URL(it.link);
        if (REF_SUBDOMAIN_RE.test(u.hostname) || REF_PATH_RE.test(u.pathname)) continue;
      } catch { /* ignore */ }
      seen.add(d);
      candidates.push({ domain: d, title: it.title, snippet: it.snippet });
    }

    const suggested = await rankCandidates(
      { brand_name, what_you_do, who_you_serve, location },
      candidates,
    );

    return new Response(JSON.stringify({ suggested }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ suggested: [], error: String(e) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});