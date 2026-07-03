import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData } = await supabase.auth.getUser(jwt);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { query, page } = await req.json().catch(() => ({ query: "", page: 1 }));
    const q = String(query ?? "").trim();
    const pageNum = Math.max(1, Math.min(50, Number.isFinite(Number(page)) ? Number(page) : 1));
    if (!q) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pexelsRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=12&page=${pageNum}`,
      { headers: { Authorization: PEXELS_API_KEY } },
    );
    if (!pexelsRes.ok) {
      const text = await pexelsRes.text();
      return new Response(JSON.stringify({ error: "pexels_failed", detail: text }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await pexelsRes.json();
    const results = (data?.photos ?? []).map((p: any) => ({
      id: p.id,
      thumbnailUrl: p.src?.medium,
      fullUrl: p.src?.large2x ?? p.src?.large,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
    }));
    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});