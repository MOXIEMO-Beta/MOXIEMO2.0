import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandAuditReport, type AuditResponse } from "@/components/audit/BrandAuditReport";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const POLL_INTERVAL_MS = 3500;
const STUCK_AFTER_MS = 3 * 60 * 1000;

export default function BrandAuditReportPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AuditResponse | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError("");
    try {
      const { data: res, error: err } = await supabase.functions.invoke("get-audit-report", { body: { id } });
      if (err) { setError(err.message); setStatus("error"); return; }
      if (!res) { setError("Not found."); setStatus("error"); return; }
      const rawStatus = typeof res.status === "string" ? res.status.toLowerCase() : "error";
      // Legacy rows may still carry status "review" with a usable report. Treat
      // any row that has a renderable report as ready. The regenerate wall is
      // gone by design: validation and repair are server-side only.
      const hasUsableReport = res.report && typeof res.report === "object" && Array.isArray((res.report as any).sections);
      const nextStatus = (rawStatus === "review" && hasUsableReport) ? "ready" : rawStatus;
      setStatus(nextStatus);
      setStartedAt(res.generation_started_at ?? null);
      if (nextStatus === "ready") {
        setData({
          status: "ready",
          brand_audit_score: res.brand_audit_score,
          report: res.report,
          inputs: res.inputs ?? null,
        });
      } else {
        setData(null);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, [id]);

  useEffect(() => { setStatus("loading"); load(); }, [load]);

  // Poll while generating. Re-render on every status change.
  useEffect(() => {
    if (status !== "generating") { setStuck(false); return; }
    const tick = () => {
      const startMs = startedAt ? new Date(startedAt).getTime() : Date.now();
      if (Date.now() - startMs > STUCK_AFTER_MS) {
        setStuck(true);
        return;
      }
      load();
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [status, startedAt, load]);

  async function retry() {
    if (!id) return;
    setError("");
    try {
      const { error: err } = await supabase.functions.invoke("run-audit-generation", { body: { audit_id: id } });
      if (err) { setError(err.message); return; }
      setStuck(false);
      setData(null);
      setStatus("generating");
      setStartedAt(new Date().toISOString());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (status === "ready" && data) {
    return (
      <>
        <SiteHeader />
        <BrandAuditReport data={data} publicAssessment />
        <SiteFooter />
      </>
    );
  }

  // Only true failures (network/parse error or hard timeout) show a retry.
  // Validation failures never reach the UI because generate-audit always
  // terminates in a ready report.
  const showRetry = status === "failed" || stuck;

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
        {status === "generating" && !stuck && (
          <>
            <div className="inline-block w-8 h-8 border-4 border-[#FF6B5C] border-t-transparent rounded-full animate-spin mb-3" />
            <h2 className="text-xl font-bold text-[#15171C] mb-2">Building your report</h2>
            <p className="text-sm text-[#7a7e8c]">
              Reading your site, scoring eight sections, and writing your fixes. This usually takes a minute or two.
            </p>
          </>
        )}
        {showRetry && (
          <>
            <h2 className="text-xl font-bold text-[#15171C] mb-2">Something interrupted your report</h2>
            <p className="text-sm text-[#7a7e8c] mb-2">
              {stuck
                ? "This is taking longer than expected. You can try again."
                : "Something went wrong while generating. You can try again."}
            </p>
            <div className="flex justify-center mt-3">
              <Button onClick={retry} className="bg-[#FF6B5C] hover:bg-[#FF6B5C]/90 text-white rounded-full px-5">
                Try again
              </Button>
            </div>
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