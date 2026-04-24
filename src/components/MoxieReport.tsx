// src/components/MoxieReport.tsx
// MOXIE Strategic Report — multi-page styled PDF layout.
// All styling inline / scoped to avoid conflicts with app Tailwind.

import React from "react";

// ─── Brand tokens ──────────────────────────────────────────────
const C = {
  navy:       "#101116",
  navy2:      "#262833",
  navy3:      "#3c3f50",
  coral:      "#ff6b6b",
  coralLight: "#ff9e9e",
  coralPale:  "#ffe4e4",
  cream:      "#f7f2eb",
  creamDark:  "#ede8e0",
  white:      "#ffffff",
  green:      "#3fae6a",
  greenPale:  "#e2f4e8",
  muted:      "#8a8c97",
};

const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

// ─── Shared page wrapper ───────────────────────────────────────
const pageBase: React.CSSProperties = {
  width: 794,
  minHeight: 1123,
  padding: 56,
  boxSizing: "border-box",
  fontFamily: FONT,
  color: C.navy,
  position: "relative",
  pageBreakAfter: "always",
  breakAfter: "page",
  overflow: "hidden",
};

const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: 3,
  textTransform: "uppercase",
  color: C.coral,
  fontWeight: 700,
  marginBottom: 24,
};

const h1: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 800,
  margin: "0 0 24px 0",
  lineHeight: 1.1,
  letterSpacing: -0.5,
};

const card: React.CSSProperties = {
  background: C.white,
  border: `1px solid ${C.creamDark}`,
  borderRadius: 10,
  padding: 20,
  boxShadow: "0 1px 2px rgba(16,17,22,0.04)",
};

const pill = (bg: string, fg: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
  display: "inline-block",
  background: bg,
  color: fg,
  borderRadius: 999,
  padding: "6px 14px",
  fontSize: 12,
  fontWeight: 600,
  marginRight: 8,
  marginBottom: 8,
  ...extra,
});

// ─── MOXIE wordmark ────────────────────────────────────────────
function MoxieMark({ light = false }: { light?: boolean }) {
  const fg = light ? C.white : C.navy;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden>
        <rect x="0" y="0" width="32" height="32" rx="6" fill={C.coral} />
        <text
          x="50%" y="54%"
          dominantBaseline="middle" textAnchor="middle"
          fontFamily={FONT} fontWeight={900} fontSize="20" fill={C.white}
        >M</text>
      </svg>
      <span style={{ fontWeight: 900, letterSpacing: 4, fontSize: 18, color: fg }}>MOXIE</span>
    </div>
  );
}

// ─── Page 1 — Cover ────────────────────────────────────────────
function Cover({ data }: { data: any }) {
  return (
    <div className="report-page" style={{ ...pageBase, background: C.navy, color: C.white, padding: 64 }}>
      <MoxieMark light />
      <div style={{ width: 80, height: 4, background: C.coral, marginTop: 20, marginBottom: 80 }} />

      <div style={{ marginTop: 120 }}>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, color: C.white, letterSpacing: -2 }}>
          Strategic
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1, color: C.coral, letterSpacing: -2 }}>
          Report
        </div>
      </div>

      <div style={{ marginTop: 80 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: C.coralLight, textTransform: "uppercase", marginBottom: 8 }}>
          Prepared for
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.white }}>
          {data?.meta?.preparedFor ?? "Founder"}
        </div>
      </div>

      <div style={{ position: "absolute", right: 64, bottom: 96, color: C.muted, fontSize: 12, letterSpacing: 2 }}>
        {data?.meta?.date ?? ""}
      </div>

      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        background: C.coralPale, color: C.navy,
        textAlign: "center", padding: "14px 0",
        fontSize: 11, letterSpacing: 4, fontWeight: 700,
      }}>
        CONFIDENTIAL
      </div>
    </div>
  );
}

