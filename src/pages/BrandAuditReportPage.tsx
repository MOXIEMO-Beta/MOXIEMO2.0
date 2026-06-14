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
  const [reviewReason, setReviewReason] = useState<string>("");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [stuck, setStuck] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError("");
    try {
      const { data: res, error: err } = await supabase.functions.invoke("get-audit-report", { body: { id } });
      if (err) { setError(err.message); setStatus("error"); return; }
      if (!res) { setError("Not found."); setStatus("error"); return; }
      setStatus(res.status);
      setReviewReason(res.review_reason ?? "");
      setStartedAt(res.generation_started_at ?? null);
      if (res.status === "ready") {
        setData({ status: "ready", brand_audit_score: res.brand_audit_score, report: res.report });
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setStatus("error");
    }
  }, [id]);

  useEffect(() => { setStatus("loading"); load(); }, [load]);

  // Poll while generating, with a stuck guard.
  useEffect(() => {
    if (status !== "generating") { setStuck(false); return; }
    const startMs = startedAt ? new Date(startedAt).getTime() : Date.now();
    if (Date.now() - startMs > STUCK_AFTER_MS) {
      setStuck(true);
      return;
    }
    const t = setTimeout(() => { load(); }, POLL_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [status, startedAt, load]);

  async function regenerate() {
    if (!id) return;
    setRegenerating(true);
    setError("");
    try {
      const { error: err } = await supabase.functions.invoke("run-audit-generation", { body: { audit_id: id } });
      if (err) { setError(err.message); return; }
      setStuck(false);
      setReviewReason("");
      setStatus("generating");
      setStartedAt(new Date().toISOString());
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setRegenerating(false);
    }
  }

  if (status === "ready" && data) {
    return (
      <>
        <SiteHeader />
        <BrandAuditReport data={data} />
        <SiteFooter />
      </>
    );
  }

  const showFinalizing = status === "review" || status === "failed" || stuck;

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
        {showFinalizing && (
          <>
            <h2 className="text-xl font-bold text-[#15171C] mb-2">Your report is being finalized</h2>
            <p className="text-sm text-[#7a7e8c] mb-2">
              {status === "failed"
                ? "Something went wrong while generating. You can try again."
                : stuck
                ? "This is taking longer than expected. You can try again."
                : "We need to tighten a few things so it reads cleanly. Run it again to finish."}
            </p>
            {reviewReason && (
              <p className="text-xs text-[#7a7e8c] mb-5 italic">Reason: {reviewReason}</p>
            )}
            <div className="flex justify-center gap-2 mt-3">
              <Button onClick={regenerate} disabled={regenerating} className="bg-[#FF6B5C] hover:bg-[#FF6B5C]/90 text-white rounded-full px-5">
                {regenerating ? "Regenerating..." : "Regenerate"}
              </Button>
              <Button onClick={load} variant="outline" className="border-2 rounded-full">Check again</Button>
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