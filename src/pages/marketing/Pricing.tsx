import { useState, type CSSProperties, type ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const CREAM = "#f4efe5";
const INK = "#13130f";
const CORAL = "#ef6f53";
const SAGE = "#dce3d2";
const PEACH = "#fdf0eb";

const serif: CSSProperties = { fontFamily: "'Newsreader', Georgia, serif" };
const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };

const Check = ({ color = CORAL }: { color?: string }) => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" style={{ flex: "none", marginTop: 2 }}>
    <path d="M3 8.5l3.5 3.5 7.5-8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckSm = ({ color = CORAL }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flex: "none", marginTop: 3 }}>
    <path d="M2.5 8l3.5 3.5 7.5-8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Arrow = ({ size = 16, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M8 3l5 5-5 5" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Eyebrow({ children, color = "#8a877a", squareColor = CORAL }: { children: ReactNode; color?: string; squareColor?: string }) {
  return (
    <div style={{ ...mono, display: "flex", alignItems: "center", gap: 10, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color, marginBottom: 24 }}>
      <span style={{ width: 7, height: 7, background: squareColor, display: "inline-block" }} />
      {children}
    </div>
  );
}

const faqsData = [
  { q: "What am I actually paying for with MOXIEMO?", a: "You are not paying for software that generates content. You are paying for a system that starts with your go-to-market foundation: your positioning, your ideal customer, your voice, your content pillars, and builds everything else on top of it. The content, the calendar, the campaigns, and the publishing are all downstream of that foundation. Most tools sell you the downstream piece and leave the foundation to you. MOXIEMO starts there." },
  { q: "What happens to my account when Beta 2.0 launches?", a: "Nothing happens without your choice. You can stay on private beta for free, indefinitely, though it will not receive new updates. Or you can take the direct offer to move into Beta 2.0 founding access, which locks in 50 percent off standard pricing for life. Private beta members get this offer before Beta 2.0 opens to anyone else." },
  { q: "Why does the price go up across Foundation, Growth, and Scale?", a: "The tiers are not about access to a better version of the same thing. They are about how much of the work MOXIEMO runs for you. Foundation gives you the foundation and the tools to execute manually. Growth adds automation to your distribution and deeper analytics. Scale runs full autonomy and supports a team. As your business gets more complex, more of the work moves from you to the system." },
  { q: "Do founding members keep their discount if standard pricing changes later?", a: "Yes. Once you lock in founding access, your 50 percent off rate stays locked to your account for as long as you remain a member, regardless of what standard pricing becomes." },
  { q: "Why is MOXIEMO cheaper than my current tool stack?", a: "MOXIEMO is one platform replacing four to six. No integrations to maintain, no middleware, no separate bill for each piece. Lower overhead is what makes the lower price possible, not a smaller feature set." },
  { q: "What happens to my strategy and data if I cancel or downgrade?", a: "You can export everything: your strategy, your content, and your analytics, at any time. Your data is always yours. If you downgrade, your strategy foundation stays intact. You simply lose access to the higher tier's automation and publishing reach until you upgrade again." },
  { q: "Is there a free trial?", a: "There is no traditional free trial, and that is by design. MOXIEMO is built around Discovery, the step where your strategy foundation gets built. Every other part of the platform runs on that foundation, so a generic, feature-limited trial would mean testing the system before its most important part even exists. Instead, Discovery itself is completely free, with no credit card and no time limit, and it produces something real: your full strategy foundation, yours to keep regardless of what you decide next. That is a stronger signal than a trial, because you are evaluating the actual foundation MOXIEMO builds for you, not a demo of the interface." },
];

const tabBase: CSSProperties = {
  fontFamily: "'Hanken Grotesk', sans-serif",
  fontSize: 14,
  padding: "9px 22px",
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  transition: "all .15s",
};
const activeTab: CSSProperties = { ...tabBase, fontWeight: 600, background: "#fff", color: INK, boxShadow: "0 1px 4px rgba(0,0,0,.1)" };
const inactiveTab: CSSProperties = { ...tabBase, fontWeight: 400, background: "transparent", color: "#6c6a60" };

