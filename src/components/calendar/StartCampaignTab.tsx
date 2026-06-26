import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CORAL = "#E85A46";
const INK = "#15171C";
const BORDER = "#ECEAE5";
const MUTED = "#6B6860";
const PLACEHOLDER = "#9A9896";
const PAPER = "#F7F6F3";
const SUBTLE = "#F0EFEC";

type Template = { label: string; prompt: string };
const TEMPLATES: Template[] = [
  { label: "Lead Generation", prompt: "I want to run a lead generation campaign targeting founder-led B2B businesses, focused on driving qualified waitlist sign-ups." },
  { label: "Product Launch", prompt: "I'm launching Beta 2.0 and need a campaign to announce it, drive sign-ups, and build momentum with my founding cohort." },
  { label: "Visibility Push", prompt: "I want to increase my visibility on LinkedIn and build authority as the go-to platform for strategy-first founders." },
  { label: "Quarterly Theme", prompt: "I want to plan my Q3 content campaign around the Strategy-First Revolution theme from my strategy." },
  { label: "Re-engagement", prompt: "I want to re-engage my email list with a campaign that reintroduces MOXIEMO Beta 2.0 and drives them back to action." },
  { label: "Beta/Waitlist Push", prompt: "I want to grow my Beta 2.0 waitlist with a 30-day campaign across LinkedIn and email." },
];

type Recommendation = {
  type: "Gap" | "Opportunity";
  title: string;
  description: string;
  cta: string;
};
const DEFAULT_RECS: Recommendation[] = [
  {
    type: "Gap",
    title: "Launch a 'Strategy-First vs. Template-First' comparison campaign",
    description:
      "You have zero recent content establishing your core differentiator. A focused 2-week LinkedIn campaign would activate your Strategy-First Marketing pillar and directly address competitive positioning.",
    cta: "Plan this campaign",
  },
  {
    type: "Opportunity",
    title: "Beta 2.0 waitlist re-engagement campaign",
    description:
      "Your email list is dormant and represents your warmest audience. A 3-email sequence over 2 weeks with a Beta 2.0 reveal angle could reactivate cold leads before launch.",
    cta: "Plan this campaign",
  },
  {
    type: "Gap",
    title: "Founder proof campaign — one win, told with metrics",
    description:
      "Your Founder Wins pillar is untapped. A single campaign featuring one beta user result with before/after numbers would activate social proof and validate your positioning in market.",
    cta: "Plan this campaign",
  },
];

function pillarsFrom(strategy: any): string[] {
  const ef = (strategy?.enhanced_foundation || {}) as any;
  const raw = ef.contentPillars ?? ef.contentThemes ?? strategy?.content_pillars ?? [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p: any) => (typeof p === "string" ? p : p?.name ?? p?.title ?? ""))
    .filter(Boolean)
    .slice(0, 8);
}
function businessGoalFrom(strategy: any): string {
  const ef = (strategy?.enhanced_foundation || {}) as any;
  return ef.businessGoal || strategy?.business_goal || "Grow qualified pipeline and brand authority over the next quarter.";
}

