import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { downloadStrategyPdf } from "@/lib/strategyPdf";
import { downloadAuditPdf } from "@/lib/brandAuditPdf";
import { generateBrandKitPdf, type BrandKitData } from "@/lib/brandKitPdf";
import { buildReportData } from "@/lib/reportDataBinding";
import { deriveEnrichment } from "@/lib/brandKitEnrichment";
import { BrandAuditReport, type AuditResponse } from "@/components/audit/BrandAuditReport";
import {
  ShieldCheck,
  ClipboardCheck,
  Palette,
  FolderOpen,
  CheckCircle2,
  Loader2,
  Circle,
  UploadCloud,
  Plus,
  X,
  Compass,
  FileText,
  Wand2,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { RefreshCw, Copy as CopyIcon, Check as CheckIcon } from "lucide-react";

type BrandTab = "welcome" | "audit" | "kit" | "assets";
type AuditStep = "prompt" | "running" | "results";
type KitStep = "visual" | "generating" | "kit";

export type ShareDocumentType = "strategy" | "brand-kit" | "brand-audit";

async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch { return false; }
}

async function mintShareLink(document_type: ShareDocumentType, source_id: string, opts?: { rotate?: boolean }) {
  const { data, error } = await supabase.functions.invoke("generate-share-token", {
    body: { document_type, source_id, rotate: !!opts?.rotate },
  });
  if (error || !data?.shareUrl) throw new Error(error?.message || "Could not create share link");
  return data.shareUrl as string;
}

function ShareControls({
  documentType, sourceId, dark = false,
}: { documentType: ShareDocumentType; sourceId: string | null | undefined; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const baseStyle: React.CSSProperties = dark
    ? { border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: 20, padding: "6px 14px", fontSize: 12, background: "transparent", cursor: "pointer" }
    : { border: `1px solid ${BORDER}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, background: "transparent", color: INK, cursor: "pointer", fontWeight: 500 };

  const handleOpenChange = async (next: boolean) => {
    if (next && !sourceId) {
      toast({ title: "Nothing to share yet", description: "Generate this document first, then try again.", variant: "destructive" });
      return;
    }
    setOpen(next);
    if (next && !url && sourceId) {
      setLoading(true);
      setError(null);
      try {
        const link = await mintShareLink(documentType, sourceId);
        setUrl(link);
      } catch (e: any) {
        setError(e?.message || "Could not create share link");
      } finally {
        setLoading(false);
      }
    }
    if (!next) { setCopied(false); }
  };

  const handleCopy = async () => {
    if (!url) return;
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const handleRotate = async () => {
    if (!sourceId) return;
    if (!confirm("Replace this link? The old one stops working immediately.")) return;
    setRotating(true);
    setError(null);
    try {
      await supabase.functions.invoke("revoke-share-token", { body: { document_type: documentType, source_id: sourceId } });
      const link = await mintShareLink(documentType, sourceId, { rotate: true });
      setUrl(link);
      setCopied(false);
    } catch (e: any) {
      setError(e?.message || "Could not replace link");
    } finally {
      setRotating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" style={baseStyle}>Share Link</button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="p-0"
        style={{ width: 380, background: "#fff", color: INK, border: `1px solid ${BORDER}`, borderRadius: 12, boxShadow: "0 10px 30px rgba(14,15,16,0.12)" }}
        onOpenAutoFocus={(e) => { e.preventDefault(); setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 0); }}
      >
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Share link</div>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} style={{ background: "transparent", border: 0, cursor: "pointer", color: MUTED, padding: 4, display: "flex" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "0 16px 12px", fontSize: 12, color: MUTED, lineHeight: 1.45 }}>
          Anyone with this link can view. Read-only, no login.
        </div>
        <div style={{ padding: "0 16px 14px", display: "flex", gap: 8 }}>
          <input
            ref={inputRef}
            readOnly
            value={loading ? "Creating link…" : (url ?? (error ? "" : ""))}
            placeholder={error ? "Failed to load" : ""}
            onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
            style={{ flex: 1, minWidth: 0, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, color: INK, background: "#FAF9F6", outline: "none" }}
          />
          <button
            type="button"
            onClick={handleCopy}
            disabled={!url || loading}
            style={{
              border: `1px solid ${copied ? GREEN : BORDER}`,
              color: copied ? GREEN : INK,
              background: "transparent",
              borderRadius: 8, padding: "0 12px", fontSize: 12, fontWeight: 500,
              cursor: url ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            {copied ? <><CheckIcon size={14} /> Copied</> : <><CopyIcon size={14} /> Copy</>}
          </button>
        </div>
        {error && (
          <div style={{ padding: "0 16px 12px", fontSize: 12, color: CORAL }}>{error}</div>
        )}
        <div style={{ borderTop: `1px solid ${BORDER}` }} />
        <div style={{ padding: "12px 16px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: INK }}>Replace this link</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.4 }}>
              Mints a new link. The old one stops working.
            </div>
          </div>
          <button
            type="button"
            onClick={handleRotate}
            disabled={rotating || loading || !sourceId}
            style={{ background: "transparent", border: 0, color: CORAL, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: 4, whiteSpace: "nowrap" }}
          >
            <RefreshCw size={14} style={rotating ? { animation: "brand-hub-spin 1s linear infinite" } : undefined} />
            {rotating ? "Replacing…" : "Rotate"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const INK = "#0E0F10";
const MUTED = "#6B6860";
const FAINT = "#9A9896";
const BORDER = "#ECEAE5";
const CORAL = "#E85A46";
const GREEN = "#22C55E";

const card: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${BORDER}`,
  borderRadius: 14,
  padding: 20,
};

function pill(active = false, accent = CORAL): React.CSSProperties {
  return {
    border: `1px solid ${active ? accent : BORDER}`,
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 12,
    background: "transparent",
    color: active ? accent : INK,
    cursor: "pointer",
    fontWeight: 500,
  };
}

function ensureSpinKeyframe() {
  if (typeof document === "undefined") return;
  if (document.getElementById("brand-hub-kf")) return;
  const s = document.createElement("style");
  s.id = "brand-hub-kf";
  s.textContent = `@keyframes brand-hub-spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(s);
}

export default function BrandHub() {
  const { user } = useAuth();
  ensureSpinKeyframe();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [strategy, setStrategy] = useState<any>(null);
  const [latestAuditId, setLatestAuditId] = useState<string | null>(null);
  const [latestKit, setLatestKit] = useState<{ id: string; kit_json: any } | null>(null);
  const [hubVisited, setHubVisited] = useState(false);
  const [tab, setTab] = useState<BrandTab>("welcome");
  const [auditStep, setAuditStep] = useState<AuditStep>("prompt");
  const [kitStep, setKitStep] = useState<KitStep>("visual");
  const wroteVisit = useRef(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, s, a, k] = await Promise.all([
        supabase
          .from("profiles")
          .select("website_url, brand_hub_visited, brand_colors, brand_logo_url, brand_fonts, business_name, full_name")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("strategies").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("audits").select("id").eq("user_id", user.id).eq("status", "ready").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("brand_kits").select("id, kit_json, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const prof: any = p.data ?? {};
      setProfile(prof);
      setStrategy(s.data);
      // Audits are now linked to signed-in users, so we can surface the latest
      // ready one for share/download/report views.
      setLatestAuditId(a.data?.id ?? null);
      setLatestKit(k.data ?? null);
      // If a completed Kit exists, land on the finished view. Otherwise start
      // the wizard at step 1 (visual). Never auto-generate on mount.
      setKitStep(k.data?.kit_json ? "kit" : "visual");
      const visited = !!prof.brand_hub_visited;
      setHubVisited(visited);
      if (visited) {
        setTab("audit");
        setAuditStep("results");
      } else {
        setTab("welcome");
      }
      setLoading(false);
    })();
  }, [user]);

  // Write visited flag on first render of welcome
  useEffect(() => {
    if (!user || loading || hubVisited || wroteVisit.current) return;
    if (tab !== "welcome") return;
    wroteVisit.current = true;
    supabase
      .from("profiles")
      .update({ brand_hub_visited: true })
      .eq("id", user.id)
      .then(() => setHubVisited(true));
  }, [user, loading, hubVisited, tab]);

  const tabs: { id: BrandTab; label: string }[] = [
    { id: "welcome", label: "Welcome" },
    { id: "audit", label: "Brand Audit" },
    { id: "kit", label: "Brand Kit" },
    { id: "assets", label: "Brand Assets" },
  ];

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", minHeight: "calc(100vh - 52px)" }}>
      {/* Page header */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: INK, margin: 0 }}>Brand Hub</h1>
        <p style={{ fontSize: 13, color: MUTED, margin: "4px 0 0" }}>
          Your strategy, your audit, and your brand kit, all in one place.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${BORDER}`, marginBottom: 20 }}>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                background: "transparent",
                border: "none",
                padding: "10px 0",
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active ? INK : MUTED,
                cursor: "pointer",
                borderBottom: active ? `2px solid ${CORAL}` : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {tab === "welcome" && (
          <WelcomePanel
            onAudit={() => { setTab("audit"); setAuditStep("prompt"); }}
            onKit={() => { setTab("kit"); setKitStep(latestKit?.kit_json ? "kit" : "visual"); }}
            onAssets={() => setTab("assets")}
          />
        )}
        {tab === "audit" && (
          <AuditPanel
            step={auditStep}
            setStep={setAuditStep}
            profile={profile}
            setProfile={setProfile}
            userId={user?.id}
            strategy={strategy}
            goAssets={() => setTab("assets")}
            latestAuditId={latestAuditId}
            onNewAudit={(id) => setLatestAuditId(id)}
          />
        )}
        {tab === "kit" && (
          <KitPanel
            step={kitStep}
            setStep={setKitStep}
            profile={profile}
            setProfile={setProfile}
            strategy={strategy}
            userId={user?.id}
            goAssets={() => setTab("assets")}
            latestKit={latestKit}
            onNewKit={(k) => setLatestKit(k)}
          />
        )}
        {tab === "assets" && (
          <AssetsPanel
            goAuditResults={() => { setTab("audit"); setAuditStep("results"); }}
            goAuditPrompt={() => { setTab("audit"); setAuditStep("prompt"); }}
            goKitVisual={() => { setTab("kit"); setKitStep("visual"); }}
            strategyId={strategy?.id ?? null}
            kitOwnerId={latestKit?.id ?? null}
            userId={user?.id ?? null}
            profile={profile}
            strategy={strategy}
            latestKit={latestKit}
            latestAuditId={latestAuditId}
          />
        )}
      </div>
    </div>
  );
}

