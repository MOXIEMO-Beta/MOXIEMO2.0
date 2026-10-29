import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Check, Instagram, Facebook, Linkedin, Loader2 } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeMoxie } from "@/components/HomeMoxie";
import { MoxieAvatar } from "@/components/MoxieAvatar";
import { Button } from "@/components/ui/button";
import { BRAND_COUNTS, HOME_ROLES, isBrandCount } from "@/lib/homeForm";
import heroCollage from "@/assets/redesign/hero-collage.jpg.asset.json";
import watchBadge from "@/assets/redesign/watch-badge-3.svg.asset.json";
import logoDark from "@/assets/redesign/moxiemo-logo.png.asset.json";
import logoLight from "@/assets/redesign/moxiemo-logo-light.png.asset.json";

/* ───────────── design tokens ───────────── */
const CREAM = "#f4efe5";
const SAGE = "#dce3d2";
const INK = "#13130f";
const CORAL = "#ef6f53";
const MUTED_CREAM = "#56544c";
const MUTED_SAGE = "#48533c";
const MUTED_DARK = "#b3b1a6";

const serif = { fontFamily: "'Newsreader', Georgia, serif" } as const;
const sans = { fontFamily: "'Hanken Grotesk', system-ui, sans-serif" } as const;
const mono = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" } as const;

/* ───────────── tiny atoms ───────────── */
function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="flex items-center gap-2 uppercase" style={{ ...mono, fontSize: 12, letterSpacing: "0.16em", color: dark ? MUTED_DARK : MUTED_CREAM }}>
      <span style={{ width: 7, height: 7, background: CORAL, borderRadius: 1, display: "inline-block" }} />
      {children}
    </div>
  );
}

function PillButton({ children, href, to, dark = true, onClick, full = false }: { children: React.ReactNode; href?: string; to?: string; dark?: boolean; onClick?: () => void; full?: boolean }) {
  const style: React.CSSProperties = {
    ...sans,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "14px 26px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.01em",
    background: dark ? INK : "transparent",
    color: dark ? CREAM : INK,
    border: dark ? "1px solid " + INK : "1px solid rgba(19,19,15,0.35)",
    textDecoration: "none",
    cursor: "pointer",
    transition: "all .2s ease",
    width: full ? "100%" : undefined,
  };
  if (to) return <Link to={to} style={style} onClick={onClick}>{children}</Link>;
  if (href) return <a href={href} style={style} onClick={onClick}>{children}</a>;
  return <button type="button" style={style} onClick={onClick}>{children}</button>;
}

/* ───────────── nav ───────────── */
function Nav() {
  const links = [
    ["Platform", "/platform"],
    ["Solutions", "/solutions"],
    ["Why MOXIEMO", "/why-moxiemo"],
    ["Pricing", "/pricing"],
    ["Community", "/community"],
    ["About", "/about"],
  ] as const;
  const linkStyle: React.CSSProperties = { ...mono, fontSize: 12, letterSpacing: "0.14em", color: INK, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 };
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: CREAM, borderBottom: "1px solid rgba(19,19,15,0.08)", margin: 0 }}>
      <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1280, padding: "16px 32px", flexWrap: "nowrap", gap: 24 }}>
        <Link to="/" className="flex items-center" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
          <img src={logoDark.url} alt="MOXIEMO" style={{ height: 44, display: "block" }} />
        </Link>
        <div className="hidden lg:flex items-center" style={{ gap: 22, flexWrap: "nowrap", flexShrink: 0 }}>
          <Link to="/platform" className="hover:text-[#ef6f53] transition-colors uppercase" style={linkStyle}>Platform</Link>
          {links.slice(1).map(([l, h]) => (
            <Link key={l} to={h} className="hover:text-[#ef6f53] transition-colors uppercase" style={linkStyle}>{l}</Link>
          ))}
        </div>
        <div className="flex items-center" style={{ gap: 16, flexWrap: "nowrap", flexShrink: 0 }}>
          <Link to="/auth?mode=signin" className="hidden sm:inline hover:text-[#ef6f53] uppercase" style={linkStyle}>Sign in</Link>
          <span style={{ whiteSpace: "nowrap" }}><PillButton to="/founding">Claim a spot</PillButton></span>
        </div>
      </div>
    </nav>
  );
}

