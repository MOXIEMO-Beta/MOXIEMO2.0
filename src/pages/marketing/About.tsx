import { getCtaLabel, trackCtaClick } from "@/lib/ctaVariant";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import heroAsset from "@/assets/karee-hero.png.asset.json";
import bioAsset from "@/assets/karee-full-bio-new.png.asset.json";
import tableAsset from "@/assets/karee-table-new.png.asset.json";
import quoteAsset from "@/assets/karee-quote-new.png.asset.json";

const COLORS = {
  cream: "#f4efe5",
  sage: "#dce3d2",
  near: "#13130f",
  dark: "#0d0d0a",
  deep: "#1a1915",
  coral: "#ef6f53",
  coralHover: "#e05c40",
  coralMuted: "#c85638",
  muted: "#56544c",
  lightMuted: "#6c6a60",
  warmMuted: "#9a9789",
};

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")";

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

.mo-about, .mo-about * { box-sizing: border-box; }
.mo-about { font-family: 'Hanken Grotesk', system-ui, sans-serif; color: ${COLORS.near}; }
.mo-serif { font-family: 'Newsreader', Georgia, serif; }
.mo-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }

.mo-reveal { opacity: 0; transform: translateY(22px); transition: opacity .8s ease, transform .8s ease; }
.mo-reveal.in { opacity: 1; transform: translateY(0); }

@keyframes mo-scroll { from { transform: translateX(0);} to { transform: translateX(-50%);} }
@keyframes mo-pulse-ring { 0%,100%{opacity:.35;transform:scale(1);} 50%{opacity:.60;transform:scale(1.025);} }
@keyframes mo-float-a { 0%,100%{transform:translateY(0) rotate(-2deg);} 55%{transform:translateY(-9px) rotate(-2deg);} }
@keyframes mo-float-b { 0%,100%{transform:translateY(0) rotate(1.5deg);} 60%{transform:translateY(-7px) rotate(1.5deg);} }
@keyframes mo-float-c { 0%,100%{transform:translateY(0) rotate(-0.5deg);} 50%{transform:translateY(-11px) rotate(-0.5deg);} }
@keyframes mo-float-d { 0%,100%{transform:translateY(0) rotate(2deg);} 45%{transform:translateY(-6px) rotate(2deg);} }
@keyframes mo-chip-in { from{opacity:0;transform:translateY(-10px);} to{opacity:1;transform:translateY(0);} }
@keyframes mo-node-pulse {
  0%,100%{ box-shadow: 0 0 0 5px rgba(239,111,83,0.18), 0 0 22px rgba(239,111,83,0.35);}
  50%{ box-shadow: 0 0 0 9px rgba(239,111,83,0.12), 0 0 40px rgba(239,111,83,0.5);}
}

