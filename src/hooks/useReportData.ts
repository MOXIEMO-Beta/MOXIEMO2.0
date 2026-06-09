import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { buildReportData } from "@/lib/reportDataBinding";

const GENERIC_TITLE_RE = /,\s*post\s*\d+\s*$/i;

async function enrichCalendarTitles(
  rd: any,
  strategyRow: any,
  setReportData: (v: any) => void,
) {
  try {
    const cal: any[] = Array.isArray(rd?.calendar) ? rd.calendar : [];
    if (!cal.length) return;
    const needsFix = cal.some((r) => !r?.title || GENERIC_TITLE_RE.test(String(r.title)));
    if (!needsFix) return;

    const rows = cal.map((r) => ({
      pillar: r.pillar || r.theme || "",
      format: r.type || "",
      channel: r.channel || "",
      date: r.date || "",
    }));
    const { data, error } = await supabase.functions.invoke("generate-calendar-topics", {
      body: {
        rows,
        voice: strategyRow?.voice_attributes ?? [],
        icp: strategyRow?.ideal_client ?? "",
        pain: strategyRow?.pain_point ?? "",
      },
    });
    if (error) {
      console.warn("generate-calendar-topics failed", error);
      return;
    }
    const titles: string[] = Array.isArray(data?.titles) ? data.titles : [];
    if (!titles.length) return;
    const nextCal = cal.map((r, i) => {
      const t = titles[i];
      if (t && (!r.title || GENERIC_TITLE_RE.test(String(r.title)))) {
        return { ...r, title: t };
      }
      return r;
    });
    setReportData({ ...rd, calendar: nextCal });
  } catch (e) {
    console.warn("enrichCalendarTitles error", e);
  }
}

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
        const rd = buildReportData(strategyRow, profileRow);
        setReportData(rd);
        void enrichCalendarTitles(rd, strategyRow, setReportData);
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