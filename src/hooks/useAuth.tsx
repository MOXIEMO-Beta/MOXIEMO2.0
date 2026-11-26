import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type Ctx = { user: User | null; session: Session | null; loading: boolean; isAdmin: boolean };
const AuthContext = createContext<Ctx>({ user: null, session: null, loading: true, isAdmin: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evt, s) => {
      setSession(s);
      setLoading(false);
      if (evt === "SIGNED_OUT" || evt === "USER_UPDATED") {
        queryClient.clear();
        setIsAdmin(false);
      }
      if (s?.user) {
        // Read app_role claim from JWT app_metadata (set by custom_jwt_claims hook)
        // Falls back to false if the token predates the hook being wired up.
        const appRole = s.user.app_metadata?.app_role;
        setIsAdmin(appRole === 'admin');
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) {
        // Read app_role claim from JWT app_metadata (set by custom_jwt_claims hook)
        // Falls back to false if the token predates the hook being wired up.
        const appRole = data.session.user.app_metadata?.app_role;
        setIsAdmin(appRole === 'admin');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, isAdmin }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);