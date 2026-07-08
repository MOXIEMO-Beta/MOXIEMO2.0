import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type Ctx = { user: User | null; session: Session | null; loading: boolean };
const AuthContext = createContext<Ctx>({ user: null, session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evt, s) => {
      setSession(s);
      setLoading(false);
      // On sign-out or user switch, wipe cached query state so a prior
      // session's data never renders under the next user.
      if (evt === "SIGNED_OUT" || evt === "USER_UPDATED") {
        queryClient.clear();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return <AuthContext.Provider value={{ user: session?.user ?? null, session, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);