/* -------------------- Welcome -------------------- */
function WelcomePanel({ onAudit, onKit, onAssets }: { onAudit: () => void; onKit: () => void; onAssets: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ maxWidth: 820, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: CORAL, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={26} color="#fff" />
        </div>
        <div style={{ textAlign: "center", maxWidth: 560 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: CORAL, textTransform: "uppercase", letterSpacing: "0.14em" }}>
            Welcome to Brand Hub
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: INK, lineHeight: 1.2, margin: "10px 0 12px" }}>
            Everything Your Brand Needs. In One Place.
          </h2>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            Brand Hub is where your strategy comes to life as tools you can actually use. Run a deep audit that measures your external presence against your strategy. Generate a brand kit to share with designers and collaborators. Access all your brand documents in one place, always current, always downloadable.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, width: "100%", maxWidth: 820, marginTop: 6 }}>
          <WelcomeCard
            onClick={onAudit}
            dark={false}
            iconBg="#FEF1EE"
            iconColor={CORAL}
            Icon={ClipboardCheck}
            title="Brand Audit"
            body="MOXIEMO scrapes your website and compares what the world sees against what your strategy says. You get a gap report with a scored breakdown and a ranked priority list."
            cta="Run your audit →"
            ctaColor={CORAL}
          />
          <WelcomeCard
            onClick={onKit}
            dark
            iconBg="rgba(255,255,255,0.1)"
            iconColor={CORAL}
            Icon={Palette}
            title="Brand Kit"
            body="A condensed, shareable brand document built from your strategy. Archetype, voice, key messages, content pillars, and ICP brief, formatted to hand to a designer, VA, or ghostwriter."
            cta="Generate your kit →"
            ctaColor={CORAL}
          />
          <WelcomeCard
            onClick={onAssets}
            dark={false}
            iconBg="#F0FDF4"
            iconColor="#16A34A"
            Icon={FolderOpen}
            title="Brand Assets"
            body="Every brand document MOXIEMO generates, your full strategy, brand kit, and audit reports, saved here automatically. Always downloadable as PDF. Always current."
            cta="View your assets →"
            ctaColor="#16A34A"
          />
        </div>

        <div style={{ background: "#F0EFEC", borderRadius: 20, padding: "8px 20px", maxWidth: 600, textAlign: "center", fontSize: 11, color: FAINT, marginTop: 6 }}>
          Your full brand strategy is already saved in Brand Assets, generated from your Discovery session. Everything updates automatically as your strategy evolves.
        </div>
      </div>
    </div>
  );
}

function WelcomeCard({
  onClick, dark, iconBg, iconColor, Icon, title, body, cta, ctaColor,
}: any) {
  const [hover, setHover] = useState(false);
  const hoverBorder = dark ? "rgba(232,90,70,0.5)" : CORAL;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: dark ? INK : "#fff",
        border: `1px solid ${hover ? hoverBorder : (dark ? "rgba(255,255,255,0.08)" : BORDER)}`,
        borderRadius: 14,
        padding: 20,
        cursor: "pointer",
        transition: "border-color 0.15s ease",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 0,
        textAlign: "left",
        font: "inherit",
        color: "inherit",
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={20} color={iconColor} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: dark ? "#fff" : INK }}>{title}</div>
      <div style={{ fontSize: 12, color: dark ? "rgba(255,255,255,0.6)" : MUTED, lineHeight: 1.6 }}>{body}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: ctaColor, marginTop: 4 }}>{cta}</div>
    </button>
  );
}

