// Shared scrape + signal helpers for the Brand Audit pipeline.
// Reuses ideas from discovery-prefill (page text) and extract-brand-kit
// (deterministic visual facts) without duplicating their behaviors.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUBPATHS = [
  "/", "/about", "/about-us", "/services", "/work", "/work-with-me",
  "/blog", "/contact", "/pricing",
];

export type RawScrape = {
  url: string;
  origin: string;
  domain: string;
  pages: { url: string; title: string | null; h1: string | null; text: string; html: string; rendered?: boolean }[];
  homepage_html: string;
  links: string[];
  social_links: string[];
  fetched_at: string;
  fetch_ok: boolean;
  render_ok?: boolean;
  render_reason?: string;
  render_method?: "firecrawl" | "raw" | "mixed";
};

export function normalizeDomain(input: string): string {
  let s = (input || "").trim().toLowerCase();
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function toUrl(input: string): string | null {
  let s = (input || "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try { return new URL(s).toString(); } catch { return null; }
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchHtml(url: string, timeoutMs = 8000): Promise<string> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MoxiemoAudit/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) return "";
    return await r.text();
  } catch { return ""; }
}

// Firecrawl-rendered fetch. Returns rendered HTML when the key is available
// and the page renders. Returns null on any failure so callers fall back to
// the raw fetch path.
async function firecrawlRenderedHtml(url: string, timeoutMs = 20000): Promise<string | null> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return null;
  try {
    const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        formats: ["html"],
        onlyMainContent: false,
        waitFor: 2500,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) return null;
    const data = await r.json().catch(() => null);
    const html: string | undefined = data?.data?.html ?? data?.html ?? data?.data?.rawHtml ?? data?.rawHtml;
    return typeof html === "string" && html.length > 0 ? html : null;
  } catch {
    return null;
  }
}

// Render-failure detection. Looks at the assembled pages and the homepage
// HTML to decide whether body content is trustworthy. When false, the audit
// must refuse body-dependent negative claims.
const SPA_MARKERS: Array<{ re: RegExp; label: string }> = [
  { re: /lovable\.dev|lovableproject|lovable-uploads/i, label: "Lovable" },
  { re: /gpt-engineer/i, label: "gpt-engineer" },
  { re: /(static\.parastorage\.com|wix-warmup|wixstatic|_wixCIDX|wix\.com\/run)/i, label: "Wix" },
  { re: /(squarespace\.com|static1\.squarespace|sqs-cdn)/i, label: "Squarespace" },
  { re: /(framer\.com|framerstatic|framerusercontent)/i, label: "Framer" },
  { re: /webflow\.com|website-files\.com/i, label: "Webflow" },
];

const BODY_THRESHOLD = 500;

