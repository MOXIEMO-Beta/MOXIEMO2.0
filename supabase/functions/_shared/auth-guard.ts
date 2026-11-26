import { createClient } from "npm:@supabase/supabase-js@2";

export interface AuthUser {
  id: string;
  email: string | undefined;
}

/**
 * Verifies the JWT from the Authorization header and returns the authenticated user.
 * Returns null if the token is missing, invalid, or expired.
 * Use this at the top of every edge function that calls Claude, Stripe, or writes data.
 */
export async function requireAuth(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  return { id: user.id, email: user.email };
}

export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
