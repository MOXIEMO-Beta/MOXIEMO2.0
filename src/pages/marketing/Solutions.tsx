import { getCtaLabel, trackCtaClick } from "@/lib/ctaVariant";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MoxieAvatar } from "@/components/MoxieAvatar";
const expertiseImg = { url: "/07-how-we-start.png" };
const serviceImg = { url: "/09-free-assessment.png" };
const growingImg = { url: "/10-why-different.png" };

const CREAM = "#f4efe5";
const SAGE = "#dce3d2";
const OFFWHITE = "#fbf9f3";
const INK = "#13130f";
const DARK = "#1a1916";
const CORAL = "#ef6f53";
const CORAL_HOVER = "#d85f44";
const MUTED = "#56544c";
const SAGE_BODY = "#48533c";
const LIGHT_MUTED = "#8a887e";
const BORDER = "#e6e0d2";

const display: CSSProperties = { fontFamily: "'Fraunces Variable', Georgia, serif" };
const body: CSSProperties = { fontFamily: "'DM Sans Variable', system-ui, sans-serif" };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace" };

const PAGE_CSS = `
.sol-loop-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;}
.sol-page { background:${CREAM}; color:${INK}; font-family:'DM Sans Variable', system-ui, sans-serif; }
.sol-grain { position:fixed; inset:0; pointer-events:none; z-index:9999; opacity:.45; mix-blend-mode:multiply; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E"); background-size:200px; }
.reveal{opacity:0;transform:translateY(40px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1);}
.reveal-l{opacity:0;transform:translateX(-44px);transition:opacity .95s cubic-bezier(.16,1,.3,1),transform .95s cubic-bezier(.16,1,.3,1);}
.reveal-r{opacity:0;transform:translateX(44px);transition:opacity .95s cubic-bezier(.16,1,.3,1),transform .95s cubic-bezier(.16,1,.3,1);}
.reveal.visible,.reveal-l.visible,.reveal-r.visible{opacity:1;transform:none;}
.d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}.d4{transition-delay:.45s}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.prob-icon{display:inline-block;font-size:26px;line-height:1;font-weight:300;transition:transform .3s ease;flex-shrink:0;color:${INK};}
.prob-icon.open{transform:rotate(45deg);}
.prob-row{cursor:pointer;border-top:1px solid rgba(19,19,15,0.09);padding:30px 0;}
.prob-row:hover .prob-hd{color:${CORAL} !important;}
.faq-item{cursor:pointer;transition:background .18s;padding:22px 0;border-bottom:1px solid rgba(19,19,15,0.09);}
.faq-moxie{float:left;margin:0 12px 4px 0;}
.persona-chip{padding:11px 24px;background:transparent;border:1.5px solid rgba(19,19,15,0.18);border-radius:999px;font-family:'JetBrains Mono Variable',monospace;font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:${MUTED};cursor:pointer;transition:all .22s ease;white-space:nowrap;}
.persona-chip:hover{border-color:${INK};color:${INK};}
.persona-chip.active{background:${INK};border-color:${INK};color:#f7f3ea;}
.sol-cta-primary{background:${CORAL};color:#fff;font-weight:700;font-size:15px;padding:16px 28px;border-radius:999px;display:inline-block;text-decoration:none;transition:background .2s;}
.sol-cta-primary:hover{background:${CORAL_HOVER};}
.sol-cta-secondary{background:transparent;color:${INK};border:1.5px solid rgba(19,19,15,0.25);font-weight:600;font-size:15px;padding:16px 28px;border-radius:999px;display:inline-block;text-decoration:none;transition:border-color .2s;}
.sol-cta-secondary:hover{border-color:${INK};}
@media (max-width: 900px){
  .sol-grid-2,.sol-grid-2-rev,.sol-hero-grid{grid-template-columns:1fr !important;}
  .sol-grid-4{grid-template-columns:1fr 1fr !important;}
  .sol-loop-grid{grid-template-columns:1fr !important;}
}
@media (max-width:600px){.sol-grid-4{grid-template-columns:1fr !important;}}
`;

function Eyebrow({ num, name, color = LIGHT_MUTED }: { num: string; name: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
      <span style={{ width: 8, height: 8, background: CORAL, display: "inline-block" }} />
      <span style={{ ...mono, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color }}>
        § {num} · {name}
      </span>
    </div>
  );
}

function MockupShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="reveal-r"
      style={{
        background: INK,
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid rgba(244,239,229,0.08)",
        boxShadow: "0 32px 64px -24px rgba(19,19,15,0.55)",
      }}
    >
      <div
        style={{
          padding: "13px 18px",
          borderBottom: "1px solid rgba(244,239,229,0.07)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: CORAL }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(244,239,229,0.15)" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(244,239,229,0.15)" }} />
        <span style={{ ...mono, fontSize: 11, textTransform: "uppercase", color: "rgba(244,239,229,0.32)", marginLeft: 10 }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

const problems = [
  {
    "t": "The backwards order problem",
    "p": "Most founders start with what to post this week. MOXIEMO starts with the goal, the audience and the gap, then decides what to post."
  },
  {
    "t": "The busy-but-stuck problem",
    "p": "Lots of activity, little progress. MOXIEMO ties every action to a milestone, so you can see what is moving the business."
  },
  {
    "t": "The disconnected content problem",
    "p": "Your strategy lives in one place and your content in five others. In MOXIEMO, every draft starts from the same plan."
  },
  {
    "t": "The blank screen problem",
    "p": "Every week starts from zero. MOXIEMO hands you drafts in your voice, tied to your pillars and ready to approve."
  },
  {
    "t": "The follow-through problem",
    "p": "Things stall between logins. MOXIE flags what is waiting and what slipped, so the plan keeps moving."
  },
  {
    "t": "The more-brands problem",
    "p": "Each brand needs its own voice and goals. On Multiply, every brand gets its own strategy and workspace under one account."
  }
];

const personas = [
{ chip: "SOLO OWNERS", img: expertiseImg.url, h: "SOLO OWNERS", p: "You are the strategist, the writer and the one who hits publish. You need to know what matters most and get it done without a team.", bullets: ["A clear plan for one brand", "Drafts in your voice, ready to approve", "MOXIE nudges so things do not slip"], link: "See the Clarity plan" },
{ chip: "GROWING OPERATORS", img: serviceImg.url, h: "GROWING OPERATORS", p: "Your direction is set and the business is growing. Marketing needs to show up every week, across more than one brand or offer.", bullets: ["An expanded action plan", "More content and publishing", "Reporting that shows what moved"], link: "See the Momentum plan" },
{ chip: "PORTFOLIO OPERATORS", img: growingImg.url, h: "PORTFOLIO OPERATORS", p: "You run several brands, each with its own customers and voice. You need one place to run them without mixing them up.", bullets: ["A separate strategy and workspace for each brand", "Cross-brand planning and reporting", "MOXIE messages that name the brand and the action"], link: "See the Multiply plan" }
];

const faqGroups: { label: string; items: { q: string; a: ReactNode; withMoxie?: boolean }[] }[] = [
  {
    "label": "HOW IT WORKS",
    "items": [
      {
        "q": "What is the difference between a brand and a go-to-market?",
        "a": "Your brand is who you are and how you look and sound. Your go-to-market is who you sell to, where you reach them, what you say and what you do first. MOXIEMO builds both from the same discovery."
      },
      {
        "q": "How does discovery work?",
        "a": <>You answer guided questions about your goals, audience, offer, proof, current activity and constraints. The questions are built on <Link to="/brand-architecture-method" style={{ color: CORAL, textDecoration: "underline", textUnderlineOffset: 3 }}>the Brand Architecture Method</Link>. MOXIEMO then reviews your brand and channels and shows you the gap.</>
      },
      {
        "q": "Why diagnose before creating content?",
        "a": "Content built on the wrong message spreads the wrong message faster. Diagnosis makes sure the first thing you make is the right thing."
      },
      {
        "q": "What happens after discovery?",
        "a": "You get your positioning, messaging, content pillars and a roadmap with your next best actions. From there you create, approve and publish, and MOXIE helps you keep moving."
      }
    ]
  },
  {
    "label": "THE AI AND MOXIE",
    "items": [
      {
        "q": "Will the content sound like me?",
        "a": "Every draft starts from your discovery answers and brand voice. You edit and approve everything before it goes out."
      },
      {
        "q": "What is MOXIE?",
        "a": "MOXIE is your growth companion, the marketing partner inside MOXIEMO. He knows your plan and tells you what needs you next: a post to approve, a decision waiting, a priority that stalled, a weekly win. Two-way texting with MOXIE is coming in a future release, and you will choose how often he checks in.",
        "withMoxie": true
      },
      {
        "q": "Can MOXIE publish without me?",
        "a": "No. Only what you approve goes out, one action at a time. Bigger decisions, like ad spend, billing or account changes, always ask for more than a single approval."
      },
      {
        "q": "What AI does MOXIEMO use?",
        "a": <>MOXIEMO uses Anthropic's Claude models to generate strategy and content. We do not use your Discovery answers to train third-party AI models. <Link to="/compare/claude" style={{ color: CORAL, textDecoration: "underline", textUnderlineOffset: 3 }}>Compare MOXIEMO with using Claude on its own.</Link></>
      }
    ]
  },
  {
    "label": "PRACTICAL",
    "items": [
      {
        "q": "Can I edit what MOXIEMO creates?",
        "a": "Yes. Nothing goes out until you approve it."
      },
      {
        "q": "What if my strategy changes?",
        "a": "Update it anytime. Your plan, content and recommendations follow the new direction."
      },
      {
        "q": "Do I need to know anything about AI?",
        "a": "No. If you can answer questions about your business, you can use MOXIEMO."
      }
    ]
  },
  {
    "label": "PRICING",
    "items": [
      {
        "q": "How much does it cost?",
        "a": "Plans are $99, $149 and $249 a month, or save 17% when you pay annually. Founding members get 50% off any plan, monthly or annual, for life, as long as they keep their founding membership. Limited to 100 founding seats."
      },
      {
        "q": "Can I cancel anytime?",
        "a": "Yes. Cancel from your account settings and your plan ends at the close of your billing period."
      }
    ]
  }
];

export default function Solutions() {
  const [openProb, setOpenProb] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [persona, setPersona] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".reveal, .reveal-l, .reveal-r").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [persona]);

  const p = personas[persona];

  const moves: { num: string; label: string; h: string; hI: string; paras: ReactNode[]; bullets: string[]; mock: ReactNode }[] = [
    {
      num: "01",
      label: "Discover and diagnose",
      h: "Find what is true about",
      hI: "your brand today.",
      paras: [<>Discovery is a guided conversation built on <Link to="/brand-architecture-method" style={{ color: CORAL, textDecoration: "underline", textUnderlineOffset: 3 }}>the Brand Architecture Method</Link>. You answer in your own words. MOXIEMO then reviews your brand and channels and shows the gap between where you are and where you want to go.</>],
      bullets: ["Guided discovery", "A diagnosis of your current brand and channels", "Your goals and success measure", "A downloadable strategy foundation"],
      mock: (
        <MockupShell title="Discovery Session">
          <div style={{ padding: "20px 20px 12px" }}>
            <div style={{ background: "rgba(239,111,83,0.1)", border: "1px solid rgba(239,111,83,0.22)", borderRadius: "12px 12px 12px 3px", maxWidth: "83%", padding: "10px 13px", marginBottom: 12 }}>
              <div style={{ ...mono, fontSize: 8.5, color: CORAL, marginBottom: 4 }}>MOXIEMO</div>
              <div style={{ fontSize: 13, color: "rgba(244,239,229,0.85)" }}>Who is your ideal client, and what keeps them up at night?</div>
            </div>
            <div style={{ background: "rgba(244,239,229,0.05)", border: "1px solid rgba(244,239,229,0.1)", borderRadius: "12px 12px 3px 12px", maxWidth: "83%", marginLeft: "auto", padding: "10px 13px" }}>
              <div style={{ ...mono, fontSize: 8.5, color: "rgba(244,239,229,0.35)", marginBottom: 4 }}>YOU</div>
              <div style={{ fontSize: 13, color: "rgba(244,239,229,0.85)" }}>Coaches who have built real expertise but can't turn it into consistent revenue...</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(244,239,229,0.07)", padding: "16px 20px 20px" }}>
            <div style={{ ...mono, fontSize: 9, textTransform: "uppercase", color: "rgba(244,239,229,0.32)", marginBottom: 12 }}>Building your foundation</div>
            {[
              { l: "Positioning", s: "done" },
              { l: "Ideal Client", s: "done" },
              { l: "Brand Voice", s: "building" },
              { l: "Content Pillars", s: "todo" },
            ].map((r) => (
              <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span
                  style={{
                    width: 17,
                    height: 17,
                    borderRadius: "50%",
                    background: r.s === "done" ? CORAL : r.s === "building" ? CORAL : "transparent",
                    border: r.s === "todo" ? "1.5px solid rgba(244,239,229,0.25)" : "none",
                    animation: r.s === "building" ? "pulse 1.3s ease-in-out infinite" : undefined,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 10,
                  }}
                >
                  {r.s === "done" ? "✓" : ""}
                </span>
                <span style={{ fontSize: 12.5, color: r.s === "done" ? "rgba(244,239,229,0.76)" : r.s === "building" ? "rgba(244,239,229,0.6)" : "rgba(244,239,229,0.32)" }}>
                  {r.l}{r.s === "building" ? "  building..." : ""}
                </span>
              </div>
            ))}
          </div>
        </MockupShell>
      ),
    },
    {
      num: "02",
      label: "Define and prioritize",
      h: "Turn the diagnosis",
      hI: "into a plan.",
      paras: ["MOXIEMO writes your positioning, messaging and content pillars, then turns them into a roadmap with milestones and your next best actions. You always know what comes first."],
      bullets: ["Positioning and messaging", "Audience priorities and content pillars", "A measurable roadmap", "Next best actions, in order"],
      mock: (
        <MockupShell title="Content Generator">
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(244,239,229,0.07)" }}>
            <div style={{ ...mono, fontSize: 8.5, color: "rgba(244,239,229,0.28)", marginBottom: 8 }}>From your brand strategy</div>
            <div style={{ display: "flex", gap: 7 }}>
              {[
                ["LinkedIn", true],
                ["Instagram", false],
                ["Facebook", false],
                ["YouTube", false],
              ].map(([n, a]: any) => (
                <span key={n} style={{ ...mono, fontSize: 9.5, padding: "6px 11px", borderRadius: 6, background: a ? CORAL : "rgba(244,239,229,0.07)", color: a ? "#fff" : "rgba(244,239,229,0.34)" }}>
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div style={{ padding: "14px 16px 16px" }}>
            <div style={{ background: "rgba(244,239,229,0.04)", border: "1px solid rgba(244,239,229,0.09)", borderRadius: 10, padding: 13, marginBottom: 12 }}>
              <div style={{ ...mono, fontSize: 8.5, color: "rgba(244,239,229,0.28)", marginBottom: 8 }}>LinkedIn · Draft 1</div>
              <div style={{ fontSize: 13, color: "rgba(244,239,229,0.8)", lineHeight: 1.5 }}>
                Stop asking what to post this week. Start with who it is for and why they should care. That is the difference between content and marketing.
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <span style={{ ...mono, fontSize: 9.5, padding: "7px 13px", borderRadius: 5, border: "1px solid rgba(244,239,229,0.18)", color: "rgba(244,239,229,0.5)" }}>Edit</span>
              <span style={{ ...mono, fontSize: 9.5, padding: "7px 13px", borderRadius: 5, background: CORAL, color: "#fff" }}>Approve</span>
            </div>
          </div>
        </MockupShell>
      ),
    },
    {
      num: "03",
      label: "Execute",
      h: "Put it in market,",
      hI: "deliberately.",
      paras: ["Every draft starts from your strategy, in your voice. You edit and approve, and MOXIEMO publishes to the channels you connect. MOXIE flags anything that needs a decision, so nothing waits in a tab."],
      bullets: ["Content from your strategy", "Social and email content in your voice", "Marketing planner and calendar", "Publishing to connected channels", "MOXIE approvals and reminders"],
      mock: (
        <MockupShell title="Marketing Planner">
          <div style={{ padding: "14px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...mono, fontSize: 11, textTransform: "uppercase", color: "rgba(244,239,229,0.65)" }}>NOVEMBER 2026</span>
            <span style={{ ...mono, fontSize: 10, padding: "4px 10px", borderRadius: 999, background: "rgba(239,111,83,0.15)", color: CORAL }}>Q2: Authority</span>
          </div>
          <div style={{ padding: "0 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 6 }}>
              {["M","T","W","T","F","S","S"].map((d,i) => (
                <span key={i} style={{ ...mono, fontSize: 7.5, color: "rgba(244,239,229,0.25)", textAlign: "center" }}>{d}</span>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
              {Array.from({ length: 21 }).map((_, i) => {
                const weekend = i % 7 === 5 || i % 7 === 6;
                const scheduled = [0, 2, 4, 7, 9, 11, 14, 16].includes(i);
                return (
                  <span key={i} style={{
                    height: 21, borderRadius: 3,
                    background: scheduled ? "rgba(239,111,83,0.2)" : weekend ? "rgba(244,239,229,0.02)" : "rgba(244,239,229,0.04)",
                    border: scheduled ? "1px solid rgba(239,111,83,0.4)" : "none",
                  }} />
                );
              })}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(244,239,229,0.07)", padding: "12px 16px 16px", marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
            {[
              { n: "LinkedIn", live: true, l: "LIVE" },
              { n: "Facebook", live: false, l: "COMING" },
              { n: "Instagram", live: false, l: "COMING" },
            ].map((row) => (
              <div key={row.n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(244,239,229,0.7)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: row.live ? CORAL : "rgba(244,239,229,0.18)" }} />
                  {row.n}
                </span>
                <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", color: row.live ? CORAL : "rgba(244,239,229,0.25)" }}>{row.l}</span>
              </div>
            ))}
          </div>
        </MockupShell>
      ),
    },
    {
      num: "04",
      label: "Measure and adapt",
      h: "See what moved.",
      hI: "Then do more of it.",
      paras: ["Results come from your connected data and tie back to your goal, your pillars and your campaigns. MOXIEMO recommends what to keep, what to drop and where to push next."],
      bullets: ["Results tied to your strategy", "Weekly progress summaries", "Recommendations for the next round"],
      mock: (
        <MockupShell title="Publishing Insights">
          <div style={{ padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 13 }}>
              {[
                { l: "Posts", v: "47" },
                { l: "Reach", v: "3.2K" },
              ].map((s) => (
                <div key={s.l} style={{ background: "rgba(244,239,229,0.05)", border: "1px solid rgba(244,239,229,0.08)", borderRadius: 10, padding: 13 }}>
                  <div style={{ ...mono, fontSize: 8.5, textTransform: "uppercase", color: "rgba(244,239,229,0.28)" }}>{s.l}</div>
                  <div style={{ ...display, fontSize: 32, fontWeight: 600, color: "rgba(244,239,229,0.86)" }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 48 }}>
              {[30,44,34,56,70,82,76,100].map((h, i) => {
                const bg = i < 4 ? "rgba(244,239,229,0.18)" : i < 7 ? "rgba(239,111,83,0.6)" : CORAL;
                return <span key={i} style={{ flex: 1, height: `${h}%`, background: bg, borderRadius: "3px 3px 0 0" }} />;
              })}
            </div>

          </div>
        </MockupShell>
      ),
    },
  ];

  const features = [
  {
    "phase": "DISCOVER AND DIAGNOSE",
    "items": [
      "Guided discovery",
      "Brand and channel diagnosis",
      "Goals and success measure",
      "Strategy foundation document"
    ],
    "muted": []
  },
  {
    "phase": "DEFINE AND PRIORITIZE",
    "items": [
      "Positioning and messaging",
      "Audience priorities",
      "Content pillars and brand voice",
      "Roadmap and next best actions"
    ],
    "muted": []
  },
  {
    "phase": "EXECUTE",
    "items": [
      "Content in your voice",
      "Social and email content",
      "Marketing planner and calendar",
      "Publishing to connected channels"
    ],
    "muted": []
  },
  {
    "phase": "MEASURE AND FOLLOW THROUGH",
    "items": [
      "Results tied to your goals",
      "Weekly progress summaries",
      "MOXIE check-ins (texting coming soon)",
      "Recommendations for the next round"
    ],
    "muted": []
  }
];

  return (
    <div className="sol-page" style={body}>
      <style>{PAGE_CSS}</style>
      <div className="sol-grain" />
      <SiteHeader />

      {/* §1 Hero */}
      <section style={{ background: SAGE }}>
        <div className="mx-auto sol-hero-grid" style={{ maxWidth: 1200, padding: "100px 40px 96px", display: "grid", gridTemplateColumns: "1.12fr 0.88fr", gap: 72, alignItems: "center" }}>
          <div>
            <div className="reveal" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(19,19,15,0.07)", borderRadius: 999, padding: "9px 16px", marginBottom: 32 }}>
              <span style={{ width: 7, height: 7, background: CORAL }} />
              <span style={{ ...mono, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.2em", color: "#5f6a52" }}>For Founders and Growing Businesses</span>
            </div>
            <h1 className="reveal d1" style={{ ...display, margin: 0, lineHeight: 1.0, letterSpacing: "-0.025em" }}>
              <span style={{ display: "block", fontWeight: 600, fontSize: "clamp(42px, 5.4vw, 76px)", color: INK }}>Know what moves your brand forward.</span>
              <span style={{ display: "block", fontWeight: 340, fontStyle: "italic", fontSize: "clamp(42px, 5.4vw, 76px)", color: "#6d7a5e" }}>Then make it happen.</span>
            </h1>
            <p className="reveal d2" style={{ fontSize: 18, color: SAGE_BODY, maxWidth: 520, marginTop: 28, marginBottom: 40, lineHeight: 1.55 }}>
              MOXIEMO diagnoses where your brand stands, builds the plan and creates the work. MOXIE, your growth companion, keeps it moving between logins.
            </p>
            <div className="reveal d3" style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              <Link to="/brand-audit" className="sol-cta-primary">Get my free growth assessment →</Link>
              <Link to="/founding" onClick={trackCtaClick} className="sol-cta-secondary whitespace-nowrap">{getCtaLabel()}</Link>
            </div>
          </div>

          <div className="reveal-r" style={{ background: INK, borderRadius: 22, padding: "32px 28px", border: "1px solid rgba(244,239,229,0.08)", boxShadow: "0 40px 80px -40px rgba(19,19,15,0.55)" }}>
            <div style={{ ...mono, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(244,239,229,0.35)", marginBottom: 28 }}>
              THE LOOP
            </div>
            <div className="sol-loop-grid">
            {[{"n": "01", "l": "DISCOVER", "d": "Your goals, audience, offer and proof."}, {"n": "02", "l": "DIAGNOSE", "d": "Where your brand stands today."}, {"n": "03", "l": "DEFINE", "d": "Positioning, messaging and pillars."}, {"n": "04", "l": "PRIORITIZE", "d": "Your next best actions, in order."}, {"n": "05", "l": "EXECUTE", "d": "Content and campaigns you approve."}, {"n": "06", "l": "MEASURE", "d": "What moved, and what is next."}].map((row, i, arr) => {
              const active = i === 0;
              return (
                <div key={row.n} style={{ display: "flex", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: active ? CORAL : "transparent",
                      border: active ? "none" : "1.5px solid rgba(244,239,229,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      ...mono, fontSize: 11,
                      color: active ? "#fff" : "rgba(244,239,229,0.4)",
                    }}>{row.n}</span>

                  </div>
                  <div style={{ paddingBottom: i < arr.length - 1 ? 18 : 0 }}>
                    <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", color: active ? CORAL : "rgba(244,239,229,0.38)", marginBottom: 6 }}>{row.l}</div>
                    <div style={{ fontSize: 13.5, color: active ? "rgba(244,239,229,0.65)" : "rgba(244,239,229,0.38)", lineHeight: 1.55 }}>{row.d}</div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </section>

      {/* §2 The Problem */}
      <section style={{ background: CREAM }}>
        <div className="mx-auto" style={{ maxWidth: 1200, padding: "100px 40px 0" }}>
          <div className="reveal" style={{ marginBottom: 48 }}>
            <Eyebrow num="01" name="The Problem" />
          </div>
          <div className="reveal" style={{ paddingBottom: 72, borderBottom: "1px solid rgba(19,19,15,0.08)" }}>
            <h2 style={{ ...display, fontWeight: 600, fontSize: "clamp(52px, 7.6vw, 108px)", lineHeight: 0.94, letterSpacing: "-0.03em", color: INK, margin: 0, marginBottom: 6 }}>A good-looking brand is a start.</h2>
            <p style={{ ...display, fontWeight: 340, fontStyle: "italic", fontSize: "clamp(42px, 6.2vw, 90px)", lineHeight: 0.96, letterSpacing: "-0.03em", color: "#6d7a5e", margin: 0 }}>Growth needs a plan behind it.</p>
          </div>
          <div className="sol-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, padding: "72px 0 100px", alignItems: "start" }}>
            <div className="reveal-l" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <p style={{ fontSize: 18, color: SAGE_BODY, lineHeight: 1.6, margin: 0 }}>Most founders have done some brand work. A logo, colors, a website that looks good, maybe a brand guide in a folder somewhere.</p>
              <p style={{ fontSize: 18, color: SAGE_BODY, lineHeight: 1.6, margin: 0 }}>A brand tells people who you are. Growth takes answers to harder questions. Who exactly do you serve, and what keeps them up at night? Where are they? What do they need to hear from you? And with limited time, what should you do first?</p>
            </div>
            <div className="reveal-r">
              <p style={{ fontSize: 18, color: SAGE_BODY, lineHeight: 1.6, marginBottom: 32 }}>
                Content without those answers disappears into the noise. MOXIEMO answers them first, then builds everything else on top.
              </p>
              <div style={{ background: SAGE, borderRadius: 14, padding: "22px 24px", display: "flex", gap: 14 }}>
                <span style={{ width: 8, height: 8, background: CORAL, flexShrink: 0, marginTop: 10 }} />
                <p style={{ ...display, fontStyle: "italic", fontSize: 20, color: "#2e3a28", margin: 0, lineHeight: 1.4 }}>
                  That is the problem MOXIEMO was built to solve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* §3 Four Moves */}
      <section style={{ background: CREAM, borderTop: "1px solid rgba(19,19,15,0.06)" }}>
        <div className="mx-auto" style={{ maxWidth: 1200, padding: "100px 40px 60px" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 96 }}>
            <div style={{ display: "inline-flex" }}><Eyebrow num="02" name="How It Works" /></div>
            <h2 style={{ ...display, fontWeight: 600, fontSize: "clamp(36px,5vw,68px)", letterSpacing: "-0.025em", color: INK, margin: 0, lineHeight: 1.05 }}>
              Four moves. <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>In order.</span>
            </h2>
            <p style={{ fontSize: 18, color: MUTED, maxWidth: 460, margin: "20px auto 0" }}>Each move depends on the one before it. That is the point.</p>
          </div>

          {moves.map((m, i) => {
            const reverse = i % 2 === 1;
            const copy = (
              <div className={reverse ? "reveal-r" : "reveal-l"}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 14 }}>
                  <span style={{ ...display, fontWeight: 600, fontSize: 72, color: "rgba(19,19,15,0.055)", lineHeight: 1 }}>{m.num}</span>
                  <span style={{ ...mono, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.18em", color: CORAL }}>Move {m.num} · {m.label}</span>
                </div>
                <h3 style={{ ...display, fontWeight: 600, fontSize: "clamp(26px,3vw,42px)", color: INK, margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                  {m.h} <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>{m.hI}</span>
                </h3>
                {m.paras.map((para, j) => (
                  <p key={j} style={{ fontSize: 17, color: MUTED, lineHeight: 1.6, marginTop: 18, marginBottom: 0 }}>{para}</p>
                ))}
                <div style={{ borderTop: "1px solid rgba(19,19,15,0.09)", marginTop: 30, paddingTop: 20 }}>
                  <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", color: LIGHT_MUTED, letterSpacing: "0.18em", marginBottom: 16 }}>What you get</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    {m.bullets.map((b) => (
                      <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15.5, color: "#3a382f" }}>
                        <span style={{ width: 6, height: 6, background: CORAL, marginTop: 8, flexShrink: 0 }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
            return (
              <div key={m.num} className="sol-grid-2" style={{
                display: "grid",
                gridTemplateColumns: reverse ? "0.95fr 1.05fr" : "1.05fr 0.95fr",
                gap: 80,
                alignItems: "center",
                padding: "72px 0",
                borderTop: "1px solid rgba(19,19,15,0.07)",
              }}>
                {reverse ? (<>{m.mock}{copy}</>) : (<>{copy}{m.mock}</>)}
              </div>
            );
          })}
        </div>
      </section>

      {/* §4 Problems Accordion */}
      <section style={{ background: CREAM, borderTop: "1px solid rgba(19,19,15,0.07)" }}>
        <div className="mx-auto" style={{ maxWidth: 1200, padding: "100px 40px" }}>
          <div className="reveal" style={{ marginBottom: 56 }}>
            <Eyebrow num="03" name="The Problems" />
            <h2 style={{ ...display, fontWeight: 600, fontSize: "clamp(30px,4vw,54px)", color: INK, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.08 }}>
              The problems MOXIEMO <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>solves.</span>
            </h2>
            <p style={{ fontSize: 17, color: MUTED, maxWidth: 560, marginTop: 18 }}>Six of them. You will probably recognize at least three.</p>
          </div>
          <div>
            {problems.map((pr, i) => {
              const open = openProb === i;
              return (
                <div key={pr.t} className="prob-row reveal" onClick={() => setOpenProb(open ? null : i)} style={i === problems.length - 1 ? { borderBottom: "1px solid rgba(19,19,15,0.09)" } : undefined}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
                      <span style={{ ...mono, fontSize: 13, color: CORAL }}>0{i + 1}</span>
                      <h3 className="prob-hd" style={{ ...display, fontWeight: 600, fontSize: "clamp(19px,2.3vw,27px)", color: INK, margin: 0, letterSpacing: "-0.015em", transition: "color .2s" }}>{pr.t}</h3>
                    </div>
                    <span className={"prob-icon" + (open ? " open" : "")}>+</span>
                  </div>
                  {open && (
                    <div style={{ marginTop: 22 }}>
                      <p style={{ fontSize: 16, color: MUTED, maxWidth: 680, lineHeight: 1.6, margin: 0 }}>{pr.p}</p>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* §5 Who This Is For */}
      <section style={{ background: SAGE }}>
        <div className="mx-auto" style={{ maxWidth: 1200, padding: "100px 40px" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 50 }}>
            <div style={{ display: "inline-flex" }}><Eyebrow num="04" name="Who This Is For" color="#5f6a52" /></div>
            <h2 style={{ ...display, fontWeight: 600, fontSize: "clamp(28px,3.8vw,52px)", color: INK, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.08 }}>
              Built for the stage <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>you are in.</span>
            </h2>
            <p style={{ fontSize: 17, color: SAGE_BODY, maxWidth: 560, margin: "20px auto 0" }}>
              One brand or several, every plan starts with your strategy.
            </p>
          </div>
          <div className="reveal" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48, justifyContent: "center" }}>
            {personas.map((pp, i) => (
              <button key={pp.chip} className={"persona-chip" + (persona === i ? " active" : "")} onClick={() => setPersona(i)}>{pp.chip}</button>
            ))}
          </div>
          <div className="sol-grid-2" key={persona} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <div className="reveal-l">
              <h3 style={{ ...display, fontWeight: 600, fontSize: "clamp(22px,2.6vw,36px)", color: INK, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{p.h}</h3>
              <p style={{ fontSize: 17, color: SAGE_BODY, lineHeight: 1.6, marginTop: 18 }}>{p.p}</p>
              <div style={{ borderTop: "1px solid rgba(19,19,15,0.12)", marginTop: 26, paddingTop: 18 }}>
                <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", color: "#5f6a52", letterSpacing: "0.18em", marginBottom: 14 }}>What changes</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {p.bullets.map((b) => (
                    <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15.5, color: "#2e3a28" }}>
                      <span style={{ width: 6, height: 6, background: CORAL, marginTop: 8, flexShrink: 0 }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link to="/pricing" className="sol-cta-secondary whitespace-nowrap" style={{ marginTop: 26 }}>{p.link}</Link>
            </div>
            <div className="reveal-r">
              <img src={p.img} alt={p.chip} style={{ width: "100%", height: 400, objectFit: "cover", objectPosition: "center 20%", display: "block", borderRadius: 20, boxShadow: "0 24px 60px -28px rgba(19,19,15,0.32)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* §6 What Is Included */}
      <section style={{ background: CREAM, borderTop: "1px solid rgba(19,19,15,0.07)" }}>
        <div className="mx-auto" style={{ maxWidth: 1200, padding: "100px 40px" }}>
          <div className="reveal" style={{ marginBottom: 56 }}>
            <Eyebrow num="05" name="What Is Included" />
            <h2 style={{ ...display, fontWeight: 600, fontSize: "clamp(30px,4vw,54px)", color: INK, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.08 }}>
              Everything in one place.
            </h2>
            <p style={{ fontSize: 17, color: MUTED, marginTop: 18 }}>Every plan includes the full strategy foundation. Publishing integrations roll out in stages, and the changelog shows what is live.</p>
          </div>

          <div className="reveal sol-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2, background: "rgba(19,19,15,0.08)", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
            {features.map((f) => (
              <div key={f.phase} style={{ background: OFFWHITE, padding: "28px 24px" }}>
                <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", color: CORAL, marginBottom: 5, letterSpacing: "0.16em" }}>{f.phase}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {f.items.map((it, idx) => {
                    const muted = f.muted.includes(idx);
                    return (
                      <li key={it} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: muted ? LIGHT_MUTED : "#3a382f" }}>
                        <span style={{ width: 5, height: 5, background: muted ? "rgba(19,19,15,0.2)" : CORAL, marginTop: 7, flexShrink: 0 }} />
                        <span>{it}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="reveal sol-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
            <div style={{ background: SAGE, borderRadius: 18, padding: "32px 30px" }}>
              <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", color: "#5f6a52", letterSpacing: "0.16em", marginBottom: 8 }}>Community · Live</div>
              <h4 style={{ ...display, fontWeight: 600, fontSize: 20, color: INK, margin: 0, marginBottom: 14 }}>Founding member Discord</h4>
              {["Prompt tools and writing resources","Direct access to Karee and the team"].map((x) => (
                <div key={x} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 8, fontSize: 13.5, color: SAGE_BODY }}>
                  <span style={{ width: 6, height: 6, background: CORAL, marginTop: 7, flexShrink: 0 }} />
                  <span>{x}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* §8 FAQ */}
      <section style={{ background: CREAM }}>
        <div className="mx-auto" style={{ maxWidth: 900, padding: "100px 40px" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: 72 }}>
            <div style={{ display: "inline-flex" }}><Eyebrow num="06" name="FAQ" /></div>
            <h2 style={{ ...display, fontWeight: 600, fontSize: "clamp(30px,4vw,50px)", color: INK, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.08 }}>
              Straight answers <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>before you start.</span>
            </h2>
          </div>
          {faqGroups.map((g, gi) => (
            <div key={g.label} style={{ marginBottom: 40 }}>
              <div className="reveal" style={{ ...mono, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.18em", color: LIGHT_MUTED, paddingBottom: 18, borderBottom: "1.5px solid " + INK, marginBottom: 4 }}>
                {g.label}
              </div>
              {g.items.map((it, ii) => {
                const key = `${gi}-${ii}`;
                const isOpen = openFaq === key;
                return (
                  <div key={key} className="faq-item" onClick={() => setOpenFaq(isOpen ? null : key)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                      <h4 style={{ ...display, fontWeight: 500, fontSize: 18, color: INK, margin: 0, lineHeight: 1.4, flex: 1 }}>{it.q}</h4>
                      <span className={"prob-icon" + (isOpen ? " open" : "")}>+</span>
                    </div>
                    {isOpen && (
                      <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.7, margin: 0, marginTop: 18, paddingRight: 40 }}>{it.withMoxie && <MoxieAvatar pose="icon" size={40} decorative className="faq-moxie" />}{it.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="reveal" style={{ background: SAGE, borderRadius: 14, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginTop: 48 }}>
            <div>
              <p style={{ ...display, fontStyle: "italic", fontSize: 18, color: "#2e3a28", margin: 0 }}>Still have questions? We answer personally.</p>
              <p style={{ ...mono, fontSize: 11, color: "#5f6a52", margin: 0, marginTop: 4 }}>hello@buildwithmoxiemo.com</p>
            </div>
            <a href="mailto:hello@buildwithmoxiemo.com" style={{ background: INK, color: "#f7f3ea", fontWeight: 600, fontSize: 14, padding: "13px 22px", borderRadius: 999, textDecoration: "none" }}>Email us →</a>
          </div>
        </div>
      </section>

      {/* §9 Final CTA */}
      <section style={{ background: SAGE, borderTop: "1px solid rgba(19,19,15,0.07)" }}>
        <div className="mx-auto" style={{ maxWidth: 900, padding: "100px 40px", textAlign: "center" }}>
          <div className="reveal" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, background: CORAL }} />
            <span style={{ ...mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#5f6a52" }}>Get Started Today</span>
          </div>
          <h2 className="reveal" style={{ ...display, fontWeight: 600, fontSize: "clamp(32px,5vw,68px)", color: INK, margin: 0, lineHeight: 1.0, letterSpacing: "-0.025em" }}>
            Find out <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>what comes first.</span>
          </h2>
          <p className="reveal" style={{ fontSize: 18, color: SAGE_BODY, maxWidth: 520, margin: "28px auto 40px", lineHeight: 1.6 }}>
            Start with the free growth assessment. Then let MOXIEMO build the plan.
          </p>
          <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            <Link to="/brand-audit" style={{ background: CORAL, color: "#fff", fontWeight: 700, fontSize: 16, padding: "17px 30px", borderRadius: 999, textDecoration: "none" }}>Get my free growth assessment →</Link>
            <Link to="/founding" onClick={trackCtaClick} style={{ whiteSpace: "nowrap", background: INK, color: "#f7f3ea", fontWeight: 600, fontSize: 16, padding: "17px 30px", borderRadius: 999, textDecoration: "none" }}>{getCtaLabel()}</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
