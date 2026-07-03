import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
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

    const { imageUrl, postId } = await req.json().catch(() => ({}));
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "missing_image_url" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch bytes from Pexels server-side
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return new Response(JSON.stringify({ error: "download_failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const bytes = new Uint8Array(await imgRes.arrayBuffer());

    const path = `${user.id}/${Date.now()}-pexels.jpg`;
    const { error: upErr } = await supabase.storage
      .from("social-assets")
      .upload(path, bytes, { contentType, upsert: false });
    if (upErr) {
      return new Response(JSON.stringify({ error: "upload_failed", detail: upErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: pub } = supabase.storage.from("social-assets").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    // Register asset in library
    const { data: asset } = await supabase.from("social_media_assets").insert({
      user_id: user.id,
      url: publicUrl,
      filename: path,
      media_type: "image",
      size_bytes: bytes.byteLength,
    }).select().single();

    // Optionally attach to a post
    if (postId) {
      await supabase.from("social_posts")
        .update({ media_urls: [path] })
        .eq("id", postId)
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ ok: true, url: publicUrl, path, asset }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});