import { getCtaLabel, getCtaVariant, trackCtaClick } from "@/lib/ctaVariant";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import heroMaskAsset from "@/assets/redesign/platform-hero-mask.png.asset.json";

/* ============================================================
   Design tokens (scoped to this page)
   ============================================================ */
const C = {
  cream: "#f4efe5",
  sage: "#dce3d2",
  off: "#fbf9f3",
  ink: "#13130f",
  coral: "#ef6f53",
  muted: "#56544c",
  lightMuted: "#6c6a60",
  border: "#e6e0d2",
  darkBorder: "#ddd8cb",
};

const fontDisplay = { fontFamily: "'Newsreader', serif" };
const fontBody = { fontFamily: "'Hanken Grotesk', sans-serif" };
const fontMono = { fontFamily: "'IBM Plex Mono', monospace" };

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")";

/* ============================================================
   Small primitives
   ============================================================ */
function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      style={{
        ...fontMono,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        color: dark ? "#7a786e" : "#8a887e",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ width: 8, height: 8, background: C.coral, display: "inline-block" }} />
      {children}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function FeatureIcon({ kind }: { kind: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: C.coral, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const wrap: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 999, background: "#fff", border: `1px solid ${C.border}`,
    display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  };
  const inner = () => {
    switch (kind) {
      case "sparkle": return (<svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></svg>);
      case "mail": return (<svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>);
      case "pencil": return (<svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>);
      case "calendar": return (<svg {...common}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>);
      case "megaphone": return (<svg {...common}><path d="m3 11 18-8v18l-18-8Z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>);
      case "bars": return (<svg {...common}><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="4" width="3" height="14" /></svg>);
    }
  };
  return <span style={wrap}>{inner()}</span>;
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={{ display: "flex", gap: 14 }}>
      <FeatureIcon kind={icon} />
      <div>
        <div style={{ ...fontBody, fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{title}</div>
        <div style={{ ...fontBody, fontSize: 14, color: C.lightMuted, lineHeight: 1.55 }}>{body}</div>
      </div>
    </div>
  );
}

/* ============================================================
   App browser mockup
   ============================================================ */
function BrowserMockup({ active, children }: { active: string; children: React.ReactNode }) {
  const navItem = (label: string) => {
    const isActive = label === active;
    return (
      <div
        key={label}
        style={{
          ...fontBody, fontSize: 12, padding: "5px 8px", borderRadius: 6, marginBottom: 2,
          color: isActive ? "#c75438" : C.lightMuted,
          background: isActive ? "rgba(239,111,83,0.13)" : "transparent",
          fontWeight: isActive ? 600 : 400,
        }}
      >
        {label}
      </div>
    );
  };
  const sectionLabel = (l: string) => (
    <div style={{ ...fontMono, fontSize: 8, textTransform: "uppercase", letterSpacing: "0.18em", color: "#9a9789", margin: "10px 8px 4px" }}>{l}</div>
  );
  return (
    <div style={{ border: `1px solid ${C.darkBorder}`, borderRadius: 12, overflow: "hidden", background: "#fff", boxShadow: "0 20px 50px -25px rgba(20,25,15,0.25)" }}>
      {/* chrome */}
      <div style={{ height: 36, background: "#efe9dc", borderBottom: `1px solid #e3ddce`, display: "flex", alignItems: "center", padding: "0 12px", gap: 6 }}>
        <span style={{ width: 9, height: 9, borderRadius: 99, background: "#e6c2b6" }} />
        <span style={{ width: 9, height: 9, borderRadius: 99, background: "#e8dab4" }} />
        <span style={{ width: 9, height: 9, borderRadius: 99, background: "#c3d3b9" }} />
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ ...fontMono, fontSize: 10, background: "#f6f1e6", border: `1px solid #e3ddce`, borderRadius: 999, padding: "3px 14px", color: "#7a786e" }}>
            app.buildwithmoxiemo.com
          </div>
        </div>
      </div>
      {/* body */}
      <div style={{ height: 316, display: "flex" }}>
        <div style={{ width: 148, background: C.cream, borderRight: `1px solid #ece6d8`, padding: 10 }}>
          <div style={{ ...fontDisplay, fontSize: 13, fontWeight: 700, color: C.ink, padding: "4px 8px", marginBottom: 4, letterSpacing: "-0.01em" }}>MOXIEMO</div>
          {sectionLabel("Workspace")}
          {["Dashboard", "Discovery", "Strategy"].map(navItem)}
          {sectionLabel("Execute")}
          {["Content", "Social", "Email", "Marketing Planner"].map(navItem)}
          {sectionLabel("Analyze")}
          {["Analytics", "Goals"].map(navItem)}
        </div>
        <div style={{ flex: 1, background: C.off, padding: "14px 16px", overflow: "hidden" }}>{children}</div>
      </div>
    </div>
  );
}

