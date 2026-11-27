import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type Ctx = { user: User | null; session: Session | null; loading: boolean; isAdmin: boolean };
const AuthContext = createContext<Ctx>({ user: null, session: null, loading: true, isAdmin: false });

async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return data?.is_admin === true;
}

// Read the stored Supabase session from localStorage synchronously so we can
// initialise without a network round-trip. Supabase stores the session under
// "sb-<project>-auth-token" (v2) or "supabase.auth.token" (v1).
function readStoredSession(): Session | null {
  try {
    const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "";
    const keys = projectRef
      ? [`sb-${projectRef}-auth-token`]
      : Object.keys(localStorage).filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { access_token?: string; expires_at?: number; user?: User };
      if (parsed?.access_token && parsed?.user) {
        // If the stored session is already expired, don't use it — let getSession() refresh.
        const expiresAt = parsed.expires_at ?? 0;
        if (expiresAt * 1000 > Date.now() + 5000) return parsed as unknown as Session;
      }
    }
  } catch { /* ignore */ }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialise synchronously from localStorage — zero flash/spinner for returning users.
  const [session, setSession] = useState<Session | null>(() => readStoredSession());
  const [loading, setLoading] = useState(() => readStoredSession() === null);
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // getSession() verifies/refreshes the token and fires onAuthStateChange.
    // We don't block on it — loading is already false if we had a stored session.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) {
        fetchIsAdmin(data.session.user.id).then(setIsAdmin);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((evt, s) => {
      setSession(s);
      setLoading(false);
      if (evt === "SIGNED_OUT") {
        queryClient.clear();
        setIsAdmin(false);
      } else if (s?.user) {
        fetchIsAdmin(s.user.id).then(setIsAdmin);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, isAdmin }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);