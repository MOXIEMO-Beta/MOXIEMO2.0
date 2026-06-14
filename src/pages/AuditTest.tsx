import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandAuditReport, type AuditResponse } from "@/components/audit/BrandAuditReport";

export default function AuditTest() {
  const [payload, setPayload] = useState("");
  const [forced, setForced] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // End-to-end pipeline state
  const [url, setUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [whatYouDo, setWhatYouDo] = useState("");
  const [whoYouServe, setWhoYouServe] = useState("");
  const [location, setLocation] = useState("");
  const [goal, setGoal] = useState("");
  const [differentiator, setDifferentiator] = useState("");
  const [reach, setReach] = useState("");
  const [competitorsText, setCompetitorsText] = useState("");
  const [deepResult, setDeepResult] = useState("");
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [pipeMsg, setPipeMsg] = useState("");
  const [pipeLoading, setPipeLoading] = useState(false);

  async function run(body: any) {
    setLoading(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-audit", { body });
      if (error) setResult(`ERROR: ${error.message}\n\n${JSON.stringify(error, null, 2)}`);
      else setResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setResult(`THROWN: ${String(e?.message ?? e)}`);
    } finally {
      setLoading(false);
    }
  }

  function runReal() {
    let parsed: any = {};
    try { parsed = payload.trim() ? JSON.parse(payload) : {}; }
    catch (e: any) { setResult(`Invalid payload JSON: ${e.message}`); return; }
    run({ payload: parsed });
  }

  function runForced() {
    let parsed: any = {};
    try { parsed = forced.trim() ? JSON.parse(forced) : {}; }
    catch (e: any) { setResult(`Invalid forced JSON: ${e.message}`); return; }
    let parsedPayload: any = {};
    try { parsedPayload = payload.trim() ? JSON.parse(payload) : {}; } catch { /* ignore */ }
    run({ payload: parsedPayload, debug_force_output: parsed });
  }

  function competitorsArr(): string[] {
    return competitorsText.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  }

  function assembledInputs() {
    return {
      brand_name: brandName,
      what_you_do: whatYouDo,
      who_you_serve: whoYouServe,
      location,
      goal,
      differentiator,
      reach,
      competitors: competitorsArr(),
    };
  }

  async function runScrapeInitial() {
    setPipeLoading(true); setPipeMsg("");
    try {
      const { data, error } = await supabase.functions.invoke("scrape-initial", { body: { url } });
      if (error) { setPipeMsg(`scrape-initial error: ${error.message}`); return; }
      setBrandName(data?.brand_name ?? "");
      setWhatYouDo(data?.what_you_do ?? "");
      setWhoYouServe(data?.who_you_serve ?? "");
      setPipeMsg(`scrape-initial OK. domain=${data?.domain ?? ""}`);
    } finally { setPipeLoading(false); }
  }

  async function runSuggestCompetitors() {
    setPipeLoading(true); setPipeMsg("");
    try {
      const { data, error } = await supabase.functions.invoke("suggest-competitors", {
        body: { what_you_do: whatYouDo, who_you_serve: whoYouServe, location },
      });
      if (error) { setPipeMsg(`suggest-competitors error: ${error.message}`); return; }
      const arr: string[] = data?.suggested ?? [];
      const merged = Array.from(new Set([...competitorsArr(), ...arr]));
      setCompetitorsText(merged.join("\n"));
      setPipeMsg(arr.length === 0 ? "No suggestions (SERPER_API_KEY may be missing)." : `Got ${arr.length} suggestions.`);
    } finally { setPipeLoading(false); }
  }

  async function runScrapeDeep() {
    setPipeLoading(true); setPipeMsg(""); setDeepResult(""); setAuditData(null);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-deep", {
        body: { url, inputs: assembledInputs() },
      });
      if (error) { setPipeMsg(`scrape-deep error: ${error.message}`); return; }
      setDeepResult(JSON.stringify(data, null, 2));
      setPipeMsg("scrape-deep OK.");
    } finally { setPipeLoading(false); }
  }

  async function runFullAudit() {
    setPipeLoading(true); setPipeMsg(""); setAuditData(null);
    try {
      let parsed: any;
      try { parsed = JSON.parse(deepResult); }
      catch { setPipeMsg("Run scrape-deep first or paste a valid payload."); return; }
      const { data, error } = await supabase.functions.invoke("generate-audit", {
        body: { payload: parsed },
      });
      if (error) { setPipeMsg(`generate-audit error: ${error.message}`); return; }
      if (data?.status === "ready") {
        setAuditData(data as AuditResponse);
        setPipeMsg("Audit ready.");
      } else {
        setPipeMsg(`Audit not ready: ${JSON.stringify(data)}`);
      }
    } finally { setPipeLoading(false); }
  }

  return (
    <div style={{ padding: 16, fontFamily: "monospace", maxWidth: 1100, margin: "0 auto" }}>
      <h1>generate-audit test harness</h1>

      <section style={{ border: "1px solid #ccc", padding: 12, marginBottom: 24 }}>
        <h2>End-to-end pipeline</h2>
        <div style={{ display: "grid", gap: 6 }}>
          <label>URL <input value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: "100%" }} placeholder="https://example.com" /></label>
          <button onClick={runScrapeInitial} disabled={pipeLoading || !url}>Run scrape-initial</button>

          <label>Brand name <input value={brandName} onChange={(e) => setBrandName(e.target.value)} style={{ width: "100%" }} /></label>
          <label>What you do <input value={whatYouDo} onChange={(e) => setWhatYouDo(e.target.value)} style={{ width: "100%" }} /></label>
          <label>Who you serve <input value={whoYouServe} onChange={(e) => setWhoYouServe(e.target.value)} style={{ width: "100%" }} /></label>
          <label>Location <input value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: "100%" }} /></label>

          <button onClick={runSuggestCompetitors} disabled={pipeLoading}>Suggest competitors</button>
          <label>Competitors (one per line or comma separated)
            <textarea value={competitorsText} onChange={(e) => setCompetitorsText(e.target.value)} rows={4} style={{ width: "100%", fontFamily: "monospace" }} />
          </label>

          <label>Goal <input value={goal} onChange={(e) => setGoal(e.target.value)} style={{ width: "100%" }} /></label>
          <label>Differentiator <input value={differentiator} onChange={(e) => setDifferentiator(e.target.value)} style={{ width: "100%" }} /></label>
          <label>Reach <input value={reach} onChange={(e) => setReach(e.target.value)} style={{ width: "100%" }} /></label>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={runScrapeDeep} disabled={pipeLoading || !url}>Run scrape-deep</button>
            <button onClick={runFullAudit} disabled={pipeLoading || !deepResult}>Run full audit</button>
          </div>

          {pipeMsg && <div style={{ color: "#333" }}>{pipeMsg}</div>}

          {deepResult && (
            <details open>
              <summary>scrape-deep payload</summary>
              <pre style={{ background: "#111", color: "#0f0", padding: 12, maxHeight: 400, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{deepResult}</pre>
            </details>
          )}
        </div>
      </section>

      {auditData && (
        <div style={{ marginBottom: 24 }}>
          <BrandAuditReport data={auditData} />
        </div>
      )}

      <h2>Payload</h2>
      <textarea
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
        rows={16}
        style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }}
        placeholder='{"inputs":{"brand_name":"...","competitors":["example.com"]},"model_type":"founder_led","low_data":false,"signals":{}}'
      />
      <button onClick={runReal} disabled={loading} style={{ marginTop: 8 }}>
        {loading ? "Running..." : "Run"}
      </button>

      <h2 style={{ marginTop: 24 }}>Debug force output (validator test)</h2>
      <textarea
        value={forced}
        onChange={(e) => setForced(e.target.value)}
        rows={16}
        style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }}
        placeholder='Paste a deliberately bad Vera report object here.'
      />
      <button onClick={runForced} disabled={loading} style={{ marginTop: 8 }}>
        {loading ? "Running..." : "Test validator"}
      </button>

      <h2 style={{ marginTop: 24 }}>Response</h2>
      <pre style={{ background: "#111", color: "#0f0", padding: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {result || "(no response yet)"}
      </pre>
    </div>
  );
}