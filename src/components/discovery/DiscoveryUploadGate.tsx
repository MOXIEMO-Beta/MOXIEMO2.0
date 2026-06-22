import { useRef, useState } from "react";
import { ArrowUp, FileText, Loader2, Upload, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_BYTES = 10 * 1024 * 1024;

export type PrefillResult = {
  answers: Record<string, string>;
  questions: { id: string; label: string }[];
  brand_data?: Record<string, any> | null;
};

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || file.type === "text/plain") {
    return await file.text();
  }
  if (name.endsWith(".docx") || file.type.includes("word")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const buf = await file.arrayBuffer();
    const res = await (mammoth as any).extractRawText({ arrayBuffer: buf });
    return res.value || "";
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfjs: any = await import("pdfjs-dist");
    // Use worker via dynamic import URL (Vite handles ?url import for worker)
    // Fallback to disabling worker if not present.
    try {
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    } catch {
      // ignore — pdf.js will run on main thread if worker unavailable
    }
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    let out = "";
    const limit = Math.min(doc.numPages, 40);
    for (let i = 1; i <= limit; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map((it: any) => it.str).join(" ") + "\n\n";
      if (out.length > 60000) break;
    }
    return out;
  }
  throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
}

type Props = {
  onSkip: () => void;
  onComplete: (result: PrefillResult) => void;
};