function detectRender(pages: RawScrape["pages"], homepageHtml: string): { render_ok: boolean; render_reason: string } {
  const bodyLens = pages.map((p) => (p.text || "").length);
  const maxBody = bodyLens.reduce((m, n) => Math.max(m, n), 0);

  // Only head metadata captured / rendered body below threshold everywhere.
  if (maxBody < BODY_THRESHOLD) {
    return { render_ok: false, render_reason: `rendered body below threshold (max ${maxBody} chars)` };
  }

  // Every probed route returns an identical shell title with no distinct body.
  const titles = new Set(pages.map((p) => (p.title || "").trim()).filter(Boolean));
  const bodyFingerprints = new Set(pages.map((p) => (p.text || "").slice(0, 200)));
  if (pages.length >= 2 && titles.size <= 1 && bodyFingerprints.size <= 1) {
    return { render_ok: false, render_reason: "every probed route returned an identical shell" };
  }

  // Known CSR markers + bare React root with no SSR content.
  for (const { re, label } of SPA_MARKERS) {
    if (re.test(homepageHtml)) {
      // Only flag when the rendered body is also thin or templated.
      if (maxBody < 1200) {
        return { render_ok: false, render_reason: `client-rendered (${label}) and rendered body thin` };
      }
    }
  }
  const bareRoot =
    /<div[^>]+id=["']root["'][^>]*>\s*<\/div>/i.test(homepageHtml) ||
    /<div[^>]+id=["']__next["'][^>]*>\s*<\/div>/i.test(homepageHtml) ||
    /<div[^>]+id=["']app["'][^>]*>\s*<\/div>/i.test(homepageHtml);
  if (bareRoot && maxBody < 1200) {
    return { render_ok: false, render_reason: "bare client-render root with no server-rendered content" };
  }

  return { render_ok: true, render_reason: "rendered body present across routes" };
}

function pickTitle(html: string): string | null {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
}
function pickH1(html: string): string | null {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "";
  return m ? htmlToText(m) : null;
}
function pickMeta(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`, "i");
  return html.match(re)?.[1] ?? null;
}

export async function scrapePrimary(inputUrl: string): Promise<RawScrape> {
  const u = toUrl(inputUrl);
  const empty: RawScrape = {
    url: inputUrl, origin: "", domain: normalizeDomain(inputUrl),
    pages: [], homepage_html: "", links: [], social_links: [],
    fetched_at: new Date().toISOString(), fetch_ok: false,
    render_ok: false, render_reason: "fetch failed", render_method: "raw",
  };
  if (!u) return empty;
  const parsed = new URL(u);
  const origin = parsed.origin;
  const domain = parsed.hostname.replace(/^www\./, "");

  // Try a JS-rendered fetch first when the key is available; fall back to raw.
  let homepageRendered = await firecrawlRenderedHtml(u);
  let homepage_html = homepageRendered ?? await fetchHtml(u);
  let homepageWasRendered = !!homepageRendered;
  // If raw is suspiciously thin and Firecrawl is available, try once more.
  if (!homepageWasRendered && homepage_html && htmlToText(homepage_html).length < BODY_THRESHOLD) {
    const retry = await firecrawlRenderedHtml(u);
    if (retry) { homepage_html = retry; homepageWasRendered = true; }
  }
  if (!homepage_html) return { ...empty, origin, domain };

  const subResults = await Promise.allSettled(
    SUBPATHS.filter((p) => p !== "/").map(async (p) => {
      const target = `${origin}${p}`;
      let renderedFlag = false;
      let html = await fetchHtml(target);
      if (html && htmlToText(html).length < BODY_THRESHOLD) {
        const r = await firecrawlRenderedHtml(target, 15000);
        if (r) { html = r; renderedFlag = true; }
      } else if (!html) {
        const r = await firecrawlRenderedHtml(target, 15000);
        if (r) { html = r; renderedFlag = true; }
      }
      return { p, html, rendered: renderedFlag };
    }),
  );

  const pages: RawScrape["pages"] = [{
    url: u, title: pickTitle(homepage_html), h1: pickH1(homepage_html),
    text: htmlToText(homepage_html).slice(0, 8000), html: homepage_html, rendered: homepageWasRendered,
  }];
  for (const r of subResults) {
    if (r.status === "fulfilled" && r.value.html) {
      pages.push({
        url: `${origin}${r.value.p}`,
        title: pickTitle(r.value.html),
        h1: pickH1(r.value.html),
        text: htmlToText(r.value.html).slice(0, 6000),
        html: r.value.html, rendered: !!r.value.rendered,
      });
    }
  }

  const blob = pages.map((p) => p.html).join("\n");
  const links = Array.from(new Set(
    [...blob.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]).filter((h) => /^https?:\/\//i.test(h)),
  )).slice(0, 200);
  const social_links = links.filter((h) =>
    /(linkedin|twitter|x\.com|instagram|facebook|youtube|tiktok|threads)\.com/i.test(h));

  const { render_ok, render_reason } = detectRender(pages, homepage_html);
  const anyRendered = pages.some((p) => p.rendered);
  const allRendered = pages.every((p) => p.rendered);
  const render_method: RawScrape["render_method"] =
    allRendered ? "firecrawl" : anyRendered ? "mixed" : "raw";

  // Strip giant html before returning to keep cache small.
  return {
    url: u, origin, domain,
    pages: pages.map((p) => ({ ...p, html: "" })),
    homepage_html,
    links, social_links,
    fetched_at: new Date().toISOString(), fetch_ok: true,
    render_ok, render_reason, render_method,
  };
}

export type DeterministicFacts = {
  logo_present: boolean;
  logo_kind: "image" | "wordmark" | null;
  colors: string[];
  fonts: string[];
  imagery: "stock_likely" | "custom_likely" | "unknown";
  social_links: string[];
  blog_present: boolean;
  blog_post_links: string[];
  blog_latest_date: string | null;
  newsletter_capture: boolean;
  waitlist_present: boolean;
  named_person: {
    detected: boolean;
    name_guess: string | null;
    about_person_section: boolean;
    personal_profile_links: string[];
  };
  seo: {
    title: string | null;
    meta_description: string | null;
    sitemap_present: boolean;
    structured_data: boolean;
  };
  total_word_count: number;
};

function extractColors(html: string): string[] {
  const counts = new Map<string, number>();
  const re = /#([0-9a-f]{6})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const hex = `#${m[1].toUpperCase()}`;
    if (/^#(FFFFFF|000000|FFF|000)$/i.test(hex)) continue;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map((c) => c[0]);
}
function extractFonts(html: string): string[] {
  const families = new Set<string>();
  const re = /font-family\s*:\s*([^;}"']+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    for (const f of m[1].split(",")) {
      const name = f.trim().replace(/['"]/g, "");
      if (!name) continue;
      if (/^(inherit|initial|unset|sans-serif|serif|monospace|system-ui|ui-sans-serif|ui-serif|ui-monospace|-apple-system|BlinkMacSystemFont)$/i.test(name)) continue;
      families.add(name);
    }
  }
  const gf = [...html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi)];
  for (const g of gf) families.add(decodeURIComponent(g[1].split(":")[0].replace(/\+/g, " ")));
  return [...families].slice(0, 8);
}

export async function deterministicFacts(raw: RawScrape): Promise<DeterministicFacts> {
  const html = raw.homepage_html || "";
  const allText = raw.pages.map((p) => p.text).join("\n");
  const allHtml = html; // homepage only is fine for visual facts

  // Logo detection: image first, then styled text wordmark fallback.
  const hasImageLogo =
    /<img[^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["']/i.test(html) ||
    /<svg[^>]*(?:class|id|aria-label)=["'][^"']*logo[^"']*["']/i.test(html);
  // Heuristic wordmark: an anchor/header element near the top that contains
  // only short text (likely the brand name) wrapped with class names like
  // logo/wordmark/brand.
  const wordmarkRe = /<(?:a|div|span)[^>]*class=["'][^"']*(?:wordmark|brand|site-?title|logo)[^"']*["'][^>]*>([\s\S]{0,120}?)<\/(?:a|div|span)>/i;
  const wordmarkMatch = !hasImageLogo ? html.match(wordmarkRe) : null;
  const wordmarkText = wordmarkMatch ? htmlToText(wordmarkMatch[1]) : "";
  const hasWordmark = !hasImageLogo && wordmarkText.length > 0 && wordmarkText.length <= 40 && !/<img/i.test(wordmarkMatch?.[0] ?? "");
  const logo_present = hasImageLogo || hasWordmark;
  const logo_kind: "image" | "wordmark" | null = hasImageLogo ? "image" : hasWordmark ? "wordmark" : null;

  const colors = extractColors(allHtml);
  const fonts = extractFonts(allHtml);

  const imgSrcs = [...html.matchAll(/<img[^>]*src=["']([^"']+)["']/gi)].map((m) => m[1]);
  const stockHits = imgSrcs.filter((s) =>
    /(unsplash|pexels|shutterstock|istockphoto|gettyimages|pixabay)/i.test(s)).length;
  const imagery: DeterministicFacts["imagery"] =
    imgSrcs.length === 0 ? "unknown"
      : stockHits / Math.max(1, imgSrcs.length) > 0.3 ? "stock_likely"
      : "custom_likely";

  // Blog detection requires REAL evidence (post links/titles/dates), not just
  // a /blog route returning 200. SPA catch-all 200s and empty "coming soon"
  // blog pages must resolve to blog_present = false.
  const blogPage = raw.pages.find((p) => /\/blog/i.test(p.url));
  const blogPostLinkSet = new Set<string>();
  for (const l of raw.links) {
    // post-shaped: /blog/<slug> where slug has more than just a section root
    const m = l.match(/\/blog\/([a-z0-9][a-z0-9-_/]{3,})/i);
    if (m && !/\/(page|category|tag|author)\//i.test(l)) {
      blogPostLinkSet.add(l);
    }
  }
  const blog_post_links = Array.from(blogPostLinkSet).slice(0, 20);
  const dateRe = /(\b\d{4}-\d{2}-\d{2}\b)|(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s*\d{4}\b)/gi;
  const blogDates = blogPage ? Array.from(blogPage.text.matchAll(dateRe)).map((m) => m[0]) : [];
  const blog_latest_date: string | null = blogDates[0] ?? null;
  // Real blog = at least 2 post links OR (blog page + at least one date).
  const blog_present =
    blog_post_links.length >= 2 ||
    (!!blogPage && blogDates.length >= 1);

  // Distinguish waitlist signup from a true newsletter capture.
  const allTextLower = (allText + " " + html).toLowerCase();
  const waitlist_present =
    /\bwait[- ]?list\b/.test(allTextLower) ||
    /join the waitlist/.test(allTextLower) ||
    /request (?:early )?access/.test(allTextLower) ||
    /get early access/.test(allTextLower);
  const newsletterHint =
    /\bnewsletter\b/.test(allTextLower) ||
    /subscribe (?:to|for) (?:our|the|my) (?:newsletter|updates|posts)/.test(allTextLower) ||
    /join (?:our|the|my) (?:newsletter|list|community)/.test(allTextLower);
  const hasEmailInput = /<input[^>]*type=["']email["']/i.test(html);
  // Newsletter is true only if there's a newsletter-shaped cue and it is NOT
  // the waitlist signup. A bare email input + waitlist copy must NOT trip
  // newsletter_capture.
  const newsletter_capture = newsletterHint && !waitlist_present && hasEmailInput;

  const personalLinks = raw.social_links.filter((l) => /(linkedin\.com\/in\/|twitter\.com\/|x\.com\/|instagram\.com\/)/i.test(l));
  const aboutPage = raw.pages.find((p) => /\/about/i.test(p.url));
  const aboutText = aboutPage?.text ?? "";
  const founderHint = /(founder|owner|i am |i'm |my story|about me|hi,?\s*i)/i.test(aboutText) || /(founder|owner|about me)/i.test(html);
  const nameMatch = aboutText.match(/(?:i am|i'm|hi,?\s*i'?m)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/);
  const named_person = {
    detected: founderHint || personalLinks.length > 0,
    name_guess: nameMatch?.[1] ?? null,
    about_person_section: !!aboutPage && founderHint,
    personal_profile_links: personalLinks.slice(0, 5),
  };

  let sitemap_present = false;
  try {
    const r = await fetch(`${raw.origin}/sitemap.xml`, { signal: AbortSignal.timeout(4000) });
    sitemap_present = r.ok;
  } catch { /* ignore */ }

  const seo = {
    title: pickTitle(html),
    meta_description: pickMeta(html, "description"),
    sitemap_present,
    structured_data: /application\/ld\+json/i.test(html),
  };

  const total_word_count = allText.split(/\s+/).filter(Boolean).length;

  return {
    logo_present, logo_kind, colors, fonts, imagery,
    social_links: raw.social_links.slice(0, 10),
    blog_present, blog_post_links, blog_latest_date,
    newsletter_capture, waitlist_present,
    named_person, seo, total_word_count,
  };
}

// Cache helpers
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getCachedScrape(domain: string): Promise<RawScrape | null> {
  if (!domain) return null;
  try {
    const sb = adminClient();
    const { data, error } = await sb
      .from("scrape_cache")
      .select("data, scraped_at")
      .eq("domain", domain)
      .maybeSingle();
    if (error || !data) return null;
    const age = Date.now() - new Date(data.scraped_at as string).getTime();
    if (age > TTL_MS) return null;
    return data.data as RawScrape;
  } catch { return null; }
}

export async function putCachedScrape(domain: string, raw: RawScrape): Promise<void> {
  if (!domain) return;
  try {
    const sb = adminClient();
    await sb.from("scrape_cache").upsert({
      domain, data: raw, scraped_at: new Date().toISOString(),
    }, { onConflict: "domain" });
  } catch (e) { console.warn("scrape_cache upsert failed", e); }
}

export async function getOrScrape(inputUrl: string): Promise<RawScrape> {
  const domain = normalizeDomain(inputUrl);
  const cached = await getCachedScrape(domain);
  if (cached) return cached;
  const raw = await scrapePrimary(inputUrl);
  if (raw.fetch_ok) await putCachedScrape(domain, raw);
  return raw;
}

// Quick competitor light scrape
export async function lightScrape(domain: string): Promise<{ domain: string; title: string | null; h1: string | null; first_line: string | null }> {
  const url = toUrl(domain);
  if (!url) return { domain, title: null, h1: null, first_line: null };
  const html = await fetchHtml(url, 6000);
  if (!html) return { domain, title: null, h1: null, first_line: null };
  const text = htmlToText(html);
  const first_line = text.split(/(?<=[.!?])\s+/)[0]?.slice(0, 240) ?? null;
  return { domain, title: pickTitle(html), h1: pickH1(html), first_line };
}