/* -------------------- Brand Audit -------------------- */
function AuditPanel({
  step, setStep, profile, setProfile, userId, strategy, goAssets, latestAuditId, onNewAudit,
}: {
  step: AuditStep;
  setStep: (s: AuditStep) => void;
  profile: any;
  setProfile: (p: any) => void;
  userId?: string;
  strategy?: any;
  goAssets: () => void;
  latestAuditId?: string | null;
  onNewAudit?: (id: string) => void;
}) {
  const [url, setUrl] = useState<string>(profile?.website_url ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setUrl(profile?.website_url ?? ""); }, [profile?.website_url]);

  // Real progress state, wired to actual backend events. No fixed timers driving
  // the checklist any more: each row flips to "done" only when its corresponding
  // call resolves. If any call fails or the whole run exceeds AUDIT_TIMEOUT_MS,
  // we transition to an "error" state instead of hanging on a spinner.
  type RunPhase = "idle" | "scraping" | "kickoff" | "generating" | "ready" | "error";
  const [runPhase, setRunPhase] = useState<RunPhase>("idle");
  const [runError, setRunError] = useState<string | null>(null);
  const [runAuditId, setRunAuditId] = useState<string | null>(null);
  const runIdRef = useRef(0);

  const AUDIT_TIMEOUT_MS = 180_000; // 3 minutes end-to-end

  const startRun = async (websiteUrl: string) => {
    const myRun = ++runIdRef.current;
    setRunError(null);
    setRunAuditId(null);
    setRunPhase("scraping");

    const deadline = Date.now() + AUDIT_TIMEOUT_MS;
    const stillCurrent = () => runIdRef.current === myRun;

    try {
      // Gate 1 (Strategy foundation loaded) is already true — profile+strategy
      // were fetched on Brand Hub mount before this panel could render.

      // Gate 2: Real deep scrape (same edge function the public /brand-audit
      // tool uses). This produces a full `payload` with signals, competitor
      // signals, model_type, low_data flag, and render_meta — the things Vera
      // needs to actually judge the brand. Pass through inputs derived from
      // the signed-in user's strategy so scrape-deep's extractor and the
      // findability probe have real context.
      const derivedInputs = {
        website: websiteUrl,
        brand_name:
          strategy?.business_name ||
          profile?.business_name ||
          profile?.full_name ||
          "",
        what_you_do: strategy?.pain_point || strategy?.transformation || "",
        who_you_serve: strategy?.ideal_client || "",
        differentiator: strategy?.differentiation || "",
        competitors: Array.isArray(strategy?.competitors) ? strategy.competitors : [],
        goal: "",
        location: "",
        reach: "",
      };
      const scrape = await supabase.functions.invoke("scrape-deep", {
        body: { url: websiteUrl, inputs: derivedInputs },
      });
      if (!stillCurrent()) return;
      if (scrape.error) throw new Error(scrape.error.message || "Website scrape failed");
      const scrapePayload: any = scrape.data ?? { inputs: derivedInputs };

      // Build the explicit strategy_foundation object the finalize-audit
      // function will prefer over the silent auth.uid() lookup.
      const strategyFoundation = strategy
        ? {
            enhanced_foundation: strategy.enhanced_foundation ?? null,
            business_name: strategy.business_name ?? null,
            ideal_client: strategy.ideal_client ?? null,
            pain_point: strategy.pain_point ?? null,
            differentiation: strategy.differentiation ?? null,
            voice_attributes: strategy.voice_attributes ?? null,
            transformation: strategy.transformation ?? null,
          }
        : null;

      // Gate 3: kickoff the audit generation pipeline with the full payload
      // AND the explicit strategy foundation so Vera never runs blind.
      setRunPhase("kickoff");
      const finalize = await supabase.functions.invoke("finalize-audit", {
        body: {
          url: websiteUrl,
          payload: {
            ...scrapePayload,
            strategy_id: strategy?.id ?? null,
            strategy_foundation: strategyFoundation,
            ideal_client: strategy?.ideal_client ?? null,
          },
        },
      });
      if (!stillCurrent()) return;
      if (finalize.error) throw new Error(finalize.error.message || "Could not start audit");
      const auditId: string | undefined = (finalize.data as any)?.audit_id;
      if (!auditId) throw new Error("Audit backend did not return an id");
      setRunAuditId(auditId);
      setRunPhase("generating");

      // Gate 4/5: poll audits row for the terminal status the backend writes.
      while (stillCurrent()) {
        if (Date.now() > deadline) throw new Error("Audit timed out. Please try again.");
        await new Promise((r) => setTimeout(r, 3000));
        if (!stillCurrent()) return;
        const { data, error } = await supabase
          .from("audits")
          .select("status, review_reason")
          .eq("id", auditId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) continue;
        if (data.status === "ready") {
          setRunPhase("ready");
          onNewAudit?.(auditId);
          setStep("results");
          return;
        }
        if (data.status === "failed") {
          throw new Error(data.review_reason || "Audit generation failed");
        }
      }
    } catch (e: any) {
      if (!stillCurrent()) return;
      setRunError(String(e?.message ?? e));
      setRunPhase("error");
    }
  };

  // Kick off a real run whenever we enter the "running" step.
  useEffect(() => {
    if (step !== "running") {
      runIdRef.current++; // cancel any in-flight run
      setRunPhase("idle");
      setRunError(null);
      return;
    }
    const target = (profile?.website_url || url || "").trim();
    if (!target) {
      setRunError("No website URL on file.");
      setRunPhase("error");
      return;
    }
    startRun(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const domain = useMemo(() => {
    const u = profile?.website_url || url || "";
    try { return new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace(/^www\./, ""); }
    catch { return u.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || "your site"; }
  }, [profile?.website_url, url]);

  if (step === "prompt") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ ...card, maxWidth: 480, width: "100%", padding: 32, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FEF1EE", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={24} color={CORAL} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: INK, marginTop: 16 }}>Run Your Brand Audit</h2>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, marginTop: 8 }}>
            MOXIEMO will compare your external presence, website, LinkedIn, content, against your strategy. Enter your website URL to begin. You only need to do this once.
          </p>
          <div style={{ marginTop: 20, textAlign: "left" }}>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourdomain.com"
              style={{
                width: "100%",
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 14,
                outline: "none",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = CORAL)}
              onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
            />
            <div style={{ fontSize: 11, color: FAINT, marginTop: 6 }}>
              Saved to your profile. Used for Brand Audit and Brand Kit.
            </div>
          </div>
          <button
            type="button"
            disabled={saving || !url.trim()}
            onClick={async () => {
              if (!userId) return;
              setSaving(true);
              await supabase.from("profiles").update({ website_url: url.trim() }).eq("id", userId);
              setProfile({ ...profile, website_url: url.trim() });
              setSaving(false);
              setStep("running");
            }}
            style={{
              marginTop: 16,
              width: "100%",
              background: CORAL,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              height: 44,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "0 4px 14px rgba(232,90,70,0.35)",
              cursor: "pointer",
              opacity: saving || !url.trim() ? 0.6 : 1,
            }}
          >
            {saving ? "Saving…" : "Run Audit →"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "running") {
    // Map real phases to the 5 checklist rows. Rows are driven by concrete
    // events, not a fixed timer: rows only flip to "done" after their gate
    // has been observed to succeed.
    const statusFor = (idx: number): "done" | "active" | "idle" => {
      // 0: Strategy foundation loaded (mount)
      // 1: Website scraped and read (scrape-initial resolved)
      // 2: Comparing presence to strategy (finalize-audit accepted the run)
      // 3: Generating advisor read (audits row is generating)
      // 4: Building priority list (audits row transitions to ready)
      const phaseOrder: RunPhase[] = ["scraping", "kickoff", "generating", "generating", "ready"];
      const rowPhase = phaseOrder[idx];
      // ordering of phases for comparison
      const rank: Record<RunPhase, number> = {
        idle: -1, scraping: 0, kickoff: 1, generating: 2, ready: 3, error: -2,
      };
      if (runPhase === "ready") return "done";
      if (runPhase === "error") return idx === 0 ? "done" : "idle";
      const cur = rank[runPhase];
      const need = rank[rowPhase];
      if (idx === 0) return "done"; // strategy is already loaded before entering this step
      if (cur > need) return "done";
      if (cur === need) return "active";
      return "idle";
    };

    if (runPhase === "error") {
      return (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ ...card, maxWidth: 480, width: "100%", padding: 32, textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FEF1EE", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={24} color={CORAL} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 16 }}>Something went wrong</h3>
            <p style={{ fontSize: 13, color: MUTED, marginTop: 6, lineHeight: 1.6 }}>
              {runError || "The audit could not finish. Your profile is saved — try again."}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18 }}>
              <button type="button" onClick={() => setStep("prompt")} style={pill(false)}>Back</button>
              <button
                type="button"
                onClick={() => { setRunPhase("idle"); startRun((profile?.website_url || url || "").trim()); }}
                style={{ background: CORAL, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ ...card, maxWidth: 480, width: "100%", padding: 32, textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${BORDER}`, borderTopColor: CORAL, borderRadius: "50%", margin: "0 auto", animation: "brand-hub-spin 0.9s linear infinite" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 16 }}>Running Your Brand Audit</h3>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Scanning {domain} and comparing against your strategy</div>
          <div style={{ marginTop: 20, maxWidth: 320, marginLeft: "auto", marginRight: "auto", textAlign: "left", display: "flex", flexDirection: "column", gap: 0 }}>
            <ChecklistRow status={statusFor(0)} label="Strategy foundation loaded" />
            <ChecklistRow status={statusFor(1)} label="Website scraped and read" />
            <ChecklistRow status={statusFor(2)} label="Comparing presence to strategy…" />
            <ChecklistRow status={statusFor(3)} label="Generating advisor read" />
            <ChecklistRow status={statusFor(4)} label="Building priority list" />
          </div>
          {runAuditId && (
            <div style={{ marginTop: 14, fontSize: 10, color: FAINT, fontFamily: "ui-monospace, monospace" }}>
              audit {runAuditId.slice(0, 8)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // results
  return <AuditResults domain={domain} setStep={setStep} goAssets={goAssets} latestAuditId={latestAuditId} />;
}

function ChecklistRow({ status, label }: { status: "done" | "active" | "idle"; label: string }) {
  const color = status === "done" ? GREEN : status === "active" ? CORAL : "#9A9896";
  const Icon = status === "done" ? CheckCircle2 : status === "active" ? Loader2 : Circle;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "5px 0", color: status === "idle" ? FAINT : INK }}>
      <Icon size={16} color={color} style={status === "active" ? { animation: "brand-hub-spin 0.9s linear infinite" } : undefined} />
      <span>{label}</span>
    </div>
  );
}

function AuditResults({ domain, setStep, goAssets, latestAuditId }: { domain: string; setStep: (s: AuditStep) => void; goAssets: () => void; latestAuditId?: string | null }) {
  const [dlBusy, setDlBusy] = useState(false);
  const [auditData, setAuditData] = useState<AuditResponse | null>(null);
  const [auditCreatedAt, setAuditCreatedAt] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Always drive the results view off the actual latest ready audit row.
  // When `latestAuditId` changes (a new run finished), refetch — this is what
  // keeps the view from displaying a stale audit after a fresh run.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadErr(null);
      setLoading(true);
      if (!latestAuditId) {
        setAuditData(null);
        setAuditCreatedAt(null);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("audits")
        .select("status, brand_audit_score, report, inputs, stage, posture, created_at")
        .eq("id", latestAuditId)
        .maybeSingle();
      if (cancelled) return;
      if (error) { setLoadErr(error.message); setLoading(false); return; }
      if (!data || !data.report) { setLoadErr("Audit report not available."); setLoading(false); return; }
      setAuditData({
        status: data.status as any,
        brand_audit_score: data.brand_audit_score ?? 0,
        report: data.report as any,
        inputs: data.inputs as any,
        stage: data.stage ?? null,
        posture: data.posture ?? null,
      });
      setAuditCreatedAt(data.created_at as string | null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [latestAuditId]);

  const handleDownload = async () => {
    setDlBusy(true);
    try {
      // Always resolve the newest ready audit for this user at click time so
      // the PDF can never be rendered from a stale in-memory row. Falls back
      // to `latestAuditId` if the freshness query fails for any reason.
      let targetId = latestAuditId ?? null;
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id ?? null;
      if (uid) {
        const { data: newest } = await supabase
          .from("audits")
          .select("id")
          .eq("user_id", uid)
          .eq("status", "ready")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (newest?.id) targetId = newest.id;
      }
      if (!targetId) { toast({ title: "Run an audit first", variant: "destructive" }); return; }
      const { data: row, error } = await supabase
        .from("audits")
        .select("status, brand_audit_score, report, inputs, stage, posture")
        .eq("id", targetId)
        .maybeSingle();
      if (error) throw error;
      if (!row || !row.report) throw new Error("Audit report not available yet.");
      let preparedFor: string | null = null;
      if (uid) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", uid)
          .maybeSingle();
        preparedFor = (prof?.full_name ?? null) as string | null;
      }
      await downloadAuditPdf({
        status: row.status as any,
        brand_audit_score: row.brand_audit_score ?? 0,
        report: row.report as any,
        inputs: row.inputs as any,
        stage: row.stage ?? null,
        posture: row.posture ?? null,
        prepared_for: preparedFor,
      });
    } catch (e: any) {
      toast({ title: "PDF export failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally { setDlBusy(false); }
  };

  const fmtDate = (iso: string | null) => {
    if (!iso) return "—";
    try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
    catch { return "—"; }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${BORDER}`, borderTopColor: CORAL, borderRadius: "50%", animation: "brand-hub-spin 0.9s linear infinite" }} />
      </div>
    );
  }

  if (!auditData) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ ...card, maxWidth: 480, width: "100%", padding: 32, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FEF1EE", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={24} color={CORAL} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 16 }}>No audit yet</h3>
          <p style={{ fontSize: 13, color: MUTED, marginTop: 6, lineHeight: 1.6 }}>
            {loadErr || "Run your first Brand Audit to see your strategy-aware findings here."}
          </p>
          <button type="button" onClick={() => setStep("prompt")} style={{ marginTop: 16, background: CORAL, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Run Brand Audit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Returning banner — driven by the actual audit row */}
      <div style={{ ...card, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 12, color: MUTED }}>
          Last audit: {fmtDate(auditCreatedAt)} · Score {auditData.brand_audit_score}/100 · Auditing <strong style={{ color: INK }}>{domain}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" onClick={goAssets} style={pill(false)}>View in Assets</button>
          <button type="button" onClick={handleDownload} disabled={dlBusy} style={pill(false)}>{dlBusy ? "Preparing…" : "Download PDF"}</button>
          <button type="button" onClick={() => setStep("prompt")} style={pill(true)}>↺ Re-run Audit</button>
        </div>
      </div>

      {/* Real strategy-aware report — same component the /brand-audit/r/:id page uses */}
      <div style={{ background: "#F7F5F1", borderRadius: 14, marginTop: -6 }}>
        <BrandAuditReport data={auditData} />
      </div>
    </div>
  );
}

/* -------------------- Brand Kit -------------------- */
function KitPanel({
  step, setStep, profile, setProfile, strategy, userId, goAssets, latestKit, onNewKit,
}: any) {
  const [url, setUrl] = useState<string>(profile?.website_url ?? "");
  const [colors, setColors] = useState<string[]>(
    Array.isArray(profile?.brand_colors) && profile.brand_colors.length
      ? profile.brand_colors
      : ["#0E0F10", "#E85A46", "#F7F5F1"]
  );
  const [fonts, setFonts] = useState<string[]>(
    Array.isArray(profile?.brand_fonts) && profile.brand_fonts.length
      ? profile.brand_fonts
      : ["Space Grotesk", "Inter"]
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(profile?.brand_logo_url ?? null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [kit, setKit] = useState<any>(latestKit?.kit_json ?? null);
  const [kitId, setKitId] = useState<string | null>(latestKit?.id ?? null);

  useEffect(() => {
    if (latestKit?.kit_json && !kit) {
      setKit(latestKit.kit_json);
      setKitId(latestKit.id);
    }
  }, [latestKit, kit]);

  useEffect(() => {
    if (step !== "generating") return;
    let cancelled = false;
    (async () => {
      setGenError(null);
      try {
        const { data, error } = await supabase.functions.invoke("generate-brand-kit", { body: {} });
        if (cancelled) return;
        if (error) throw error;
        if (!data?.kit) throw new Error(data?.error || "Kit generation returned no content");
        setKit(data.kit);
        setKitId(data.kit_id ?? null);
        onNewKit?.({ id: data.kit_id, kit_json: data.kit });
        setStep("kit");
      } catch (e: any) {
        if (cancelled) return;
        setGenError(String(e?.message ?? e));
      }
    })();
    return () => { cancelled = true; };
  }, [step, setStep, onNewKit]);

  async function handleLogo(file: File) {
    if (!userId) return;
    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/logo.${ext}`;
    const up = await supabase.storage.from("brand-kit").upload(path, file, { upsert: true });
    if (up.error) return;
    const { data } = await supabase.storage.from("brand-kit").createSignedUrl(path, 60 * 60 * 24 * 365);
    const signed = data?.signedUrl ?? null;
    setLogoUrl(signed);
    await supabase.from("profiles").update({ brand_logo_url: signed }).eq("id", userId);
    setProfile({ ...profile, brand_logo_url: signed });
  }

  if (step === "visual") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <StepPill index={1} label="Voice" state="done" />
          <div style={{ flex: 1, maxWidth: 32, height: 1, background: BORDER }} />
          <StepPill index={2} label="Visual Assets" state="active" />
          <div style={{ flex: 1, maxWidth: 32, height: 1, background: BORDER }} />
          <StepPill index={3} label="Generate" state="idle" />
        </div>

        <div style={{ ...card, padding: 28 }}>
          {/* URL */}
          <FieldLabel>Website URL</FieldLabel>
          <div style={{ fontSize: 11, color: FAINT, marginBottom: 8 }}>We extract your live colors and typography from your site.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourdomain.com"
              style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = CORAL)}
              onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
            />
            <button style={{ background: INK, color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", height: 40, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Scan Site
            </button>
          </div>

          <Divider />

          <FieldLabel>Logo</FieldLabel>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border: `1.5px dashed ${BORDER}`, borderRadius: 10, padding: 20, textAlign: "center", background: "#FAFAF8", cursor: "pointer" }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogo(f); }}
            />
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ maxHeight: 60, margin: "0 auto" }} />
            ) : (
              <>
                <UploadCloud size={24} color={FAINT} style={{ margin: "0 auto" }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: INK, marginTop: 8 }}>Upload your logo</div>
                <div style={{ fontSize: 11, color: FAINT }}>PNG, SVG, or JPG · Stored to your profile</div>
              </>
            )}
          </div>

          <Divider />

          <FieldLabel>Brand Colors</FieldLabel>
          <div style={{ fontSize: 11, color: FAINT, marginBottom: 10 }}>Auto-extracted from your site. Confirm or edit.</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
            {colors.map((c, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}>
                <input
                  type="color"
                  value={c}
                  onChange={(e) => setColors(colors.map((x, j) => (i === j ? e.target.value : x)))}
                  style={{ width: 36, height: 36, padding: 0, border: "none", background: "transparent", borderRadius: "50%", cursor: "pointer" }}
                />
                <div style={{ fontSize: 10, color: MUTED }}>{c.toUpperCase()}</div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setColors([...colors, "#888888"])}
              style={{ width: 36, height: 36, border: `1px dashed ${BORDER}`, borderRadius: 6, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              aria-label="Add color"
            >
              <Plus size={14} color={FAINT} />
            </button>
          </div>

          <Divider />

          <FieldLabel>Typography</FieldLabel>
          <div style={{ fontSize: 11, color: FAINT, marginBottom: 10 }}>Auto-detected from your site.</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {fonts.map((f, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#F0EFEC", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 500, color: INK }}>
                {f}
                <X size={12} color={FAINT} style={{ cursor: "pointer" }} onClick={() => setFonts(fonts.filter((_, j) => j !== i))} />
              </span>
            ))}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1px dashed ${BORDER}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: FAINT, cursor: "pointer" }}>
              <Plus size={12} /> Add font
            </span>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (userId) {
                await supabase.from("profiles").update({
                  website_url: url.trim() || null,
                  brand_colors: colors,
                  brand_fonts: fonts,
                }).eq("id", userId);
                setProfile({ ...profile, website_url: url.trim(), brand_colors: colors, brand_fonts: fonts });
              }
              setStep("generating");
            }}
            style={{
              marginTop: 20,
              width: "100%",
              background: CORAL,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              height: 46,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "0 4px 14px rgba(232,90,70,0.35)",
              cursor: "pointer",
            }}
          >
            Generate Brand Kit →
          </button>
        </div>
      </div>
    );
  }

  if (step === "generating") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ ...card, maxWidth: 480, width: "100%", padding: 32, textAlign: "center" }}>
          {genError ? (
            <>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FEF1EE", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={24} color={CORAL} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 16 }}>Could not generate your kit</h3>
              <p style={{ fontSize: 13, color: MUTED, marginTop: 6, lineHeight: 1.6 }}>{genError}</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18 }}>
                <button type="button" onClick={() => setStep("visual")} style={pill(false)}>Back</button>
                <button type="button" onClick={() => { setGenError(null); setStep("visual"); setTimeout(() => setStep("generating"), 0); }}
                  style={{ background: CORAL, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Retry</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ width: 40, height: 40, border: `3px solid ${BORDER}`, borderTopColor: CORAL, borderRadius: "50%", margin: "0 auto", animation: "brand-hub-spin 0.9s linear infinite" }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 16 }}>Building Your Brand Kit…</h3>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Combining your strategy with your visual assets</div>
              <div style={{ marginTop: 20, maxWidth: 320, marginLeft: "auto", marginRight: "auto", textAlign: "left" }}>
                <ChecklistRow status="done" label="Voice data loaded from your strategy" />
                <ChecklistRow status="done" label="Visual assets confirmed" />
                <ChecklistRow status="active" label="Writing narrative sections…" />
                <ChecklistRow status="idle" label="Assembling final document" />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // kit
  return <KitDocument profile={profile} strategy={strategy} colors={colors} logoUrl={logoUrl} fonts={fonts} setStep={setStep} goAssets={goAssets} kitOwnerId={kitId} kit={kit} />;
}

function StepPill({ index, label, state }: { index: number; label: string; state: "done" | "active" | "idle" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {state === "done" ? (
        <CheckCircle2 size={16} color={GREEN} />
      ) : state === "active" ? (
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: CORAL, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{index}</div>
      ) : (
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${BORDER}`, color: FAINT, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{index}</div>
      )}
      <span style={{ fontSize: 12, fontWeight: state === "idle" ? 400 : 600, color: state === "done" ? GREEN : state === "active" ? CORAL : FAINT }}>{label}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: FAINT, letterSpacing: "0.08em", marginBottom: 4 }}>{children}</div>;
}
function Divider() { return <div style={{ height: 1, background: BORDER, margin: "16px 0" }} />; }

