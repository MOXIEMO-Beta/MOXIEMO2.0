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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        setIsAdmin(await fetchIsAdmin(data.session.user.id));
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (evt, s) => {
      setSession(s);
      if (evt === "SIGNED_OUT") {
        queryClient.clear();
        setIsAdmin(false);
      } else if (s?.user) {
        setIsAdmin(await fetchIsAdmin(s.user.id));
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, isAdmin }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);