// ─── Page 2 — Strategic Overview ───────────────────────────────
function Overview({ data }: { data: any }) {
  const breakdown = data?.positioning?.breakdown ?? {};
  const cells: Array<[string, string]> = [
    ["Who", breakdown.who],
    ["Problem", breakdown.problem],
    ["Solution", breakdown.solution],
    ["Result", breakdown.result],
    ["Method", breakdown.method],
    ["Transformation", breakdown.transformation],
  ];
  const values: string[] = data?.archetype?.values ?? [];

  return (
    <div className="report-page" style={{ ...pageBase, background: C.cream }}>
      <div style={sectionLabel}>01 · Strategic Overview</div>
      <h1 style={h1}>Positioning & Archetype</h1>

      <div style={{ background: C.navy, color: C.white, borderRadius: 12, padding: 28, marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.coralLight, marginBottom: 10 }}>POSITIONING</div>
        <div style={{ fontSize: 20, lineHeight: 1.4, fontWeight: 600 }}>
          {data?.positioning?.statement ?? "—"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {cells.map(([k, v]) => (
          <div key={k} style={{ ...card, padding: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.coral, fontWeight: 700, marginBottom: 6 }}>{k.toUpperCase()}</div>
            <div style={{ fontSize: 13, lineHeight: 1.4, color: C.navy2 }}>{v ?? "—"}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.coral, fontWeight: 700, marginBottom: 8 }}>ARCHETYPE</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          {data?.archetype?.primary ?? "—"}
          {data?.archetype?.secondary ? (
            <span style={{ color: C.muted, fontWeight: 500, fontSize: 16 }}> · {data.archetype.secondary}</span>
          ) : null}
        </div>
        <div style={{ fontSize: 13, color: C.navy3, lineHeight: 1.5 }}>
          {data?.archetype?.description ?? ""}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.coral, fontWeight: 700, marginBottom: 8 }}>VALUES</div>
        {values.length ? values.map((v: any, i) => (
          <span key={i} style={pill(C.coralPale, C.navy)}>
            {typeof v === "string" ? v : (v?.name ?? v?.title ?? "—")}
          </span>
        )) : <span style={{ color: C.muted }}>—</span>}
      </div>
    </div>
  );
}