export function DiscoveryUploadGate({ onSkip, onComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error("File too large — max 10MB.");
      return;
    }
    setFile(f);
  }

  async function callPrefill(payload: { text?: string; url?: string }) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? key;
    const r = await fetch(`${supabaseUrl}/functions/v1/discovery-prefill`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: key,
      },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(`Prefill failed: ${r.status} ${t}`.slice(0, 200));
    }
    return (await r.json()) as PrefillResult;
  }

  async function handleSubmit() {
    if (processing) return;
    if (!file && !url.trim()) {
      toast.error("Upload a file or paste a URL first.");
      return;
    }
    setProcessing(true);
    try {
      let payload: { text?: string; url?: string } = {};
      if (file) {
        setStage("Reading your document...");
        const text = await extractText(file);
        if (!text || text.trim().length < 50) {
          throw new Error("Couldn't read enough text from that file.");
        }
        payload.text = text;
      } else {
        setStage("Fetching the URL...");
        payload.url = url.trim();
      }
      setStage("MOXIEMO is finding your answers...");
      const result = await callPrefill(payload);
      onComplete(result);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Couldn't process that — try another file or skip.");
    } finally {
      setProcessing(false);
    }
  }

  if (processing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{
        background: "radial-gradient(circle at center, #181B22 0%, #0B0C10 80%)",
      }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />
        <div className="relative z-10 max-w-md w-full text-center">
          <span style={{
            display: "inline-block",
            fontSize: 9, letterSpacing: "0.12em", fontWeight: 600,
            color: "#FF6B5C",
            backgroundColor: "rgba(255,107,92,0.18)",
            border: "1px solid rgba(255,107,92,0.35)",
            borderRadius: 999, padding: "4px 10px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}>◈ MOXIEMO · DOCUMENT READER</span>
          <h1 className="text-white font-extrabold mt-5" style={{ fontSize: 24, letterSpacing: "-0.025em" }}>
            MOXIEMO is reading your document...
          </h1>
          <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{stage}</p>
          <div className="mt-8 flex items-center justify-center gap-2">
            <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: "#FF6B5C", animation: "bounce 1.2s ease-in-out infinite", animationDelay: "0s" }} />
            <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: "#FF6B5C", animation: "bounce 1.2s ease-in-out infinite", animationDelay: "0.2s" }} />
            <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: "#FF6B5C", animation: "bounce 1.2s ease-in-out infinite", animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-10 py-8" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="max-w-xl mx-auto">
        <div className="mb-4">
          <span style={{
            display: "inline-block",
            fontSize: 9, letterSpacing: "0.12em", fontWeight: 600,
            color: "#FF6B5C",
            backgroundColor: "rgba(255,107,92,0.10)",
            border: "1px solid rgba(255,107,92,0.25)",
            borderRadius: 999, padding: "4px 10px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            textTransform: "uppercase",
          }}>✦ FASTER DISCOVERY</span>
        </div>

        <h1 style={{ color: "#15171C", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Save time. Start with what you already have.
        </h1>
        <p className="mt-2" style={{ color: "rgba(21,23,28,0.50)", fontSize: 15 }}>
          Upload a brand doc, strategy file, or paste your website URL. MOXIEMO will scan it and pre-fill any Discovery questions it can answer. You review, edit, and continue from there.
        </p>

        {/* How this works — three step row */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl p-4"
          style={{ backgroundColor: "rgba(255,107,92,0.04)", border: "1px solid rgba(255,107,92,0.12)" }}>
          {[
            { n: 1, t: "Upload or paste", d: "Drop a PDF, DOCX, or TXT file — or paste your website, LinkedIn, or Google Doc URL." },
            { n: 2, t: "MOXIEMO scans it", d: "We look for brand details, offer descriptions, audience information, and voice cues." },
            { n: 3, t: "Review and continue", d: "Pre-filled answers are saved. You confirm, edit anything, and move through Discovery." },
          ].map((s) => (
            <div key={s.n} className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center rounded-full text-white font-semibold"
                  style={{ width: 24, height: 24, backgroundColor: "#FF6B5C", fontSize: 12 }}>{s.n}</span>
                <span style={{ color: "#15171C", fontSize: 13, fontWeight: 600 }}>{s.t}</span>
              </div>
              <p className="mt-2" style={{ color: "rgba(21,23,28,0.60)", fontSize: 13, lineHeight: 1.4 }}>{s.d}</p>
            </div>
          ))}
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files?.[0] ?? null);
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          className="mt-6 cursor-pointer rounded-2xl px-6 py-10 text-center transition"
          style={{
            border: `2px dashed ${dragOver ? "#FF6B5C" : "rgba(255,107,92,0.45)"}`,
            backgroundColor: dragOver ? "rgba(255,107,92,0.06)" : "rgba(255,107,92,0.03)",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-5 w-5" style={{ color: "#FF6B5C" }} />
              <span style={{ color: "#15171C", fontSize: 14, fontWeight: 500 }}>{file.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="ml-1 rounded-full p-1 hover:bg-black/5"
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" style={{ color: "rgba(21,23,28,0.5)" }} />
              </button>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-7 w-7" style={{ color: "#FF6B5C" }} />
              <p className="mt-3" style={{ color: "#15171C", fontSize: 15, fontWeight: 500 }}>
                Drop your brand deck, strategy doc, or any file about your business
              </p>
              <p className="mt-1" style={{ color: "rgba(21,23,28,0.50)", fontSize: 12 }}>
                PDF, DOCX, or TXT · Max 10MB
              </p>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white p-2"
          style={{ border: "1px solid rgba(21,23,28,0.08)" }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Or paste your website URL, LinkedIn profile, or Google Doc link"
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
            style={{ color: "#15171C" }}
          />
          <button
            type="button"
            onClick={() => { if (url.trim()) handleSubmit(); }}
            className="h-9 w-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#FF6B5C", color: "white" }}
            aria-label="Submit URL"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={processing || (!file && !url.trim())}
          className="mt-6 w-full h-12 rounded-xl text-[15px] font-medium"
          style={{ backgroundColor: "#FF6B5C", color: "white" }}
        >
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload and pre-fill my answers →"}
        </Button>

        {/* OR separator */}
        <div className="mt-6 flex items-center gap-3" aria-hidden="true">
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(21,23,28,0.10)" }} />
          <span style={{ color: "rgba(21,23,28,0.45)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }}>OR</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(21,23,28,0.10)" }} />
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onSkip}
            className="underline-offset-4 hover:underline"
            style={{ color: "#1a1a1a", fontSize: 15, fontWeight: 500 }}
          >
            Start from scratch instead →
          </button>
        </div>
      </div>
    </div>
  );
}

type SummaryProps = {
  result: PrefillResult;
  onContinue: () => void;
  onSkip: () => void;
};

export function DiscoveryPrefillSummary({ result, onContinue, onSkip }: SummaryProps) {
  const filled = result.questions.filter((q) => result.answers[q.id]);
  const empty = result.questions.length - filled.length;

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-10 py-8 pb-32 relative" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <span style={{
            display: "inline-block",
            fontSize: 9, letterSpacing: "0.12em", fontWeight: 600,
            color: "#FF6B5C",
            backgroundColor: "rgba(255,107,92,0.10)",
            border: "1px solid rgba(255,107,92,0.25)",
            borderRadius: 999, padding: "4px 10px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            textTransform: "uppercase",
          }}>◈ PRE-FILLED ANSWERS</span>
        </div>
        <h1 style={{ color: "#15171C", fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Here's what MOXIEMO found in your document
        </h1>
        <p className="mt-2" style={{ color: "rgba(21,23,28,0.50)", fontSize: 14 }}>
          {filled.length} of {result.questions.length} answers pre-filled
          {empty > 0 ? ` · ${empty} you'll fill in during Discovery` : ""}.
        </p>

        {filled.length === 0 ? (
          <div className="mt-6 rounded-xl bg-white p-5" style={{ border: "1px solid rgba(21,23,28,0.08)" }}>
            <p style={{ color: "#15171C", fontSize: 14 }}>
              MOXIEMO couldn't extract clear signals from that source. No worries — you can answer everything fresh in Discovery.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {filled.map((q) => (
              <li key={q.id} className="rounded-xl bg-white p-4" style={{ border: "1px solid rgba(21,23,28,0.08)" }}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#FF6B5C" }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: "rgba(21,23,28,0.55)", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
                      {q.label}
                    </p>
                    <p className="mt-1" style={{ color: "#15171C", fontSize: 14, lineHeight: 1.5 }}>
                      {result.answers[q.id]}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-sm" style={{ color: "rgba(21,23,28,0.50)" }}>
          Review and confirm your answers — you can edit anything.
        </p>
        <div id="prefill-continue" className="mt-4 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onContinue}
            id="prefill-continue-button"
            className="h-12 px-6 rounded-xl text-[15px] font-medium"
            style={{ backgroundColor: "#FF6B5C", color: "white" }}
          >
            Continue to Discovery →
          </Button>
          <button
            onClick={onSkip}
            className="text-sm underline-offset-4 hover:underline"
            style={{ color: "rgba(21,23,28,0.50)" }}
          >
            Start from scratch instead →
          </button>
        </div>
      </div>

      {/* Sticky bottom banner */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3 shadow-lg"
        style={{ backgroundColor: filled.length > 0 ? "#ff6b6b" : "#15171C" }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          {filled.length > 0 ? (
            <>
              <div className="flex-1 min-w-0 text-white">
                <p style={{ fontSize: 15, fontWeight: 700 }}>
                  We found answers to {filled.length} question{filled.length === 1 ? "" : "s"}. Scroll down to review and keep going.
                </p>
                <p style={{ fontSize: 13, opacity: 0.9 }}>
                  Edit anything before continuing. Your answers are yours.
                </p>
              </div>
              <button
                onClick={() => {
                  const el = document.getElementById("prefill-continue-button");
                  if (!el) return;
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  window.setTimeout(() => {
                    el.classList.add("moxie-coral-pulse");
                    window.setTimeout(() => el.classList.remove("moxie-coral-pulse"), 1000);
                  }, 300);
                }}
                className="h-10 px-4 rounded-lg font-semibold whitespace-nowrap"
                style={{ backgroundColor: "white", color: "#ff6b6b", fontSize: 14 }}
              >
                Review and continue →
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0 text-white">
                <p style={{ fontSize: 14, fontWeight: 600 }}>
                  We couldn't find enough to pre-fill from that file. You can try another file or start Discovery from scratch.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="h-10 px-4 rounded-lg font-medium whitespace-nowrap"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.25)", fontSize: 14 }}
                >
                  Try another file
                </button>
                <button
                  onClick={onSkip}
                  className="h-10 px-4 rounded-lg font-semibold whitespace-nowrap"
                  style={{ backgroundColor: "white", color: "#15171C", fontSize: 14 }}
                >
                  Start Discovery instead
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}