import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandAuditReport, type AuditResponse } from "@/components/audit/BrandAuditReport";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function BrandAuditReportPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AuditResponse | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setStatus("loading");
    setError("");
    try {
      const { data: res, error: err } = await supabase.functions.invoke("get-audit-report", { body: { id } });
      if (err) { setError(err.message); setStatus("error"); return; }
      if (!res) { setError("Not found."); setStatus("error"); return; }
      setStatus(res.status);
      if (res.status === "ready") {
        setData({ status: "ready", brand_audit_score: res.brand_audit_score, report: res.report });
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setStatus("error");
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (status === "ready" && data) {
    return (
      <>
        <SiteHeader />
        <BrandAuditReport data={data} />
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <div className="min-h-[70vh] bg-[#F7F5F1] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white border-2 rounded-2xl p-8 text-center">
        {status === "loading" && (
          <>
            <div className="inline-block w-8 h-8 border-4 border-[#FF6B5C] border-t-transparent rounded-full animate-spin mb-3" />
            <h2 className="text-xl font-bold text-[#15171C] mb-1">Loading your report</h2>
            <p className="text-sm text-[#7a7e8c]">One moment.</p>
          </>
        )}
        {(status === "generating" || status === "review") && (
          <>
            <h2 className="text-xl font-bold text-[#15171C] mb-2">Your report is being finalized</h2>
            <p className="text-sm text-[#7a7e8c] mb-5">
              Give it a moment. We are tightening a few things so it reads cleanly.
            </p>
            <Button onClick={load} variant="outline" className="border-2 rounded-full">Check again</Button>
          </>
        )}
          {status === "error" && (
          <>
            <h2 className="text-xl font-bold text-[#15171C] mb-2">We could not load this report</h2>
            <p className="text-sm text-[#7a7e8c] mb-5">{error || "Please try again."}</p>
            <Button onClick={load} variant="outline" className="border-2 rounded-full">Retry</Button>
          </>
          )}
        </div>
      </div>
      <SiteFooter />
    </>
  );
}