export default function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const isAnnual = billing === "annual";
  const billingLabel = isAnnual ? "/year" : "/month";
  const foundationPrice = isAnnual ? "$990" : "$99";
  const growthPrice = isAnnual ? "$1,490" : "$149";
  const scalePrice = isAnnual ? "$2,490" : "$249";
  const foundationFounding = isAnnual ? "$495" : "$49.50";
  const growthFounding = isAnnual ? "$745" : "$74.50";
  const scaleFounding = isAnnual ? "$1,245" : "$124.50";

  return (
    <div style={{ background: CREAM, color: INK, fontFamily: "'Hanken Grotesk', sans-serif", WebkitFontSmoothing: "antialiased", overflowX: "hidden", position: "relative" }}>
      <SiteHeader />

      {/* GRAIN */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, opacity: 0.4, mixBlendMode: "multiply", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")", backgroundSize: 200 }} />

      <style>{`
        @keyframes mo-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes mo-blink { 0%,100%{opacity:1} 50%{opacity:.35} }
        .mo-coral-btn:hover { background:#fbd9cf !important; color:#13130f !important; }
        .mo-dark-btn:hover { background:#2a2722 !important; }
        .mo-outline-btn:hover { border-color:#13130f !important; }
        .mo-foundation-cta:hover { background:#64748b !important; color:#f4efe5 !important; border-color:#64748b !important; }
        .mo-scale-cta:hover { background:#64748b !important; color:#f4efe5 !important; border-color:#64748b !important; }
        @media (max-width: 900px) {
          .mo-tiers { grid-template-columns: 1fr !important; }
          .mo-stats { grid-template-columns: 1fr 1fr !important; }
          .mo-every-grid { grid-template-columns: 1fr !important; }
          .mo-next { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>

      {/* HERO */}
      <section style={{ background: CREAM, padding: "120px 40px 96px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-54%)", ...serif, fontSize: 480, fontWeight: 700, color: "rgba(239,111,83,0.045)", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>01</div>
        <div style={{ position: "relative", zIndex: 2, maxWidth: 820, margin: "0 auto" }}>
          <div style={{ ...mono, display: "inline-flex", alignItems: "center", gap: 9, fontSize: 11.5, letterSpacing: "0.22em", textTransform: "uppercase", color: "#8a877a", marginBottom: 36, background: "rgba(239,111,83,0.09)", border: "1px solid rgba(239,111,83,0.22)", padding: "8px 18px", borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, background: CORAL, borderRadius: "50%", display: "inline-block" }} />PRICING
          </div>
          <h1 style={{ ...serif, fontWeight: 600, fontSize: "clamp(54px,7.5vw,104px)", lineHeight: 0.95, letterSpacing: "-0.03em", margin: "0 0 34px", color: INK }}>
            Simple pricing.<br /><span style={{ fontWeight: 300, fontStyle: "italic", color: CORAL }}>A real go-to-market.</span>
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.65, color: "#56544c", maxWidth: 600, margin: "0 auto 48px" }}>Most founders are paying for four to six disconnected tools and still do not have a strategy underneath any of it. MOXIEMO replaces the stack with one platform built on a foundation, not a guess.</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 60 }}>
            <a href="/founding" className="mo-coral-btn" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: CORAL, color: "#fff", fontWeight: 700, fontSize: 16, padding: "16px 32px", borderRadius: 999, textDecoration: "none" }}>Join the Private Beta <Arrow /></a>
            <a href="#preview" className="mo-outline-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: INK, fontWeight: 500, fontSize: 15, padding: "15px 24px", border: "1.5px solid rgba(19,19,15,0.22)", borderRadius: 999, textDecoration: "none" }}>
              See Beta 2.0 pricing <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 9l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {["content scheduler", "social publisher", "email platform", "analytics tool", "strategy doc"].map((t) => (
              <span key={t} style={{ ...mono, fontSize: 11.5, letterSpacing: "0.08em", color: "#c4bfb5", textDecoration: "line-through", padding: "6px 13px", border: "1px solid #e8e3d8", borderRadius: 4 }}>{t}</span>
            ))}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flex: "none", opacity: 0.35 }}><path d="M3 8h10M8 3l5 5-5 5" stroke="#13130f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ ...mono, fontSize: 11.5, fontWeight: 500, letterSpacing: "0.1em", padding: "6px 15px", borderRadius: 4, background: CORAL, color: "#fff" }}>MOXIEMO</span>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ background: INK, overflow: "hidden", padding: "14px 0" }}>
        <div style={{ display: "inline-flex", whiteSpace: "nowrap", animation: "mo-scroll 32s linear infinite", ...mono, fontSize: 12.5, letterSpacing: "0.18em", textTransform: "uppercase", color: CREAM }}>
          {[0, 1].map((k) => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center" }}>
              {["Private beta now open", "No credit card required", "1:1 kickoff with our team", "Free for as long as beta runs", "Founding price locked for life", "Limited spots"].map((s, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                  <span style={{ padding: "0 28px" }}>{s}</span>
                  <span style={{ width: 6, height: 6, background: CORAL, display: "inline-block", flex: "none" }} />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* PRIVATE BETA BANNER */}
      <section id="beta" style={{ background: INK, padding: "100px 40px" }}>
        <div style={{ maxWidth: 740, margin: "0 auto", textAlign: "center" }}>
          <div style={{ ...mono, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: CORAL, marginBottom: 32, background: "rgba(239,111,83,0.12)", border: "1px solid rgba(239,111,83,0.25)", padding: "8px 18px", borderRadius: 999 }}>
            <span style={{ width: 5, height: 5, background: CORAL, borderRadius: "50%", display: "inline-block", animation: "mo-blink 2s ease infinite" }} />PRIVATE BETA &nbsp;·&nbsp; LIMITED SPOTS
          </div>
          <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(40px,5.5vw,72px)", lineHeight: 1.04, letterSpacing: "-0.025em", margin: "0 0 30px", color: CREAM }}>Join the private beta.<br /><span style={{ fontWeight: 300, fontStyle: "italic", color: "#6c6a60" }}>Free for as long as it runs.</span></h2>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "#8a877a", margin: "0 0 44px" }}>You are early. That is the whole offer. Private beta access is free, with a personal 1:1 kickoff call with our team, for as long as the private beta is open. When MOXIEMO moves to Beta 2.0, you get a direct offer to upgrade into founding access at 50 percent off for life. You can also choose to stay on the free version as is. Nothing is forced.</p>
          <a href="/founding" className="mo-coral-btn" style={{ display: "inline-flex", alignItems: "center", gap: 12, background: CORAL, color: "#fff", fontWeight: 700, fontSize: 17, padding: "18px 40px", borderRadius: 999, textDecoration: "none" }}>Join the Private Beta <Arrow size={18} /></a>
        </div>
      </section>

      {/* PRIVATE BETA CARD */}
      <section style={{ background: CREAM, padding: "80px 40px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 48px -12px rgba(19,19,15,0.16)", border: "1px solid rgba(19,19,15,0.07)" }}>
            <div style={{ background: CORAL, padding: "28px 36px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
              <div>
                <div style={{ ...mono, fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: 10 }}>Private Beta Founding Member</div>
                <div style={{ ...serif, fontSize: 26, fontWeight: 600, color: "#fff", lineHeight: 1.25, maxWidth: 340 }}>For early believers who joined before the world caught on.</div>
              </div>
              <div style={{ textAlign: "right", flex: "none" }}>
                <div style={{ ...serif, fontSize: 52, fontWeight: 700, color: "#fff", lineHeight: 1 }}>Free</div>
                <div style={{ ...mono, fontSize: 10.5, color: "rgba(255,255,255,0.65)", marginTop: 4, letterSpacing: "0.08em" }}>for as long as beta runs</div>
              </div>
            </div>
            <div style={{ padding: "32px 36px" }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#9a9789", marginBottom: 20 }}>Included</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 28 }}>
                {[
                  "AI strategic discovery (one brand strategy)",
                  "25 content generations per month",
                  "Marketing Planner access",
                  "Social publishing: LinkedIn personal profile, live now",
                ].map((t) => (
                  <div key={t} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}><Check /><span style={{ fontSize: 15, color: "#3a382f", lineHeight: 1.5 }}>{t}</span></div>
                ))}
                <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                  <Check />
                  <div style={{ fontSize: 15, color: "#3a382f", lineHeight: 1.5 }}>
                    Facebook, Instagram, and LinkedIn company pages
                    <span style={{ ...mono, display: "inline-block", fontSize: 9.5, letterSpacing: "0.1em", background: CREAM, color: "#8a877a", padding: "2px 8px", borderRadius: 4, marginLeft: 6, verticalAlign: "middle", position: "relative", top: -1 }}>IN REVIEW</span>
                  </div>
                </div>
                {[
                  "Email content generation (draft only, ESP sync arrives with Beta 2.0)",
                  "2 active campaigns",
                  "Standard support",
                ].map((t) => (
                  <div key={t} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}><Check /><span style={{ fontSize: 15, color: "#3a382f", lineHeight: 1.5 }}>{t}</span></div>
                ))}
              </div>
              <div style={{ background: "#fdf0ec", border: "1px solid rgba(239,111,83,0.18)", borderRadius: 10, padding: "16px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flex: "none" }}><circle cx="10" cy="10" r="8.5" stroke={CORAL} strokeWidth="1.5" /><path d="M10 6.5V11M10 13.5v.5" stroke={CORAL} strokeWidth="1.75" strokeLinecap="round" /></svg>
                <span style={{ fontSize: 14.5, color: "#6c3a2a", lineHeight: 1.45 }}>Includes a personal 1:1 kickoff call with our team</span>
              </div>
              <a href="/founding" className="mo-coral-btn" style={{ display: "block", textAlign: "center", background: CORAL, color: "#fff", fontWeight: 700, fontSize: 16, padding: "16px 24px", borderRadius: 10, textDecoration: "none", marginBottom: 14 }}>Join the Private Beta</a>
              <div style={{ ...mono, fontSize: 11, color: "#9a9789", textAlign: "center", letterSpacing: "0.05em", lineHeight: 1.55, marginBottom: 18 }}>Private beta access is by invitation only and is not guaranteed to remain open indefinitely.</div>
              <div style={{ borderTop: "1px solid rgba(19,19,15,0.08)", paddingTop: 16, textAlign: "center" }}>
                <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9a9789" }}>Replaces: </span>
                <span style={{ fontSize: 13, color: "#8a877a", fontStyle: "italic" }}>your scattered tool experiments.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BETA 2.0 TRANSITION */}
      <section style={{ background: SAGE, padding: "96px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ ...mono, display: "flex", alignItems: "center", gap: 10, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5f6a52", marginBottom: 36 }}>
            <span style={{ width: 7, height: 7, background: CORAL, display: "inline-block" }} />WHAT HAPPENS NEXT
          </div>
          <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(36px,4.5vw,60px)", lineHeight: 1.07, letterSpacing: "-0.025em", margin: "0 0 52px", color: INK, maxWidth: 700 }}>Here is exactly what changes,<br /><span style={{ fontWeight: 300, fontStyle: "italic", color: "#6d7a5e" }}>and what does not.</span></h2>
          <div className="mo-next" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 52, marginBottom: 40 }}>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: "#3a4a32", margin: 0 }}>Private beta stays free for as long as it runs, and if you want to stay on it after Beta 2.0 launches, you can. It simply will not receive new updates going forward. Everything new, including the autonomous tools, ships in Beta 2.0.</p>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: "#3a4a32", margin: 0 }}>Private beta members get a direct offer to move into Beta 2.0 founding access first, before it opens publicly. Founding access locks in 50 percent off standard pricing for life, on a limited number of seats. Once those seats fill, new sign-ups pay standard pricing, no discount.</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.55)", borderRadius: 12, padding: "22px 28px", display: "flex", alignItems: "center", gap: 16, border: "1px solid rgba(19,19,15,0.09)", maxWidth: 580 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flex: "none" }}><circle cx="11" cy="11" r="9.5" stroke="#5f6a52" strokeWidth="1.5" /><path d="M11 8v5M11 15.5v.5" stroke="#5f6a52" strokeWidth="1.75" strokeLinecap="round" /></svg>
            <span style={{ fontSize: 15, color: "#3a382f", fontStyle: "italic", lineHeight: 1.5 }}>Nothing happens automatically. You will always get the offer and the choice.</span>
          </div>
        </div>
      </section>

      {/* BETA 2.0 PRICING PREVIEW */}
      <section id="preview" style={{ background: CREAM, padding: "96px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ ...mono, display: "flex", alignItems: "center", gap: 10, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a877a", marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, background: CORAL, display: "inline-block" }} />BETA 2.0 PRICING &nbsp;·&nbsp; COMING SOON
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
            <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(30px,4vw,52px)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: 0, color: INK, maxWidth: 580 }}>Founding access locks in 50% off,<br /><span style={{ fontWeight: 300, fontStyle: "italic", color: "#8a877a" }}>for life, on a limited number of seats.</span></h2>
            <div style={{ display: "inline-flex", background: "#e8e3d8", borderRadius: 999, padding: 4, gap: 2, flex: "none" }}>
              <button onClick={() => setBilling("monthly")} style={billing === "monthly" ? activeTab : inactiveTab}>Monthly</button>
              <button onClick={() => setBilling("annual")} style={billing === "annual" ? activeTab : inactiveTab}>Annual &nbsp;<span style={{ color: "#5f6a52", fontSize: 11, ...mono, letterSpacing: "0.06em" }}>SAVE 17%</span></button>
            </div>
          </div>
          <p style={{ ...mono, fontSize: 12, letterSpacing: "0.06em", color: "#9a9789", margin: "0 0 52px" }}>Not active today. Shown so private beta members know what they are locking in by joining now.</p>

          <div className="mo-tiers" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, alignItems: "start" }}>
            {/* FOUNDATION */}
            <Tier
              dark={false}
              icon={
                <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
                  <rect x="4" y="33" width="40" height="11" rx="3.5" fill="#FDE0D8" stroke={INK} strokeWidth="1.75" />
                  <rect x="10" y="20" width="28" height="11" rx="3.5" fill="#F0B8A8" stroke={INK} strokeWidth="1.75" />
                  <rect x="16" y="7" width="16" height="11" rx="3.5" fill={CORAL} stroke={INK} strokeWidth="1.75" opacity="0.85" />
                </svg>
              }
              name="Foundation"
              desc="For founders ready to build a real go-to-market and stop winging it."
              price={foundationPrice}
              founding={foundationFounding}
              billingLabel={billingLabel}
              ctaLabel="Join the Beta 2.0 Waitlist"
              ctaVariant="outline"
              ctaHref="/beta20-founding?tier=foundation"
              features={[
                "Complete AI strategic discovery",
                "Marketing foundation: positioning, ICP, voice, content pillars",
                "Marketing Planner access",
                "100 content generations per month",
                "Social publishing: LinkedIn, Facebook, Instagram",
                "Email content generation with ESP sync",
                "Up to 5 active campaigns",
                "Basic analytics dashboard",
                "Standard support, 24-hour response",
              ]}
              replaces="a content scheduler, a social publisher, and a content planning tool."
            />
            {/* GROWTH */}
            <Tier
              dark
              popular
              icon={
                <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
                  <path d="M24 43V22" stroke="#A8CBA8" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M24 33C24 22 10 17 10 17C10 28 17 34 24 33Z" fill="#A8CBA8" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M24 25C24 14 38 9 38 9C38 20 31 26 24 25Z" fill="#A8CBA8" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinejoin="round" />
                  <ellipse cx="24" cy="15" rx="5.5" ry="7" fill="#A8CBA8" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
                  <path d="M15 43h18" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
              name="Growth"
              desc="For established founders scaling their expertise."
              price={growthPrice}
              founding={growthFounding}
              billingLabel={billingLabel}
              ctaLabel="Join the Beta 2.0 Waitlist"
              ctaVariant="coral"
              ctaHref="/beta20-founding?tier=growth"
              features={[
                "Everything in Foundation",
                "Unlimited content generation",
                "Expanded publishing: LinkedIn, Facebook, Instagram, Pinterest, and Threads",
                "Campaign builder: launches, sequences, evergreen",
                "One automated distribution sequence",
                "Full ESP sync",
                "Advanced analytics: attribution and ROI",
                "Lead magnet creation",
                "Priority support, 12-hour response",
                "Quarterly strategy refinement calls",
              ]}
              replaces="a content scheduler, an email platform, and a course platform's marketing tools."
            />
            {/* SCALE */}
            <Tier
              dark={false}
              comingSoon
              icon={
                <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="13" r="5.5" fill="#E8C87A" stroke={INK} strokeWidth="1.5" opacity="0.65" />
                  <circle cx="11" cy="31" r="4" fill="#E8C87A" stroke={INK} strokeWidth="1.5" opacity="0.5" />
                  <circle cx="37" cy="29" r="4.5" fill="#E8C87A" stroke={INK} strokeWidth="1.5" opacity="0.5" />
                  <circle cx="24" cy="41" r="3" fill="#E8C87A" stroke={INK} strokeWidth="1.5" opacity="0.4" />
                  <path d="M24 18L11 31M24 18L37 29M11 35L24 41M37 33L24 41" stroke={INK} strokeWidth="1" strokeLinecap="round" opacity="0.12" />
                </svg>
              }
              name="Scale"
              desc="For agencies and multi-brand operators running at full capacity."
              price={scalePrice}
              founding={scaleFounding}
              billingLabel={billingLabel}
              ctaLabel="Notify Me When Available"
              ctaVariant="disabled"
              ctaHref="/beta20-founding?tier=scale"
              checkColor="#b8b4aa"
              features={[
                "Everything in Growth",
                "Full publishing suite: LinkedIn, Facebook, Instagram, Pinterest, Threads, TikTok, YouTube, Google Business",
                "Full autonomous distribution",
                "Team collaboration, up to 5 users",
                "Multiple brand workspaces",
                "Custom integrations",
                "Dedicated account manager",
                "White-glove onboarding and migration",
                "Monthly strategy check-in calls",
                "Priority feature requests",
              ]}
              replaces="a full martech stack and the team hours spent running it."
            />
          </div>
        </div>
      </section>

      {/* THE NUMBERS */}
      <section style={{ background: PEACH, padding: "96px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Eyebrow>THE NUMBERS</Eyebrow>
          <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(36px,4.5vw,60px)", lineHeight: 1.08, letterSpacing: "-0.025em", margin: "0 0 14px", color: INK }}>What MOXIEMO is built to give back.</h2>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: "#56544c", margin: "0 0 60px", maxWidth: 680 }}>Every founder who runs MOXIEMO Discovery gets a complete marketing strategy in minutes. Here is what MOXIEMO is designed to save you, in time and in tools.</p>
          <div className="mo-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderRadius: 4, overflow: "hidden", gap: 1, background: "rgba(19,19,15,0.09)" }}>
            {[
              { num: "18+", lbl: "HRS BACK PER WEEK", icon: (
                <svg width="54" height="54" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="18" fill="#FDE0D8" stroke={INK} strokeWidth="1.75" /><path d="M24 13v11l7.5 5" stroke={CORAL} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" /><circle cx="24" cy="24" r="2.5" fill={CORAL} /></svg>
              )},
              { num: "4–6", lbl: "TOOLS ELIMINATED", icon: (
                <svg width="54" height="54" viewBox="0 0 48 48" fill="none"><rect x="3" y="3" width="19" height="19" rx="4.5" fill="#F0B8A8" stroke={INK} strokeWidth="1.5" /><rect x="26" y="3" width="19" height="19" rx="4.5" fill="#E8C87A" stroke={INK} strokeWidth="1.5" /><rect x="3" y="26" width="19" height="19" rx="4.5" fill="#A8CBA8" stroke={INK} strokeWidth="1.5" /><rect x="26" y="26" width="19" height="19" rx="4.5" fill="#E4DFD8" stroke={INK} strokeWidth="1.5" /></svg>
              )},
              { num: "20", lbl: "MIN TO FULL STRATEGY", icon: (
                <svg width="54" height="54" viewBox="0 0 48 48" fill="none"><path d="M29 3L12 28h14L21 45 40 20H26L29 3z" fill="#E8C87A" stroke={INK} strokeWidth="1.75" strokeLinejoin="round" /></svg>
              )},
              { num: "$93K", lbl: "SAVED ANNUALLY", icon: (
                <svg width="54" height="54" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="18" fill="#A8CBA8" stroke={INK} strokeWidth="1.75" /><path d="M19.5 17.5c0-2.8 2.1-5 4.5-5s4.5 2.2 4.5 5c0 5.5-9 5.5-9 11 0 3.2 2.1 5.5 4.5 5.5s4.5-2.3 4.5-5.5" stroke="#fff" strokeWidth="2.25" strokeLinecap="round" /></svg>
              )},
            ].map((s) => (
              <div key={s.lbl} style={{ background: PEACH, padding: "44px 36px 42px" }}>
                <div style={{ marginBottom: 22 }}>{s.icon}</div>
                <div style={{ ...serif, fontSize: "clamp(48px,5.5vw,80px)", fontWeight: 700, color: CORAL, lineHeight: 1, marginBottom: 10 }}>{s.num}</div>
                <div style={{ ...mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a877a" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "#9a9789", margin: "20px 0 0", fontStyle: "italic", maxWidth: 700, lineHeight: 1.6 }}>Based on the platform's designed workflow. Your results will reflect your business, your volume, and your starting point. Real numbers from private beta members will replace these as data comes in.</p>
        </div>
      </section>

      {/* EVERY PLAN INCLUDES */}
      <section style={{ background: CREAM, padding: "96px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 72, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 380, flex: "none" }}>
              <Eyebrow>EVERY PLAN</Eyebrow>
              <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(34px,4vw,52px)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 16px", color: INK }}>Every plan includes the essentials.</h2>
              <p style={{ fontSize: 17, color: "#6c6a60", margin: "0 0 32px", fontStyle: "italic", lineHeight: 1.6 }}>Strategy, creation, and support,<br />never paywalled.</p>
              <div style={{ width: 40, height: 3, background: CORAL, borderRadius: 2 }} />
            </div>
            <div style={{ flex: 1, minWidth: 300 }}>
              <div className="mo-every-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 40px" }}>
                {[
                  "20-minute AI strategic discovery",
                  "Marketing Planner and content calendar access",
                  "Marketing foundation: positioning, ICP, voice, and content pillars",
                  "Email content generation, in your voice",
                  "Content generation across every platform we support, from day one",
                  "Data export anytime",
                  "Unlimited strategy updates",
                  "Direct team support and the private beta Discord community",
                ].map((t) => (
                  <div key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "18px 0", borderTop: "1px solid rgba(19,19,15,0.08)" }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flex: "none", marginTop: 2 }}><path d="M3 9l4 4 8-9" stroke={CORAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span style={{ fontSize: 15, color: "#3a382f", lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section style={{ background: SAGE, padding: "80px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 60, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 520 }}>
            <Eyebrow color="#5f6a52" squareColor="#5f6a52">SECURITY AND COMPLIANCE</Eyebrow>
            <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(28px,3.5vw,44px)", lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 0 18px", color: INK }}>Built on secure infrastructure.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.72, color: "#3a4a32", margin: "0 0 24px" }}>Your data is hosted on enterprise-grade cloud infrastructure. Formal security certifications are on our roadmap as MOXIEMO grows beyond private beta.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 380, flex: 1, minWidth: 280 }}>
            {[
              "Enterprise-grade cloud infrastructure",
              "Your data is always yours to export",
              "Formal certifications on the roadmap",
            ].map((t) => (
              <div key={t} style={{ background: "rgba(255,255,255,0.55)", borderRadius: 12, padding: "18px 22px", border: "1px solid rgba(19,19,15,0.08)", display: "flex", alignItems: "center", gap: 14 }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flex: "none" }}><path d="M11 2L3 6v7c0 5.5 3.5 10 8 11 4.5-1 8-5.5 8-11V6L11 2z" stroke="#5f6a52" strokeWidth="1.5" strokeLinejoin="round" fill="none" /></svg>
                <span style={{ fontSize: 14, color: "#3a4a32", lineHeight: 1.45 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GUARANTEE */}
      <section style={{ background: INK, padding: "100px 40px" }}>
        <div style={{ maxWidth: 740, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, border: "1.5px solid rgba(239,111,83,0.3)", borderRadius: "50%", marginBottom: 28 }}>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none"><path d="M15 3L4 8.5v8c0 7 5 12.5 11 14 6-1.5 11-7 11-14v-8L15 3z" stroke={CORAL} strokeWidth="1.5" strokeLinejoin="round" fill="none" /><path d="M10 15.5l3.5 3.5 7.5-8" stroke={CORAL} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6c6a60", marginBottom: 24 }}>30-DAY GUARANTEE · PAID PLANS ONLY</div>
          <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(38px,5vw,66px)", lineHeight: 1.07, letterSpacing: "-0.025em", margin: "0 0 28px", color: CREAM }}>A guarantee,<br /><span style={{ fontWeight: 300, fontStyle: "italic", color: CORAL }}>not a sales tactic.</span></h2>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "#8a877a", margin: "0 0 20px" }}>Once you are on a paid Beta 2.0 plan, try it for 30 days. Complete Discovery. Generate content. Publish it. If it does not save you real hours and give you a strategy that sounds like you, request a full refund. No hoops.</p>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: "#6c6a60", fontStyle: "italic", margin: 0 }}>Most founders who complete Discovery do not look back. Your strategy is yours to keep, regardless.</p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: CREAM, padding: "96px 40px" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          <Eyebrow>PRICING QUESTIONS, ANSWERED</Eyebrow>
          <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(36px,4.5vw,60px)", lineHeight: 1.08, letterSpacing: "-0.025em", margin: "0 0 56px", color: INK }}>Frequently asked<br /><span style={{ fontWeight: 300, fontStyle: "italic", color: "#8a877a" }}>pricing questions.</span></h2>
          <div style={{ borderTop: "1px solid rgba(19,19,15,0.12)" }}>
            {faqsData.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i} onClick={() => setOpenFaq(open ? null : i)} style={{ borderBottom: "1px solid rgba(19,19,15,0.1)", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "26px 0", gap: 24 }}>
                    <span style={{ ...serif, fontSize: 19.5, fontWeight: 500, lineHeight: 1.35, color: INK }}>{f.q}</span>
                    {open ? (
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flex: "none", marginTop: 5 }}><path d="M5 11h12" stroke={CORAL} strokeWidth="2" strokeLinecap="round" /></svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flex: "none", marginTop: 5 }}><path d="M11 5v12M5 11h12" stroke="#9a9789" strokeWidth="2" strokeLinecap="round" /></svg>
                    )}
                  </div>
                  {open && (
                    <div style={{ paddingBottom: 28, fontSize: 16, lineHeight: 1.75, color: "#56544c", maxWidth: 720 }}>{f.a}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={{ background: CREAM, borderTop: "1px solid rgba(19,19,15,0.08)", padding: "80px 40px", textAlign: "center" }}>
        <h2 style={{ ...serif, fontWeight: 400, fontSize: "clamp(28px,3.5vw,46px)", lineHeight: 1.2, letterSpacing: "-0.015em", margin: "0 0 14px", color: INK, fontStyle: "italic" }}>Still have questions?<br />We answer personally.</h2>
        <p style={{ fontSize: 16, color: "#6c6a60", margin: "0 0 36px" }}>Email us at <a href="mailto:hello@buildwithmoxiemo.com" style={{ color: CORAL, textDecoration: "none", fontWeight: 600 }}>hello@buildwithmoxiemo.com</a></p>
        <a href="/founding" className="mo-dark-btn" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: INK, color: CREAM, fontWeight: 600, fontSize: 15, padding: "15px 30px", borderRadius: 999, textDecoration: "none" }}>Join the Private Beta, Free <Arrow size={15} color={CREAM} /></a>
      </section>

      <SiteFooter />
    </div>
  );
}

function Tier({
  dark, popular, comingSoon, icon, name, desc, price, founding, billingLabel, ctaLabel, ctaVariant, ctaHref, features, replaces, checkColor = CORAL,
}: {
  dark: boolean;
  popular?: boolean;
  comingSoon?: boolean;
  icon: ReactNode;
  name: string;
  desc: string;
  price: string;
  founding: string;
  billingLabel: string;
  ctaLabel: string;
  ctaVariant: "outline" | "coral" | "disabled";
  ctaHref?: string;
  features: string[];
  replaces: string;
  checkColor?: string;
}) {
  const cardBg = dark ? INK : "#fff";
  const featTextColor = dark ? "#c9c5b6" : "#3a382f";
  const borderColor = dark ? "rgba(255,255,255,0.07)" : "rgba(19,19,15,0.07)";
  const wrapperStyle: CSSProperties = {
    background: cardBg,
    borderRadius: 16,
    border: dark ? undefined : "1px solid rgba(19,19,15,0.1)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: dark ? "0 24px 64px -24px rgba(19,19,15,0.45)" : undefined,
    opacity: comingSoon ? 0.72 : 1,
  };
  return (
    <div style={wrapperStyle}>
      {popular && (
        <div style={{ background: CORAL, padding: "10px 28px", textAlign: "center" }}>
          <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: "#fff", fontWeight: 500 }}>Most Popular</span>
        </div>
      )}
      {comingSoon && (
        <div style={{ background: "#ece7de", padding: "10px 28px", textAlign: "center" }}>
          <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: "#8a877a", fontWeight: 500 }}>Coming Soon</span>
        </div>
      )}
      <div style={{ padding: "28px 28px 22px" }}>
        <div style={{ marginBottom: 20 }}>{icon}</div>
        <div style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: dark ? "#9a9789" : "#8a877a", marginBottom: 10 }}>{name}</div>
        <p style={{ fontSize: 13.5, color: "#6c6a60", lineHeight: 1.5, margin: "0 0 24px", minHeight: 40 }}>{desc}</p>
        <div style={{ marginBottom: 6 }}>
          <span style={{ ...mono, fontSize: 12, color: dark ? "#5a5850" : "#b8b4aa", textDecoration: "line-through" }}>{price}{billingLabel}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 6 }}>
          <span style={{ ...serif, fontSize: 48, fontWeight: 700, lineHeight: 1, color: dark ? CREAM : INK }}>{founding}</span>
          <span style={{ fontSize: 14, color: dark ? "#8a877a" : "#6c6a60" }}>{billingLabel}</span>
        </div>
        <div style={{ ...mono, fontSize: 10.5, color: comingSoon ? "#9a9789" : CORAL, letterSpacing: "0.1em", marginBottom: 22 }}>FOUNDING PRICE · LOCKED FOR LIFE</div>
        {ctaVariant === "outline" && (
          <a href={ctaHref || "/founding"} className="mo-foundation-cta" style={{ display: "block", textAlign: "center", background: CREAM, color: INK, fontWeight: 600, fontSize: 14, padding: "13px 18px", borderRadius: 8, textDecoration: "none", border: `1.5px solid ${INK}` }}>{ctaLabel}</a>
        )}
        {ctaVariant === "coral" && (
          <a href={ctaHref || "/founding"} className="mo-coral-btn" style={{ display: "block", textAlign: "center", background: CORAL, color: "#fff", fontWeight: 700, fontSize: 14, padding: "13px 18px", borderRadius: 8, textDecoration: "none" }}>{ctaLabel}</a>
        )}
        {ctaVariant === "disabled" && (
          <a href={ctaHref || "/beta20-founding"} className="mo-foundation-cta" style={{ display: "block", textAlign: "center", background: CREAM, color: INK, fontWeight: 600, fontSize: 14, padding: "13px 18px", borderRadius: 8, textDecoration: "none", border: `1.5px solid ${INK}` }}>{ctaLabel}</a>
        )}
      </div>
      <div style={{ padding: "20px 28px 28px", flex: 1, display: "flex", flexDirection: "column", gap: 10, borderTop: `1px solid ${borderColor}` }}>
        {features.map((f) => (
          <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <CheckSm color={checkColor} />
            <span style={{ fontSize: 13.5, color: featTextColor, lineHeight: 1.45 }}>{f}</span>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(19,19,15,0.08)"}`, marginTop: 6, paddingTop: 14 }}>
          <span style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: dark ? "#6c6a60" : "#9a9789" }}>Replaces: </span>
          <span style={{ fontSize: 12, color: dark ? "#6c6a60" : "#8a877a", fontStyle: "italic" }}>{replaces}</span>
        </div>
      </div>
    </div>
  );
}