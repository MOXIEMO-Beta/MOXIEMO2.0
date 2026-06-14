import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AuditTest() {
  const [payload, setPayload] = useState("");
  const [forced, setForced] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ padding: 16, fontFamily: "monospace", maxWidth: 1100, margin: "0 auto" }}>
      <h1>generate-audit test harness</h1>

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