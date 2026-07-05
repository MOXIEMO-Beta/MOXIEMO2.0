// TEMP DIAGNOSTIC — remove after use.
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function LinkedInAnalyticsProbe() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("linkedin-analytics-probe", {
        method: "POST",
      });
      if (error) throw error;
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6" style={{ background: "#FFFDF7", border: "0.5px dashed #D6A85F", borderRadius: 12, padding: 16 }}>
      <div className="text-[12px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#8A5A1A" }}>
        TEMP DIAGNOSTIC — remove after use
      </div>
      <div className="text-[13px] mb-3" style={{ color: "#6B6860" }}>
        Checks whether your LinkedIn connections can read post analytics.
      </div>
      <button
        onClick={run}
        disabled={loading}
        className="text-[12px] font-semibold"
        style={{ background: "#0E0F10", color: "#fff", borderRadius: 6, height: 32, padding: "0 14px" }}
      >
        {loading ? "Probing…" : "Run LinkedIn analytics probe"}
      </button>
      {err && (
        <pre className="mt-3 text-[11px]" style={{ color: "#B23A2A", whiteSpace: "pre-wrap" }}>
          {err}
        </pre>
      )}
      {result && (
        <pre
          className="mt-3 text-[11px]"
          style={{
            background: "#0E0F10",
            color: "#F4F1EA",
            padding: 12,
            borderRadius: 8,
            maxHeight: 520,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {result}
        </pre>
      )}
    </div>
  );
}