// ─── Page 3 — Voice & Brand ────────────────────────────────────
function Voice({ data }: { data: any }) {
  const attrs: string[] = data?.voice?.attributes ?? [];
  const useWords: string[] = data?.voice?.useWords ?? [];
  const avoidWords: string[] = data?.voice?.avoidWords ?? [];
  const tone = data?.voice?.toneByChannel ?? {};

  return (
    <div className="report-page" style={{ ...pageBase, background: C.cream }}>
      <div style={sectionLabel}>02 · Voice & Brand Identity</div>
      <h1 style={h1}>How You Sound</h1>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.coral, fontWeight: 700, marginBottom: 8 }}>VOICE ATTRIBUTES</div>
        {attrs.slice(0, 4).map((a, i) => (
          <span key={i} style={pill(C.coral, C.white)}>{a}</span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={card}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: C.green, fontWeight: 700, marginBottom: 8 }}>USE</div>
          {useWords.map((w, i) => (
            <span key={i} style={pill(C.greenPale, C.green)}>{w}</span>
          ))}
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: C.coral, fontWeight: 700, marginBottom: 8 }}>AVOID</div>
          {avoidWords.map((w, i) => (
            <span key={i} style={pill(C.coralPale, C.coral, { textDecoration: "line-through" })}>{w}</span>
          ))}
        </div>
      </div>

      <div style={{ ...card, borderLeft: `4px solid ${C.coral}`, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.coral, fontWeight: 700, marginBottom: 8 }}>VOICE EXAMPLE</div>
        <div style={{ fontSize: 16, fontStyle: "italic", lineHeight: 1.5, color: C.navy2 }}>
          “{data?.voice?.exampleLine ?? "—"}”
        </div>
      </div>

      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.muted, fontWeight: 700, marginBottom: 6 }}>NEVER SOUND LIKE</div>
        <div style={{ fontSize: 13, color: C.navy3 }}>{data?.voice?.neverSoundLike ?? "—"}</div>
      </div>

      <div>
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.coral, fontWeight: 700, marginBottom: 10 }}>TONE BY CHANNEL</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {(["email", "linkedin", "podcast"] as const).map((ch) => (
            <div key={ch} style={{ ...card, padding: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.coral, fontWeight: 700, marginBottom: 6 }}>
                {ch.toUpperCase()}
              </div>
              <div style={{ fontSize: 12, color: C.navy3, lineHeight: 1.4 }}>{tone[ch] ?? "—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page 4 — Content Strategy ─────────────────────────────────
function Content({ data }: { data: any }) {
  const pillars: any[] = data?.contentStrategy?.pillars ?? [];
  const quarters: any[] = data?.contentStrategy?.quarters ?? [];
  const qColors = [C.coral, C.navy, C.green];

  return (
    <div className="report-page" style={{ ...pageBase, background: C.cream }}>
      <div style={sectionLabel}>03 · Content Strategy</div>
      <h1 style={h1}>What You Publish</h1>

      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.coral, fontWeight: 700, marginBottom: 12 }}>CONTENT PILLARS</div>
        {pillars.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: i ? `1px solid ${C.creamDark}` : "none" }}>
            <div style={{ minWidth: 28, height: 28, borderRadius: 6, background: C.coralPale, color: C.coral, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{i + 1}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
                {typeof p === "string" ? p : (p?.name ?? p?.title ?? "—")}
              </div>
              {typeof p !== "string" && p?.description && (
                <div style={{ fontSize: 12, color: C.navy3, marginTop: 2 }}>{p.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {quarters.slice(0, 3).map((q, i) => (
          <div key={i} style={{ ...card, borderLeft: `4px solid ${qColors[i % qColors.length]}` }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: qColors[i % qColors.length], fontWeight: 700 }}>
              {q?.label ?? `Q${i + 1}`}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, margin: "6px 0", color: C.navy }}>
              {q?.theme ?? "—"}
            </div>
            <div style={{ fontSize: 12, color: C.navy3, lineHeight: 1.4, marginBottom: 10 }}>
              {q?.arc ?? ""}
            </div>
            {q?.cta && (
              <div style={{ fontSize: 11, color: C.coral, fontWeight: 700, marginBottom: 4 }}>CTA · {q.cta}</div>
            )}
            {q?.metric && (
              <div style={{ fontSize: 11, color: C.muted }}>METRIC · {q.metric}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page 5 — 30-Day Calendar ──────────────────────────────────
function Calendar({ data }: { data: any }) {
  const entries: any[] = data?.calendar ?? [];
  const colorFor = (type: string = "") => {
    const t = type.toLowerCase();
    if (t.includes("post")) return C.coral;
    if (t.includes("email") || t.includes("newsletter")) return C.navy;
    if (t.includes("podcast") || t.includes("video")) return C.green;
    return C.navy3;
  };

  return (
    <div className="report-page" style={{ ...pageBase, background: C.cream }}>
      <div style={sectionLabel}>03B · 30-Day Content Calendar</div>
      <h1 style={h1}>Next 30 Days</h1>

      <div>
        {entries.map((e, i) => (
          <div key={i} className="calendar-entry" style={{
            ...card,
            padding: 12,
            marginBottom: 8,
            borderLeft: `4px solid ${colorFor(e?.type)}`,
            display: "grid",
            gridTemplateColumns: "70px 80px 110px 110px 1fr",
            gap: 12,
            alignItems: "center",
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.navy }}>{e?.date ?? ""}</div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>{e?.dayName ?? ""}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.coral, textTransform: "uppercase", letterSpacing: 1 }}>{e?.channel ?? ""}</div>
            <div style={{ fontSize: 11, color: C.navy3, textTransform: "uppercase", letterSpacing: 1 }}>{e?.type ?? ""}</div>
            <div style={{ fontSize: 13, color: C.navy2 }}>{e?.title ?? ""}</div>
          </div>
        ))}
        {entries.length === 0 && <div style={{ color: C.muted }}>No calendar entries.</div>}
      </div>
    </div>
  );
}

// ─── Page 6 — Channels & Metrics ───────────────────────────────
function ChannelsMetrics({ data }: { data: any }) {
  const channels = data?.channels ?? {};
  const tiers: Array<["primary" | "secondary" | "tertiary", string]> = [
    ["primary", "Primary"],
    ["secondary", "Secondary"],
    ["tertiary", "Tertiary"],
  ];
  const goals: any[] = data?.metrics?.businessGoals ?? [];
  const bh = data?.metrics?.brandHealth ?? {};
  const normalize = (n: any) => {
    const v = Number(n) || 0;
    return v > 10 ? v / 10 : v;
  };
  const aa = normalize(bh.archetypeAlignment);
  const vc = normalize(bh.voiceConsistency);

  return (
    <div className="report-page" style={{ ...pageBase, background: C.cream }}>
      <div style={sectionLabel}>04 · Channels & Metrics</div>
      <h1 style={h1}>Where & How We Measure</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {tiers.map(([key, label]) => {
          const ch = channels?.[key] ?? {};
          return (
            <div key={key} style={{ ...card }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.coral, fontWeight: 700 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 800, margin: "6px 0", color: C.navy }}>{ch?.name ?? "—"}</div>
              <div style={{ fontSize: 12, color: C.navy3, lineHeight: 1.4, wordBreak: "break-word" }}>
                {ch?.rationale ?? ch?.description ?? ""}
              </div>
              {ch?.cadence && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Cadence · {ch.cadence}</div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.coral, fontWeight: 700, marginBottom: 12 }}>BUSINESS GOALS</div>
        {goals.map((g, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1fr 100px 100px",
            gap: 12, padding: "10px 0",
            borderTop: i ? `1px solid ${C.creamDark}` : "none",
            fontSize: 13,
          }}>
            <div style={{ color: C.navy2 }}>{g?.goal ?? g?.name ?? "—"}</div>
            <div style={{ color: C.muted }}>{g?.timeframe ?? ""}</div>
            <div style={{ color: C.coral, fontWeight: 700 }}>{g?.target ?? ""}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.coral, fontWeight: 700, marginBottom: 12 }}>BRAND HEALTH</div>
        {[
          ["Archetype Alignment", aa],
          ["Voice Consistency", vc],
        ].map(([label, val]: any) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: C.navy2, fontWeight: 600 }}>{label}</span>
              <span style={{ color: C.coral, fontWeight: 700 }}>{val.toFixed(1)} / 10</span>
            </div>
            <div style={{ height: 8, background: C.creamDark, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${(val / 10) * 100}%`, height: "100%", background: C.coral }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page 7 — Action Plan ──────────────────────────────────────
function ActionPlan({ data }: { data: any }) {
  const weeks: any[] = data?.actionPlan?.weeks ?? [];
  const routine = data?.actionPlan?.ongoingRoutine ?? {};
  const wColors = [C.coral, C.navy, C.green, C.navy3];
  const tiers: Array<["daily" | "weekly" | "monthly", string]> = [
    ["daily", "Daily"],
    ["weekly", "Weekly"],
    ["monthly", "Monthly"],
  ];

  return (
    <div className="report-page" style={{ ...pageBase, background: C.cream }}>
      <div style={sectionLabel}>06 · Action Plan</div>
      <h1 style={h1}>What To Do Next</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {weeks.slice(0, 4).map((w, i) => {
          const color = wColors[i % wColors.length];
          const tasks: any[] = w?.tasks ?? [];
          return (
            <div key={i} style={{ ...card, padding: 0, overflow: "hidden" }}>
              <div style={{ background: color, color: C.white, padding: "10px 16px", fontSize: 11, letterSpacing: 2, fontWeight: 700 }}>
                {w?.label ?? `WEEK ${i + 1}`}
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.navy, marginBottom: 8 }}>{w?.theme ?? "—"}</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: C.navy2, fontSize: 12, lineHeight: 1.5 }}>
                  {tasks.map((t, j) => (
                    <li key={j}>{typeof t === "string" ? t : (t?.title ?? t?.task ?? "")}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div style={card}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: C.coral, fontWeight: 700, marginBottom: 12 }}>ONGOING ROUTINE</div>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 0 }}>
          {tiers.map(([key, label], i) => {
            const items = routine?.[key];
            const list = Array.isArray(items) ? items : items ? [items] : [];
            return (
              <React.Fragment key={key}>
                <div style={{
                  padding: "12px 8px",
                  borderTop: i ? `1px solid ${C.creamDark}` : "none",
                  fontSize: 11, letterSpacing: 2, color: C.coral, fontWeight: 700,
                }}>{label.toUpperCase()}</div>
                <div style={{
                  padding: "12px 8px",
                  borderTop: i ? `1px solid ${C.creamDark}` : "none",
                  fontSize: 13, color: C.navy2, lineHeight: 1.5,
                }}>
                  {list.length
                    ? list.map((x, j) => (
                        <div key={j}>{typeof x === "string" ? x : (x?.title ?? x?.task ?? "")}</div>
                      ))
                    : "—"}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────
export default function MoxieReport({ data }: { data: any }) {
  return (
    <div
      id="moxie-pdf-report"
      style={{
        background: C.cream,
        color: C.navy,
        fontFamily: FONT,
      }}
    >
      <Cover data={data} />
      <Overview data={data} />
      <Voice data={data} />
      <Content data={data} />
      <Calendar data={data} />
      <ChannelsMetrics data={data} />
      <ActionPlan data={data} />
    </div>
  );
}