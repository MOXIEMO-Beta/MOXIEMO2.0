import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import {
  ShieldCheck,
  ClipboardCheck,
  Palette,
  FolderOpen,
  CheckCircle2,
  Loader2,
  Circle,
  TrendingUp,
  UploadCloud,
  Plus,
  X,
  Compass,
  FileText,
  Wand2,
} from "lucide-react";

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

async function createShareLink(document_type: ShareDocumentType, source_id: string | null | undefined, opts?: { rotate?: boolean }) {
  if (!source_id) {
    toast({ title: "Nothing to share yet", description: "Generate this document first, then try again.", variant: "destructive" });
    return null;
  }
  const { data, error } = await supabase.functions.invoke("generate-share-token", {
    body: { document_type, source_id, rotate: !!opts?.rotate },
  });
  if (error || !data?.shareUrl) {
    toast({ title: "Could not create share link", description: error?.message ?? "Please try again.", variant: "destructive" });
    return null;
  }
  const copied = await copyToClipboard(data.shareUrl);
  toast({
    title: opts?.rotate ? "New share link created" : (data.reused ? "Share link ready" : "Share link created"),
    description: copied ? `Copied to clipboard: ${data.shareUrl}` : data.shareUrl,
  });
  return data.shareUrl as string;
}

async function revokeShareLink(document_type: ShareDocumentType, source_id: string | null | undefined) {
  if (!source_id) return;
  const { error } = await supabase.functions.invoke("revoke-share-token", {
    body: { document_type, source_id },
  });
  if (error) {
    toast({ title: "Could not revoke link", description: error.message, variant: "destructive" });
    return;
  }
  toast({ title: "Share link revoked", description: "The previous link no longer works." });
}

function ShareControls({
  documentType, sourceId, dark = false,
}: { documentType: ShareDocumentType; sourceId: string | null | undefined; dark?: boolean }) {
  const [busy, setBusy] = useState(false);
  const baseStyle: React.CSSProperties = dark
    ? { border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: 20, padding: "6px 14px", fontSize: 12, background: "transparent", cursor: "pointer" }
    : { border: `1px solid ${BORDER}`, borderRadius: 20, padding: "6px 14px", fontSize: 12, background: "transparent", color: INK, cursor: "pointer", fontWeight: 500 };
  const rotateStyle: React.CSSProperties = { ...baseStyle, padding: "6px 10px", opacity: 0.85 };
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      <button
        type="button"
        disabled={busy}
        onClick={async () => { setBusy(true); try { await createShareLink(documentType, sourceId); } finally { setBusy(false); } }}
        style={baseStyle}
      >
        {busy ? "Working…" : "Share Link"}
      </button>
      <button
        type="button"
        title="Revoke previous link and create a new one"
        aria-label="Rotate share link"
        disabled={busy}
        onClick={async () => {
          if (!sourceId) return;
          if (!confirm("Revoke the current share link and create a new one? The old link will stop working immediately.")) return;
          setBusy(true);
          try { await createShareLink(documentType, sourceId, { rotate: true }); } finally { setBusy(false); }
        }}
        style={rotateStyle}
      >
        ↻
      </button>
    </span>
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
  const [hubVisited, setHubVisited] = useState(false);
  const [tab, setTab] = useState<BrandTab>("welcome");
  const [auditStep, setAuditStep] = useState<AuditStep>("prompt");
  const [kitStep, setKitStep] = useState<KitStep>("visual");
  const wroteVisit = useRef(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, s, a] = await Promise.all([
        supabase
          .from("profiles")
          .select("website_url, brand_hub_visited, brand_colors, brand_logo_url, brand_fonts, business_name, full_name")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("strategies").select("*").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("audits")
          .select("id")
          .eq("inputs->>user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      const prof: any = p.data ?? {};
      setProfile(prof);
      setStrategy(s.data);
      setLatestAuditId((a as any)?.data?.id ?? null);
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
            onKit={() => { setTab("kit"); setKitStep("visual"); }}
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
            goAssets={() => setTab("assets")}
            latestAuditId={latestAuditId}
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
          />
        )}
        {tab === "assets" && (
          <AssetsPanel
            goAuditResults={() => { setTab("audit"); setAuditStep("results"); }}
            goAuditPrompt={() => { setTab("audit"); setAuditStep("prompt"); }}
            goKitVisual={() => { setTab("kit"); setKitStep("visual"); }}
            strategyId={strategy?.id ?? null}
            kitOwnerId={user?.id ?? null}
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
    <div
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
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={20} color={iconColor} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: dark ? "#fff" : INK }}>{title}</div>
      <div style={{ fontSize: 12, color: dark ? "rgba(255,255,255,0.6)" : MUTED, lineHeight: 1.6 }}>{body}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: ctaColor, marginTop: 4 }}>{cta}</div>
    </div>
  );
}