.mo-btn-primary { background:${COLORS.coral}; color:#fff; font-weight:700; font-size:16px; padding:18px 36px; border-radius:999px; box-shadow:0 10px 36px -8px rgba(239,111,83,0.5); text-decoration:none; display:inline-block; transition:background .2s ease; }
.mo-btn-primary:hover { background:${COLORS.coralHover}; }
.mo-btn-outline { background:transparent; color:${COLORS.near}; border:1.5px solid rgba(19,19,15,0.22); font-weight:600; font-size:16px; padding:17px 36px; border-radius:999px; text-decoration:none; display:inline-block; transition:background .2s ease; }
.mo-btn-outline:hover { background:rgba(19,19,15,0.06); }

@media (max-width: 880px) {
  .mo-hero { flex-direction: column !important; min-height: auto !important; padding-bottom: 60px !important; }
  .mo-hero-left { width: 100% !important; padding-top: 40px !important; }
  .mo-hero-right { position: relative !important; width: 100% !important; height: 420px !important; }
  .mo-hero-left-base { display: none !important; }
  .mo-personal-grid, .mo-rules-grid, .mo-experience-grid { grid-template-columns: 1fr !important; }
  .mo-timeline-row { grid-template-columns: 1fr !important; text-align: left !important; padding-left: 32px !important; }
  .mo-timeline-row > * { text-align: left !important; padding: 0 !important; }
  .mo-timeline-spine { left: 8px !important; }
  .mo-rule-card-5 { grid-template-columns: 1fr !important; }
}
`;

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".mo-about .mo-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function About() {
  useReveal();
  const spineRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const spine = spineRef.current;
    const container = timelineRef.current;
    if (!spine || !container) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            spine.style.height = container.offsetHeight + "px";
            io.disconnect();
          }
        });
      },
      { threshold: 0.05 }
    );
    io.observe(container);
    return () => io.disconnect();
  }, []);

  const grainStyle: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 9000, pointerEvents: "none",
    opacity: 0.42, mixBlendMode: "multiply",
    backgroundImage: GRAIN, backgroundSize: "200px",
  };

  const eyebrow: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase",
    letterSpacing: "0.22em", color: COLORS.coral,
  };

  const chipDark: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em",
    textTransform: "uppercase", padding: "5px 11px", borderRadius: 3,
    background: "rgba(15,15,12,0.82)", color: COLORS.cream,
    border: "0.5px solid rgba(244,239,229,0.3)", backdropFilter: "blur(8px)",
    position: "absolute" as const, pointerEvents: "none",
  };
  const chipCoral: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em",
    textTransform: "uppercase", padding: "5px 11px", borderRadius: 3,
    background: COLORS.coral, color: "#fff",
    boxShadow: "0 6px 20px rgba(239,111,83,0.4)",
    position: "absolute" as const, pointerEvents: "none",
  };

  const milestones = [
    { yr: "YEAR 1 · 2026", num: "500", desc: "founders and business owners get clear on what comes first.", side: "left", size: 18 },
    { yr: "YEAR 2 · 2027", num: "1,000", desc: "founders running their marketing from one plan, with MOXIE keeping it moving.", side: "right", size: 20 },
    { yr: "YEAR 3 · 2028", num: "3,000", desc: "businesses and personal brands executing across their connected channels, organic and paid.", side: "left", size: 22 },
    { yr: "YEAR 4 · 2029", num: "5,000", desc: "founders who can see, in real numbers, what their marketing is doing for their business.", side: "right", size: 24 },
    { yr: "YEAR 5 · 2030", num: "10,000", desc: "founders and businesses growing on one system, with proof as the standard.", side: "left", size: 28 },
  ] as const;

  const rules = [
    { n: "01", t: "Strategy comes first.", d: "Every feature starts from the goal and the brand, before the content.", f: "Does this start from the goal?" },
    { n: "02", t: "Ask before acting.", d: "MOXIEMO and MOXIE act only on what the owner approved, one action at a time. Bigger decisions always ask for more.", f: "Did the owner approve this exact action?" },
    { n: "03", t: "Never invent a result.", d: "Every number we show comes from connected, trustworthy data. If a task did not run, we say so.", f: "Is this true, specific and sourced?" },
    { n: "04", t: "Built for operators.", d: "An executive coach building her personal brand. A local service business owner growing his company. Neither is a developer. If a feature needs technical knowledge, we have failed.", f: "Can a founder or business owner use this without frustration?" },
  ];

  const tickerItems = [
    "Brand Strategist", "JD / MBA", "Goldman Sachs 10KSB Scholar", "HBJ 40 Under 40",
    "4× Entrepreneur", "15+ Years in Marketing", "Founder of MOXIEMO",
  ];
  const tickerSpan = (
    <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", paddingRight: 0 }}>
      {tickerItems.map((t, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
          <span style={{ padding: "0 28px" }}>{t}</span>
          <span style={{ opacity: 0.45, fontSize: 8 }}>◆</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: COLORS.cream }}>
      <style>{GLOBAL_CSS}</style>
      <div style={grainStyle} aria-hidden="true" />
      <SiteHeader />

      <main className="mo-about flex-1">
        {/* SECTION 1: HERO */}
        <section
          className="mo-hero"
          style={{
            position: "relative", background: COLORS.dark, minHeight: "100vh",
            display: "flex", alignItems: "center",
            paddingTop: "max(88px, calc(var(--nav-height, 72px) + 24px))",
            paddingBottom: 40, overflow: "hidden",
          }}
        >
          <div className="mo-hero-left-base" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "50%", background: COLORS.dark, pointerEvents: "none" }} />

          {/* RIGHT PANEL */}
          <div
            className="mo-hero-right"
            style={{
              position: "absolute", right: 0, top: 0, bottom: 0, width: "52%",
              overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
              background: COLORS.dark,
            }}
          >
            <img
              src={heroAsset.url}
              alt="Karee Laing, Founder of MOXIEMO"
              style={{ height: "100%", width: "auto", objectFit: "contain", objectPosition: "top center", filter: "brightness(0.88)", flex: "none" }}
            />
            <div aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 220, background: "linear-gradient(to right, #0d0d0a, transparent)", zIndex: 2, pointerEvents: "none" }} />
            <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 180, background: "linear-gradient(to top, #0d0d0a, transparent)", pointerEvents: "none" }} />
            {/* Soft vignette / diffusion to blend photo backdrop into hero */}
            <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", background: "radial-gradient(ellipse 62% 70% at 62% 38%, transparent 0%, transparent 42%, rgba(13,13,10,0.55) 78%, rgba(13,13,10,0.95) 100%)" }} />
            <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", background: "linear-gradient(to right, transparent 55%, rgba(13,13,10,0.7) 100%)" }} />

            {/* Annotation layer */}
            <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 }}>
              {/* Face ring primary */}
              <div style={{ position: "absolute", right: "11%", top: "10%", width: "clamp(200px, 20vw, 290px)", height: "clamp(200px, 20vw, 290px)", borderRadius: "50%", border: "1.5px solid rgba(239,111,83,0.5)", animation: "mo-pulse-ring 6s ease-in-out infinite" }} />
              {/* Face ring inner */}
              <div style={{ position: "absolute", right: "calc(11% + clamp(28px, 2.8vw, 40px))", top: "calc(10% + clamp(28px, 2.8vw, 40px))", width: "clamp(144px, 14.4vw, 210px)", height: "clamp(144px, 14.4vw, 210px)", borderRadius: "50%", border: "0.5px solid rgba(239,111,83,0.2)" }} />
              {/* Crosshair horizontal */}
              <div style={{ position: "absolute", left: "32%", right: 0, top: "calc(10% + clamp(100px, 10vw, 145px))", height: "0.5px", background: "linear-gradient(to right, transparent, rgba(239,111,83,0.25) 10%, rgba(239,111,83,0.25) 90%, transparent)" }} />
              {/* Crosshair vertical */}
              <div style={{ position: "absolute", top: 0, bottom: 0, right: "calc(11% + clamp(100px, 10vw, 145px))", width: "0.5px", background: "linear-gradient(to bottom, transparent 4%, rgba(239,111,83,0.2) 15%, rgba(239,111,83,0.2) 85%, transparent)" }} />
              {/* Corner brackets */}
              <div style={{ position: "absolute", width: 16, height: 16, right: "calc(11% + clamp(200px,20vw,290px) + 10px)", top: "calc(10% - 10px)", borderTop: "1.5px solid rgba(239,111,83,0.6)", borderLeft: "1.5px solid rgba(239,111,83,0.6)" }} />
              <div style={{ position: "absolute", width: 16, height: 16, right: "calc(11% - 10px)", top: "calc(10% - 10px)", borderTop: "1.5px solid rgba(239,111,83,0.6)", borderRight: "1.5px solid rgba(239,111,83,0.6)" }} />
              <div style={{ position: "absolute", width: 16, height: 16, right: "calc(11% + clamp(200px,20vw,290px) + 10px)", top: "calc(10% + clamp(200px,20vw,290px) + 10px)", borderBottom: "1.5px solid rgba(239,111,83,0.6)", borderLeft: "1.5px solid rgba(239,111,83,0.6)" }} />
              <div style={{ position: "absolute", width: 16, height: 16, right: "calc(11% - 10px)", top: "calc(10% + clamp(200px,20vw,290px) + 10px)", borderBottom: "1.5px solid rgba(239,111,83,0.6)", borderRight: "1.5px solid rgba(239,111,83,0.6)" }} />

              {/* Chips */}
              <div style={{ ...chipCoral, right: "6%", top: "8%", animation: "mo-chip-in .7s .9s ease both, mo-float-a 8s 1.6s ease-in-out infinite" }}>15+ YRS</div>
              <div style={{ ...chipDark, right: "38%", top: "74%", animation: "mo-chip-in .7s 1.2s ease both, mo-float-b 10s 1.9s ease-in-out infinite" }}>4× Entrepreneur</div>
              <div style={{ ...chipDark, right: "5%", top: "52%", animation: "mo-chip-in .7s 1.5s ease both, mo-float-c 12s 2.2s ease-in-out infinite" }}>GS 10KSB Scholar</div>
              <div style={{ ...chipCoral, right: "28%", top: "58%", animation: "mo-chip-in .7s 1.8s ease both, mo-float-d 9s 2.5s ease-in-out infinite" }}>HBJ 40 Under 40</div>

              {/* Ghost measurement numbers */}
              <div style={{ position: "absolute", fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "rgba(239,111,83,0.5)", right: "calc(11% + clamp(100px, 10vw, 145px) + 12px)", top: "calc(10% + clamp(100px, 10vw, 145px) - 14px)", animation: "mo-chip-in .7s 2s ease both" }}>332.11</div>
              <div style={{ position: "absolute", fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "rgba(239,111,83,0.5)", right: "calc(11% + clamp(100px, 10vw, 145px) - 60px)", top: "calc(10% + clamp(100px, 10vw, 145px) - 14px)", animation: "mo-chip-in .7s 2s ease both" }}>361.11</div>
            </div>

            {/* Photo caption */}
            <div style={{ position: "absolute", bottom: 30, right: 40, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: "0.1em", color: "rgba(244,239,229,0.3)", zIndex: 4 }}>
              Karee Laing · Founder, Brand Strategist, 4x Entrepreneur
            </div>
          </div>

          {/* LEFT TEXT */}
          <div className="mo-hero-left" style={{ position: "relative", zIndex: 10, width: "50%", padding: "0 40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, animation: "mo-chip-in 0.9s 0.1s ease both" }}>
              <span style={{ width: 7, height: 7, background: COLORS.coral, display: "inline-block" }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.24em", color: COLORS.coral }}>About</span>
            </div>

            <h1 className="mo-serif" style={{ fontWeight: 600, fontSize: "clamp(52px, 6.8vw, 98px)", lineHeight: 0.93, letterSpacing: "-0.026em", color: COLORS.cream, marginBottom: 30, maxWidth: 520, animation: "mo-chip-in 0.9s 0.25s ease both" }}>
              Built so<br />founders<br />know what<br />
              <span className="mo-serif" style={{ fontWeight: 320, fontStyle: "italic", color: "rgba(244,239,229,0.45)" }}>comes first.</span>
            </h1>

            <p style={{ fontSize: 18, lineHeight: 1.65, color: "rgba(244,239,229,0.58)", maxWidth: 450, marginBottom: 46, animation: "mo-chip-in 0.9s 0.4s ease both" }}>
              MOXIEMO helps founders and growing businesses find what moves their brand forward, then get it done.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 16, animation: "mo-chip-in 0.9s 0.55s ease both" }}>
              <div style={{ width: 1, height: 52, background: "linear-gradient(to bottom, rgba(239,111,83,0.6), transparent)" }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(244,239,229,0.3)" }}>Scroll to explore</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: MARQUEE */}
        <section style={{ background: COLORS.coral, padding: "14px 0", overflow: "hidden" }}>
          <div style={{ display: "flex", animation: "mo-scroll 30s linear infinite", whiteSpace: "nowrap", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.18em", color: "#fff" }}>
            {tickerSpan}{tickerSpan}
          </div>
        </section>

        {/* SECTION 3: THIS IS PERSONAL */}
        <section style={{ background: COLORS.cream, padding: "120px 40px" }}>
          <div className="mo-personal-grid" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "0.82fr 1.18fr", gap: 80, alignItems: "start" }}>
            <div className="mo-reveal">
              <div style={{ borderRadius: 6, overflow: "hidden", boxShadow: "0 28px 70px -24px rgba(19,19,15,0.22)", position: "relative" }}>
                <img src={bioAsset.url} alt="Karee Laing" style={{ width: "100%", height: "auto", display: "block" }} />
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: COLORS.coral }} />
              </div>
              <div style={{ marginTop: 22, paddingLeft: 4 }}>
                <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, fontSize: 16, color: COLORS.near, marginBottom: 4 }}>Karee Laing</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: COLORS.warmMuted, marginBottom: 18 }}>Founder, MOXIEMO</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["Brand Strategist","JD/MBA","Goldman Sachs 10KSB Scholar","HBJ 40 Under 40"].map((c) => (
                    <span key={c} style={{ background: "rgba(239,111,83,0.1)", color: COLORS.coralMuted, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 3 }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="mo-reveal" style={{ ...eyebrow, marginBottom: 16, transitionDelay: "0ms" }}>WHY MOXIEMO EXISTS</div>
              <h2 className="mo-serif mo-reveal" style={{ fontWeight: 600, fontSize: "clamp(36px, 4.6vw, 58px)", lineHeight: 1.0, letterSpacing: "-0.022em", color: COLORS.near, marginBottom: 38, transitionDelay: "80ms" }}>This is personal.</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 22, color: "#3a382f", fontSize: 17, lineHeight: 1.72 }}>
                <p className="mo-reveal" style={{ transitionDelay: "160ms" }}>I've lived the Monday night tool panic. You know the one where it's 9 PM and you need to prep and schedule the Tuesday morning newsletter, but first you have to pull the list from your website, check Analytics for what performed best, find that graphic in Canva, copy the caption from Claude, and format it all while updating the CTA. Two hours later, you've sent one email.</p>
                <p className="mo-reveal" style={{ transitionDelay: "240ms" }}>I've spent 15+ years in marketing. I should know better. But I was still drowning in tools, building Zapier automations at 11 PM, wondering why marketing felt like IT work instead of strategy. If I was struggling, what about the founders I work with? The ones building real businesses, whether it's coaching practices, consulting firms, or service companies who never signed up to become software administrators.</p>
                <p className="mo-reveal" style={{ transitionDelay: "320ms" }}>Here is what I kept seeing. Brilliant founders spending most of their marketing time on operations: copying content between platforms, fixing integrations and managing subscriptions. Almost none of it went to strategy, like positioning, a consistent story or content that moves the business.</p>
                <p className="mo-reveal" style={{ borderLeft: `3px solid ${COLORS.coral}`, paddingLeft: 22, transitionDelay: "400ms" }}>
                  <strong style={{ color: COLORS.near }}>The real problem was the order.</strong> Every tool jumped straight to execution without asking the strategic questions first. Who are you? Who do you serve? What makes you different? What should you do first? And even with a plan, things stalled between logins because nobody was there to nudge.
                </p>
                <p className="mo-reveal" style={{ transitionDelay: "480ms" }}>So I built MOXIEMO. It asks the strategic questions, diagnoses where your brand stands, builds the plan and helps you do the work. Then I built MOXIE, a growth companion who knows your plan and makes sure it happens. You became a founder to build something that lasts. MOXIEMO is here to help you do that.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: BUILT FROM EXPERIENCE */}
        <section style={{ background: COLORS.sage, padding: "100px 40px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <h2 className="mo-serif mo-reveal" style={{ fontWeight: 600, fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.0, letterSpacing: "-0.022em", color: COLORS.near, textAlign: "center", marginBottom: 56 }}>
              Built from experience.<br />
              <span className="mo-serif" style={{ fontWeight: 320, fontStyle: "italic", color: "#6d7a5e" }}>Not just ambition.</span>
            </h2>

            <div className="mo-experience-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { src: tableAsset.url, caption: "The Table · curated dinners for women founders in Houston", alt: "The Table dinner" },
                { src: quoteAsset.url, caption: "15+ years. Hundreds of founders. One recurring problem.", alt: "Karee Laing" },
              ].map((c, i) => (
                <div key={i} className="mo-reveal" style={{ borderRadius: 8, overflow: "hidden", position: "relative", height: 370, transitionDelay: `${i*100}ms` }}>
                  <img src={c.src} alt={c.alt} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, rgba(15,15,12,0.85), transparent)" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 18px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(244,239,229,0.7)" }}>{c.caption}</div>
                </div>
              ))}
              <div className="mo-reveal" style={{ background: COLORS.near, borderRadius: 8, padding: "40px 34px", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 370, transitionDelay: "200ms" }}>
                <div style={{ width: 28, height: 2.5, background: COLORS.coral, borderRadius: 2, marginBottom: 30 }} />
                <p className="mo-serif" style={{ fontWeight: 500, fontSize: "clamp(22px, 2.4vw, 30px)", lineHeight: 1.28, color: COLORS.cream, letterSpacing: "-0.01em", marginBottom: 24 }}>
                  The question is always the same: what do I do first?
                </p>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(244,239,229,0.4)" }}>That's why MOXIEMO exists.</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: MISSION */}
        <section style={{ background: COLORS.near, position: "relative", overflow: "hidden" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "128px 40px", textAlign: "center", position: "relative" }}>
            <div aria-hidden style={{ position: "absolute", right: -120, top: -120, width: 640, height: 640, borderRadius: "50%", border: "1px solid rgba(239,111,83,0.07)", pointerEvents: "none" }} />
            <div aria-hidden style={{ position: "absolute", right: -60, top: -60, width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(239,111,83,0.05)", pointerEvents: "none" }} />
            <div aria-hidden style={{ position: "absolute", left: -100, bottom: -80, width: 500, height: 500, borderRadius: "50%", border: "0.5px solid rgba(239,111,83,0.04)", pointerEvents: "none" }} />

            <div className="mo-reveal" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.26em", color: COLORS.coral, marginBottom: 30, display: "inline-block", position: "relative" }}>OUR MISSION</div>
            <h2 className="mo-serif mo-reveal" style={{ fontWeight: 600, fontSize: "clamp(30px, 4.8vw, 64px)", lineHeight: 1.02, letterSpacing: "-0.024em", color: COLORS.cream, marginBottom: 34, textWrap: "balance", position: "relative", transitionDelay: "100ms" } as React.CSSProperties}>
              We help founders and growing businesses know what comes first, get it done and see what it moved.
            </h2>
            <p className="mo-reveal" style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(244,239,229,0.48)", maxWidth: 640, margin: "0 auto", position: "relative", transitionDelay: "200ms" }}>
              In five years, we want every founder who uses MOXIEMO to have a clear answer to the question: is my marketing working?
            </p>
          </div>
        </section>

        {/* SECTION 6: RULES */}
        <section style={{ background: COLORS.cream, padding: "120px 40px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <h2 className="mo-serif mo-reveal" style={{ fontWeight: 600, fontSize: "clamp(36px, 5vw, 64px)", letterSpacing: "-0.022em", color: COLORS.near, textAlign: "center", marginBottom: 68 }}>
              The rules we never break.
            </h2>
            <div className="mo-rules-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {rules.map((r, i) => (
                <div key={r.n} className="mo-reveal" style={{ border: "1px solid rgba(19,19,15,0.10)", borderRadius: 8, padding: "38px 34px", transitionDelay: `${i*80}ms` }}>
                  <div className="mo-serif" style={{ fontSize: 40, color: COLORS.coral, lineHeight: 1, marginBottom: 16 }}>{r.n}</div>
                  <h3 style={{ fontWeight: 700, fontSize: 18, color: COLORS.near, letterSpacing: "-0.01em", marginBottom: 14 }}>{r.t}</h3>
                  <p style={{ fontSize: 16, lineHeight: 1.65, color: COLORS.muted, marginBottom: 22 }}>{r.d}</p>
                  <div style={{ borderLeft: "3px solid rgba(19,19,15,0.10)", paddingLeft: 18 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: COLORS.coral, marginBottom: 7 }}>DECISION FILTER</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: COLORS.lightMuted, lineHeight: 1.5 }}>"{r.f}"</div>
                  </div>
                </div>
              ))}
              <div className="mo-reveal mo-rule-card-5" style={{ gridColumn: "1 / -1", border: "1px solid rgba(19,19,15,0.10)", borderRadius: 8, padding: "38px 34px", display: "grid", gridTemplateColumns: "auto 1fr", gap: "0 48px", alignItems: "start", transitionDelay: "320ms" }}>
                <div className="mo-serif" style={{ fontSize: 40, color: COLORS.coral, lineHeight: 1 }}>05</div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 18, color: COLORS.near, letterSpacing: "-0.01em", marginBottom: 14 }}>Fewer, better features.</h3>
                  <p style={{ fontSize: 16, lineHeight: 1.65, color: COLORS.muted, marginBottom: 22, maxWidth: 680 }}>Every feature should make the others more useful. Busy founders want fewer, better tools.</p>
                  <div style={{ borderLeft: "3px solid rgba(19,19,15,0.10)", paddingLeft: 18 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: COLORS.coral, marginBottom: 7 }}>DECISION FILTER</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: COLORS.lightMuted, lineHeight: 1.5 }}>"Does this make the platform simpler or more complex?"</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: ROADMAP */}
        <section style={{ background: COLORS.deep, padding: "120px 40px 100px" }}>
          <div style={{ maxWidth: 1060, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 88 }}>
              <h2 className="mo-serif mo-reveal" style={{ fontWeight: 600, fontSize: "clamp(42px, 5.5vw, 74px)", lineHeight: 0.95, letterSpacing: "-0.026em", color: COLORS.cream, marginBottom: 20 }}>Where we're going.</h2>
              <div className="mo-reveal" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, letterSpacing: "0.12em", color: COLORS.coral, fontStyle: "italic", transitionDelay: "100ms" }}>
                Our goals. We measure success in progress you can prove.
              </div>
            </div>

            <div ref={timelineRef} style={{ position: "relative" }}>
              <div
                ref={spineRef}
                className="mo-timeline-spine"
                style={{
                  position: "absolute", left: "50%", top: 0, width: 1.5, transform: "translateX(-50%)",
                  background: "linear-gradient(to bottom, #ef6f53, rgba(239,111,83,0.2))",
                  zIndex: 0, height: 0, transition: "height 2.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
              {milestones.map((m, i) => {
                const last = i === milestones.length - 1;
                const isLeft = m.side === "left";
                const content = (
                  <div className="mo-reveal" style={{ transitionDelay: `${i*100}ms` }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.26em", color: COLORS.coral, marginBottom: 10 }}>{m.yr}</div>
                    <div className="mo-serif" style={{ fontWeight: 600, fontSize: "clamp(60px, 7.5vw, 96px)", lineHeight: 0.88, letterSpacing: "-0.025em", color: COLORS.cream }}>{m.num}</div>
                    <div style={{ fontSize: 15, lineHeight: 1.65, color: "rgba(244,239,229,0.48)", marginTop: 14, maxWidth: 310, marginLeft: isLeft ? "auto" : 0 }}>{m.desc}</div>
                  </div>
                );
                return (
                  <div key={i} className="mo-timeline-row" style={{ display: "grid", gridTemplateColumns: "1fr 90px 1fr", alignItems: "center", marginBottom: last ? 0 : 60 }}>
                    <div style={{ textAlign: "right", paddingRight: 48 }}>{isLeft ? content : null}</div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div style={{ width: m.size, height: m.size, borderRadius: "50%", background: COLORS.coral, position: "relative", zIndex: 2, animation: `mo-node-pulse 3.5s ${i*0.4}s ease-in-out infinite` }} />
                    </div>
                    <div style={{ paddingLeft: 48 }}>{!isLeft ? content : null}</div>
                  </div>
                );
              })}
            </div>

            <div className="mo-reveal" style={{ marginTop: 80, paddingTop: 56, borderTop: "1px solid rgba(244,239,229,0.06)", textAlign: "center" }}>
              <div className="mo-serif" style={{ fontStyle: "italic", fontSize: "clamp(18px, 2.2vw, 26px)", color: "rgba(244,239,229,0.38)" }}>
                "I know what comes first, and it gets done." That's the North Star.
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: CLOSING CTA */}
        <section style={{ background: COLORS.sage, padding: "120px 40px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
            <h2 className="mo-serif mo-reveal" style={{ fontWeight: 600, fontSize: "clamp(44px, 6.5vw, 84px)", lineHeight: 0.93, letterSpacing: "-0.026em", color: COLORS.near, marginBottom: 26 }}>
              Ready when you are.
            </h2>
            <p className="mo-reveal" style={{ fontSize: 18, lineHeight: 1.7, color: COLORS.muted, maxWidth: 580, margin: "0 auto 48px", transitionDelay: "100ms" }}>
              Start with the free growth assessment, then claim one of 100 founding seats at 50% off any plan, for life.
            </p>
            <div className="mo-reveal" style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 26, transitionDelay: "200ms" }}>
              <Link to="/brand-audit" className="mo-btn-primary">Get my free growth assessment →</Link>
              <Link to="/founding" onClick={trackCtaClick} className="mo-btn-outline whitespace-nowrap">{getCtaLabel()} →</Link>
            </div>
            <div className="mo-reveal" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: COLORS.warmMuted, transitionDelay: "300ms" }}>
              PLANS FROM $99 A MONTH · 50% OFF FOR LIFE FOR 100 FOUNDING MEMBERS
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
