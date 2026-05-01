import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let html = "";
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; MOXIE/1.0)" },
        signal: AbortSignal.timeout(8000),
      });
      html = await res.text();
    } catch {
      return new Response(
        JSON.stringify({ siteName: "", logo: "", colors: [], favicon: "" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const siteName =
      html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"/i)?.[1] ??
      html
        .match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
        ?.split("|")[0]
        ?.split("-")[0]
        ?.trim() ??
      "";

    const ogImage =
      html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1] ?? "";
    const faviconRaw =
      html.match(/<link[^>]*rel="[^"]*icon[^"]*"[^>]*href="([^"]+)"/i)?.[1] ?? "/favicon.ico";
    const favicon = faviconRaw.startsWith("http")
      ? faviconRaw
      : `${parsedUrl.origin}${faviconRaw.startsWith("/") ? "" : "/"}${faviconRaw}`;
    const logo = ogImage || favicon;

    const themeColor =
      html.match(/<meta[^>]*name="theme-color"[^>]*content="([^"]+)"/i)?.[1] ?? "";
    const colors = [themeColor].filter(Boolean);

    return new Response(
      JSON.stringify({
        siteName,
        logo,
        colors,
        favicon: `${parsedUrl.origin}/favicon.ico`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ siteName: "", logo: "", colors: [], error: String(e) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});