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

function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function isExtremeLightness(rgb: { r: number; g: number; b: number }): boolean {
  const { l } = rgbToHsl(rgb);
  return l > 93 || l < 8;
}

// Strip CSS blocks whose only purpose is declaring WordPress preset/global/style custom properties.
// Any color that lives exclusively inside `--wp--preset--color--*`, `--wp--global--*`,
// `--wp--style--*` declarations should be excluded from the palette.
function stripWpPresetDeclarations(css: string): string {
  return css.replace(
    /--wp--(?:preset|global|style)--[a-z0-9-]+\s*:\s*[^;}]+;?/gi,
    "",
  );
}

// Identify CSS rule blocks that target prominent, rendered elements. We use these as a proxy
// for "computed styles on visible elements" since we can't run a browser in the edge function.
const PROMINENT_SELECTORS =
  /(header|nav|\.nav|\.navbar|\.site-header|\.hero|\.banner|\.btn|\.button|\.cta|a\.button|\bbutton\b|h1|h2|footer|\.site-footer|body)\b/i;

function extractProminentCssBlocks(css: string): string {
  const blocks: string[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    const selector = m[1];
    const body = m[2];
    if (PROMINENT_SELECTORS.test(selector)) {
      // weight prominent blocks by repeating them so frequency reflects dominance
      blocks.push(body, body, body);
    }
  }
  return blocks.join("\n");
}

function extractInlineStyledHtml(html: string): string {
  // inline style attributes on rendered elements
  const styles: string[] = [];
  const re = /style\s*=\s*"([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) styles.push(m[1]);
  return styles.join("\n");
}

type RGB = { r: number; g: number; b: number };
type Candidate = { hex: string; rgb: RGB; count: number };

function collectColors(blob: string): Map<string, number> {
  const counts = new Map<string, number>();
  // only count colors that appear as actual property values (background-color, color, border-color, border, background)
  const propRe = /\b(?:background(?:-color)?|color|border(?:-(?:top|right|bottom|left))?(?:-color)?|outline-color|fill|stroke)\s*:\s*([^;}]+)[;}]/gi;
  let m: RegExpExecArray | null;
  while ((m = propRe.exec(blob)) !== null) {
    const value = m[1];
    const hexRe = /#([0-9a-f]{6}|[0-9a-f]{3})\b/gi;
    let hm: RegExpExecArray | null;
    while ((hm = hexRe.exec(value)) !== null) {
      const hex = normalizeHex(hm[0]);
      if (hex) counts.set(hex, (counts.get(hex) ?? 0) + 1);
    }
    const rgbRe = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;
    while ((hm = rgbRe.exec(value)) !== null) {
      const r = +hm[1], g = +hm[2], b = +hm[3];
      if ([r, g, b].some((n) => n < 0 || n > 255)) continue;
      const toH = (n: number) => n.toString(16).padStart(2, "0");
      const hex = `#${toH(r)}${toH(g)}${toH(b)}`.toUpperCase();
      counts.set(hex, (counts.get(hex) ?? 0) + 1);
    }
  }
  return counts;
}

function hexDelta(a: RGB, b: RGB): number {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
}

type ColorRole = "Primary" | "Secondary" | "Accent" | "Neutral" | "Support";

type RoledColor = {
  role: ColorRole;
  hex: string;
  rgb: RGB;
};

function extractColors(html: string, css: string): { palette: string[]; roles: RoledColor[] } {
  // 1. Strip WP preset/global/style custom-property declarations entirely so colors that
  //    exist ONLY as variable declarations never enter the candidate pool.
  const cleanedCss = stripWpPresetDeclarations(css);
  const cleanedHtml = stripWpPresetDeclarations(html);

  // 2. Weight blocks that target rendered/visible elements (header, nav, hero, buttons, h1/h2, footer).
  const prominent = extractProminentCssBlocks(cleanedCss);
  const inline = extractInlineStyledHtml(cleanedHtml);
  const blob = `${cleanedCss}\n${prominent}\n${inline}`;

  const counts = collectColors(blob);

  // 3. Build candidate list, filter extreme lightness.
  const all: Candidate[] = [...counts.entries()]
    .map(([hex, count]) => ({ hex, count, rgb: hexToRgb(hex)! }))
    .filter((c) => c.rgb);

  const midRange = all.filter((c) => !isExtremeLightness(c.rgb));

  let working: Candidate[];
  if (midRange.length > 0) {
    working = midRange;
  } else {
    // Fallback: include the two most visually distinct extreme colors.
    const sorted = [...all].sort((a, b) => b.count - a.count);
    const pick: Candidate[] = [];
    for (const c of sorted) {
      if (pick.length === 0 || pick.every((p) => hexDelta(p.rgb, c.rgb) > 60)) {
        pick.push(c);
      }
      if (pick.length >= 2) break;
    }
    working = pick;
  }

  // 4. Deduplicate by visual similarity (hex-delta < 15), keeping the higher-count rep.
  working.sort((a, b) => b.count - a.count);
  const deduped: Candidate[] = [];
  for (const c of working) {
    const near = deduped.find((p) => hexDelta(p.rgb, c.rgb) < 15);
    if (near) {
      near.count += c.count;
      continue;
    }
    deduped.push({ ...c });
  }

  deduped.sort((a, b) => b.count - a.count);
  const picked = deduped.slice(0, 6);

  // 5. Assign roles by dominance.
  const roleNames: ColorRole[] = ["Primary", "Secondary", "Accent", "Neutral", "Support", "Support"];
  const roles: RoledColor[] = picked.map((c, i) => ({
    role: roleNames[i] ?? "Support",
    hex: c.hex,
    rgb: c.rgb,
  }));

  return { palette: picked.map((c) => c.hex), roles };
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

    const { palette: colors, roles: colorRoles } = extractColors(html, css);
    const fonts = extractFonts(html, css);
    const logo = extractLogo(html, parsed.origin);
    const siteName = extractSiteName(html) || parsed.hostname;

    return new Response(
      JSON.stringify({
        siteName,
        logo,
        colors,
        colorRoles,
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