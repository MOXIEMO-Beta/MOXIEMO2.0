import { useState, type CSSProperties, type ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { MoxieAvatar } from "@/components/MoxieAvatar";
import { comparison, DEFAULT_BILLING, formatPrice, getPlanPrice, plans, pricingFaqs, pricingOffer, type Billing } from "./pricingData";

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

const faqsData = pricingFaqs;

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
  const [billing, setBilling] = useState<Billing>(DEFAULT_BILLING);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const isAnnual = billing === "annual";
  const billingLabel = isAnnual ? "/year" : "/month";

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
            <span style={{ width: 6, height: 6, background: CORAL, borderRadius: "50%", display: "inline-block" }} />01 · PRICING
          </div>
          <h1 style={{ ...serif, fontWeight: 600, fontSize: "clamp(54px,7.5vw,104px)", lineHeight: 0.95, letterSpacing: "-0.03em", margin: "0 0 34px", color: INK }}>
            Simple pricing.<br /><span style={{ fontWeight: 300, fontStyle: "italic", color: CORAL }}>Strategy on every plan.</span>
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.65, color: "#56544c", maxWidth: 600, margin: "0 auto 48px" }}>Every plan starts with discovery and a diagnosis of where your brand stands today. Choose by how many brands you run and how much execution you need.</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 60 }}>
            <Button asChild variant="ghost" className="h-auto whitespace-normal"><a href="/founding" className="mo-coral-btn" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: CORAL, color: "#fff", fontWeight: 700, fontSize: 16, padding: "16px 32px", borderRadius: 999, textDecoration: "none" }}>Claim a first-100 spot <Arrow /></a></Button>
            <Button asChild variant="ghost" className="h-auto whitespace-normal"><a href="/brand-audit" className="mo-outline-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: INK, fontWeight: 500, fontSize: 15, padding: "15px 24px", border: "1.5px solid rgba(19,19,15,0.22)", borderRadius: 999, textDecoration: "none" }}>
              Run my free Brand Audit <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 9l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a></Button>
          </div>

        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ background: INK, overflow: "hidden", padding: "14px 0" }}>
        <div style={{ display: "inline-flex", whiteSpace: "nowrap", animation: "mo-scroll 32s linear infinite", ...mono, fontSize: 12.5, letterSpacing: "0.18em", textTransform: "uppercase", color: CREAM }}>
          {[0, 1].map((k) => (
            <span key={k} style={{ display: "inline-flex", alignItems: "center" }}>
              {["MOXIEMO 2.0 BETA", "50% OFF FOR THE FIRST 100", "MONTHLY OR ANNUAL", "SAVE 17% ANNUALLY", "STRATEGY ON EVERY PLAN", "MOXIE INCLUDED"].map((s, i) => (
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
            <span style={{ width: 5, height: 5, background: CORAL, borderRadius: "50%", display: "inline-block", animation: "mo-blink 2s ease infinite" }} />MOXIEMO 2.0 BETA · FIRST 100 CUSTOMERS
          </div>
          <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(40px,5.5vw,72px)", lineHeight: 1.04, letterSpacing: "-0.025em", margin: "0 0 30px", color: CREAM }}>50% off for our first {pricingOffer.firstCustomerLimit} customers.</h2>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "#8a877a", margin: "0 0 44px" }}>The MOXIEMO 2.0 beta is open now. Our first 100 customers get 50% off any plan, monthly or annual, during the beta. Once 100 spots are filled, new customers pay standard pricing.</p>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "#8a877a", margin: "0 0 44px" }}>Your 50% rate stays with you for as long as you keep your plan.</p>
          <Button asChild variant="ghost" className="h-auto whitespace-normal"><a href="/founding" className="mo-coral-btn" style={{ display: "inline-flex", alignItems: "center", gap: 12, background: CORAL, color: "#fff", fontWeight: 700, fontSize: 17, padding: "18px 40px", borderRadius: 999, textDecoration: "none" }}>Claim a first-100 spot <Arrow size={18} /></a></Button>
        </div>
      </section>

      {/* BETA 2.0 PRICING PREVIEW */}
      <section id="preview" style={{ background: CREAM, padding: "96px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ ...mono, display: "flex", alignItems: "center", gap: 10, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a877a", marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, background: CORAL, display: "inline-block" }} />PLANS
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
            <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(30px,4vw,52px)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: 0, color: INK, maxWidth: 580 }}>Pick the plan that fits how many brands you run.</h2>
            <div style={{ display: "inline-flex", background: "#e8e3d8", borderRadius: 999, padding: 4, gap: 2, flex: "none" }}>
              <Button variant="ghost" aria-pressed={billing === "monthly"} onClick={() => setBilling("monthly")} style={billing === "monthly" ? activeTab : inactiveTab}>Monthly</Button>
              <Button variant="ghost" aria-pressed={billing === "annual"} onClick={() => setBilling("annual")} style={billing === "annual" ? activeTab : inactiveTab}>Annual &nbsp;<span style={{ color: "#5f6a52", fontSize: 11, ...mono, letterSpacing: "0.06em" }}>SAVE 17%</span></Button>
            </div>
          </div>


          <div className="mo-tiers" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, alignItems: "start" }}>
            {plans.map((plan, index) => {
              const prices = getPlanPrice(plan, billing);
              return (
                <div key={plan.name}>
                  <Tier
                    dark={index === 1}
                    icon={[<svg width="56" height="56" viewBox="0 0 48 48" fill="none">
                  <rect x="4" y="33" width="40" height="11" rx="3.5" fill="#FDE0D8" stroke={INK} strokeWidth="1.75" />
                  <rect x="10" y="20" width="28" height="11" rx="3.5" fill="#F0B8A8" stroke={INK} strokeWidth="1.75" />
                  <rect x="16" y="7" width="16" height="11" rx="3.5" fill={CORAL} stroke={INK} strokeWidth="1.75" opacity="0.85" />
                </svg>,
<svg width="56" height="56" viewBox="0 0 48 48" fill="none">
                  <path d="M24 43V22" stroke="#A8CBA8" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M24 33C24 22 10 17 10 17C10 28 17 34 24 33Z" fill="#A8CBA8" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M24 25C24 14 38 9 38 9C38 20 31 26 24 25Z" fill="#A8CBA8" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinejoin="round" />
                  <ellipse cx="24" cy="15" rx="5.5" ry="7" fill="#A8CBA8" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
                  <path d="M15 43h18" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>,
<svg width="56" height="56" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="13" r="5.5" fill="#E8C87A" stroke={INK} strokeWidth="1.5" opacity="0.65" />
                  <circle cx="11" cy="31" r="4" fill="#E8C87A" stroke={INK} strokeWidth="1.5" opacity="0.5" />
                  <circle cx="37" cy="29" r="4.5" fill="#E8C87A" stroke={INK} strokeWidth="1.5" opacity="0.5" />
                  <circle cx="24" cy="41" r="3" fill="#E8C87A" stroke={INK} strokeWidth="1.5" opacity="0.4" />
                  <path d="M24 18L11 31M24 18L37 29M11 35L24 41M37 33L24 41" stroke={INK} strokeWidth="1" strokeLinecap="round" opacity="0.12" />
                </svg>][index]}
                    name={plan.name}
                    desc={plan.promise}
                    bestFor={plan.bestFor}
                    brands={plan.brands}
                    price={formatPrice(prices.standard)}
                    founding={formatPrice(prices.first100)}
                    billingLabel={billingLabel}
                    ctaLabel={`Start with ${plan.name}`}
                    ctaVariant={index === 1 ? "coral" : "outline"}
                    ctaHref="/founding"
                    features={plan.features}
                  />
                  {index === 2 && <p style={{ fontSize: 14, lineHeight: 1.6, margin: "20px 0 0" }}>Running more than three brands? <a href="mailto:hello@buildwithmoxiemo.com" style={{ color: CORAL }}>Let's talk.</a></p>}
                </div>
              );
            })}
          </div>          <p style={{ fontSize: 14, lineHeight: 1.65, color: "#6c6a60", margin: "32px 0 0" }}>Paid media spend and third-party channel fees are billed separately by those providers. Texting with MOXIE will be included on every plan when it opens. Message and data rates from your carrier may apply.</p>
        </div>
      </section>

      <section className="pricing-comparison" aria-labelledby="compare-title">
        <div className="pricing-section-inner">
          <Eyebrow>COMPARE PLANS</Eyebrow>
          <h2 id="compare-title" className="pricing-section-heading">Compare plans.</h2>
          <div className="pricing-table-scroll" role="region" aria-label="Plan capabilities" tabIndex={0}>
            <table className="pricing-table">
              <thead><tr>{["Capability", ...plans.map(plan => plan.name)].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
              <tbody>{comparison.map(([capability, ...values]) => <tr key={capability}><th scope="row">{capability}</th>{values.map((value, index) => <td key={index}>{value}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="pricing-moxie">
        <div className="pricing-section-inner">
          <div className="pricing-moxie-row">
            <MoxieAvatar pose="wave" size={180} decorative className="pricing-moxie-avatar" />
            <div>
              <Eyebrow>MOXIE</Eyebrow>
              <h2 className="pricing-section-heading">MOXIE comes with every plan.</h2>
              <p className="pricing-section-body">MOXIE is your growth companion. He reminds you of what you planned, asks for approvals, flags stalled priorities and shares weekly wins. Two-way texting with MOXIE is coming in a future release. When it opens, you choose how often he checks in, you can pause or reply STOP at any time, and he never texts your customers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* EVERY PLAN INCLUDES */}
      <section style={{ background: CREAM, padding: "96px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 72, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 380, flex: "none" }}>
              <Eyebrow>EVERY PLAN</Eyebrow>
              <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(34px,4vw,52px)", lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 16px", color: INK }}>Every plan includes the essentials.</h2>
              <p style={{ fontSize: 17, color: "#6c6a60", margin: "0 0 32px", fontStyle: "italic", lineHeight: 1.6 }}>Strategy, creation and support on every plan.</p>
              <div style={{ width: 40, height: 3, background: CORAL, borderRadius: 2 }} />
            </div>
            <div style={{ flex: 1, minWidth: 300 }}>
              <div className="mo-every-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 40px" }}>
                {[
                  "Brand discovery and diagnosis",
                  "Positioning, messaging and content pillars",
                  "A roadmap with your next best actions",
                  "Content in your voice",
                  "MOXIE check-ins (texting coming soon)",
                  "Unlimited strategy updates",
                  "Data export anytime",
                  "Direct support from the team",
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
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6c6a60", marginBottom: 24 }}>{pricingOffer.refundDays}-DAY GUARANTEE</div>
          <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(38px,5vw,66px)", lineHeight: 1.07, letterSpacing: "-0.025em", margin: "0 0 28px", color: CREAM }}>Try it for {pricingOffer.refundDays} days.</h2>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: "#8a877a", margin: "0 0 20px" }}>Complete discovery. Approve your first content. Publish it. If MOXIEMO does not give you a strategy that sounds like you and a clear next step, ask for a full refund within {pricingOffer.refundDays} days. Your strategy is yours to keep either way.</p>

        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: CREAM, padding: "96px 40px" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          <Eyebrow>PRICING QUESTIONS, ANSWERED</Eyebrow>
          <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(36px,4.5vw,60px)", lineHeight: 1.08, letterSpacing: "-0.025em", margin: "0 0 56px", color: INK }}>Pricing questions, answered.</h2>
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
        <Button asChild variant="ghost" className="h-auto whitespace-normal"><a href="/founding" className="mo-dark-btn" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: INK, color: CREAM, fontWeight: 600, fontSize: 15, padding: "15px 30px", borderRadius: 999, textDecoration: "none" }}>Claim a first-100 spot <Arrow size={15} color={CREAM} /></a></Button>
      </section>

      <SiteFooter />
    </div>
  );
}

function Tier({
  dark, icon, name, desc, bestFor, brands, price, founding, billingLabel, ctaLabel, ctaVariant, ctaHref, features, checkColor = CORAL,
}: {
  dark: boolean;
  icon: ReactNode;
  name: string;
  desc: string;
  bestFor: string;
  brands: number;
  price: string;
  founding: string;
  billingLabel: string;
  ctaLabel: string;
  ctaVariant: "outline" | "coral";
  ctaHref?: string;
  features: readonly string[];
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

  };
  return (
    <div style={wrapperStyle}>
      <div style={{ padding: "28px 28px 22px" }}>
        <div style={{ marginBottom: 20 }}>{icon}</div>
        <div style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: dark ? "#9a9789" : "#8a877a", marginBottom: 10 }}>{name}</div>
        <p style={{ fontSize: 13.5, color: "#6c6a60", lineHeight: 1.5, margin: "0 0 24px", minHeight: 40 }}>{desc}</p>
        <p style={{ fontSize: 13.5, lineHeight: 1.5, color: featTextColor, margin: "0 0 12px" }}>Best for: {bestFor}</p>
        <p style={{ fontSize: 13.5, color: featTextColor, margin: "0 0 24px" }}>Brands included: {brands}</p>
        <div className={`pricing-card-price${dark ? " pricing-card-price-dark" : ""}`}>
          <s>{price}{billingLabel}</s>
          <div><strong>{founding}</strong><span>{billingLabel}</span></div>
        </div>
        <div style={{ ...mono, fontSize: 10.5, color: CORAL, letterSpacing: "0.1em", marginBottom: 22 }}>FIRST 100 PRICE</div>
        {ctaVariant === "outline" && (
          <Button asChild variant="ghost" className="h-auto whitespace-normal"><a href={ctaHref || "/founding"} className="mo-foundation-cta" style={{ display: "block", textAlign: "center", background: CREAM, color: INK, fontWeight: 600, fontSize: 14, padding: "13px 18px", borderRadius: 8, textDecoration: "none", border: `1.5px solid ${INK}` }}>{ctaLabel}</a></Button>
        )}
        {ctaVariant === "coral" && (
          <Button asChild variant="ghost" className="h-auto whitespace-normal"><a href={ctaHref || "/founding"} className="mo-coral-btn" style={{ display: "block", textAlign: "center", background: CORAL, color: "#fff", fontWeight: 700, fontSize: 14, padding: "13px 18px", borderRadius: 8, textDecoration: "none" }}>{ctaLabel}</a></Button>
        )}

      </div>
      <div style={{ padding: "20px 28px 28px", flex: 1, display: "flex", flexDirection: "column", gap: 10, borderTop: `1px solid ${borderColor}` }}>
        {features.map((f) => (
          <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <CheckSm color={checkColor} />
            <span style={{ fontSize: 13.5, color: featTextColor, lineHeight: 1.45 }}>{f}</span>
          </div>
        ))}

      </div>
    </div>
  );
}