/* ───────────── hero ───────────── */
function Hero() {
  return (
    <section style={{ background: SAGE }}>
      <div className="mx-auto grid gap-[52px] lg:grid-cols-[0.92fr_1.18fr] items-center" style={{ maxWidth: 1200, padding: "96px 40px 110px" }}>
        <div>
          <h1 style={{ ...serif, fontWeight: 600, fontSize: "clamp(54px, 7.4vw, 92px)", lineHeight: 0.95, color: INK, marginTop: 0, letterSpacing: "-0.02em" }}>
            Built on strategy.<br />
            <span style={{ fontStyle: "italic", fontWeight: 340, color: "#6d7a5e" }}>Powered to execute.</span>
          </h1>
          <p style={{ ...sans, fontSize: 19, lineHeight: 1.55, color: MUTED_SAGE, maxWidth: 480, marginTop: 28 }}>
            MOXIEMO figures out what moves your brand forward. MOXIE, your growth companion, makes sure it happens.
          </p>
          <p style={{ ...sans, fontSize: 17, lineHeight: 1.65, color: MUTED_SAGE, maxWidth: 480, marginTop: 20 }}>Start with a guided discovery built on the This Is Branding brand architecture. MOXIEMO finds the gap between where your brand is and where you want it to go, sets your priorities and creates the work to close it. You approve. It gets done.</p>
          <div className="flex flex-wrap items-center" style={{ gap: 24, marginTop: 36 }}>
            <div className="flex flex-col gap-3">
              <PillButton to="/brand-audit">Run my free Brand Audit <ArrowRight size={16} /></PillButton>
              <PillButton to="/founding" dark={false}>Claim a first-100 spot</PillButton>
            </div>
            <a
              href="#platform"
              aria-label="Watch how it works"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("platform")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              style={{ display: "inline-block", flexShrink: 0, lineHeight: 0 }}
              className="transition-transform duration-300 ease-out hover:-rotate-[4deg]"
            >
              <img src={watchBadge.url} alt="Watch how it works, two minutes" width={120} height={120} style={{ width: 120, height: 120, display: "block" }} />
            </a>
          </div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_SAGE, marginTop: 24 }}>50% off any plan while the 2.0 beta runs. Limited to our first 100 customers.</div>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ aspectRatio: "1 / 1.12", borderRadius: 6, overflow: "hidden", boxShadow: "0 30px 80px rgba(19,19,15,0.18)" }}>
            <img src={heroCollage.url} alt="MOXIEMO marketing collage" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <style>{`
            .mx-hero-moxie {
              position: absolute; left: 18px; bottom: 18px;
              display: flex; align-items: flex-end; gap: 12px;
              opacity: 0; transform: translateY(12px);
              animation: mx-hero-moxie-in 600ms ease-out 500ms forwards;
            }
            @keyframes mx-hero-moxie-in {
              to { opacity: 1; transform: translateY(0); }
            }
            .mx-hero-moxie-icon img { width: 56px !important; }
            @media (prefers-reduced-motion: reduce) {
              .mx-hero-moxie { animation: none; opacity: 1; transform: none; }
            }
            @media (max-width: 767px) {
              .mx-hero-moxie { left: 12px; bottom: 12px; }
              .mx-hero-moxie-icon img { width: 44px !important; }
              .mx-hero-moxie-bubble { max-width: 230px !important; font-size: 14px !important; }
            }
          `}</style>
          <div className="mx-hero-moxie">
            <span className="mx-hero-moxie-icon" style={{ flex: "none", lineHeight: 0 }}>
              <MoxieAvatar pose="icon" size={56} decorative />
            </span>
            <div
              className="mx-hero-moxie-bubble"
              style={{
                background: CREAM, color: INK, ...sans, fontSize: 15, lineHeight: 1.45,
                padding: "12px 16px", maxWidth: 300,
                borderRadius: 16, borderBottomLeftRadius: 4,
                boxShadow: "0 12px 30px -12px rgba(19,19,15,0.35)",
              }}
            >
              <div style={{ ...mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED_CREAM, marginBottom: 6 }}>MOXIE</div>
              Hi, I am MOXIE. I know your plan, I tell you what needs you next, and I follow up until it is done.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── marquee ───────────── */
