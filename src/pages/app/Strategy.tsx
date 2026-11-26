import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/hooks/useBrand";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Download, Check, X, Lock, Loader2 } from "lucide-react";

const C = {
  coral: "#FF6B5C", navy: "#14243D", paper: "#F7F5F1",
  warmPaper: "#F4F2ED", white: "#FFFFFF", ink: "#15171C",
  muted: "#6B6B6B", sage: "#B8C5A6", taupe: "#D8CEBD", border: "#E8E4DD",
};
const card: React.CSSProperties = { background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 };
const sectionLabel: React.CSSProperties = { fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 14 };
const h1Style: React.CSSProperties = { fontFamily: "'DM Sans Variable',sans-serif", fontSize: 28, fontWeight: 700, color: C.ink, marginBottom: 4 };
const btnPrimary: React.CSSProperties = { background: C.coral, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const btnSecondary: React.CSSProperties = { background: "transparent", color: C.navy, border: `1.5px solid ${C.taupe}`, borderRadius: 10, padding: "11px 24px", fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer" };
const btnSm: React.CSSProperties = { height: 32, padding: "0 14px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: C.white, fontFamily: "'DM Sans Variable',sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 };

type Strategy = Record<string, any>;

function normaliseToString(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

type Pillar = { name: string; description: string };
function normalisePillars(v: unknown): Pillar[] {
  if (!Array.isArray(v)) return [];
  return v.map((el) => {
    if (typeof el === "string") return { name: el, description: "" };
    if (el && typeof el === "object" && "name" in el) return { name: (el as any).name ?? "", description: (el as any).description ?? "" };
    return { name: String(el), description: "" };
  });
}

function SkeletonCard() {
  return (
    <div style={{ ...card, height: 80, background: C.border, borderRadius: 8, opacity: 0.5, animation: "pulse 1.5s ease-in-out infinite" }} />
  );
}

function EditableCard({
  label,
  value,
  fieldName,
  strategyId,
  onSaved,
  style,
}: {
  label: string;
  value: string;
  fieldName: string;
  strategyId: string;
  onSaved: (field: string, val: string) => void;
  style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [hovered, setHovered] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("strategies").update({ [fieldName]: draft } as any).eq("id", strategyId);
    setSaving(false);
    if (error) { toast.error("Save failed"); return; }
    onSaved(fieldName, draft);
    setEditing(false);
    toast.success("Saved");
  };

  return (
    <div
      style={{ ...card, ...style, position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={sectionLabel}>{label}</div>
      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            style={{ width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink, border: `1.5px solid ${C.coral}`, borderRadius: 8, padding: "10px 12px", resize: "vertical", outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={save} disabled={saving} style={{ ...btnSm, background: C.coral, color: "#fff", border: "none" }}>
              <Check size={12} /> {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => { setEditing(false); setDraft(value); }} style={btnSm}>
              <X size={12} /> Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0 }}>
            {value || <span style={{ color: C.muted, fontStyle: "italic" }}>Not set</span>}
          </p>
          {hovered && (
            <button
              onClick={() => { setDraft(value); setEditing(true); }}
              style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", cursor: "pointer", color: C.muted }}
            >
              <Pencil size={14} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

type RailSection = "positioning" | "voice" | "pillars" | "channel" | "plan";
const RAIL_ITEMS: { key: RailSection; label: string }[] = [
  { key: "positioning", label: "Positioning" },
  { key: "voice", label: "Voice and tone" },
  { key: "pillars", label: "Content pillars" },
  { key: "channel", label: "Channel strategy" },
  { key: "plan", label: "90-day plan" },
];

function PaywallOverlay({ onUpgrade, upgrading }: { onUpgrade: () => void; upgrading: boolean }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 10,
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      background: "rgba(247,245,241,0.75)",
      borderRadius: 16,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 16,
    }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Lock size={20} color="#fff" />
      </div>
      <div style={{ textAlign: "center" as const, maxWidth: 280 }}>
        <p style={{ fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 700, fontSize: 16, color: C.ink, margin: "0 0 6px" }}>
          Unlock your full strategy
        </p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
          Upgrade to Foundation to see your complete brand strategy, voice, pillars, and 90-day plan.
        </p>
      </div>
      <button
        onClick={onUpgrade}
        disabled={upgrading}
        style={{ background: C.coral, color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
      >
        {upgrading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
        Upgrade to Foundation — $79/mo
      </button>
    </div>
  );
}

// section_key → parsed content from strategy_sections (RLS-gated)
type SectionMap = Record<string, Record<string, unknown>>;

export default function Strategy() {
  const { user } = useAuth();
  const { brandId } = useBrand();
  const { plan } = usePlan();
  const navigate = useNavigate();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  // sections fetched separately — RLS returns only what the user is allowed to see
  const [sections, setSections] = useState<SectionMap>({});
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<RailSection>("positioning");
  const [exporting, setExporting] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  // synthesis polling — when user arrives from Discovery before the edge function finishes
  const [synthesizing, setSynthesizing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // isLocked = true means the user has NOT paid — paid sections won't come back from DB
  // but we still show the paywall overlay so they know the content exists
  const isLocked = plan === "founding_member";
  const LOCKED_SECTIONS: RailSection[] = ["voice", "pillars", "channel", "plan"];
  const isSectionLocked = (section: RailSection) => isLocked && LOCKED_SECTIONS.includes(section);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: { plan: "foundation" },
      });
      if (error || data?.error) { toast.error(data?.error ?? "Could not start checkout"); return; }
      if (data?.url) window.location.href = data.url;
    } finally {
      setUpgrading(false);
    }
  };

  const fetchStrategy = useCallback(async () => {
    if (!user) return;
    // Select only the metadata columns needed for rendering — intentionally excludes
    // enhanced_foundation and other paid-content JSONB blobs. Paid content is served
    // exclusively via strategy_sections which is RLS-gated at the DB row level.
    const q = supabase.from("strategies").select(
      "id,user_id,updated_at,positioning_statement,target_audience,brand_voice,tone_guidelines,avoid_phrases,primary_channel,strategy_lane"
    );
    const { data, error } = await (brandId ? q.eq("brand_id", brandId) : q.eq("user_id", user.id)).maybeSingle();
    if (!error) setStrategy(data as Strategy | null);

    // Fetch sections separately — RLS suppresses paid sections for non-paying users.
    // This is the DB-level paid content gate: paid section content never reaches the
    // browser network response for founding_member plan users.
    if (!error && data?.id) {
      const { data: secRows } = await supabase
        .from("strategy_sections")
        .select("section_key,is_paid,content,sort_order")
        .eq("strategy_id", data.id)
        .order("sort_order", { ascending: true });
      if (secRows) {
        const map: SectionMap = {};
        for (const row of secRows) {
          map[row.section_key] = row.content as Record<string, unknown>;
        }
        setSections(map);
      }
    }
  }, [user, brandId]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const stopPoll = () => {
      if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; }
    };

    (async () => {
      setLoading(true);
      await fetchStrategy();
      if (cancelled) return;
      setLoading(false);

      // Check if synthesis is still in-flight on the latest discovery session.
      // This happens when the user arrives from Discovery before the edge function finishes.
      const { data: sess } = await supabase
        .from("discovery_sessions")
        .select("synthesis_status")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const status = sess?.synthesis_status;

      if (status === "pending" || status === "in_progress") {
        if (!cancelled) setSynthesizing(true);

        // Exponential backoff: 3s → 6s → 12s → 24s → 24s … stop after 90s total
        const DELAYS = [3_000, 6_000, 12_000, 24_000];
        const MAX_ELAPSED = 90_000;
        const startedAt = Date.now();
        let attempt = 0;

        const schedulePoll = () => {
          const delay = DELAYS[Math.min(attempt, DELAYS.length - 1)];
          pollRef.current = setTimeout(async () => {
            if (cancelled) return;
            const { data: s2 } = await supabase
              .from("discovery_sessions")
              .select("synthesis_status")
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            const s2status = s2?.synthesis_status;
            if (s2status === "completed" || s2status === "failed" || !s2status) {
              if (!cancelled) {
                setSynthesizing(false);
                await fetchStrategy();
              }
            } else if (Date.now() - startedAt < MAX_ELAPSED) {
              attempt++;
              schedulePoll();
            } else {
              // 90s elapsed — stop polling, let member refresh manually
              if (!cancelled) setSynthesizing(false);
            }
          }, delay);
        };

        schedulePoll();
      }
    })();

    return () => {
      cancelled = true;
      stopPoll();
    };
  }, [user, brandId, fetchStrategy]);

  const handleSaved = (field: string, val: string) => {
    setStrategy((s) => s ? { ...s, [field]: val } : s);
  };

  const handleDownload = async () => {
    if (!strategy) return;
    setExporting(true);
    try {
      // Build a merged object for PDF — include sections content so PDF has full data
      const pdfPayload = { ...strategy, _sections: sections };
      const { downloadStrategyPdf } = await import("@/lib/strategyPdf");
      await downloadStrategyPdf(pdfPayload as any, "MOXIEMO-Strategy.pdf");
    } catch (e: any) {
      toast.error("PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: C.paper, minHeight: "100vh", padding: "40px 48px" }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!strategy) {
    if (synthesizing) {
      return (
        <div style={{ background: C.paper, minHeight: "100vh", padding: "40px 48px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <Loader2 size={32} style={{ color: C.coral, animation: "spin 1s linear infinite" }} />
          <p style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 20, fontWeight: 700, color: C.ink, margin: 0 }}>
            Building your strategy…
          </p>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.muted, margin: 0 }}>
            This takes about 30–60 seconds. The page will update automatically.
          </p>
        </div>
      );
    }
    return (
      <div style={{ background: C.paper, minHeight: "100vh", padding: "40px 48px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 18, color: C.ink, marginBottom: 24 }}>
          No strategy yet. Complete Discovery to build yours.
        </p>
        <button onClick={() => navigate("/app/discovery")} style={btnPrimary}>
          Begin Discovery
        </button>
      </div>
    );
  }

  // Paid sections: data comes from strategy_sections (RLS-gated).
  // If the user hasn't paid, these will be empty objects — content never arrived in the network response.
  const voiceSection = sections["voice"] ?? {};
  const pillarsSection = sections["pillars"] ?? {};
  const channelSection = sections["channel"] ?? {};
  const planSection = sections["plan"] ?? {};
  const positioningSection = sections["positioning"] ?? {};

  // Pillars from sections first (paid gate), fallback to strategies row for legacy strategies
  const pillars = normalisePillars(
    (pillarsSection.pillars as unknown[]) ?? strategy.content_pillars
  );
  const updatedAt = strategy.updated_at
    ? new Date(strategy.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  // Voice/tone from sections (paid gate)
  const toneGuidelines = normaliseToString(
    (voiceSection.guidelines as any)?.toneByPlatform ?? strategy.tone_guidelines
  );
  const avoidPhrases = normaliseToString(strategy.avoid_phrases);

  const actionPlan = (planSection.actionPlan as any) ?? null;
  const planColumns: { range: string; items: string[] }[] = actionPlan
    ? [
        { range: "Days 1–30", items: Array.isArray(actionPlan.week1?.tasks) ? actionPlan.week1.tasks.map((t: any) => t?.task ?? t).filter(Boolean) : [] },
        { range: "Days 31–60", items: Array.isArray(actionPlan.week2?.tasks) ? actionPlan.week2.tasks.map((t: any) => t?.task ?? t).filter(Boolean) : [] },
        { range: "Days 61–90", items: Array.isArray(actionPlan.week3?.tasks) ? actionPlan.week3.tasks.map((t: any) => t?.task ?? t).filter(Boolean) : [] },
      ]
    : [
        { range: "Days 1–30", items: ["Define your content pillars", "Publish 2x per week on LinkedIn", "Build your content library"] },
        { range: "Days 31–60", items: ["Increase posting cadence to 3x/week", "Engage with top-performing comments", "Start email list nurture sequence"] },
        { range: "Days 61–90", items: ["Review analytics and double-down on best pillar", "Launch a lead magnet", "Plan next quarter campaign"] },
      ];

  return (
    <div style={{ background: C.paper, minHeight: "100vh", padding: "40px 48px" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={h1Style}>Your Marketing Strategy</h1>
          {updatedAt && (
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
              Updated {updatedAt}
            </p>
          )}
        </div>
        <button onClick={handleDownload} disabled={exporting} style={{ ...btnSm, opacity: exporting ? 0.6 : 1 }}>
          <Download size={13} /> {exporting ? "Exporting…" : "Download PDF"}
        </button>
      </div>

      {/* Layout */}
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        {/* Left rail */}
        <div style={{ width: 200, flexShrink: 0, position: "sticky", top: 32 }}>
          {RAIL_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                marginBottom: 4,
                borderRadius: 10,
                border: "none",
                background: activeSection === item.key ? C.white : "transparent",
                fontFamily: "'DM Sans Variable',sans-serif",
                fontSize: 13,
                fontWeight: activeSection === item.key ? 700 : 500,
                color: activeSection === item.key ? C.navy : C.muted,
                cursor: "pointer",
                boxShadow: activeSection === item.key ? `0 0 0 1.5px ${C.border}` : "none",
              }}
            >
              {item.label}
              {isSectionLocked(item.key) && <Lock size={11} style={{ opacity: 0.4 }} />}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, maxWidth: 720, position: "relative" }}>

          {/* Positioning */}
          {activeSection === "positioning" && (
            <div>
              <EditableCard label="Positioning statement" value={normaliseToString(strategy.positioning_statement)} fieldName="positioning_statement" strategyId={strategy.id} onSaved={handleSaved} />
              <EditableCard label="Who buys from you" value={normaliseToString(strategy.target_audience)} fieldName="target_audience" strategyId={strategy.id} onSaved={handleSaved} />
              {(positioningSection.breakdown as any)?.painPoint && (
                <div style={card}>
                  <div style={sectionLabel}>The gap you fill</div>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0 }}>
                    {normaliseToString((positioningSection.breakdown as any).painPoint)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Voice and tone */}
          {activeSection === "voice" && (
            <div style={{ position: "relative" }}>
              {isSectionLocked("voice") && <PaywallOverlay onUpgrade={handleUpgrade} upgrading={upgrading} />}
              <EditableCard label="Brand voice" value={normaliseToString(strategy.brand_voice)} fieldName="brand_voice" strategyId={strategy.id} onSaved={handleSaved} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={card}>
                  <div style={sectionLabel}>Write like this</div>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0 }}>
                    {toneGuidelines || <span style={{ color: C.muted, fontStyle: "italic" }}>Not set</span>}
                  </p>
                </div>
                <div style={card}>
                  <div style={sectionLabel}>Never write like this</div>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0 }}>
                    {avoidPhrases || <span style={{ color: C.muted, fontStyle: "italic" }}>Not set</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content pillars */}
          {activeSection === "pillars" && (
            <div style={{ position: "relative" }}>
              {isSectionLocked("pillars") && <PaywallOverlay onUpgrade={handleUpgrade} upgrading={upgrading} />}
              {pillars.length === 0 ? (
                <div style={card}>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.muted, fontStyle: "italic" }}>
                    No content pillars defined yet.
                  </p>
                </div>
              ) : pillars.map((pillar, i) => (
                <div
                  key={i}
                  style={{
                    ...card,
                    borderTop: i === 0 ? `3px solid ${C.coral}` : undefined,
                  }}
                >
                  <div style={sectionLabel}>Pillar {i + 1}</div>
                  <p style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 16, fontWeight: 700, color: C.ink, margin: "0 0 6px" }}>
                    {pillar.name}
                  </p>
                  {pillar.description && (
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.6, margin: 0 }}>
                      {pillar.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Channel strategy */}
          {activeSection === "channel" && (
            <div style={{ position: "relative" }}>
              {isSectionLocked("channel") && <PaywallOverlay onUpgrade={handleUpgrade} upgrading={upgrading} />}
              <div style={card}>
                <div style={sectionLabel}>Primary channel</div>
                <p style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 20, fontWeight: 700, color: C.navy, marginBottom: 16 }}>
                  {normaliseToString((channelSection.primary as string) ?? strategy.primary_channel) || "LinkedIn"}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Cadence", value: normaliseToString((channelSection.frequency as string) ?? strategy.posting_frequency) || "3x per week" },
                    { label: "Format mix", value: normaliseToString((channelSection.competitive as any)?.differentiators?.[0]) || "Content + engagement" },
                    { label: "Distribution", value: normaliseToString((channelSection.distribution as any)?.doubleDownOn) || "Primary channel" },
                  ].map((box) => (
                    <div key={box.label} style={{ background: C.warmPaper, borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: C.muted, marginBottom: 6 }}>
                        {box.label}
                      </div>
                      <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 14, fontWeight: 600, color: C.ink }}>
                        {box.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 90-day plan */}
          {activeSection === "plan" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, position: "relative" }}>
              {isSectionLocked("plan") && <PaywallOverlay onUpgrade={handleUpgrade} upgrading={upgrading} />}
              {planColumns.map((col, i) => (
                <div key={i} style={card}>
                  <div style={{ ...sectionLabel, color: i === 0 ? C.coral : C.muted }}>{col.range}</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {col.items.map((item, j) => (
                      <li key={j} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.6, paddingBottom: 8, borderBottom: j < col.items.length - 1 ? `1px solid ${C.border}` : "none", marginBottom: 8 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