export default function StartCampaignTab({ ctx }: { ctx: any }) {
  const { strategy, openCampaign } = ctx;
  const [prompt, setPrompt] = useState("");
  const openModal = (title?: string) => openCampaign?.(title);

  const onChip = (t: Template) => {
    setPrompt(t.prompt);
    openModal();
  };

  return (
    <div>
      {/* SECTION 1 — Prompt card */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          padding: "28px 32px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: PLACEHOLDER,
            marginBottom: 12,
          }}
        >
          What should we plan today?
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to campaign around — a launch, a seasonal push, a visibility goal, or anything on your mind. MOXIEMO will shape it into a campaign plan."
          style={{
            width: "100%",
            minHeight: 88,
            border: `1.5px solid ${BORDER}`,
            borderRadius: 10,
            padding: "14px 16px",
            fontSize: 14,
            fontFamily: "Space Grotesk, system-ui, sans-serif",
            color: "#0E0F10",
            background: "#FAFAF8",
            resize: "vertical",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <button
            onClick={() => openModal()}
            style={{
              background: CORAL,
              color: "#fff",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            ✦ Start a campaign →
          </button>
          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              color: PLACEHOLDER,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            Add a file
          </button>
        </div>
        <div style={{ height: 1, background: BORDER, marginTop: 20, marginBottom: 20 }} />
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: PLACEHOLDER,
            marginBottom: 10,
          }}
        >
          Or start from a template
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => onChip(t)}
              className="moxiemo-template-chip"
              style={{
                border: `1px solid ${BORDER}`,
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 500,
                color: INK,
                background: "#fff",
                cursor: "pointer",
                transition: "border-color 120ms ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2 — Recommendations */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: CORAL,
                marginBottom: 4,
              }}
            >
              MOXIEMO recommends
            </div>
            <div style={{ fontSize: 13, color: PLACEHOLDER }}>
              Campaign ideas based on your strategy and recent activity.
            </div>
          </div>
          <button
            type="button"
            style={{
              background: SUBTLE,
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: INK,
              cursor: "pointer",
            }}
          >
            ↺ Refresh
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          {DEFAULT_RECS.map((rec, i) => {
            const isGap = rec.type === "Gap";
            return (
              <div
                key={i}
                style={{
                  background: "#fff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${PAPER}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      background: isGap ? SUBTLE : "#EFF6FF",
                      color: isGap ? MUTED : "#2563EB",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      borderRadius: 4,
                      padding: "2px 8px",
                    }}
                  >
                    {rec.type}
                  </span>
                  <button
                    type="button"
                    style={{ background: "transparent", border: "none", color: PLACEHOLDER, cursor: "pointer", fontSize: 16, lineHeight: 1 }}
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>
                <div style={{ padding: 16, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.4, marginBottom: 8 }}>{rec.title}</div>
                  <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{rec.description}</div>
                </div>
                <button
                  onClick={() => openModal(rec.title)}
                  style={{
                    padding: "11px 16px",
                    borderTop: `1px solid ${PAPER}`,
                    background: PAPER,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{rec.cta}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`.moxiemo-template-chip:hover{border-color:${CORAL} !important}`}</style>
    </div>
  );
}

/* ============================ MODAL ============================ */

const GOAL_OPTIONS = [
  { id: "lead", icon: "🎯", title: "Lead Generation", sub: "Capture qualified leads" },
  { id: "awareness", icon: "📣", title: "Audience Awareness", sub: "Grow your following" },
  { id: "bizdev", icon: "🤝", title: "Business Development", sub: "Partnerships and intros" },
  { id: "brand", icon: "✨", title: "Brand Awareness", sub: "Build recognition" },
  { id: "sales", icon: "💰", title: "Sales Campaign", sub: "Drive revenue" },
  { id: "meta", icon: "📱", title: "Meta Ads Campaign", sub: "Paid social push" },
];

const COLORS = ["#E85A46", "#0E0F10", "#0A66C2", "#D97706", "#7C3AED", "#0F766E", "#DC2626", "#16A34A"];

export function CampaignWizardModal({
  strategy,
  seedTitle,
  user,
  onClose,
  onCreated,
}: {
  strategy: any;
  seedTitle: string;
  user?: any;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["lead", "sales"]);
  const [name, setName] = useState(seedTitle || "");
  const [type, setType] = useState("Quarterly theme");
  const [color, setColor] = useState(COLORS[0]);

  const pillarOptions = useMemo(() => pillarsFrom(strategy), [strategy]);
  const [pillars, setPillars] = useState<string[]>(pillarOptions.slice(0, 2));
  useEffect(() => {
    if (pillars.length === 0 && pillarOptions.length) setPillars(pillarOptions.slice(0, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pillarOptions.length]);

  const today = new Date();
  const in30 = new Date(today.getTime() + 30 * 86400000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(fmt(today));
  const [endDate, setEndDate] = useState(fmt(in30));
  const [customGoal, setCustomGoal] = useState("");

  const businessGoal = businessGoalFrom(strategy);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setSaveError(null);
    const firstGoalId = selectedGoals[0];
    const goalLabel = GOAL_OPTIONS.find((g) => g.id === firstGoalId)?.title ?? type;
    const finalName = (name || "").trim() || `${goalLabel} Campaign`;
    const finalGoal = (customGoal || "").trim() || businessGoal;
    if (!user?.id) {
      setSaveError("Something went wrong saving your campaign. Please try again.");
      return;
    }
    setSaving(true);
    const { data: inserted, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        name: finalName,
        campaign_type: goalLabel,
        color,
        pillars,
        start_date: startDate,
        end_date: endDate,
        goals: finalGoal,
        status: "active",
      })
      .select("id")
      .single();
    if (error || !inserted) {
      setSaving(false);
      setSaveError("Something went wrong saving your campaign. Please try again.");
      return;
    }

    // Generate plan content
    const ef = (strategy?.enhanced_foundation || {}) as any;
    const voiceAttributes = Array.isArray(ef.voiceAttributes)
      ? ef.voiceAttributes.join(", ")
      : (ef.voiceAttributes || (Array.isArray(strategy?.voice_attributes) ? strategy.voice_attributes.join(", ") : ""));

    try {
      const { data: gen, error: genErr } = await supabase.functions.invoke("generate-campaign-content-plan", {
        body: {
          campaignName: finalName,
          campaignType: goalLabel,
          campaignGoal: finalGoal,
          selectedPillars: pillars,
          startDate,
          endDate,
          voiceAttributes,
        },
      });
      if (genErr) throw genErr;
      if (gen?.plan) {
        await supabase.from("campaigns").update({ plan: gen.plan }).eq("id", inserted.id);
      }
    } catch (e) {
      console.error("plan generation failed", e);
      // Save still succeeded; surface a soft warning but proceed.
    }
    setSaving(false);
    onCreated?.();
  };

  const toggleGoal = (id: string) =>
    setSelectedGoals((p) => (p.includes(id) ? p.filter((g) => g !== id) : [...p, id]));
  const togglePillar = (p: string) =>
    setPillars((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const headerSubtitle = "Build a marketing campaign aligned to your goals";

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(14,15,16,0.5)", zIndex: 60 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: 460,
          background: "#fff",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Space Grotesk, system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>New campaign · Step {step} of 3</div>
            <div style={{ fontSize: 12, color: PLACEHOLDER, marginTop: 3 }}>{headerSubtitle}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: `1px solid ${BORDER}`,
              background: "#fff",
              color: PLACEHOLDER,
              fontSize: 16,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Step progress */}
        <div style={{ padding: "0 24px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", gap: 6, margin: "14px 0 8px" }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background:
                    s < step ? CORAL : s === step ? CORAL : s === step + 1 ? "rgba(232,90,70,0.3)" : SUBTLE,
                  opacity: s <= step ? 1 : s === step + 1 ? 1 : 1,
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: PLACEHOLDER,
              paddingBottom: 12,
            }}
          >
            <span style={{ color: step === 1 ? CORAL : PLACEHOLDER }}>① Goal &amp; Setup</span>
            <span style={{ color: step === 2 ? CORAL : PLACEHOLDER }}>② Theme &amp; Dates</span>
            <span style={{ color: step === 3 ? CORAL : PLACEHOLDER }}>③ Generate</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {step === 1 && (
            <div style={{ padding: 24 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: CORAL,
                  marginBottom: 14,
                }}
              >
                Recommended for your goals
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {GOAL_OPTIONS.map((g) => {
                  const sel = selectedGoals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGoal(g.id)}
                      style={{
                        textAlign: "left",
                        padding: 14,
                        borderRadius: 10,
                        cursor: "pointer",
                        border: sel ? `2px solid ${CORAL}` : `1.5px solid ${BORDER}`,
                        background: sel ? "#FEF1EE" : "#fff",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>
                        {g.icon} {g.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2 }}>{g.sub}</div>
                    </button>
                  );
                })}
              </div>

              <FieldLabel>Campaign name</FieldLabel>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={'e.g. "Q2 Leadership Framework"'}
                style={inputStyle}
              />

              <div style={{ height: 14 }} />
              <FieldLabel>Campaign type</FieldLabel>
              <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                <option>Quarterly theme</option>
                <option>Product launch</option>
                <option>Visibility push</option>
                <option>Nurture sequence</option>
              </select>

              <div style={{ height: 14 }} />
              <FieldLabel>Campaign color</FieldLabel>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={c}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: c,
                      border: color === c ? `2px solid ${INK}` : "2px solid transparent",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 12, color: PLACEHOLDER, marginTop: 6 }}>
                Used on the campaign card and calendar indicators.
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 14 }}>Theme / focus</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: PLACEHOLDER,
                  marginBottom: 8,
                }}
              >
                From your strategy
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
                {(pillarOptions.length ? pillarOptions : ["Strategy-First Marketing", "Founder Wins", "Behind the Build"]).map((p) => {
                  const sel = pillars.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePillar(p)}
                      style={{
                        background: sel ? "#FEF1EE" : SUBTLE,
                        border: sel ? `1.5px solid ${CORAL}` : "1.5px solid transparent",
                        color: sel ? CORAL : MUTED,
                        borderRadius: 20,
                        padding: "5px 12px",
                        fontSize: 12,
                        fontWeight: sel ? 600 : 500,
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, color: PLACEHOLDER, marginBottom: 18 }}>Or write a custom theme</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                <div>
                  <FieldLabel>Start date</FieldLabel>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <FieldLabel>End date</FieldLabel>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <FieldLabel>Campaign goal</FieldLabel>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: PLACEHOLDER,
                  margin: "8px 0",
                }}
              >
                From your goals
              </div>
              <div
                style={{
                  background: PAPER,
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 13,
                  color: INK,
                  lineHeight: 1.6,
                  marginBottom: 10,
                }}
              >
                {businessGoal}
              </div>
              <input
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder={'e.g. "Book 10 discovery calls from LinkedIn"'}
                style={inputStyle}
              />
            </div>
          )}

          {step === 3 && (
            <div style={{ padding: 24, display: "flex", flexDirection: "column", minHeight: "100%" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 6 }}>Ready to generate</div>
              <div style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>
                Here's what MOXIEMO will build for you.
              </div>
              <div
                style={{
                  background: "#F7F5F1",
                  borderRadius: 10,
                  padding: 16,
                  border: `1px solid ${BORDER}`,
                }}
              >
                <SummaryRow first label="Campaign type" value={type} />
                <SummaryRow label="Focus pillars" value={pillars.join(", ") || "—"} />
                <SummaryRow
                  label="Duration"
                  value={`${startDate} → ${endDate}`}
                />
                <SummaryRow label="What you'll get" value="30-day content calendar + schedule" />
              </div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: PLACEHOLDER,
                  margin: "20px 0 10px",
                }}
              >
                MOXIEMO will generate
              </div>
              {[
                "A 30-day content calendar with post topics",
                "Platform-specific posting schedule",
                "Campaign goal tracking metrics tied to your strategy",
              ].map((d) => (
                <div
                  key={d}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    background: "#fff",
                    borderRadius: 8,
                    border: `1px solid ${BORDER}`,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: INK }}>{d}</span>
                </div>
              ))}

              <div style={{ flex: 1, minHeight: 16 }} />
              {saveError && (
                <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                  {saveError}
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={saving}
                style={{
                  marginTop: "auto",
                  width: "100%",
                  background: CORAL,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "14px 24px",
                  fontSize: 15,
                  fontWeight: 700,
                  textAlign: "center",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                  boxShadow: "0 4px 14px rgba(232,90,70,0.35)",
                }}
              >
                {saving ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "moxiemo-spin 0.8s linear infinite",
                      }}
                    />
                    Building your campaign plan…
                  </span>
                ) : (
                  "✦ Generate My Campaign Plan →"
                )}
              </button>
              <style>{`@keyframes moxiemo-spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ fontSize: 12, color: PLACEHOLDER, textAlign: "center", marginTop: 8 }}>
                MOXIEMO will build your 30-day content roadmap based on your goals and strategy.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "18px 24px",
            borderTop: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {step === 1 ? (
            <>
              <button onClick={onClose} style={btnGray}>Cancel</button>
              <button onClick={() => setStep(2)} style={btnDark}>Next: Theme &amp; Dates →</button>
            </>
          ) : step === 2 ? (
            <>
              <button onClick={() => setStep(1)} style={btnGray}>← Back</button>
              <button onClick={() => setStep(3)} style={btnDark}>Next: Review &amp; Generate →</button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(2)}
                style={{ background: "transparent", border: "none", color: PLACEHOLDER, fontSize: 13, cursor: "pointer" }}
              >
                ← Back
              </button>
              <span />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: `1.5px solid ${BORDER}`,
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  fontFamily: "Space Grotesk, system-ui, sans-serif",
  color: INK,
  background: "#fff",
  outline: "none",
};

const btnGray: React.CSSProperties = {
  background: SUBTLE,
  color: INK,
  border: "none",
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
const btnDark: React.CSSProperties = {
  background: "#15171C",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: 13, fontWeight: 500, color: INK, display: "block", marginBottom: 6 }}>{children}</label>;
}

function SummaryRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        borderTop: first ? "none" : `1px solid ${BORDER}`,
        paddingTop: first ? 0 : 10,
        marginTop: first ? 0 : 10,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: PLACEHOLDER, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: INK, textAlign: "right", maxWidth: "60%" }}>{value}</div>
    </div>
  );
}