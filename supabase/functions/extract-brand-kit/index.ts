import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Basic in-memory rate limit per IP (best-effort, per-instance).
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = 10;
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  HITS.set(ip, arr);
  return arr.length > MAX_HITS;
}

function normalizeUrl(input: string): URL | null {
  let s = (input || "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    return new URL(s);
  } catch {
    return null;
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace("#", "");
  if (m.length === 3) {
    const r = parseInt(m[0] + m[0], 16);
    const g = parseInt(m[1] + m[1], 16);
    const b = parseInt(m[2] + m[2], 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r, g, b };
  }
  if (m.length === 6) {
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return null;
    return { r, g, b };
  }
  return null;
}

function normalizeHex(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const toH = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toH(rgb.r)}${toH(rgb.g)}${toH(rgb.b)}`.toUpperCase();
}

function colorDistance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function isNearGreyOrExtreme(rgb: { r: number; g: number; b: number }): boolean {
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  const sat = max - min;
  if (sat < 14 && (max > 240 || max < 20)) return true; // pure white/black
  return false;
}

function extractColors(html: string, css: string): string[] {
  const blob = `${html}\n${css}`;
  const counts = new Map<string, number>();
  // hex
  const hexRe = /#([0-9a-f]{6}|[0-9a-f]{3})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = hexRe.exec(blob)) !== null) {
    const hex = normalizeHex(m[0]);
    if (!hex) continue;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  // rgb()
  const rgbRe = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;
  while ((m = rgbRe.exec(blob)) !== null) {
    const r = +m[1], g = +m[2], b = +m[3];
    if ([r, g, b].some((n) => n < 0 || n > 255)) continue;
    const toH = (n: number) => n.toString(16).padStart(2, "0");
    const hex = `#${toH(r)}${toH(g)}${toH(b)}`.toUpperCase();
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }

  // filter & rank
  const ranked = [...counts.entries()]
    .map(([hex, count]) => ({ hex, count, rgb: hexToRgb(hex)! }))
    .filter((c) => c.rgb && !isNearGreyOrExtreme(c.rgb))
    .sort((a, b) => b.count - a.count);

  // dedupe near-identical (distance < 30)
  const picked: typeof ranked = [];
  for (const c of ranked) {
    if (picked.some((p) => colorDistance(p.rgb, c.rgb) < 30)) continue;
    picked.push(c);
    if (picked.length >= 6) break;
  }
  return picked.map((c) => c.hex);
}

function extractFonts(html: string, css: string): { heading: string; body: string; all: string[] } {
  const blob = `${html}\n${css}`;
  const families = new Set<string>();
  const ffRe = /font-family\s*:\s*([^;{}"]+)/gi;
  let m: RegExpExecArray | null;
  const ordered: string[] = [];
  while ((m = ffRe.exec(blob)) !== null) {
    const list = m[1]
      .split(",")
      .map((s) => s.trim().replace(/['"]/g, ""))
      .filter(Boolean)
      .filter((s) => !/^(inherit|initial|unset|sans-serif|serif|monospace|system-ui|ui-sans-serif|ui-serif|ui-monospace|-apple-system|BlinkMacSystemFont)$/i.test(s));
    for (const f of list) {
      if (!families.has(f)) {
        families.add(f);
        ordered.push(f);
      }
    }
  }
  // google fonts link
  const gfRe = /fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/gi;
  while ((m = gfRe.exec(blob)) !== null) {
    const name = decodeURIComponent(m[1].split(":")[0].replace(/\+/g, " "));
    if (name && !families.has(name)) {
      families.add(name);
      ordered.push(name);
    }
  }

  const heading = ordered[0] || "Inter";
  const body = ordered[1] || ordered[0] || "Inter";
  return { heading, body, all: ordered.slice(0, 8) };
}

function abs(url: string, origin: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${origin}${url}`;
  return `${origin}/${url}`;
}

function extractLogo(html: string, origin: string): string {
  // common patterns: <img class="logo" />, alt="logo", header img, og:image as fallback
  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
  const logoImg =
    html.match(/<img[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i)?.[1] ??
    html.match(/<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["']/i)?.[1] ??
    html.match(/<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i)?.[1];
  const appleIcon = html.match(/<link[^>]*rel=["']apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1];
  const favicon = html.match(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1];
  const pick = logoImg || appleIcon || ogImage || favicon || "/favicon.ico";
  return abs(pick, origin);
}

function extractSiteName(html: string): string {
  return (
    html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.split(/[|·\-—]/)[0].trim() ||
    ""
  );
}

async function fetchText(url: string, timeoutMs = 8000): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MOXIEMO-BrandKit/1.0)" },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    if (rateLimited(ip)) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url } = await req.json().catch(() => ({ url: "" }));
    const parsed = normalizeUrl(url || "");
    if (!parsed) {
      return new Response(JSON.stringify({ error: "invalid_url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await fetchText(parsed.toString());
    if (!html) {
      return new Response(
        JSON.stringify({
          siteName: parsed.hostname,
          logo: `${parsed.origin}/favicon.ico`,
          colors: [],
          fonts: { heading: "Inter", body: "Inter", all: [] },
          partial: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // pull up to 3 stylesheet hrefs
    const cssLinks: string[] = [];
    const linkRe = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi;
    let lm: RegExpExecArray | null;
    while ((lm = linkRe.exec(html)) !== null && cssLinks.length < 3) {
      cssLinks.push(abs(lm[1], parsed.origin));
    }
    const cssBlobs = await Promise.all(cssLinks.map((u) => fetchText(u, 5000)));
    const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n");
    const css = `${inlineStyles}\n${cssBlobs.join("\n")}`;

    const colors = extractColors(html, css);
    const fonts = extractFonts(html, css);
    const logo = extractLogo(html, parsed.origin);
    const siteName = extractSiteName(html) || parsed.hostname;

    return new Response(
      JSON.stringify({
        siteName,
        logo,
        colors,
        fonts,
        partial: colors.length === 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});