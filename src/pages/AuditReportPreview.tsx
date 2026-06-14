import { useState } from "react";
import { BrandAuditReport, type AuditResponse } from "@/components/audit/BrandAuditReport";

export default function AuditReportPreview() {
  const [raw, setRaw] = useState("");
  const [data, setData] = useState<AuditResponse | null>(null);
  const [err, setErr] = useState("");

  function render() {
    setErr("");
    try {
      const parsed = JSON.parse(raw);
      setData(parsed);
    } catch (e: any) {
      setErr(`Invalid JSON: ${e.message}`);
      setData(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F1" }}>
      <div style={{ padding: 16, fontFamily: "monospace", maxWidth: 1100, margin: "0 auto" }}>
        <h1>Brand audit report preview</h1>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={14}
          style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }}
          placeholder='Paste a full generate-audit response: {"status":"ready","brand_audit_score":64,"report":{...}}'
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={render}>Render</button>
        </div>
        {err && <pre style={{ color: "red" }}>{err}</pre>}
      </div>
      {data && <BrandAuditReport data={data} />}
    </div>
  );
}