function KitDocument({ profile, strategy, colors, logoUrl, fonts, setStep, goAssets, kitOwnerId, kit }: any) {
  const brandName = kit?.brand_name || strategy?.business_name || profile?.business_name || profile?.full_name || "Your Brand";
  const generatedAt = "Jun 22, 2026";

  const palette = (colors && colors.length ? colors : ["#0E0F10", "#E85A46", "#F7F5F1", "#B8C5A6"]).slice(0, 4);
  const fontName = fonts?.[0] || "Space Grotesk";

  const archetypePrimary = kit?.archetype?.primary || "The Magician";
  const archetypeSecondary = kit?.archetype?.secondary || "Creator";
  const archetypeDescription = kit?.archetype?.description || "Transforms chaos into clarity, complexity into autonomy. Promises to turn a founder's vision into reality through a system that feels effortless.";
  const voiceAttrs: string[] = Array.isArray(kit?.voice?.attributes) && kit.voice.attributes.length
    ? kit.voice.attributes
    : ["Clear and Direct", "Empowering, Not Overwhelming", "Strategic, Not Salesy", "Honest and Specific"];
  const neverUse: string[] = Array.isArray(kit?.voice?.never_use) && kit.voice.never_use.length
    ? kit.voice.never_use
    : ["Em-Dashes", "Contractions in Formal Copy", "Filler Phrases"];
  const icpRows: [string, string][] = [
    ["Revenue Floor", kit?.icp?.revenue_floor || "$250K+ annually"],
    ["Business Type", kit?.icp?.business_type || "Expertise-based, founder-led"],
    ["Core Pain", kit?.icp?.core_pain || "20+ hrs/week on reactive marketing with no strategy"],
    ["Transformation", kit?.icp?.transformation || "From tool chaos to 1 platform, 2 hrs/week"],
  ];
  const keyMessages: string[] = Array.isArray(kit?.key_messages) && kit.key_messages.length
    ? kit.key_messages
    : [
        "You built a real business. Your marketing should match.",
        "Strategy first. Always. Then content that actually works.",
        "One platform. 18 hours back. Revenue that moves.",
      ];
  const primaryPillar = kit?.pillars?.primary || "Strategy-First Marketing";
  const supportingPillars: string[] = Array.isArray(kit?.pillars?.supporting) && kit.pillars.supporting.length
    ? kit.pillars.supporting
    : ["Founder Wins & Beta Stories", "Platform Transparency & Product Updates", "Founder Efficiency Hacks", "Market Positioning & Differentiation"];

  // Enrichment sections (Positioning / Values / Tone) — derived structure-agnostically
  // from the kit's own fields when present, otherwise from strategy.enhanced_foundation.
  const enrichment = deriveEnrichment(kit, strategy);
  const positioning = enrichment.positioning;
  const values = enrichment.values;
  const tone = enrichment.tone;

  const [dlBusy, setDlBusy] = useState(false);
  const handleDownload = async () => {
    setDlBusy(true);
    try {
      const data: BrandKitData = {
        siteName: brandName,
        websiteUrl: profile?.website_url ?? "",
        logo: logoUrl ?? undefined,
        colors: palette.map((hex: string, i: number) => ({ hex, rgb: "", role: i === 0 ? "Primary" : i === 1 ? "Accent" : `Support ${i - 1}` })),
        fonts: { heading: fontName, body: fonts?.[1] || fontName },
        imagery: [],
        kit: kit ?? null,
        enhancedFoundation: strategy?.enhanced_foundation ?? null,
      };
      const blob = await generateBrandKitPdf(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brand"}-brand-kit.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      toast({ title: "PDF export failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally { setDlBusy(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Cover */}
      <div style={{ background: INK, borderRadius: 14, padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#5A5855", letterSpacing: "0.1em" }}>MOXIEMO Brand Guide</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginTop: 6 }}>{brandName}</div>
          <div style={{ fontSize: 12, color: "#9A9896", marginTop: 4 }}>Brand Identity · Voice · Visual Direction · Key Messages</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ShareControls documentType="brand-kit" sourceId={kitOwnerId} dark />
          <button onClick={handleDownload} disabled={dlBusy} style={{ background: CORAL, color: "#fff", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: dlBusy ? "not-allowed" : "pointer", opacity: dlBusy ? 0.6 : 1 }}>{dlBusy ? "Preparing…" : "Download PDF"}</button>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: FAINT, letterSpacing: "0.12em", marginTop: 6 }}>Part I — Voice</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Card A — Archetype */}
        <KitCard title>
          <CopyPill />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 56, height: 56, background: INK, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wand2 size={24} color={CORAL} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: INK }}>{archetypePrimary}</div>
              <div style={{ fontSize: 12, color: MUTED }}>Secondary: {archetypeSecondary}</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginTop: 10 }}>
            {archetypeDescription}
          </p>
        </KitCard>

        {/* Card B — Voice */}
        <KitCard>
          <CopyPill />
          <div style={{ fontSize: 11, color: FAINT, marginBottom: 8 }}>Use these to brief anyone writing for your brand.</div>
          {voiceAttrs.map((v: string) => (
            <div key={v} style={{ borderLeft: `2px solid ${CORAL}`, background: "#FAFAF8", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: INK, marginBottom: 4 }}>
              {v}
            </div>
          ))}
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: FAINT, marginTop: 12, marginBottom: 6 }}>Never Use</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {neverUse.map((v: string) => (
              <span key={v} style={{ background: "#F0EFEC", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: FAINT, textDecoration: "line-through" }}>{v}</span>
            ))}
          </div>
        </KitCard>

        {/* Card C — ICP */}
        <KitCard>
          <CopyPill />
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 10 }}>Ideal Client Profile</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {icpRows.map(([l, v]) => (
              <div key={l} style={{ background: "#F7F5F1", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: FAINT, letterSpacing: "0.06em" }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: INK, lineHeight: 1.4, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </KitCard>

        {/* Card D — Key messages */}
        <KitCard>
          <CopyPill />
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 8 }}>Key Messages</div>
          <div style={{ fontSize: 11, color: FAINT, marginBottom: 8 }}>Use across bio, pitches, and onboarding copy.</div>
          {keyMessages.map((q: string) => (
            <div key={q} style={{ background: "#F7F5F1", borderLeft: `2.5px solid ${CORAL}`, borderRadius: "0 8px 8px 0", padding: "10px 14px", fontSize: 13, color: INK, lineHeight: 1.5, marginBottom: 6 }}>
              {q}
            </div>
          ))}
        </KitCard>

        {/* Card E — Pillars */}
        <KitCard fullWidth>
          <CopyPill />
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 10 }}>Content Pillars</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span style={{ background: INK, color: "#fff", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600 }}>{primaryPillar}</span>
            {supportingPillars.map((p: string) => (
              <span key={p} style={{ background: "#FEF1EE", color: CORAL, borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 500 }}>{p}</span>
            ))}
          </div>
        </KitCard>
      </div>

      {/* Enrichment: Positioning / Values / Tone — additive strategy-depth pages */}
      {positioning ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <KitCard fullWidth>
            <CopyPill />
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: FAINT, letterSpacing: "0.1em", marginBottom: 6 }}>
              07 · Positioning
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: INK, marginBottom: 6 }}>Where you stand.</div>
            {positioning.statement ? (
              <div style={{ background: INK, color: "#fff", borderRadius: 10, padding: "14px 18px", fontSize: 14, lineHeight: 1.55, marginBottom: 14 }}>
                {positioning.statement}
              </div>
            ) : null}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                ["Who", positioning.who],
                ["Problem", positioning.problem],
                ["Solution", positioning.solution],
                ["Result", positioning.result],
              ].map(([label, val]) => (
                <div key={label} style={{ background: "#F7F5F1", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: FAINT, letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, color: INK, lineHeight: 1.5 }}>{val || "Not provided."}</div>
                </div>
              ))}
            </div>
          </KitCard>
        </div>
      ) : null}

      {values.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <KitCard fullWidth>
            <CopyPill />
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: FAINT, letterSpacing: "0.1em", marginBottom: 6 }}>
              08 · Values
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: INK, marginBottom: 4 }}>How you decide.</div>
            <div style={{ fontSize: 12, color: FAINT, marginBottom: 12 }}>Every value is a decision filter. When you are not sure, ask the question.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {values.map((v, i) => (
                <div key={v.name + i} style={{ background: "#FAFAF8", borderLeft: `3px solid ${CORAL}`, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 6 }}>{v.name}</div>
                  {v.filter ? (
                    <div style={{ fontSize: 12, color: MUTED, fontStyle: "italic", lineHeight: 1.5 }}>{v.filter}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </KitCard>
        </div>
      ) : null}

      {(tone.words_to_use.length || tone.words_to_avoid.length || tone.tone_by_platform.length) ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <KitCard fullWidth>
            <CopyPill />
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", color: FAINT, letterSpacing: "0.1em", marginBottom: 6 }}>
              09 · Tone
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: INK, marginBottom: 12 }}>Words and rhythm.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: FAINT, letterSpacing: "0.08em", marginBottom: 8 }}>Words to use</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {tone.words_to_use.map((w, i) => (
                    <span key={i} style={{ background: "#FEF1EE", color: CORAL, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 500 }}>{w}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: FAINT, letterSpacing: "0.08em", marginBottom: 8 }}>Words to avoid</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {tone.words_to_avoid.map((w, i) => (
                    <span key={i} style={{ background: "#F0EFEC", color: FAINT, borderRadius: 20, padding: "4px 12px", fontSize: 12, textDecoration: "line-through" }}>{w}</span>
                  ))}
                </div>
              </div>
            </div>
            {tone.tone_by_platform.length ? (
              <>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: FAINT, letterSpacing: "0.08em", marginBottom: 8 }}>Tone by platform</div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${tone.tone_by_platform.length}, 1fr)`, gap: 10 }}>
                  {tone.tone_by_platform.map((t, i) => (
                    <div key={t.platform + i} style={{ background: "#F7F5F1", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: CORAL, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{t.platform}</div>
                      <div style={{ fontSize: 13, color: INK, lineHeight: 1.5 }}>{t.descriptor}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </KitCard>
        </div>
      ) : null}

      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: FAINT, letterSpacing: "0.12em", marginTop: 6 }}>Part II — Visual Direction</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <KitCard>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 10 }}>Brand Colors</div>
          <div style={{ display: "flex", gap: 8 }}>
            {palette.map((c: string, i: number) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ height: 52, background: c, borderRadius: 8 }} />
                <div style={{ fontSize: 11, color: MUTED, marginTop: 4, textAlign: "center" }}>{c.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </KitCard>
        <KitCard>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 10 }}>Typography & Logo</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: INK }}>{fontName}</div>
              <div style={{ fontSize: 13, color: MUTED }}>Regular · Medium · Bold</div>
            </div>
            <div style={{ background: "#F7F5F1", borderRadius: 8, padding: 12, minWidth: 100, minHeight: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ maxHeight: 40, maxWidth: 120 }} /> : <span style={{ fontSize: 11, color: FAINT }}>No logo</span>}
            </div>
          </div>
        </KitCard>
      </div>

      {/* Footer */}
      <div style={{ ...card, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 10 }}>
        <div style={{ fontSize: 12, color: FAINT }}>
          Generated from your strategy · Saved to Brand Assets automatically · last generated {generatedAt}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={pill()} onClick={goAssets}>View in Assets</button>
          <button style={pill()} onClick={handleDownload} disabled={dlBusy}>{dlBusy ? "Preparing…" : "Download PDF"}</button>
          <ShareControls documentType="brand-kit" sourceId={kitOwnerId} />
          <button style={pill(true)} onClick={() => setStep("visual")}>↺ Regenerate Kit</button>
        </div>
      </div>
    </div>
  );
}

function KitCard({ children, fullWidth }: { children: React.ReactNode; fullWidth?: boolean; title?: boolean }) {
  return (
    <div style={{ ...card, position: "relative", gridColumn: fullWidth ? "1 / -1" : undefined }}>
      {children}
    </div>
  );
}
function CopyPill() {
  return (
    <button style={{ position: "absolute", top: 14, right: 14, fontSize: 11, textTransform: "uppercase", color: CORAL, border: `1px solid ${BORDER}`, borderRadius: 20, padding: "3px 10px", background: "transparent", cursor: "pointer" }}>
      Copy Section
    </button>
  );
}

/* -------------------- Brand Assets -------------------- */
function AssetsPanel({ goAuditResults, goAuditPrompt, goKitVisual, strategyId, kitOwnerId, latestAuditId, userId, profile, strategy, latestKit }: { goAuditResults: () => void; goAuditPrompt: () => void; goKitVisual: () => void; strategyId?: string | null; kitOwnerId?: string | null; latestAuditId?: string | null; userId?: string | null; profile?: any; strategy?: any; latestKit?: { id: string; kit_json: any } | null }) {
  const [busy, setBusy] = useState<null | "strategy" | "kit" | "audit">(null);
  // Load the real latest audit row so the "Brand Audit Report" card can never
  // show fabricated headline data. If no audit exists yet, `latestAudit`
  // stays null and the card renders an empty state.
  const [latestAudit, setLatestAudit] = useState<{
    created_at: string | null;
    score: number | null;
    strongest: { title: string; score: number } | null;
    weakest: { title: string; score: number } | null;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!latestAuditId) { setLatestAudit(null); return; }
      const { data } = await supabase
        .from("audits")
        .select("created_at, brand_audit_score, report")
        .eq("id", latestAuditId)
        .maybeSingle();
      if (cancelled || !data) return;
      const sections: Array<{ title?: string; score?: number }> = Array.isArray((data.report as any)?.sections)
        ? (data.report as any).sections
        : [];
      const scored = sections
        .filter((s) => typeof s?.score === "number" && typeof s?.title === "string")
        .map((s) => ({ title: s.title as string, score: s.score as number }));
      let strongest: { title: string; score: number } | null = null;
      let weakest: { title: string; score: number } | null = null;
      for (const s of scored) {
        if (!strongest || s.score > strongest.score) strongest = s;
        if (!weakest || s.score < weakest.score) weakest = s;
      }
      setLatestAudit({
        created_at: (data.created_at as string) ?? null,
        score: (data.brand_audit_score as number) ?? null,
        strongest,
        weakest,
      });
    })();
    return () => { cancelled = true; };
  }, [latestAuditId]);
  const auditDateLabel = latestAudit?.created_at
    ? new Date(latestAudit.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;
  const dlStrategy = async () => {
    if (!userId) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    setBusy("strategy");
    try {
      const [{ data: strategyRow }, { data: profileRow }] = await Promise.all([
        supabase.from("strategies").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("profiles").select("full_name, business_name, email, created_at").eq("id", userId).maybeSingle(),
      ]);
      if (!strategyRow) throw new Error("No strategy on file.");
      const rd = buildReportData(strategyRow, profileRow);
      const first = String(profileRow?.full_name || "Founder").split(/\s+/)[0].replace(/[^A-Za-z0-9_-]/g, "") || "Founder";
      const d = new Date();
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      await downloadStrategyPdf(rd, `${first}-MOXIEMO-Strategy-${date}.pdf`);
    } catch (e: any) {
      toast({ title: "Could not export strategy PDF", description: e?.message ?? String(e), variant: "destructive" });
    } finally { setBusy(null); }
  };
  const dlKit = async () => {
    if (!latestKit) { toast({ title: "Generate your Brand Kit first", variant: "destructive" }); return; }
    setBusy("kit");
    try {
      const data: BrandKitData = {
        siteName: strategy?.business_name || profile?.business_name || profile?.full_name || "Your Brand",
        websiteUrl: profile?.website_url ?? "",
        logo: profile?.brand_logo_url ?? undefined,
        colors: (Array.isArray(profile?.brand_colors) ? profile.brand_colors : []).map((hex: string, i: number) => ({ hex, rgb: "", role: i === 0 ? "Primary" : i === 1 ? "Accent" : `Support ${i - 1}` })),
        fonts: { heading: profile?.brand_fonts?.[0] || "Helvetica", body: profile?.brand_fonts?.[1] || profile?.brand_fonts?.[0] || "Helvetica" },
        imagery: [],
        kit: latestKit?.kit_json ?? null,
        enhancedFoundation: strategy?.enhanced_foundation ?? null,
      };
      const blob = await generateBrandKitPdf(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.siteName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brand"}-brand-kit.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      toast({ title: "Could not export brand kit PDF", description: e?.message ?? String(e), variant: "destructive" });
    } finally { setBusy(null); }
  };
  const dlAudit = async () => {
    setBusy("audit");
    try {
      // Resolve the newest ready audit at click time — the parent's
      // `latestAuditId` may be stale if a fresh run just finished on another
      // tab or before this component remounted.
      let targetId = latestAuditId ?? null;
      if (userId) {
        const { data: newest } = await supabase
          .from("audits")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "ready")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (newest?.id) targetId = newest.id;
      }
      if (!targetId) { toast({ title: "Run a Brand Audit first", variant: "destructive" }); return; }
      const { data: row, error } = await supabase.from("audits").select("status, brand_audit_score, report, inputs, stage, posture").eq("id", targetId).maybeSingle();
      if (error) throw error;
      if (!row || !row.report) throw new Error("Audit report not available yet.");
      let preparedFor: string | null = (profile?.full_name ?? null) as string | null;
      if (userId) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userId)
          .maybeSingle();
        if (prof?.full_name) preparedFor = prof.full_name as string;
      }
      await downloadAuditPdf({
        status: row.status as any,
        brand_audit_score: row.brand_audit_score ?? 0,
        report: row.report as any,
        inputs: row.inputs as any,
        stage: row.stage ?? null,
        posture: row.posture ?? null,
        prepared_for: preparedFor,
      });
    } catch (e: any) {
      toast({ title: "Could not export audit PDF", description: e?.message ?? String(e), variant: "destructive" });
    } finally { setBusy(null); }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <AssetCard
        stripe={CORAL}
        iconBg="#FEF1EE"
        iconColor={CORAL}
        Icon={Compass}
        title="Full Brand Strategy"
        description="Positioning · ICP · Voice · Channels · Action Plan · Metrics, the complete document"
        meta={<span style={{ fontSize: 11, color: FAINT }}>Updated Jun 22, 2026</span>}
        body={
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: "#F7F5F1", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: FAINT }}>Positioning</div>
              <div style={{ fontSize: 12, color: INK, marginTop: 2 }}>First fully autonomous content marketing platform starting with custom strategy</div>
            </div>
            <div style={{ background: "#F7F5F1", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: FAINT }}>Archetype</div>
              <div style={{ fontSize: 12, color: INK, marginTop: 2 }}>The Magician · Secondary: Creator</div>
            </div>
          </div>
        }
        bodyNote="6 sections · Auto-updates when strategy is regenerated"
        footer={
          <>
            <PrimaryPill onClick={dlStrategy} disabled={busy === "strategy"}>{busy === "strategy" ? "Preparing…" : "Download PDF"}</PrimaryPill>
            <button style={pill()}>Copy All</button>
            <ShareControls documentType="strategy" sourceId={strategyId} />
            <span style={{ fontSize: 10, color: FAINT, marginLeft: "auto" }}>Auto-saved from your strategy</span>
          </>
        }
      />
      <AssetCard
        stripe="#2563EB"
        iconBg="#EFF6FF"
        iconColor="#2563EB"
        Icon={FileText}
        title="Brand Kit"
        description="Archetype · Voice · Key Messages · Content Pillars · ICP Brief, built for sharing"
        meta={<span style={{ fontSize: 11, color: FAINT }}>Generated Jun 22, 2026</span>}
        body={
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <span style={{ background: INK, color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 11 }}>The Magician</span>
            {["Clear and Direct", "Strategy-First Marketing", "$250K+ Founder ICP"].map((c) => (
              <span key={c} style={{ background: "#F0EFEC", color: INK, borderRadius: 20, padding: "4px 12px", fontSize: 11 }}>{c}</span>
            ))}
            <span style={{ background: "#F0EFEC", color: INK, borderRadius: 20, padding: "4px 12px", fontSize: 11 }}>+4 more</span>
          </div>
        }
        bodyNote="5 sections · 1 page · Regenerate from Brand Kit tab when strategy changes"
        footer={
          <>
            <PrimaryPill onClick={dlKit} disabled={busy === "kit"}>{busy === "kit" ? "Preparing…" : "Download PDF"}</PrimaryPill>
            <button style={pill()}>Copy All</button>
            <ShareControls documentType="brand-kit" sourceId={kitOwnerId} />
            <button style={pill(true)} onClick={goKitVisual}>↺ Regenerate</button>
            <span style={{ fontSize: 10, color: FAINT, marginLeft: "auto" }}>Saved from Brand Kit tab</span>
          </>
        }
      />
      <AssetCard
        stripe="#22C55E"
        iconBg="#F0FDF4"
        iconColor="#16A34A"
        Icon={ClipboardCheck}
        title="Brand Audit Report"
        description={
          latestAudit && latestAudit.score != null && auditDateLabel
            ? `Latest: ${auditDateLabel} · Score ${latestAudit.score}/100`
            : "No audit yet — run your first Brand Audit to see your score and section breakdown here."
        }
        meta={null}
        body={
          latestAudit && (latestAudit.strongest || latestAudit.weakest) ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {latestAudit.strongest && (
                <div style={{ background: "#F0FDF4", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: FAINT }}>Strongest Section</div>
                  <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 600, marginTop: 2 }}>
                    {latestAudit.strongest.title} · {latestAudit.strongest.score}/100
                  </div>
                </div>
              )}
              {latestAudit.weakest && (
                <div style={{ background: "#FEF1EE", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: FAINT }}>Critical Gap</div>
                  <div style={{ fontSize: 12, color: CORAL, fontWeight: 600, marginTop: 2 }}>
                    {latestAudit.weakest.title} · {latestAudit.weakest.score}/100
                  </div>
                </div>
              )}
            </div>
          ) : null
        }
        bodyNote={latestAudit ? "Each run saved separately" : ""}
        footer={
          latestAudit ? (
            <>
              <PrimaryPill onClick={dlAudit} disabled={busy === "audit"}>{busy === "audit" ? "Preparing…" : "Download PDF"}</PrimaryPill>
              <ShareControls documentType="brand-audit" sourceId={latestAuditId} />
              <button style={pill()} onClick={goAuditResults}>Open Full Report</button>
              <button style={pill(true)} onClick={goAuditPrompt}>↺ Re-run Audit</button>
              <span style={{ fontSize: 10, color: FAINT, marginLeft: "auto" }}>Saved from Brand Audit tab</span>
            </>
          ) : (
            <>
              <PrimaryPill onClick={goAuditPrompt}>Run your first audit</PrimaryPill>
              <span style={{ fontSize: 10, color: FAINT, marginLeft: "auto" }}>Saved from Brand Audit tab</span>
            </>
          )
        }
      />
    </div>
  );
}

function PrimaryPill({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: CORAL, color: "#fff", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  );
}

function AssetCard({ stripe, iconBg, iconColor, Icon, title, description, meta, body, bodyNote, footer }: any) {
  return (
    <div style={{ display: "flex", borderRadius: 14, background: "#fff", border: `1px solid ${BORDER}`, overflow: "hidden" }}>
      <div style={{ width: 6, background: stripe, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={20} color={iconColor} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{title}</div>
                {meta}
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{description}</div>
            </div>
          </div>
          {body}
          <div style={{ fontSize: 11, color: FAINT }}>{bodyNote}</div>
        </div>
        <div style={{ background: "#FAFAF8", borderTop: `1px solid ${BORDER}`, padding: "10px 18px", display: "flex", gap: 8, alignItems: "center" }}>
          {footer}
        </div>
      </div>
    </div>
  );
}