import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { buildReportData } from "@/lib/reportDataBinding";

export function useReportData() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setReportData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [{ data: strategyRow, error: sErr }, { data: profileRow, error: pErr }] = await Promise.all([
        supabase.from("strategies").select("*").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name, business_name, email, created_at")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (sErr) throw sErr;
      if (pErr) throw pErr;

      if (!strategyRow) {
        setReportData(null);
      } else {
        setReportData(buildReportData(strategyRow, profileRow));
      }
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { reportData, isLoading, error, refetch: load };
}