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
    // getSession bootstraps state before the listener fires
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        setIsAdmin(data.session.user.app_metadata?.app_role === "admin");
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((evt, s) => {
      setSession(s);
      if (evt === "SIGNED_OUT") {
        queryClient.clear();
        setIsAdmin(false);
      } else if (s?.user) {
        setIsAdmin(s.user.app_metadata?.app_role === "admin");
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, isAdmin }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);