function Marquee() {
  const items = ["STRATEGY FIRST", "DISCOVER", "DIAGNOSE", "DEFINE", "PRIORITIZE", "EXECUTE", "MEASURE", "MOXIE, YOUR GROWTH COMPANION, KEEPS IT MOVING", "50% OFF FOR THE FIRST 100"];
  const Row = () => (
    <div className="flex items-center shrink-0" style={{ gap: 36, paddingRight: 36 }}>
      {items.map((t, i) => (
        <span key={i} className="flex items-center" style={{ gap: 36 }}>
          <span style={{ ...mono, fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", color: CREAM }}>{t}</span>
          <span style={{ width: 7, height: 7, background: CORAL, display: "inline-block" }} />
        </span>
      ))}
    </div>
  );
  return (
    <div style={{ background: INK, padding: "15px 0", overflow: "hidden" }}>
      <div className="flex" style={{ animation: "mx-marquee 32s linear infinite", width: "max-content" }}>
        <Row /><Row />
      </div>
    </div>
  );
}

/* ───────────── §01 Problem ───────────── */
function Problem() {
  const items = [
    ["01", "BUSY WITHOUT A PLAN", "You are posting, emailing and testing. You are not sure which of it is moving the business."],
    ["02", "A STRATEGY THAT LIVES IN YOUR HEAD", "You know what you want to say. Until it is written down and built into your tools, every post starts from scratch."],
    ["03", "THINGS STALL BETWEEN LOGINS", "The approval waits in a tab. The newsletter slips a week. Nobody nudges you, so nothing moves."],
  ];
  return (
    <section style={{ background: CREAM }}>
      <div className="mx-auto grid gap-[72px] lg:grid-cols-[1fr_1.12fr]" style={{ maxWidth: 1200, padding: "118px 40px" }}>
        <div>
          <Eyebrow>§ 01 · Sound familiar?</Eyebrow>
          <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(40px, 4.6vw, 60px)", lineHeight: 1.02, color: INK, marginTop: 24, letterSpacing: "-0.015em" }}>
            You built something real.{" "}
            <span style={{ fontStyle: "italic", fontWeight: 340, color: "#6d7a5e" }}>So why does marketing still feel like guessing?</span>
          </h2>
          <p style={{ ...sans, fontSize: 17, lineHeight: 1.65, color: MUTED_CREAM, marginTop: 28, maxWidth: 460 }}>
            There is always another post to write, another tool to open and another idea worth trying. It all feels urgent, and very little of it ties back to a goal. MOXIEMO starts one step earlier, with what your business is trying to achieve and what needs to happen first.
          </p>
        </div>
        <div>
          {items.map(([n, h, b]) => (
            <div key={n} style={{ borderTop: "1px solid rgba(19,19,15,0.12)", padding: "32px 0" }}>
              <div className="flex items-baseline" style={{ gap: 24 }}>
                <span style={{ ...serif, fontSize: 42, fontWeight: 340, color: "#b8b3a4" }}>{n}</span>
                <div>
                  <div style={{ ...mono, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>{h}</div>
                  <p style={{ ...sans, fontSize: 16, lineHeight: 1.6, color: MUTED_CREAM }}>{b}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── §02 Platform demo ───────────── */
const SCREENS = ["Dashboard", "Discovery", "Strategy", "Content", "Planner"] as const;
type Screen = typeof SCREENS[number];

function DemoWindow() {
  const [active, setActive] = useState<Screen>("Dashboard");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    timer.current = window.setInterval(() => {
      setActive((s) => SCREENS[(SCREENS.indexOf(s) + 1) % SCREENS.length]);
    }, 4600);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  function pick(s: Screen) {
    setActive(s);
    if (timer.current) clearInterval(timer.current);
    timer.current = window.setInterval(() => setActive((cur) => SCREENS[(SCREENS.indexOf(cur) + 1) % SCREENS.length]), 4600);
  }

  const idx = SCREENS.indexOf(active);
  const navItems = [...SCREENS, "Analytics"];

  return (
    <div style={{ background: CREAM, border: "1px solid rgba(19,19,15,0.12)", borderRadius: 16, overflow: "hidden", boxShadow: "0 40px 80px rgba(19,19,15,0.18)" }}>
      {/* chrome */}
      <div className="flex items-center" style={{ background: "#ebe5d7", padding: "12px 16px", gap: 8, borderBottom: "1px solid rgba(19,19,15,0.08)" }}>
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ef6f53" }} />
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#e7c14a" }} />
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#7fb069" }} />
        <span className="home-sample-label">SAMPLE WORKSPACE</span>
        <div className="hidden sm:block" style={{ ...mono, fontSize: 11, color: MUTED_CREAM, background: CREAM, padding: "5px 14px", borderRadius: 6, marginLeft: 16, border: "1px solid rgba(19,19,15,0.08)" }}>app.buildwithmoxiemo.com</div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "214px 1fr", minHeight: 520 }}>
        {/* sidebar */}
        <div className="hidden md:flex flex-col" style={{ background: CREAM, borderRight: "1px solid rgba(19,19,15,0.08)", padding: "20px 14px", position: "relative" }}>
          <img src={logoDark.url} alt="" style={{ height: 14, marginBottom: 24, marginLeft: 6 }} />
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: 42, top: idx * 50, background: "rgba(239,111,83,0.14)", borderRadius: 10, transition: "top .4s cubic-bezier(.5,.1,.2,1)" }} />
            {navItems.map((n) => {
              const sel = n === active;
              const greyed = n === "Analytics";
              return (
                <button key={n} type="button" onClick={() => !greyed && pick(n as Screen)} style={{ position: "relative", display: "block", width: "100%", textAlign: "left", padding: "12px 14px", height: 42, marginBottom: 8, borderRadius: 10, ...sans, fontSize: 13, fontWeight: sel ? 600 : 500, color: greyed ? "#bdb8aa" : sel ? CORAL : INK, background: "transparent", border: 0, cursor: greyed ? "default" : "pointer" }}>
                  {n}{greyed && <span style={{ ...mono, fontSize: 9, marginLeft: 6, color: "#bdb8aa" }}>SOON</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-auto flex items-center" style={{ gap: 10, paddingTop: 20, borderTop: "1px solid rgba(19,19,15,0.08)" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: CORAL, color: CREAM, display: "flex", alignItems: "center", justifyContent: "center", ...mono, fontSize: 11, fontWeight: 500 }}>KL</div>
            <div>
              <div style={{ ...sans, fontSize: 12, fontWeight: 600, color: INK }}>Karee L.</div>
              <div style={{ ...mono, fontSize: 9, color: MUTED_CREAM, letterSpacing: "0.1em", textTransform: "uppercase" }}>Founder</div>
            </div>
          </div>
        </div>
        {/* content */}
        <div style={{ background: "#fbf9f3", padding: "20px 28px 32px" }}>
          <div className="flex items-center justify-between" style={{ ...mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_CREAM, marginBottom: 18 }}>
            <span>MOXIEMO <span style={{ color: "#bdb8aa" }}>/</span> {active}</span>
            <span className="flex items-center" style={{ gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#62a35d", boxShadow: "0 0 0 3px rgba(98,163,93,0.18)" }} />Live</span>
          </div>
          <div key={active} style={{ animation: "mx-fadeUp .5s ease both" }}>
            <ScreenContent screen={active} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ children, dark = false, pad = 18 }: { children: React.ReactNode; dark?: boolean; pad?: number }) {
  return <div style={{ background: dark ? INK : CREAM, color: dark ? CREAM : INK, border: dark ? "1px solid #2c2920" : "1px solid rgba(19,19,15,0.08)", borderRadius: 12, padding: pad }}>{children}</div>;
}

function ScreenContent({ screen }: { screen: Screen }) {
  if (screen === "Dashboard") {
    const kpis = [["Published", "24", "+18%"], ["Engagement", "4.6%", "+0.8%"], ["Leads", "31", "+12"], ["Consistency", "94%", "+6%"]];
    return (
      <div>
        <h3 style={{ ...serif, fontSize: 30, fontWeight: 600, color: INK, marginBottom: 4 }}>Good afternoon, Jordan.</h3>
        <p style={{ ...sans, fontSize: 13, color: MUTED_CREAM, marginBottom: 18 }}>Here is what is moving this week.</p>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          {kpis.map(([l, v, d], i) => (
            <div key={l} style={{ animation: `mx-fadeUp .5s ease ${i * 0.08}s both` }}>
              <Card>
                <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_CREAM }}>{l}</div>
                <div style={{ ...serif, fontSize: 28, fontWeight: 600, color: INK, marginTop: 4 }}>{v}</div>
                <div style={{ ...mono, fontSize: 10, color: CORAL, marginTop: 2 }}>{d}</div>
              </Card>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          <Card pad={0}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_CREAM, padding: "12px 16px", borderBottom: "1px solid rgba(19,19,15,0.08)" }}>Content queue</div>
            {[["LinkedIn post", "Draft", "#e7c14a"], ["Newsletter", "Scheduled", "#5d8acf"], ["Instagram", "Published", "#7fb069"]].map(([t, s, c]) => (
              <div key={t} className="flex items-center justify-between" style={{ padding: "11px 16px", borderTop: "1px solid rgba(19,19,15,0.06)", ...sans, fontSize: 13, color: INK }}>
                <span>{t}</span>
                <span style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: c }}>{s}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  }
  if (screen === "Discovery") {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <Card>
          <div style={{ ...sans, fontSize: 13, background: "rgba(239,111,83,0.1)", padding: 12, borderRadius: 10, color: INK, marginBottom: 12 }}>
            <strong style={{ color: CORAL }}>MOXIEMO</strong> · What transformation do your clients actually pay you for?
          </div>
          <div style={{ ...sans, fontSize: 13, background: CREAM, padding: 12, borderRadius: 10, color: INK, border: "1px solid rgba(19,19,15,0.08)", marginBottom: 12 }}>
            <strong>You</strong> · Turning scattered, reactive marketing into one clear strategy they can actually run.
          </div>
          <div style={{ ...mono, fontSize: 18, color: MUTED_CREAM, letterSpacing: "0.3em" }}>···</div>
        </Card>
        <Card>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_CREAM, marginBottom: 12 }}>Extracting</div>
          {[["Positioning", "done"], ["Audience", "done"], ["Voice", "active"], ["Goals", "pending"]].map(([t, s]) => (
            <div key={t} className="flex items-center" style={{ gap: 8, ...sans, fontSize: 13, color: INK, padding: "6px 0" }}>
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: s === "done" ? CORAL : s === "active" ? "rgba(239,111,83,0.3)" : "transparent", border: s === "pending" ? "1px solid rgba(19,19,15,0.2)" : 0, display: "inline-flex", alignItems: "center", justifyContent: "center", color: CREAM, fontSize: 9 }}>{s === "done" && "✓"}</span>
              {t}<span style={{ marginLeft: "auto", ...mono, fontSize: 10, color: MUTED_CREAM }}>{s}</span>
            </div>
          ))}
          <div style={{ marginTop: 14, height: 6, background: "rgba(19,19,15,0.08)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: "38%", height: "100%", background: CORAL, animation: "mx-grow 1.2s ease both" }} />
          </div>
          <div style={{ ...mono, fontSize: 10, color: MUTED_CREAM, marginTop: 6 }}>38% complete</div>
        </Card>
      </div>
    );
  }
  if (screen === "Strategy") {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_CREAM }}>Strategy strength</div>
          <div className="flex items-baseline" style={{ gap: 6, marginTop: 6 }}>
            <span style={{ ...serif, fontSize: 42, fontWeight: 600, color: INK }}>100</span>
            <span style={{ ...sans, fontSize: 14, color: MUTED_CREAM }}>/100</span>
          </div>
          <div style={{ height: 6, background: "rgba(19,19,15,0.08)", borderRadius: 999, overflow: "hidden", marginTop: 8 }}><div style={{ width: "100%", height: "100%", background: CORAL }} /></div>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_CREAM, marginTop: 16 }}>Content pillars</div>
          <div className="flex flex-wrap" style={{ gap: 6, marginTop: 8 }}>
            {["Authority", "Systems", "Founder story", "Proof"].map((p) => (
              <span key={p} style={{ ...mono, fontSize: 11, padding: "5px 10px", border: "1px solid rgba(19,19,15,0.15)", borderRadius: 999, color: INK }}>{p}</span>
            ))}
          </div>
        </Card>
        <Card dark>
          <div style={{ ...serif, fontStyle: "italic", fontWeight: 340, fontSize: 18, lineHeight: 1.35, color: CREAM }}>
            "For founders who want a marketing system, not a content treadmill."
          </div>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_DARK, marginTop: 18 }}>Channel mix</div>
          {[["LinkedIn", 80, CORAL], ["Email", 60, "#5d8acf"], ["Instagram", 42, "#7fb069"]].map(([l, v, c]) => (
            <div key={l as string} style={{ marginTop: 10 }}>
              <div className="flex justify-between" style={{ ...mono, fontSize: 11, color: MUTED_DARK }}><span>{l}</span><span>{v}%</span></div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden", marginTop: 4 }}><div style={{ width: `${v}%`, height: "100%", background: c as string }} /></div>
            </div>
          ))}
        </Card>
      </div>
    );
  }
  if (screen === "Content") {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1.3fr" }}>
        <Card>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_CREAM }}>Pillar</div>
          <div className="flex flex-wrap" style={{ gap: 6, marginTop: 8 }}>
            {["Authority", "Systems", "Founder story"].map((p, i) => (
              <span key={p} style={{ ...mono, fontSize: 11, padding: "5px 10px", border: "1px solid " + (i === 0 ? CORAL : "rgba(19,19,15,0.15)"), background: i === 0 ? "rgba(239,111,83,0.1)" : "transparent", color: i === 0 ? CORAL : INK, borderRadius: 999 }}>{p}</span>
            ))}
          </div>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_CREAM, marginTop: 18 }}>Format</div>
          <div className="flex flex-wrap" style={{ gap: 6, marginTop: 8 }}>
            {["LinkedIn", "Email", "Instagram"].map((p, i) => (
              <span key={p} style={{ ...mono, fontSize: 11, padding: "5px 10px", border: "1px solid " + (i === 0 ? CORAL : "rgba(19,19,15,0.15)"), background: i === 0 ? "rgba(239,111,83,0.1)" : "transparent", color: i === 0 ? CORAL : INK, borderRadius: 999 }}>{p}</span>
            ))}
          </div>
          <div className="flex items-center justify-between" style={{ marginTop: 18, ...sans, fontSize: 13, color: INK }}>
            <span>In your voice</span>
            <span style={{ width: 36, height: 20, background: CORAL, borderRadius: 999, position: "relative" }}><span style={{ position: "absolute", right: 2, top: 2, width: 16, height: 16, borderRadius: "50%", background: CREAM }} /></span>
          </div>
        </Card>
        <Card>
          <p style={{ ...sans, fontSize: 14, lineHeight: 1.55, color: INK }}>
            Most $250K founders do not have a marketing problem. They have a fragmentation problem.<br /><br />
            Six tabs. Three drafts. Zero strategy connecting them.<br /><br />
            That is not a content gap. That is a system gap<span style={{ display: "inline-block", width: 7, height: 14, background: INK, marginLeft: 2, verticalAlign: "middle", animation: "mx-blink 1s steps(1) infinite" }} />
          </p>
          <div className="flex items-center justify-between" style={{ marginTop: 14 }}>
            <span style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#62a35d", background: "rgba(98,163,93,0.12)", padding: "5px 9px", borderRadius: 999 }}>In your voice</span>
            <span style={{ ...sans, fontSize: 12, fontWeight: 600, background: INK, color: CREAM, padding: "9px 16px", borderRadius: 999 }}>Approve &amp; schedule</span>
          </div>
        </Card>
      </div>
    );
  }
  // Planner
  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <div style={{ ...serif, fontSize: 22, fontWeight: 600, color: INK }}>May 2026</div>
        <div className="flex" style={{ gap: 14 }}>
          {[["LinkedIn", CORAL], ["Email", "#5d8acf"], ["Instagram", "#7fb069"]].map(([l, c]) => (
            <span key={l} className="flex items-center" style={{ gap: 5, ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED_CREAM }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c as string }} />{l}
            </span>
          ))}
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const tags = [["L"], ["E"], [], ["L", "I"], ["E"], [], ["L"]][i] as string[];
          const gap = i === 2;
          return (
            <div key={i} style={{ border: gap ? `1px dashed ${CORAL}` : "1px solid rgba(19,19,15,0.08)", background: CREAM, borderRadius: 8, minHeight: 92, padding: 8 }}>
              <div style={{ ...mono, fontSize: 10, color: MUTED_CREAM }}>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</div>
              <div style={{ ...serif, fontSize: 18, color: INK, marginTop: 2 }}>{4 + i}</div>
              <div className="flex flex-wrap" style={{ gap: 3, marginTop: 6 }}>
                {tags.map((t, j) => (
                  <span key={j} style={{ width: 14, height: 4, borderRadius: 2, background: t === "L" ? CORAL : t === "E" ? "#5d8acf" : "#7fb069" }} />
                ))}
                {gap && <span style={{ ...mono, fontSize: 9, color: CORAL, letterSpacing: "0.12em", textTransform: "uppercase" }}>Gap</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_CREAM, marginTop: 14 }}>
        12 posts scheduled · 2 gaps flagged · tied to strategy
      </div>
    </div>
  );
}

