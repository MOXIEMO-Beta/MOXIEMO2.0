import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type BrandCtx = {
  brandId: string | null;
  accountId: string | null;
  loading: boolean;
};

const BrandContext = createContext<BrandCtx>({ brandId: null, accountId: null, loading: true });

export function BrandProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [brandId, setBrandId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setBrandId(null); setAccountId(null); setLoading(false); return; }
    setLoading(true);
    supabase
      .from("caller_brand" as any)
      .select("brand_id, account_id")
      .maybeSingle()
      .then(({ data, error }) => {
        // 42P01 = relation does not exist (migration not yet deployed — silent fallback)
        if (!error || (error as any)?.code === "42P01") {
          setBrandId((data as any)?.brand_id ?? null);
          setAccountId((data as any)?.account_id ?? null);
        }
        setLoading(false);
      });
  }, [user]);

  return <BrandContext.Provider value={{ brandId, accountId, loading }}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}