/* -------------------- Brand Audit -------------------- */
function AuditPanel({
  step, setStep, profile, setProfile, userId, goAssets, latestAuditId,
}: {
  step: AuditStep;
  setStep: (s: AuditStep) => void;
  profile: any;
  setProfile: (p: any) => void;
  userId?: string;
  goAssets: () => void;
  latestAuditId?: string | null;
}) {
  const [url, setUrl] = useState<string>(profile?.website_url ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setUrl(profile?.website_url ?? ""); }, [profile?.website_url]);

  // Auto-transition from running to results after 2.4s
  useEffect(() => {
    if (step !== "running") return;
    const t = setTimeout(() => setStep("results"), 2400);
    return () => clearTimeout(t);
  }, [step, setStep]);

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
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ ...card, maxWidth: 480, width: "100%", padding: 32, textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${BORDER}`, borderTopColor: CORAL, borderRadius: "50%", margin: "0 auto", animation: "brand-hub-spin 0.9s linear infinite" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 16 }}>Running Your Brand Audit</h3>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Scanning {domain} and comparing against your strategy</div>
          <div style={{ marginTop: 20, maxWidth: 320, marginLeft: "auto", marginRight: "auto", textAlign: "left", display: "flex", flexDirection: "column", gap: 0 }}>
            <ChecklistRow status="done" label="Strategy foundation loaded" />
            <ChecklistRow status="done" label="Website scraped and read" />
            <ChecklistRow status="active" label="Comparing presence to strategy…" />
            <ChecklistRow status="idle" label="Generating advisor read" />
            <ChecklistRow status="idle" label="Building priority list" />
          </div>
        </div>
      </div>
    );
  }

  // results
  return <AuditResults domain={domain} setStep={setStep} goAssets={goAssets} />;
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

function AuditResults({ domain, setStep, goAssets }: { domain: string; setStep: (s: AuditStep) => void; goAssets: () => void }) {
  const score = 71;
  const C = 2 * Math.PI * 52;

  const sections = [
    { name: "Positioning Clarity", score: 88, finding: "ICP revenue floor is present. \"Why now\" urgency missing from public copy." },
    { name: "Voice Consistency", score: 62, finding: "LinkedIn bio contains \"passionate about\" and two em dashes, contradicts your voice rules." },
    { name: "Content-Strategy Alignment", score: 44, finding: "Strategy-First Marketing pillar, your primary differentiator, has zero posts in 30 days." },
    { name: "ICP Signal Strength", score: 58, finding: "External copy says \"founders\" without the qualifiers. A $50K founder thinks this is for them." },
  ];

  const scoreMeta = (s: number) => {
    if (s >= 75) return { color: GREEN, badgeBg: "#EAF3DE", badgeText: "#3B6D11", label: "Strong" };
    if (s >= 55) return { color: "#D97706", badgeBg: "#FEF3C7", badgeText: "#854F0B", label: "Needs Work" };
    return { color: CORAL, badgeBg: "#FEF1EE", badgeText: "#993C1D", label: "Critical Gap" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Returning banner */}
      <div style={{ ...card, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 10 }}>
        <div style={{ fontSize: 12, color: MUTED }}>
          Last audit: Jun 26, 2026 · Score 71/100 · Auditing <strong style={{ color: INK }}>{domain}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 11, color: FAINT }}>Next recommended: Sep 26, 2026</div>
          <button type="button" onClick={() => setStep("prompt")} style={pill(true)}>↺ Re-run Audit</button>
        </div>
      </div>

      {/* Dark hero */}
      <div style={{ background: INK, borderRadius: 14, padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#5A5855", letterSpacing: "0.1em" }}>
            Brand Health Score · Jun 26, 2026
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginTop: 6 }}>
            Your strategy is strong. Your presence has catching up to do.
          </div>
          <div style={{ fontSize: 13, color: "#9A9896", lineHeight: 1.55, maxWidth: 400, marginTop: 6 }}>
            MOXIEMO compared your external presence, website, LinkedIn, content, against your strategy. Here is the gap report.
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="52" fill="none" stroke={CORAL} strokeWidth="10"
              strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)}
              strokeLinecap="round" transform="rotate(-90 60 60)"
            />
            <text x="60" y="56" textAnchor="middle" fontSize="26" fontWeight="700" fill="white" dy="8">{score}</text>
            <text x="60" y="76" textAnchor="middle" fontSize="12" fill="#5A5855">/100</text>
          </svg>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11, color: GREEN, marginTop: 4 }}>
            <TrendingUp size={12} /> from 64
          </div>
        </div>
      </div>

      {/* Strategic Advisor Read */}
      <div style={{ ...card, borderLeft: `2px solid ${CORAL}`, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: CORAL, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Strategic Advisor Read
          </span>
          <span style={{ fontSize: 11, color: "#16A34A", background: "#F0FDF4", borderRadius: 20, padding: "2px 10px" }}>
            Early Stage · Founder-Led Expertise
          </span>
        </div>
        <p style={{ fontSize: 13, color: INK, lineHeight: 1.75, marginTop: 10 }}>
          Your strategy foundation is one of the strongest MOXIEMO has seen, clear ICP, sharp pain point, differentiated positioning. That clarity is not yet visible externally. Your LinkedIn presence reads like a generalist. The gap is execution, not thinking.
        </p>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            "Strategy foundation is specific and differentiated, ICP, pain, and transformation are locked",
            "Brand archetype (The Magician) is a strong fit and creates a compelling content angle",
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, flexShrink: 0, marginTop: 6 }} />
              <div style={{ fontSize: 12, color: INK }}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, background: "#FFF7F5", border: "1px solid #FED7D0", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: CORAL, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            What Matters Most Right Now
          </div>
          <div style={{ fontSize: 13, color: INK, lineHeight: 1.6, marginTop: 4 }}>
            Close the strategy-to-presence gap on LinkedIn. Your strategy says you serve founders doing $250K+ who are done playing small. Your last 10 posts do not say that.
          </div>
        </div>
      </div>

      {/* Section scores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {sections.map((s) => {
          const m = scoreMeta(s.score);
          const isCritical = m.label === "Critical Gap";
          return (
            <div key={s.name} style={{ ...card, padding: 16, border: isCritical ? `1.5px solid ${CORAL}` : `1px solid ${BORDER}`, borderRadius: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{s.name}</div>
                <div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{s.score}</span>
                  <span style={{ fontSize: 12, color: FAINT }}>/100</span>
                </div>
              </div>
              <div style={{ marginTop: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, background: m.badgeBg, color: m.badgeText, borderRadius: 4, padding: "2px 8px" }}>{m.label}</span>
              </div>
              <div style={{ marginTop: 8, height: 6, background: "#F0EFEC", borderRadius: 3 }}>
                <div style={{ width: `${s.score}%`, height: "100%", background: m.color, borderRadius: 3 }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{s.finding}</div>
            </div>
          );
        })}
      </div>

      {/* Footer action bar */}
      <div style={{ ...card, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 10 }}>
        <div style={{ fontSize: 12, color: FAINT }}>
          Auditing <span style={{ color: INK, fontWeight: 600 }}>{domain}</span> · Saved to Brand Assets as PDF
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={pill()} onClick={goAssets}>View in Assets</button>
          <button style={pill()}>Download PDF</button>
          <button style={pill(true)} onClick={() => setStep("prompt")}>↺ Re-run Audit</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Brand Kit -------------------- */
function KitPanel({
  step, setStep, profile, setProfile, strategy, userId, goAssets,
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

  useEffect(() => {
    if (step !== "generating") return;
    const t = setTimeout(() => setStep("kit"), 2400);
    return () => clearTimeout(t);
  }, [step, setStep]);

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
          <div style={{ width: 40, height: 40, border: `3px solid ${BORDER}`, borderTopColor: CORAL, borderRadius: "50%", margin: "0 auto", animation: "brand-hub-spin 0.9s linear infinite" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, marginTop: 16 }}>Building Your Brand Kit…</h3>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Combining your strategy with your visual assets</div>
          <div style={{ marginTop: 20, maxWidth: 320, marginLeft: "auto", marginRight: "auto", textAlign: "left" }}>
            <ChecklistRow status="done" label="Voice data loaded from your strategy" />
            <ChecklistRow status="done" label="Visual assets confirmed" />
            <ChecklistRow status="active" label="Writing narrative sections…" />
            <ChecklistRow status="idle" label="Assembling final document" />
          </div>
        </div>
      </div>
    );
  }

  // kit
  return <KitDocument profile={profile} strategy={strategy} colors={colors} logoUrl={logoUrl} fonts={fonts} setStep={setStep} goAssets={goAssets} />;
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

function KitDocument({ profile, strategy, colors, logoUrl, fonts, setStep, goAssets }: any) {
  const brandName = strategy?.business_name || profile?.business_name || profile?.full_name || "Your Brand";
  const generatedAt = "Jun 22, 2026";

  const palette = (colors && colors.length ? colors : ["#0E0F10", "#E85A46", "#F7F5F1", "#B8C5A6"]).slice(0, 4);
  const fontName = fonts?.[0] || "Space Grotesk";

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
          <button style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: 20, padding: "6px 14px", fontSize: 12, background: "transparent", cursor: "pointer" }}>Share Link</button>
          <button style={{ background: CORAL, color: "#fff", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>Download PDF</button>
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
              <div style={{ fontSize: 18, fontWeight: 700, color: INK }}>The Magician</div>
              <div style={{ fontSize: 12, color: MUTED }}>Secondary: Creator</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, marginTop: 10 }}>
            Transforms chaos into clarity, complexity into autonomy. Promises to turn a founder's vision into reality through a system that feels effortless.
          </p>
        </KitCard>

        {/* Card B — Voice */}
        <KitCard>
          <CopyPill />
          <div style={{ fontSize: 11, color: FAINT, marginBottom: 8 }}>Use these to brief anyone writing for your brand.</div>
          {[
            "Clear and Direct",
            "Empowering, Not Overwhelming",
            "Strategic, Not Salesy",
            "Honest and Specific",
          ].map((v) => (
            <div key={v} style={{ borderLeft: `2px solid ${CORAL}`, background: "#FAFAF8", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: INK, marginBottom: 4 }}>
              {v}
            </div>
          ))}
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: FAINT, marginTop: 12, marginBottom: 6 }}>Never Use</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Em-Dashes", "Contractions in Formal Copy", "Filler Phrases"].map((v) => (
              <span key={v} style={{ background: "#F0EFEC", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: FAINT, textDecoration: "line-through" }}>{v}</span>
            ))}
          </div>
        </KitCard>

        {/* Card C — ICP */}
        <KitCard>
          <CopyPill />
          <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 10 }}>Ideal Client Profile</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["Revenue Floor", "$250K+ annually"],
              ["Business Type", "Expertise-based, founder-led"],
              ["Core Pain", "20+ hrs/week on reactive marketing with no strategy"],
              ["Transformation", "From tool chaos to 1 platform, 2 hrs/week"],
            ].map(([l, v]) => (
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
          {[
            "You built a real business. Your marketing should match.",
            "Strategy first. Always. Then content that actually works.",
            "One platform. 18 hours back. Revenue that moves.",
          ].map((q) => (
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
            <span style={{ background: INK, color: "#fff", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 600 }}>Strategy-First Marketing</span>
            {["Founder Wins & Beta Stories", "Platform Transparency & Product Updates", "Founder Efficiency Hacks", "Market Positioning & Differentiation"].map((p) => (
              <span key={p} style={{ background: "#FEF1EE", color: CORAL, borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 500 }}>{p}</span>
            ))}
          </div>
        </KitCard>
      </div>

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
          <button style={pill()}>Download PDF</button>
          <button style={pill()}>Share Link</button>
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
function AssetsPanel({ goAuditResults, goAuditPrompt, goKitVisual, strategyId, kitOwnerId, latestAuditId }: { goAuditResults: () => void; goAuditPrompt: () => void; goKitVisual: () => void; strategyId?: string | null; kitOwnerId?: string | null; latestAuditId?: string | null }) {
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
            <PrimaryPill>Download PDF</PrimaryPill>
            <button style={pill()}>Copy All</button>
            <button style={pill()}>Share Link</button>
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
            <PrimaryPill>Download PDF</PrimaryPill>
            <button style={pill()}>Copy All</button>
            <button style={pill()}>Share Link</button>
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
        description="Latest: Jun 26, 2026 · Score 71/100 · 3 audits total, score trend: 58 → 64 → 71"
        meta={<span style={{ background: "#F0FDF4", color: "#16A34A", borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 600 }}>+7 from last run</span>}
        body={
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: "#F0FDF4", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: FAINT }}>Strongest Section</div>
              <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 600, marginTop: 2 }}>Positioning Clarity · 88/100</div>
            </div>
            <div style={{ background: "#FEF1EE", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", color: FAINT }}>Critical Gap</div>
              <div style={{ fontSize: 12, color: CORAL, fontWeight: 600, marginTop: 2 }}>Content-Strategy Alignment · 44/100</div>
            </div>
          </div>
        }
        bodyNote="Next audit recommended: Sep 26, 2026 · Each run saved separately"
        footer={
          <>
            <PrimaryPill>Download PDF</PrimaryPill>
            <button style={pill()}>View All Runs</button>
            <button style={pill()} onClick={goAuditResults}>Open Full Report</button>
            <button style={pill(true)} onClick={goAuditPrompt}>↺ Re-run Audit</button>
            <span style={{ fontSize: 10, color: FAINT, marginLeft: "auto" }}>Saved from Brand Audit tab</span>
          </>
        }
      />
    </div>
  );
}

function PrimaryPill({ children }: { children: React.ReactNode }) {
  return (
    <button style={{ background: CORAL, color: "#fff", border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
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