function PlatformSection() {
  return (
    <section id="platform" style={{ background: SAGE }}>
      <div className="mx-auto" style={{ maxWidth: 1200, padding: "118px 40px" }}>
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-[72px]" style={{ marginBottom: 56 }}>
          <div>
            <Eyebrow>§ 02 · Inside MOXIEMO</Eyebrow>
            <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(38px, 4.4vw, 56px)", lineHeight: 1.02, color: INK, marginTop: 22, letterSpacing: "-0.015em" }}>
              One plan behind{" "}
              <span style={{ fontStyle: "italic", fontWeight: 340, color: "#6d7a5e" }}>every next step.</span>
            </h2>
          </div>
          <p style={{ ...sans, fontSize: 17, lineHeight: 1.65, color: MUTED_SAGE, alignSelf: "end" }}>
            Discovery captures your goals and your brand. Diagnosis shows where you stand. Your roadmap sets the priorities, and every piece of content, campaign and result ties back to it.
          </p>
        </div>
        <DemoWindow />
      </div>
    </section>
  );
}

/* ───────────── §04 How it works ───────────── */
function HowItWorks() {
  const steps = [
    ["01", "DISCOVER", "Answer guided questions built on This Is Branding: your goals, audience, offer, proof and constraints."],
    ["02", "DIAGNOSE", "See the gap between where you want to go and where your brand stands today."],
    ["03", "DEFINE", "Get clear positioning, messaging, audience priorities and content pillars."],
    ["04", "PRIORITIZE", "Turn the strategy into a roadmap with milestones and your next best actions."],
    ["05", "EXECUTE", "Approve ready-to-go content and campaigns, published to the channels you connect."],
    ["06", "MEASURE AND ADAPT", "See results against your goals and adjust the next round."],
  ];
  return (
    <section style={{ background: INK, color: CREAM }}>
      <div className="mx-auto" style={{ maxWidth: 1200, padding: "118px 40px" }}>
        <div className="grid lg:grid-cols-2 gap-[72px]" style={{ marginBottom: 64 }}>
          <div>
            <Eyebrow dark>§ 04 · How it works</Eyebrow>
            <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(40px, 4.6vw, 60px)", lineHeight: 1.02, color: CREAM, marginTop: 22, letterSpacing: "-0.015em" }}>
              From first question{" "}
              <span style={{ fontStyle: "italic", fontWeight: 340, color: "#86847a" }}>to measurable progress.</span>
            </h2>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map(([eyebrow, h, b]) => (
            <div key={h} style={{ borderTop: "1px solid rgba(244,239,229,0.18)", paddingTop: 28 }}>
              <div style={{ ...mono, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: CORAL, marginBottom: 18 }}>{eyebrow}</div>
              <h3 style={{ ...serif, fontSize: 28, fontWeight: 600, color: CREAM, marginBottom: 14, lineHeight: 1.15 }}>{h}</h3>
              <p style={{ ...sans, fontSize: 15, lineHeight: 1.65, color: MUTED_DARK }}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── §05 Built for you ───────────── */
function BuiltForYou() {
  const personas = [
    ["SOLO OWNER", "One brand and a lot of hats. Know where you stand and where to go.", "Clarity plan"],
    ["GROWING OPERATOR", "Your direction is clear. Now it needs to show up every week.", "Momentum plan"],
    ["PORTFOLIO OPERATOR", "Several brands, each with its own voice and goals, run from one account.", "Multiply plan"],
  ];
  return (
    <section style={{ background: CREAM }}>
      <div className="mx-auto" style={{ maxWidth: 1200, padding: "118px 40px" }}>
        <div className="grid lg:grid-cols-2 gap-[72px]" style={{ marginBottom: 56 }}>
          <div>
            <Eyebrow>§ 05 · Built for you</Eyebrow>
            <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(40px, 4.6vw, 60px)", lineHeight: 1.02, color: INK, marginTop: 22, letterSpacing: "-0.015em" }}>
              Built for the stage{" "}
              <span style={{ fontStyle: "italic", fontWeight: 340, color: "#6d7a5e" }}>you are in.</span>
            </h2>
          </div>
          <p style={{ ...sans, fontSize: 17, lineHeight: 1.65, color: MUTED_CREAM, alignSelf: "end" }}>
            One brand or several, every plan starts with your strategy.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {personas.map(([label, body, link]) => (
            <div key={label} className="home-operator-card">
              <div className="home-operator-label">{label}</div>
              <p>{body}</p>
              <PillButton to="/pricing" dark={false}>{link} <ArrowRight size={16} /></PillButton>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── §05.5 The Platform ───────────── */
function ThePlatform() {
  const items = [
    ["01", "Strategy", "Your foundation, built from discovery and diagnosis.", "DISCOVER · DIAGNOSE · DEFINE"],
    ["02", "Content", "Drafts in your voice, tied to your goals.", "READY TO APPROVE"],
    ["03", "Planner", "Your priorities and milestones in one view.", "NEXT BEST ACTIONS"],
  ];
  return (
    <section style={{ background: INK, color: CREAM }}>
      <div className="mx-auto" style={{ maxWidth: 1200, padding: "118px 40px" }}>
        <div className="grid lg:grid-cols-2 gap-[72px]" style={{ marginBottom: 56 }}>
          <div>
            <Eyebrow dark>§ 05.5 · The platform</Eyebrow>
            <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(40px, 4.6vw, 60px)", lineHeight: 1.02, color: CREAM, marginTop: 22, letterSpacing: "-0.015em" }}>
              Everything you need.{" "}
              <span style={{ fontStyle: "italic", fontWeight: 340, color: "#86847a" }}>One place.</span>
            </h2>
          </div>
          <p style={{ ...sans, fontSize: 17, lineHeight: 1.65, color: MUTED_DARK, alignSelf: "end" }}>
            Strategy, content, planning and results, all working from the same plan.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {items.map(([n, h, b, pill]) => (
            <div key={n} style={{ borderTop: "1px solid rgba(244,239,229,0.18)", paddingTop: 28 }}>
              <div style={{ ...mono, fontSize: 12, letterSpacing: "0.14em", color: CORAL }}>{n}</div>
              <h3 style={{ ...serif, fontSize: 28, fontWeight: 600, color: CREAM, marginTop: 12, marginBottom: 12 }}>{h}</h3>
              <p style={{ ...sans, fontSize: 15, lineHeight: 1.6, color: MUTED_DARK, marginBottom: 18 }}>{b}</p>
              <span style={{ ...mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: CORAL, background: "rgba(239,111,83,0.12)", padding: "7px 12px", borderRadius: 999, border: "1px solid rgba(239,111,83,0.3)", display: "inline-block" }}>{pill}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── §06 Why ───────────── */
function Why() {
  const bullets = [
    "Diagnosis comes before content. Your website is one piece of evidence. Your goals lead.",
    "You approve what goes out.",
    "One strategy behind every channel you connect.",
    "Your voice in every draft.",
    "Results from your connected data, read against your goals.",
  ];
  return (
    <section id="why" style={{ background: SAGE }}>
      <div className="mx-auto grid lg:grid-cols-2 gap-[72px] items-start" style={{ maxWidth: 1200, padding: "118px 40px" }}>
        <div>
          <Eyebrow>§ 06 · Why MOXIEMO</Eyebrow>
          <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(40px, 4.6vw, 60px)", lineHeight: 1.02, color: INK, marginTop: 22, letterSpacing: "-0.015em" }}>
            Strategy first. Then the work.{" "}
            <span style={{ fontStyle: "italic", fontWeight: 340, color: "#6d7a5e" }}>Then the follow-through.</span>
          </h2>
          <p style={{ ...sans, fontSize: 17, lineHeight: 1.65, color: MUTED_SAGE, marginTop: 28 }}>
            Most marketing tools take the message you already have and help you make more of it. MOXIEMO starts earlier, with what you are trying to achieve, what is true about your brand today and what needs to change. Then it helps you do the work and keeps it moving.
          </p>
        </div>
        <div style={{ background: CREAM, borderRadius: 16, padding: "32px 30px", border: "1px solid rgba(19,19,15,0.08)" }}>
          {bullets.map((b) => (
            <div key={b} className="flex items-start" style={{ gap: 14, padding: "14px 0", borderTop: "1px solid rgba(19,19,15,0.08)" }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: CORAL, color: CREAM, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Check size={13} strokeWidth={3} />
              </span>
              <span style={{ ...sans, fontSize: 16, color: INK, lineHeight: 1.5 }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── §07 Founding members + form ───────────── */
const ROLES = HOME_ROLES;
const REFERRAL_SOURCES = ["LinkedIn", "Instagram", "A friend or colleague", "Podcast", "Google search", "An event", "Other"];

function FoundingSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Solo business owner");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [brandCount, setBrandCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) { setError("Please fill in your name and email."); return; }
    if (!isBrandCount(brandCount)) { setError("Please select how many brands you run."); return; }
    setSubmitting(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("join-waitlist", {
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          website_url: websiteUrl.trim() || null,
          company_name: companyName.trim() || null,
          referral_source: referralSource || null,
          brand_count: brandCount,
          source: "home_first100",
        },
      });
      let bodyError: string | undefined = (data as any)?.error;
      if (invokeError) {
        try {
          const ctx: any = (invokeError as any).context;
          if (ctx && typeof ctx.json === "function") bodyError = (await ctx.json())?.error ?? bodyError;
        } catch {}
      }
      if (typeof bodyError === "string" && bodyError.includes("already_registered")) {
        setError("Looks like you are already on the list. Check your email for next steps.");
        return;
      }
      if (invokeError || bodyError) { setError("Something went wrong. Please try again."); return; }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setSubmitting(false); }
  }

  const bullets = [
    "50% off Clarity, Momentum or Multiply",
    "Discovery and brand diagnosis on every plan",
    "MOXIE text check-ins included",
    "First access to new features as they ship",
    "A direct line to the team during the beta",
  ];

  const labelStyle: React.CSSProperties = { ...mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_DARK, display: "block", marginBottom: 8 };
  const inputStyle: React.CSSProperties = { ...sans, width: "100%", background: "#13110c", border: "1px solid #34301f", borderRadius: 9, padding: "11px 13px", color: CREAM, fontSize: 14, outline: "none" };

  return (
    <section id="join" style={{ background: INK, color: CREAM }}>
      <div className="mx-auto grid lg:grid-cols-[1fr_1.05fr] gap-[64px] items-start" style={{ maxWidth: 1200, padding: "118px 40px" }}>
        <div>
          <Eyebrow dark>§ 07 · THE FIRST 100</Eyebrow>
          <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(40px, 4.6vw, 60px)", lineHeight: 1.02, color: CREAM, marginTop: 22, letterSpacing: "-0.015em" }}>
            Be one of our first{" "}
            <span style={{ fontStyle: "italic", fontWeight: 340, color: "#86847a" }}>100 customers.</span>
          </h2>
          <p style={{ ...sans, fontSize: 17, lineHeight: 1.65, color: MUTED_DARK, marginTop: 24, maxWidth: 460 }}>
            The MOXIEMO 2.0 beta is open to 100 customers. Join now and get 50% off any plan, monthly or annual, for as long as the beta runs.
          </p>
          <div style={{ marginTop: 28 }}>
            {bullets.map((b) => (
              <div key={b} className="flex items-start" style={{ gap: 14, padding: "10px 0" }}>
                <span style={{ width: 9, height: 9, background: CORAL, marginTop: 7, flexShrink: 0 }} />
                <span style={{ ...sans, fontSize: 15, color: CREAM }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#1c1a14", border: "1px solid #2c2920", borderRadius: 16, padding: 28 }}>
          {success ? (
            <div className="text-center" style={{ padding: "20px 8px" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: CORAL, color: CREAM, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Check size={26} strokeWidth={3} />
              </div>
              <h3 style={{ ...serif, fontSize: 30, fontWeight: 600, color: CREAM, marginBottom: 10 }}>You are on the list.</h3>
              <p style={{ ...sans, fontSize: 15, color: MUTED_DARK, lineHeight: 1.6 }}>Check your inbox. We will send a link to book your 1:1 kickoff call with Karee.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="home-name" style={labelStyle}>First name</label>
                  <input id="home-name" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
                </div>
                <div>
                  <label htmlFor="home-email" style={labelStyle}>Email</label>
                  <input id="home-email" type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
                </div>
              </div>
              <div>
                <label htmlFor="home-role" style={labelStyle}>What best describes you?</label>
                <select id="home-role" style={{ ...inputStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23b3b1a6' fill='none' stroke-width='1.5'/></svg>")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: 34 }} value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="home-brands" style={labelStyle}>How many brands do you run?</label>
                <select id="home-brands" style={inputStyle} value={brandCount} onChange={e => setBrandCount(e.target.value)} required>
                  <option value="" disabled>Select...</option>
                  {BRAND_COUNTS.map(count => <option key={count} value={count}>{count}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="home-referral" style={labelStyle}>How did you hear about us?</label>
                <select id="home-referral" style={{ ...inputStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23b3b1a6' fill='none' stroke-width='1.5'/></svg>")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: 34 }} value={referralSource} onChange={(e) => setReferralSource(e.target.value)}>
                  <option value="">Select...</option>
                  {REFERRAL_SOURCES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="home-company" style={labelStyle}>Company (optional)</label>
                  <input id="home-company" style={inputStyle} value={companyName} onChange={(e) => setCompanyName(e.target.value)} maxLength={150} />
                </div>
                <div>
                  <label htmlFor="home-website" style={labelStyle}>Website (optional)</label>
                  <input id="home-website" style={inputStyle} value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} maxLength={250} placeholder="https://" />
                </div>
              </div>
              <Button type="submit" className="h-auto whitespace-normal" disabled={submitting} style={{ ...sans, width: "100%", background: CORAL, color: CREAM, border: 0, borderRadius: 999, padding: "14px 22px", fontSize: 14, fontWeight: 600, cursor: submitting ? "default" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Joining...</> : <>Claim my spot <ArrowRight size={16} /></>}
              </Button>
              {error && <p style={{ ...sans, fontSize: 13, color: "#f6b9af", textAlign: "center", marginTop: 6 }}>{error}</p>}
              <p style={{ ...sans, fontSize: 13, color: MUTED_DARK, textAlign: "center", marginTop: 6 }}>
                Already have access? <Link to="/auth" style={{ color: CREAM, textDecoration: "underline" }}>Sign in →</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Final CTA ───────────── */
function FinalCta() {
  return (
    <section style={{ background: SAGE }}>
      <div className="mx-auto text-center" style={{ maxWidth: 900, padding: "118px 40px" }}>
        <h2 style={{ ...serif, fontWeight: 600, fontSize: "clamp(44px, 5.6vw, 76px)", lineHeight: 1.02, color: INK, letterSpacing: "-0.02em" }}>
          Find out{" "}
          <span style={{ fontStyle: "italic", fontWeight: 340, color: "#6d7a5e" }}>what comes first.</span>
        </h2>
        <p style={{ ...sans, fontSize: 17, lineHeight: 1.65, color: MUTED_SAGE, marginTop: 28 }}>Run the free Brand Audit for a quick read on your brand. Then let MOXIEMO build the plan and MOXIE keep it moving.</p>
        <div className="flex flex-wrap items-center justify-center" style={{ gap: 20, marginTop: 36 }}>
          <PillButton to="/brand-audit">Run my free Brand Audit <ArrowRight size={16} /></PillButton>
          <PillButton to="/pricing" dark={false}>See pricing</PillButton>
          <div className="flex items-center" style={{ gap: 10, ...mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED_SAGE }}>
            <span style={{ width: 7, height: 7, background: CORAL, display: "inline-block" }} />
            50% OFF FOR OUR FIRST 100 CUSTOMERS DURING THE MOXIEMO 2.0 BETA
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Footer ───────────── */
function Footer() {
  const letters = "MOXIEMO".split("");
  return (
    <footer style={{ background: INK, color: CREAM, overflow: "hidden" }}>
      <div className="mx-auto" style={{ maxWidth: 1400, padding: "72px 40px 36px" }}>
        <div className="flex w-full" style={{ justifyContent: "space-between", lineHeight: 0.85 }}>
          {letters.map((l, i) => (
            <span key={i} style={{ ...sans, fontWeight: 700, fontSize: "clamp(80px, 22vw, 320px)", color: "#ffffff", letterSpacing: "-0.04em" }}>{l}</span>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-10 items-end" style={{ marginTop: 60, paddingBottom: 60, borderBottom: "1px solid rgba(244,239,229,0.12)" }}>
          <div>
            <div style={{ ...serif, fontStyle: "italic", fontWeight: 340, fontSize: "clamp(28px, 3.4vw, 44px)", color: "#86847a", lineHeight: 1.1 }}>Built on strategy. Powered to execute.</div>
            <p style={{ ...sans, fontSize: 15, color: MUTED_DARK, marginTop: 16, maxWidth: 520, lineHeight: 1.6 }}>
              The strategy-led marketing system for founders and growing businesses. MOXIEMO finds what moves your brand forward. MOXIE makes sure it happens.
            </p>
          </div>
          <div className="lg:text-right">
            <PillButton to="/founding">Claim a first-100 spot</PillButton>
          </div>
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4" style={{ paddingTop: 56 }}>
          <div>
            <img src={logoLight.url} alt="MOXIEMO" style={{ height: 42, marginBottom: 18 }} />
            <div style={{ ...mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_DARK, lineHeight: 1.7 }}>
              MOXIEMO 2.0 BETA<br />50% OFF FOR OUR FIRST 100 CUSTOMERS
            </div>
            <div className="flex" style={{ gap: 10, marginTop: 18 }}>
              {[Instagram, Facebook, Linkedin].map((Icon, i) => (
                <a key={i} href="#" aria-label="social" style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(244,239,229,0.2)", color: CREAM, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon size={15} /></a>
              ))}
            </div>
          </div>
          {[
            ["Product", [["Platform", "/platform"], ["Solutions", "/solutions"], ["Why MOXIEMO", "/why-moxiemo"], ["Pricing", "/pricing"], ["About", "/about"]]],
            ["Resources", [["Building with MOXIEMO", "/blog"], ["Changelog", "/changelog"], ["Free Brand Audit", "/brand-audit"], ["Free Brand Kit", "/brand-kit", true], ["Contact", "mailto:hello@buildwithmoxiemo.com"]]],
            ["Legal", [["Privacy", "/privacy"], ["Terms", "/terms"], ["Data Deletion", "/data-deletion"]]],
          ].map(([title, items]) => (
            <div key={title as string}>
              <div style={{ ...mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_DARK, marginBottom: 16 }}>{title}</div>
              {(items as any[]).map(([l, h, hl]) => (
                <Link key={l} to={h} style={{ ...sans, fontSize: 14, color: hl ? CORAL : CREAM, display: "block", padding: "6px 0", textDecoration: "none" }} className="hover:opacity-70">{l}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center" style={{ gap: 14, marginTop: 60, paddingTop: 24, borderTop: "1px solid rgba(244,239,229,0.12)", ...mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED_DARK }}>
          <span>© 2026 MOXIEMO. All rights reserved.</span>
          <span style={{ width: 7, height: 7, background: CORAL, display: "inline-block" }} />
          <span>Built with care</span>
        </div>
      </div>
    </footer>
  );
}

/* ───────────── grain + animations ───────────── */
function Styles() {
  return (
    <style>{`
      html, body, #root { margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { font-family: 'Hanken Grotesk', system-ui, sans-serif; color: ${INK}; }
      @keyframes mx-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
      @keyframes mx-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      @keyframes mx-fadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
      @keyframes mx-grow { from { width: 0 } to { width: 38% } }
      @keyframes mx-blink { 50% { opacity: 0 } }
    `}</style>
  );
}

function Grain() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, mixBlendMode: "multiply", opacity: 0.5 }}>
      <svg width="100%" height="100%">
        <filter id="mx-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0" /></filter>
        <rect width="100%" height="100%" filter="url(#mx-grain)" />
      </svg>
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const [interceptingAuth, setInterceptingAuth] = useState(() => {
    if (typeof window === "undefined") return false;
    const h = window.location.hash || "";
    return h.includes("access_token=") || h.includes("type=invite") || h.includes("type=recovery") || h.includes("type=signup") || h.includes("type=magiclink");
  });

  useEffect(() => {
    if (!interceptingAuth) return;
    const raw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(raw);
    const access_token = params.get("access_token") || "";
    const refresh_token = params.get("refresh_token") || "";
    const type = params.get("type") || "";
    (async () => {
      try {
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      } catch (e) {
        // fall through to callback which will surface the error
      } finally {
        const target = "/auth/callback" + (type ? `#type=${encodeURIComponent(type)}` : "");
        navigate(target, { replace: true });
      }
    })();
  }, [interceptingAuth, navigate]);

  if (interceptingAuth) {
    return <div style={{ background: CREAM, minHeight: "100vh" }} />;
  }

  return (
    <div style={{ background: CREAM }}>
      <Styles />
      <Grain />
      <Nav />
      <Hero />
      <Marquee />
      <Problem />
      <PlatformSection />
      <HomeMoxie />
      <HowItWorks />
      <BuiltForYou />
      <ThePlatform />
      <Why />
      <FoundingSection />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}