/* ===== mockup contents per step ===== */
const tinyMono: React.CSSProperties = { ...fontMono, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: "#8a887e" };

function MockSocialCalendar() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const items: Record<number, { c: string; t: string }[]> = {
    1: [{ c: C.coral, t: "LinkedIn" }],
    4: [{ c: "#5b8bd6", t: "Email" }],
    8: [{ c: "#7ba87a", t: "IG" }],
    11: [{ c: C.coral, t: "LinkedIn" }],
    15: [{ c: "#5b8bd6", t: "Email" }, { c: C.coral, t: "LI" }],
    18: [{ c: "#7ba87a", t: "Instagram" }],
    22: [{ c: C.coral, t: "LinkedIn" }],
    25: [{ c: "#5b8bd6", t: "Email" }],
  };
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ ...fontDisplay, fontSize: 14, fontWeight: 600, color: C.ink }}>Social · Calendar</div>
        <div style={tinyMono}>May 2026</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 4 }}>
        {days.map(d => <div key={d} style={{ ...tinyMono, textAlign: "center", padding: "2px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 4, padding: 3, minHeight: 32, fontSize: 8, color: C.lightMuted }}>
            <div style={{ ...fontMono, fontSize: 8, marginBottom: 2 }}>{i + 1}</div>
            {(items[i] || []).map((it, j) => (
              <div key={j} style={{ background: it.c, color: "#fff", fontSize: 7, padding: "1px 3px", borderRadius: 2, marginTop: 1, lineHeight: 1.2 }}>{it.t}</div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function MockStrategy() {
  return (
    <div style={{ background: C.ink, borderRadius: 10, padding: 16, height: "100%", color: "#f4efe5" }}>
      <div style={{ ...fontMono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: C.coral, marginBottom: 12 }}>
        <span style={{ display: "inline-block", width: 6, height: 6, background: C.coral, marginRight: 6 }} />Positioning Statement
      </div>
      <div style={{ ...fontDisplay, fontSize: 16, lineHeight: 1.35, color: "#fff", marginBottom: 16 }}>
        We help founder-led service firms win better clients with a clear point of view.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[{ k: "Who", v: "Founder-led service firms" }, { k: "Problem", v: "Busy marketing, unclear priorities" }].map(b => (
          <div key={b.k} style={{ border: `1px solid rgba(244,239,229,0.18)`, borderRadius: 6, padding: 10 }}>
            <div style={{ ...fontMono, fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7a786e", marginBottom: 4 }}>{b.k}</div>
            <div style={{ ...fontBody, fontSize: 11, color: "#d9d6cb" }}>{b.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockContent() {
  const pill = (label: string, active = false) => (
    <div style={{ ...fontBody, fontSize: 10, padding: "5px 10px", borderRadius: 999, border: `1px solid ${active ? C.coral : C.border}`, background: active ? "rgba(239,111,83,0.1)" : "#fff", color: active ? "#c75438" : C.lightMuted, fontWeight: active ? 600 : 400 }}>{label}</div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, height: "100%" }}>
      <div>
        <div style={tinyMono}>Pillar</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5, marginBottom: 10 }}>{pill("Authority", true)}{pill("Systems")}{pill("Growth")}</div>
        <div style={tinyMono}>Format</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5, marginBottom: 10 }}>{pill("LinkedIn post", true)}{pill("Email")}{pill("Article")}</div>
        <div style={tinyMono}>Voice</div>
        <div style={{ marginTop: 6, padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 10, color: C.lightMuted, background: "#fff" }}>
          ● In your voice <span style={{ float: "right", color: C.coral }}>ON</span>
        </div>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 999, background: C.coral, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", ...fontBody }}>KL</div>
          <div style={{ ...fontBody, fontSize: 11, fontWeight: 600, color: C.ink }}>Kate L. <span style={{ color: C.lightMuted, fontWeight: 400 }}>· 1m</span></div>
        </div>
        <div style={{ ...fontBody, fontSize: 10.5, color: C.ink, lineHeight: 1.5, flex: 1 }}>
          Three signs it is time to reposition your offer, and what to fix first.
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <div style={{ ...fontMono, fontSize: 8, color: "#7ba87a", textTransform: "uppercase", letterSpacing: "0.16em" }}>● In your voice</div>
          <div style={{ ...fontBody, fontSize: 10, padding: "5px 12px", borderRadius: 999, background: C.ink, color: "#fff", fontWeight: 600 }}>Approve</div>
        </div>
      </div>
    </div>
  );
}

function MockPlanner() {
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <div style={{ ...fontMono, fontSize: 9, padding: "4px 9px", borderRadius: 999, background: "rgba(239,111,83,0.13)", color: "#c75438", letterSpacing: "0.14em", textTransform: "uppercase" }}>Growth Ideas</div>
        <div style={{ ...fontMono, fontSize: 9, padding: "4px 9px", borderRadius: 999, color: C.lightMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>Calendar</div>
        <div style={{ ...fontMono, fontSize: 9, padding: "4px 9px", borderRadius: 999, color: C.lightMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>Review</div>
      </div>
      <div style={{ ...fontBody, fontSize: 11, fontWeight: 600, color: C.ink, marginBottom: 6 }}>This week's opportunities</div>
      {[
        { t: "Newsletter: Strategy vs Tactics", m: "Email · Tues" },
        { t: "LinkedIn carousel: 3 signals", m: "Social · Wed" },
        { t: "Long-form: Coach plateau", m: "Blog · Fri" },
      ].map(c => (
        <div key={c.t} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", marginBottom: 5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...fontBody, fontSize: 11, color: C.ink }}>{c.t}</div>
          <div style={{ ...fontMono, fontSize: 9, color: C.lightMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{c.m}</div>
        </div>
      ))}
      <div style={{ ...fontBody, fontSize: 11, fontWeight: 600, color: C.ink, margin: "10px 0 6px" }}>Content gaps</div>
      {["Welcome sequence email 3", "About page refresh"].map(g => (
        <div key={g} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: `1px solid ${C.border}` }}>
          <div style={{ ...fontBody, fontSize: 11, color: C.muted }}>{g}</div>
          <div style={{ ...fontMono, fontSize: 9, color: C.coral, letterSpacing: "0.12em", textTransform: "uppercase" }}>Create post →</div>
        </div>
      ))}
    </div>
  );
}

function MockAnalytics() {
  const metrics = [
    { k: "Calls", v: "12", d: "+4" },
    { k: "Published", v: "24", d: "+18%" },
    { k: "Engage", v: "4.6%", d: "+.8%" },
    { k: "Leads", v: "31", d: "+12" },
  ];
  const bars = [{ k: "LinkedIn", v: 85 }, { k: "Email", v: 72 }, { k: "Instagram", v: 58 }];
  return (
    <div>
      <div style={tinyMono}>SAMPLE DATA</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 12 }}>
        {metrics.map(m => (
          <div key={m.k} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 9px" }}>
            <div style={tinyMono}>{m.k}</div>
            <div style={{ ...fontDisplay, fontSize: 18, fontWeight: 600, color: C.ink, lineHeight: 1.1, marginTop: 2 }}>{m.v}</div>
            <div style={{ ...fontMono, fontSize: 9, color: C.coral, marginTop: 2 }}>{m.d}</div>
          </div>
        ))}
      </div>
      <div style={tinyMono}>Strategy alignment</div>
      <div style={{ marginTop: 6, marginBottom: 10 }}>
        {bars.map(b => (
          <div key={b.k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ ...fontBody, fontSize: 10, color: C.lightMuted, width: 60 }}>{b.k}</div>
            <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${b.v}%`, height: "100%", background: C.coral, transition: "width 1s ease-out" }} />
            </div>
            <div style={{ ...fontMono, fontSize: 9, color: C.muted, width: 30, textAlign: "right" }}>{b.v}%</div>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(239,111,83,0.08)", border: `1px solid ${C.border}`, borderRadius: 8, padding: 10 }}>
        <div style={{ ...fontMono, fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: C.coral, marginBottom: 3 }}>Weekly insight</div>
        <div style={{ ...fontBody, fontSize: 11, color: C.ink, lineHeight: 1.45 }}>LinkedIn carousels outperformed plain text 2.3×. Double down next week.</div>
      </div>
    </div>
  );
}

/* ============================================================
   Step card
   ============================================================ */
interface Step {
  n: string; label: string; time: string; title: string; body: string; checks: string[];
  active: string; mock: React.ReactNode;
}
const STEPS: Step[] = [
  { n: "01", label: "DISCOVER AND DIAGNOSE", time: "One guided session", title: "Start with the truth about your brand.",
    body: "MOXIEMO asks founder-built questions drawn from This Is Branding: your goals, audience, offer, proof, current activity and constraints. Then it compares your answers with what your brand and channels show today and names the gap.",
    checks: ["Business goals and success measure", "Audience and offer", "Proof and current activity", "Brand and channel review", "The gap between your goal and today"],
    active: "Social", mock: <MockSocialCalendar /> },
  { n: "02", label: "DEFINE", time: "Always on", title: "A strategy you can use every day.",
    body: "Positioning, messaging, audience priorities and content pillars, written in plain language and built into every tool you use in MOXIEMO.",
    checks: ["Positioning statement", "Messaging", "Audience priorities", "Content pillars", "Brand voice"],
    active: "Strategy", mock: <MockStrategy /> },
  { n: "03", label: "PRIORITIZE", time: "Weekly", title: "Know what comes first.",
    body: "Your strategy becomes a roadmap with milestones and next best actions, in order. When something slips, you see it. When something works, it moves up.",
    checks: ["Measurable roadmap", "Milestones", "Next best actions", "Growth tests with clear success criteria"],
    active: "Marketing Planner", mock: <MockPlanner /> },
  { n: "04", label: "EXECUTE", time: "You approve", title: "Ready-to-approve work, in your voice.",
    body: "Pick a pillar or a priority and MOXIEMO drafts the post, newsletter, article or script. You edit and approve. With your accounts connected, it publishes on the schedule you set, and MOXIE lets you know when something is ready.",
    checks: ["LinkedIn posts", "Email newsletters", "Blog articles", "Video scripts"],
    active: "Content", mock: <MockContent /> },
  { n: "05", label: "MEASURE AND ADAPT", time: "Weekly review", title: "See what moved. Decide what is next.",
    body: "Results come from your connected data and are read against the goal you set. You see what worked, what to drop and what to try next.",
    checks: ["Your success measure", "Results by channel and pillar", "Weekly summary from MOXIE", "Recommendations for the next round"],
    active: "Analytics", mock: <MockAnalytics /> },
];

function StepCard({ step }: { step: Step }) {
  return (
    <div style={{ background: C.off, border: `1px solid ${C.border}`, borderRadius: 18, padding: "48px 52px", display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 52, alignItems: "center" }} className="step-card">
      <div>
        <div style={{ ...fontDisplay, fontSize: 88, fontWeight: 600, color: C.coral, lineHeight: 0.85, marginBottom: 14 }}>{step.n}</div>
        <div style={{ ...fontMono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#8a877a", marginBottom: 4 }}>{step.label}</div>
        <div style={{ ...fontBody, fontSize: 15, color: "#9a9789", marginBottom: 18 }}>{step.time}</div>
        <h3 style={{ ...fontDisplay, fontWeight: 600, fontSize: "clamp(22px,2.5vw,30px)", lineHeight: 1.15, letterSpacing: "-0.02em", color: C.ink, marginBottom: 14 }}>{step.title}</h3>
        <p style={{ ...fontBody, fontSize: 16, color: C.muted, lineHeight: 1.6, marginBottom: 22 }}>{step.body}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 18px" }}>
          {step.checks.map(c => (
            <div key={c} style={{ display: "flex", gap: 8, alignItems: "flex-start", ...fontBody, fontSize: 14, color: "#3a382f" }}>
              <CheckIcon />{c}
            </div>
          ))}
        </div>
      </div>
      <BrowserMockup active={step.active}>{step.mock}</BrowserMockup>
    </div>
  );
}

/* ============================================================
   Page
   ============================================================ */
export default function Platform() {
  const marqueeItems = ["STRATEGY FIRST", "EXECUTION THAT MOVES", "YOU APPROVE WHAT GOES OUT", "MOXIE, YOUR GROWTH COMPANION, KEEPS IT MOVING", "YOUR VOICE, EVERY TIME"];
  return (
    <div style={{ ...fontBody, background: C.cream, color: C.ink, minHeight: "100vh" }}>
      <SiteHeader />

      {/* grain overlay */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, backgroundImage: GRAIN_URL, backgroundSize: "200px", opacity: 0.5, mixBlendMode: "multiply" }} />

      <style>{`
        @keyframes pf-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (max-width: 900px) {
          .pf-copilot-grid { grid-template-columns: 1fr !important; }
          .step-card { grid-template-columns: 1fr !important; padding: 32px !important; gap: 32px !important; }
          .pf-mig-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .pf-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .pf-stats-head { grid-template-columns: 1fr !important; }
          .pf-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* SECTION 1 · HERO */}
      <section style={{ background: C.sage }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "104px 40px 120px", textAlign: "center" }}>
          <div style={{ display: "inline-block", marginBottom: 24 }}>
            <Eyebrow>§ · The Platform</Eyebrow>
          </div>
          <h1 style={{ ...fontDisplay, fontSize: "clamp(48px,6.5vw,96px)", lineHeight: 1.02, letterSpacing: "-0.02em", margin: 0 }}>
            <span style={{ fontWeight: 600, color: C.ink, display: "block" }}>Strategy first.</span>
            <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e", display: "block" }}>Execution that moves.</span>
          </h1>
          <p style={{ ...fontBody, fontSize: 20, color: "#48533c", maxWidth: 580, margin: "32px auto 40px", lineHeight: 1.55 }}>
            MOXIEMO is a strategy-led marketing system. It works out what moves your brand forward, creates and publishes the work with your approval, and measures what happened.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <Link to="/brand-audit" style={{ ...fontBody, background: C.ink, color: "#f7f3ea", fontWeight: 600, padding: "16px 28px", borderRadius: 999, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
              Get my free growth assessment <span style={{ color: C.coral }}>→</span>
            </Link>
            <Link to="/pricing" style={{ ...fontBody, background: "transparent", color: C.ink, fontWeight: 600, padding: "14.5px 28px", borderRadius: 999, border: `1.5px solid ${C.ink}`, textDecoration: "none" }}>
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2 · AI CO-PILOT */}
      <section style={{ background: C.cream, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Eyebrow>§ 01 · WHAT MOXIEMO DOES</Eyebrow>
          </div>
          <div style={{
            background: `radial-gradient(ellipse at 50% 108%, rgba(239,111,83,0.09) 0%, ${C.off} 58%)`,
            border: `1px solid ${C.border}`, borderRadius: 20,
            boxShadow: "0 40px 80px -40px rgba(30,45,55,0.38)",
          }}>
            <div style={{ textAlign: "center", padding: "52px 40px 36px" }}>
              <h2 style={{ ...fontDisplay, fontWeight: 600, fontSize: "clamp(32px,4vw,54px)", letterSpacing: "-0.02em", margin: 0, color: C.ink, lineHeight: 1.05 }}>
                A strategic advisor and an execution partner in one.
              </h2>
              <p style={{ ...fontBody, fontSize: 18, color: C.muted, margin: "16px auto 0", maxWidth: 560 }}>
                You set the direction. MOXIEMO handles the steps between.
              </p>
            </div>
            <div className="pf-copilot-grid" style={{ display: "grid", gridTemplateColumns: "1fr 300px 1fr", gap: 32, padding: "0 52px 44px", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
                <Feature icon="sparkle" title="Discovery and diagnosis" body="Guided questions built on the This Is Branding brand architecture, plus a read on your brand and channels today." />
                <Feature icon="mail" title="Positioning and content pillars" body="Clear positioning, messaging, audience priorities and the pillars your content stands on." />
                <Feature icon="pencil" title="Roadmap and next best actions" body="Milestones and priorities in order, so you always know what comes first." />
              </div>
              <div style={{ height: 440, borderRadius: 18, overflow: "hidden", background: "linear-gradient(140deg, #f9b96e 0%, #ef6f53 38%, #de5fa0 70%, #a87cc8 100%)" }}>
                <img src={heroMaskAsset.url} alt="Founder wearing MOXIEMO mask" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%", mixBlendMode: "multiply" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
                <Feature icon="calendar" title="Content creation" body="Posts, newsletters, articles and scripts in your voice, ready for your approval." />
                <Feature icon="megaphone" title="Publishing and workflows" body="Publish to the channels you connect, on the schedule you approved." />
                <Feature icon="bars" title="Performance and recommendations" body="Results read against your goal, with clear next steps." />
              </div>
            </div>
            <div style={{ textAlign: "center", paddingBottom: 52 }}>
              <Link to="/pricing" style={{ ...fontBody, background: C.coral, color: "#fff", fontWeight: 600, padding: "17px 34px", borderRadius: 999, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 8px 24px -8px rgba(239,111,83,0.45)" }}>
                See pricing →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 · MARQUEE */}
      <section style={{ background: C.ink, padding: "15px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", width: "max-content", animation: "pf-scroll 32s linear infinite" }}>
          {[0, 1].map(loop => (
            <div key={loop} style={{ display: "flex", alignItems: "center" }}>
              {marqueeItems.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", paddingRight: 36 }}>
                  <span style={{ ...fontMono, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.16em", color: C.cream, whiteSpace: "nowrap" }}>{item}</span>
                  <span style={{ width: 7, height: 7, background: C.coral, marginLeft: 36 }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 · FIVE STAGES */}
      <section id="how-it-works" style={{ background: C.cream, padding: "112px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56, maxWidth: 840, marginInline: "auto" }}>
            <div style={{ marginBottom: 24 }}><Eyebrow>§ 02 · THE LOOP</Eyebrow></div>
            <h2 style={{ ...fontDisplay, fontSize: "clamp(38px,5vw,72px)", letterSpacing: "-0.02em", lineHeight: 1.02, margin: 0 }}>
              <span style={{ fontWeight: 600, color: C.ink, display: "block" }}>Six stages.</span>
              <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e", display: "block" }}>One plan.</span>
            </h2>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", margin: "28px 0 18px" }}>
              {[["DISCOVER", false], ["DIAGNOSE", false], ["DEFINE", false], ["PRIORITIZE", false], ["EXECUTE", false], ["MEASURE + ADAPT", true]].map(([t, last], i, arr) => (
                <span key={String(t)} style={{ ...fontMono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: last ? C.coral : C.lightMuted, fontWeight: last ? 700 : 400, display: "inline-flex", alignItems: "center", gap: 10 }}>
                  {t}{i < arr.length - 1 && <span style={{ color: C.coral }}>→</span>}
                </span>
              ))}
            </div>
            <p style={{ ...fontBody, fontSize: 18, color: C.muted, margin: 0 }}>
              Every round makes the next one sharper.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {STEPS.map(s => <StepCard key={s.n} step={s} />)}
          </div>
        </div>
      </section>

      <section style={{ background: C.sage, padding: "112px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Eyebrow>§ 03 · HOW WE ARE BUILDING IT</Eyebrow>
          <h2 style={{ ...fontDisplay, fontWeight: 600, fontSize: "clamp(34px,4vw,54px)", lineHeight: 1.05, color: C.ink, margin: "24px 0" }}>Built in stages, in the right order.</h2>
          <p style={{ ...fontBody, fontSize: 17, lineHeight: 1.6, color: C.muted, marginBottom: 40 }}>Every connector and feature is sequenced so the strategy comes first. Check the changelog to see what is live.</p>
          <div className="grid gap-8 md:grid-cols-2">
            {[
              ["01", "FOUNDATION", "Guided discovery, diagnosis, goals, brand architecture, a priority roadmap and content pillars."],
              ["02", "ACTIVATION", "Ready-to-approve content, task tracking, MOXIE reminders and weekly progress summaries."],
              ["03", "EXECUTION", "Connected publishing and marketing platforms, two-way approvals by text and results back in your dashboard."],
              ["04", "OPTIMIZATION", "Deeper growth tests, search and AI answer insights, attribution, cross-brand views and carefully controlled ad tools."],
            ].map(([n, title, body]) => <div key={n} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
              <div style={{ ...fontMono, fontSize: 12, color: C.coral }}>{n} {title}</div>
              <p style={{ ...fontBody, fontSize: 16, lineHeight: 1.6, color: C.muted, marginTop: 14 }}>{body}</p>
            </div>)}
          </div>
          <Link to="/changelog" style={{ ...fontBody, color: C.ink, display: "inline-block", marginTop: 36 }}>See the changelog →</Link>
        </div>
      </section>

      {/* SECTION 6 · MIGRATION + SECURITY */}
      <section style={{ background: C.cream, padding: "112px 24px" }}>
        <div className="pf-mig-grid" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72 }}>
          <div>
            <div style={{ marginBottom: 22 }}><Eyebrow>§ 04 · GETTING STARTED</Eyebrow></div>
            <h2 style={{ ...fontDisplay, fontSize: "clamp(34px,4vw,54px)", letterSpacing: "-0.02em", lineHeight: 1.05, margin: 0 }}>
              <span style={{ fontWeight: 600, color: C.ink, display: "block" }}>How you get going.</span>
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              {[1, 2, 3, 4].map((n, i) => (
                <div key={n} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : 0 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 99, background: C.coral, flexShrink: 0 }} />
                  {i < 3 && <div style={{ flex: 1, height: 1, background: C.coral, opacity: 0.4, margin: "0 6px" }} />}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28, ...fontMono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.lightMuted }}>
              {[1, 2, 3, 4].map(n => <span key={n}>{String(n).padStart(2, "0")}</span>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["01", "Run discovery"],
                ["02", "Review your diagnosis and strategy"],
                ["03", "Connect your channels and choose how MOXIE checks in"],
                ["04", "Approve your first actions"],
              ].map(([w, t]) => (
                <div key={w} style={{ display: "flex", alignItems: "center", gap: 14, ...fontBody, fontSize: 16, color: C.ink }}>
                  <span style={{ color: C.coral, fontWeight: 700 }}>→</span>
                  <span style={{ ...fontMono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: C.lightMuted, minWidth: 64 }}>{w}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: C.off, border: `1px solid ${C.border}`, borderRadius: 16, padding: 40, boxShadow: "0 30px 60px -40px rgba(30,45,55,0.3)", alignSelf: "start" }}>
            <div style={{ ...fontMono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: C.coral, marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 8, height: 8, background: C.coral, display: "inline-block" }} />
              Built on secure infrastructure
            </div>
            <div>
              {["Encryption in transit (TLS)", "Encrypted storage for sensitive data", "Row-level security, so you only see your own data", "Export your data anytime", "We do not use your Discovery answers to train third-party AI models", "Formal security certifications are on our roadmap"].map((item, i) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 0", borderTop: i === 0 ? "none" : `1px solid ${C.border}`, ...fontBody, fontSize: 16, color: C.ink }}>
                  <CheckIcon />{item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 · FINAL CTA */}
      <section style={{ background: C.sage, padding: "112px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ ...fontDisplay, fontSize: "clamp(40px,6vw,84px)", lineHeight: 1.02, letterSpacing: "-0.02em", margin: "0 auto 36px", maxWidth: 800 }}>
            <span style={{ fontWeight: 600, color: C.ink, display: "block" }}>Ready when you are.</span>
          </h2>
          <p style={{ ...fontBody, fontSize: 18, color: C.muted, lineHeight: 1.6, marginBottom: 32 }}>Start with the free growth assessment. Then claim one of 100 founding seats at 50% off for life.</p>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <Link to="/brand-audit" style={{ ...fontBody, background: C.ink, color: "#fff", fontWeight: 600, fontSize: 15.5, padding: "16px 28px", borderRadius: 999, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
              Get my free growth assessment <span style={{ color: C.coral }}>→</span>
            </Link>
            <Link to="/founding" onClick={trackCtaClick} style={{ whiteSpace: "nowrap", ...fontBody, color: C.ink, fontWeight: 600, padding: "14.5px 28px", borderRadius: 999, border: `1.5px solid ${C.ink}`, textDecoration: "none" }}>{getCtaLabel()}</Link>
            <span style={{ ...fontMono, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.16em", color: "#5f6a52", display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 8, height: 8, background: C.coral, display: "inline-block" }} />
              50% OFF FOR LIFE FOR OUR 100 FOUNDING MEMBERS
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 8 · FOOTER */}
      <SiteFooter />
    </div>
  );
}