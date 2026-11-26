import { getCtaLabel, trackCtaClick } from "@/lib/ctaVariant";
import { useEffect, type CSSProperties } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const CREAM = "#f4efe5";
const SAGE = "#dce3d2";
const INK = "#13130f";
const CORAL = "#ef6f53";
const CORAL_DARK = "#c75438";
const MUTED = "#56544c";
const SAGE_BODY = "#48533c";
const LIGHT_MUTED = "#8a887e";
const SAGE_MUTED = "#5f6a52";
const NUMBER_MUTED = "#c9c5b6";
const GREEN = "#5f7740";

const mono: CSSProperties = { fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace" };
const display: CSSProperties = { fontFamily: "'Fraunces Variable', Georgia, serif" };

const PAGE_CSS = `
.wm-page{background:${CREAM};color:${INK};font-family:'DM Sans Variable',system-ui,sans-serif;}
.wm-grain{position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:.45;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E");background-size:200px;}
.rv{opacity:0;transform:translateY(32px);transition:opacity .85s cubic-bezier(.16,1,.3,1),transform .85s cubic-bezier(.16,1,.3,1);}
.rvl{opacity:0;transform:translateX(-32px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1);}
.rvr{opacity:0;transform:translateX(32px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1);}
.rv.in,.rvl.in,.rvr.in{opacity:1;transform:none;}
.d1{transition-delay:.08s}.d2{transition-delay:.18s}.d3{transition-delay:.28s}.d4{transition-delay:.38s}.d5{transition-delay:.48s}
.trow{transition:background .22s;}
.trow:hover{background:rgba(239,111,83,0.04);}
@keyframes wm-ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.wm-ticker{display:flex;width:max-content;animation:wm-ticker 22s linear infinite;}
@media (max-width:1000px){
  .wm-hero-grid,.wm-tried-head,.wm-conv-grid,.wm-stats-grid,.wm-split{grid-template-columns:1fr !important;}
  .wm-trow{grid-template-columns:40px 1fr !important;}
  .wm-trow .col-hap,.wm-trow .col-why{grid-column:2 / -1;padding-left:0 !important;border-left:0 !important;margin-top:12px;}
  .wm-tl-grid{grid-template-columns:40px 1fr !important;}
  .wm-tl-empty{display:none;}
  .wm-tl-left,.wm-tl-right{padding:24px 0 24px 16px !important;}
  .wm-stats-grid{grid-template-columns:1fr 1fr !important;}
}
@media (max-width:640px){
  .wm-stats-grid{grid-template-columns:1fr !important;}
  .wm-thead{display:none;}
}
`;

function Eyebrow({ num, name, color = LIGHT_MUTED }: { num: string; name: string; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <span style={{ width: 7, height: 7, background: CORAL, display: "inline-block" }} />
      <span style={{ ...mono, fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color }}>
        § {num} · {name}
      </span>
    </div>
  );
}

const tried = [
  {
    n: "01",
    tool: "Hired a VA",
    desc: "Brought on a virtual assistant to manage tools, post content, and coordinate marketing.",
    happened: "Weeks one and two went to training on six platforms. Weeks three to six, they seemed to be getting it. Weeks seven and eight, they quit. You were back to managing everything, and behind on campaigns.",
    why: "A VA can run your tasks. Someone still has to decide which tasks matter.",
  },
  {
    n: "02",
    tool: "Built Zapier automations",
    desc: "Spent hours wiring workflows to connect your tools.",
    happened: "It felt brilliant when it worked. Then one stopped firing. Then another broke silently. Now you are debugging webhooks on Sunday nights.",
    why: "Automation moves work between tools. It cannot tell you what the work should be.",
  },
  {
    n: "03",
    tool: "Looked at HubSpot",
    desc: "Evaluated enterprise marketing automation for your business.",
    happened: "You loved the demo. Then you saw the enterprise price, the months-long implementation, and the mixed reviews. You walked away.",
    why: "Built for companies with marketing teams. It assumes the strategy already exists.",
  },
  {
    n: "04",
    tool: "Tried all-in-one platforms",
    desc: "Consolidated onto Kajabi or Teachable to simplify the stack.",
    happened: "You still needed a separate tool for advanced email. Another for scheduling. Another for social. Another for contracts. Same number of tools, just rearranged.",
    why: "Consolidating tools changed where the work lived. The plan behind it was still missing.",
  },
  {
    n: "05",
    tool: "Used a general AI chat tool to write content faster.",
    desc: "",
    happened: "The drafts came out generic, and you still had to decide what to say and where to say it.",
    why: "A chat tool does not know your goals, your audience or what comes first.",
  },
];

const convergences = [
  {
    "n": "01",
    "label": "Building got easy",
    "b": "Anyone can launch a site, an offer or an app in a weekend. Getting to your first 100 customers is the hard part now."
  },
  {
    "n": "02",
    "label": "AI content is everywhere",
    "b": "When everyone can make more content, most of it sounds the same. A clear strategy is what makes yours worth choosing."
  },
  {
    "n": "03",
    "label": "Founders are stretched thin",
    "b": "Most founders know more than they have time to act on. Follow-through is where plans stall, which is why MOXIE, your growth companion, exists."
  }
];

const differences = [
  {
    "n": "01",
    "side": "L",
    "t": "We start with diagnosis.",
    "them": "start with what you want to post.",
    "us": "discovery and diagnosis first, so the first thing you make is the right thing."
  },
  {
    "n": "02",
    "side": "R",
    "t": "Strategy that stays live.",
    "them": "a strategy doc you check until it goes stale.",
    "us": "your strategy is built into every draft, plan and report, and you can update it anytime."
  },
  {
    "n": "03",
    "side": "L",
    "t": "You approve what goes out.",
    "them": "wait for you to do everything, or run on autopilot.",
    "us": "drafts and publishes with your approval, and a YES approves one specific action."
  },
  {
    "n": "04",
    "side": "R",
    "t": "Follow-through, built in.",
    "them": "wait for you to log in.",
    "us": "MOXIE tells you what needs you, at the pace you set. Texting with him is coming in a future release."
  },
  {
    "n": "05",
    "side": "L",
    "t": "One brand or several.",
    "them": "one workspace, one voice.",
    "us": "each brand gets its own strategy, voice and workspace under one account."
  }
];

const forYou = [
  {
    "t": "You have built something real",
    "b": "You are serious about growth and want marketing tied to a goal."
  },
  {
    "t": "You want to know what comes first",
    "b": "A clear order of operations for your marketing."
  },
  {
    "t": "You want strategy and execution in one place",
    "b": "The plan, the content and the publishing, all working from the same strategy."
  },
  {
    "t": "You want the system to work, with your hand on it",
    "b": "MOXIEMO plans, writes, schedules and publishes. You review, approve and steer."
  },
  {
    "t": "You want a nudge when things slip",
    "b": "MOXIE keeps your priorities moving between logins."
  },
  {
    "t": "You run more than one brand",
    "b": "Each one gets its own strategy under one account."
  }
];

const notForYou = [
  {
    "t": "You want to hand it off and never look at it again",
    "b": "You stay the owner. You review and approve."
  },
  {
    "t": "You want to skip the strategy",
    "b": "MOXIEMO is built strategy-first. If you only want to post and hope, this is not the fit."
  },
  {
    "t": "You only want a list of content ideas",
    "b": "MOXIEMO is a full system. If you only need prompts, this is more than you need."
  },
  {
    "t": "You are not ready to invest in your marketing yet",
    "b": "Plans start at $99 a month. Founding members get 50% off for life, as long as they keep their founding membership."
  }
];

const tickerPhrases = [
  "YOU TRIED THE TOOLS",
  "NONE OF THEM STARTED WITH STRATEGY",
  "MOXIEMO DOES",
  "STRATEGY FIRST. ALWAYS."
];

function TickerRun() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 36, paddingRight: 36 }}>
      {tickerPhrases.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <span style={{ ...mono, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#fff" }}>{p}</span>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.4)" }} />
        </div>
      ))}
    </div>
  );
}

export default function WhyMoxiemo() {
  useEffect(() => {
    // Temporarily suspend fallback tags while this route owns these fields.
    const selector = [
      'meta[name="description"]', 'meta[name="twitter:title"]',
      'meta[name="twitter:description"]', 'meta[property="og:title"]',
      'meta[property="og:description"]', 'meta[property="og:url"]',
      'meta[property="og:type"]', 'link[rel="canonical"]',
    ].map((tag) => `${tag}:not([data-rh])`).join(",");
    const fallbacks = Array.from(document.head.querySelectorAll(selector));
    fallbacks.forEach((tag) => tag.remove());
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".rv,.rvl,.rvr").forEach((el) => obs.observe(el));
    return () => {
      obs.disconnect();
      fallbacks.forEach((tag) => document.head.appendChild(tag));
    };
  }, []);

  return (
    <div className="wm-page" style={{ minHeight: "100vh" }}>
      <Helmet>
        <title>Why MOXIEMO | Strategy first, always</title>
        <meta name="description" content="MOXIEMO starts with diagnosis, builds the plan, helps you do the work, and MOXIE keeps it moving." />
        <link rel="canonical" href="https://buildwithmoxiemo.com/why-moxiemo" />
        <meta property="og:url" content="https://buildwithmoxiemo.com/why-moxiemo" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Why MOXIEMO | Strategy first, always" />
        <meta property="og:description" content="MOXIEMO starts with diagnosis, builds the plan, helps you do the work, and MOXIE keeps it moving." />
        <meta name="twitter:title" content="Why MOXIEMO | Strategy first, always" />
        <meta name="twitter:description" content="MOXIEMO starts with diagnosis, builds the plan, helps you do the work, and MOXIE keeps it moving." />
      </Helmet>
      <style>{PAGE_CSS}</style>
      <div className="wm-grain" aria-hidden />
      <SiteHeader />

      {/* §1 HERO */}
      <section style={{ background: INK, minHeight: "92vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative", overflow: "hidden" }}>
        {/* Decorative grid */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {[25, 50, 75].map((l) => (
            <div key={l} style={{ position: "absolute", top: 0, bottom: 0, left: `${l}%`, width: 1, background: "rgba(244,239,229,0.04)" }} />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, top: "44%", height: 1, background: "rgba(244,239,229,0.04)" }} />
          <div style={{ position: "absolute", left: "50%", top: "44%", transform: "translate(-50%,-50%)", width: 52, height: 52, borderRadius: "50%", border: "1px solid rgba(239,111,83,0.2)" }} />
          <div style={{ position: "absolute", left: "50%", top: "44%", transform: "translate(-50%,-50%)", width: 1, height: 58, background: "rgba(239,111,83,0.22)" }} />
          <div style={{ position: "absolute", left: "50%", top: "44%", transform: "translate(-50%,-50%)", width: 58, height: 1, background: "rgba(239,111,83,0.22)" }} />
          <div style={{ position: "absolute", top: 24, right: 32, ...mono, fontSize: 10, letterSpacing: "0.14em", color: "rgba(244,239,229,0.18)" }}>
            WHY / MOXIEMO
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "128px 40px 0", position: "relative" }}>
          <div className="rv" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 44 }}>
            <span style={{ width: 7, height: 7, background: CORAL, display: "inline-block" }} />
            <span style={{ ...mono, fontSize: 11.5, letterSpacing: "0.24em", textTransform: "uppercase", color: CORAL }}>Why MOXIEMO</span>
          </div>

          <h1 className="rv d1" style={{ ...display, fontWeight: 700, fontSize: "clamp(72px,11vw,164px)", lineHeight: 0.88, letterSpacing: "-0.035em", color: CREAM, margin: 0 }}>
            Strategy first.<br />
            <span style={{ fontWeight: 300, fontStyle: "italic", color: "rgba(244,239,229,0.17)" }}>Always.</span>
          </h1>

          <div className="wm-hero-grid rv d4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid rgba(244,239,229,0.1)", marginTop: 80 }}>
            <div style={{ padding: "28px 40px 40px 0", borderRight: "1px solid rgba(244,239,229,0.1)" }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(244,239,229,0.26)", marginBottom: 12 }}>The problem</div>
              <p style={{ fontSize: 15, lineHeight: 1.62, color: "rgba(244,239,229,0.5)", margin: 0 }}>
                Most marketing tools take your current message as the starting point. If that message is off, they help you make more of it, faster.
              </p>
            </div>
            <div style={{ padding: "28px 40px 40px 40px", borderRight: "1px solid rgba(244,239,229,0.1)" }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(244,239,229,0.26)", marginBottom: 12 }}>The system</div>
              <p style={{ fontSize: 15, lineHeight: 1.62, color: "rgba(244,239,229,0.5)", margin: 0 }}>
                MOXIEMO starts earlier. It diagnoses what should happen first, builds the plan, helps you do the work and measures what moved.
              </p>
            </div>
            <div style={{ padding: "28px 0 40px 40px" }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(244,239,229,0.26)", marginBottom: 12 }}>Start here</div>
              <p style={{ fontSize: 15, lineHeight: 1.62, color: "rgba(244,239,229,0.5)", margin: "0 0 18px" }}>
                Start with the free growth assessment for a quick read. Then claim one of 100 founding seats at 50% off for life.
              </p>
              <Link to="/brand-audit" style={{ background: CORAL, color: "#fff", fontWeight: 700, fontSize: 14, padding: "14px 24px", borderRadius: 999, textDecoration: "none", display: "inline-block" }}>
                Get my free growth assessment →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* §2 WHAT YOU'VE ALREADY TRIED */}
      <section style={{ background: CREAM, padding: "96px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="wm-tried-head" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "end", marginBottom: 56 }}>
            <div className="rvl">
              <Eyebrow num="02" name="What you've already tried" />
              <h2 style={{ ...display, fontWeight: 700, fontSize: "clamp(38px,4.8vw,64px)", lineHeight: 0.95, letterSpacing: "-0.025em", color: INK, margin: 0 }}>
                And why none of it stuck.
              </h2>
            </div>
            <div className="rvr">
              <p style={{ fontSize: 18, lineHeight: 1.55, color: MUTED, maxWidth: 460, margin: "0 0 0 auto" }}>
                Each of these started with execution, before anyone decided what should come first.
              </p>
            </div>
          </div>

          {/* Header row */}
          <div className="wm-thead" style={{ display: "grid", gridTemplateColumns: "52px 1fr 1.05fr 0.95fr", paddingBottom: 11, borderBottom: `1.5px solid ${INK}` }}>
            <div />
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9a9789" }}>What you tried</div>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9a9789", paddingLeft: 28 }}>What happened</div>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: CORAL, paddingLeft: 28 }}>Why it failed</div>
          </div>

          {tried.map((r, i) => (
            <div key={r.n} className="trow rv wm-trow" style={{
              display: "grid",
              gridTemplateColumns: "52px 1fr 1.05fr 0.95fr",
              padding: "28px 0",
              borderBottom: i === tried.length - 1 ? `1.5px solid ${INK}` : "1px solid rgba(19,19,15,0.1)",
            }}>
              <div style={{ ...display, fontSize: 26, color: NUMBER_MUTED }}>{r.n}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: INK, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, lineHeight: 1 }}>✕</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: INK }}>{r.tool}</span>
                </div>
                <p style={{ fontSize: 13.5, color: "#6c6a60", margin: 0, lineHeight: 1.55, maxWidth: 240 }}>{r.desc}</p>
              </div>
              <div className="col-hap" style={{ paddingLeft: 28, borderLeft: "1px solid rgba(19,19,15,0.08)", fontSize: 13.5, color: MUTED, lineHeight: 1.6 }}>{r.happened}</div>
              <div className="col-why" style={{ paddingLeft: 28, borderLeft: "1px solid rgba(19,19,15,0.08)", fontSize: 13.5, color: CORAL_DARK, fontWeight: 500, lineHeight: 1.6 }}>{r.why}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MARQUEE */}
      <section style={{ background: CORAL, padding: "14px 0", overflow: "hidden" }}>
        <div className="wm-ticker">
          <TickerRun />
          <TickerRun />
        </div>
      </section>

      {/* §3 WHAT CHANGES */}
      <section style={{ background: CREAM, padding: "96px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="rv"><Eyebrow num="03" name="What changes" /></div>
          <h2 className="rv d1" style={{ ...display, fontWeight: 700, fontSize: "clamp(38px,5vw,68px)", lineHeight: 0.95, color: INK, margin: "0 0 60px" }}>What changes when strategy comes first.</h2>
          <div className="wm-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 32 }}>
            {[
              { t: "You know what comes first", b: "A roadmap with your next best actions, in order." },
              { t: "Your work ties to a goal", b: "Every post, email and test connects to a milestone." },
              { t: "Things stop stalling", b: "MOXIE flags it when a decision is waiting or a priority slips." },
              { t: "You see what moved", b: "Results from your connected data, read against your goals." },
            ].map((item, i) => (
              <div key={item.t} className={`rv d${i + 1}`} style={{ borderTop: `1.5px solid ${INK}`, paddingTop: 24 }}>
                <h3 style={{ ...display, fontWeight: 600, fontSize: 25, lineHeight: 1.2, color: INK, margin: "0 0 13px" }}>{item.t}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.62, color: MUTED, margin: 0 }}>{item.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §4 THREE CONVERGENCES */}
      <section style={{ background: SAGE, padding: "96px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 60 }}>
            <div className="rv"><Eyebrow num="04" name="Why now" color={SAGE_MUTED} /></div>
            <h2 className="rv d1" style={{ ...display, fontWeight: 700, fontSize: "clamp(38px,5vw,68px)", lineHeight: 0.95, letterSpacing: "-0.025em", color: INK, margin: 0 }}>
              Three shifts make this the moment.
            </h2>
          </div>

          <div className="wm-conv-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(19,19,15,0.1)" }}>
            {convergences.map((c, i) => (
              <div key={c.n} className={`rv d${i + 1}`} style={{ background: SAGE, padding: "48px 40px" }}>
                <div style={{ ...display, fontWeight: 700, fontSize: 80, color: "rgba(19,19,15,0.08)", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 24 }}>{c.n}</div>
                <div style={{ ...mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: SAGE_MUTED, marginBottom: 13 }}>{c.label}</div>
                <p style={{ fontSize: 15, lineHeight: 1.62, color: SAGE_BODY, margin: 0 }}>{c.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §5 FIVE DIFFERENCES TIMELINE */}
      <section style={{ background: CREAM, padding: "96px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 72 }}>
            <div className="rv"><Eyebrow num="05" name="What makes MOXIEMO different" /></div>
            <h2 className="rv d1" style={{ ...display, fontWeight: 700, fontSize: "clamp(38px,5vw,68px)", lineHeight: 0.95, letterSpacing: "-0.025em", color: INK, margin: 0 }}>
              Five differences that matter.
            </h2>
          </div>

          <div style={{ position: "relative" }}>
            <div aria-hidden style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(19,19,15,0.1)", transform: "translateX(-50%)", pointerEvents: "none" }} />
            {differences.map((d, i) => {
              const isLast = i === differences.length - 1;
              const borderStyle = isLast ? "none" : "1px solid rgba(19,19,15,0.08)";
              const Content = (
                <div>
                  <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: CORAL, marginBottom: 12 }}>Difference {d.n}</div>
                  <h3 style={{ ...display, fontWeight: 700, fontSize: 27, lineHeight: 1.15, color: INK, margin: "0 0 18px" }}>{d.t}</h3>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                    <span style={{ color: CORAL_DARK, fontSize: 13, flex: "none", marginTop: 3 }}>✕</span>
                    <div style={{ fontSize: 14, color: "#6c6a60", lineHeight: 1.55 }}>
                      <span style={{ color: "#3a382f", fontWeight: 600 }}>Most tools: </span>{d.them}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: GREEN, fontSize: 13, flex: "none", marginTop: 3 }}>✓</span>
                    <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.55 }}>
                      <span style={{ color: "#3a382f", fontWeight: 600 }}>MOXIEMO: </span>{d.us}
                    </div>
                  </div>
                </div>
              );
              const dotBg = d.n === "05" ? CORAL : INK;
              const dotColor = d.n === "05" ? "#fff" : CREAM;
              return (
                <div key={d.n} className="rv wm-tl-grid" style={{ display: "grid", gridTemplateColumns: "1fr 72px 1fr" }}>
                  {d.side === "L" ? (
                    <div className="wm-tl-left" style={{ padding: "44px 52px 44px 0", borderBottom: borderStyle }}>{Content}</div>
                  ) : (
                    <div className="wm-tl-empty" style={{ borderBottom: borderStyle }} />
                  )}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 48, borderBottom: borderStyle }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: dotBg, color: dotColor, ...mono, fontSize: 10.5, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>{d.n}</div>
                  </div>
                  {d.side === "R" ? (
                    <div className="wm-tl-right" style={{ padding: "44px 0 44px 52px", borderBottom: borderStyle }}>{Content}</div>
                  ) : (
                    <div className="wm-tl-empty" style={{ borderBottom: borderStyle }} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="rv" style={{ marginTop: 40 }}>
            <Link to="/compare" style={{ color: CORAL, textDecoration: "underline", textUnderlineOffset: 3, fontSize: 15 }}>
              See how MOXIEMO compares with ChatGPT, Claude, Jasper and five other tools →
            </Link>
          </div>
        </div>
      </section>

      {/* §6 SPLIT IS THIS RIGHT FOR YOU */}
      <section className="wm-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* Left For You */}
        <div style={{ background: SAGE, padding: "88px 60px 88px 40px" }}>
          <div style={{ maxWidth: 520, margin: "0 0 0 auto" }}>
            <div className="rv" style={{ marginBottom: 40 }}>
              <Eyebrow num="06" name="Who is this for" color={SAGE_MUTED} />
              <h2 style={{ ...display, fontWeight: 700, fontSize: "clamp(34px,4vw,52px)", lineHeight: 0.97, letterSpacing: "-0.025em", color: INK, margin: 0 }}>
                This is <span style={{ fontWeight: 300, fontStyle: "italic", color: "#6d7a5e" }}>for you</span> if…
              </h2>
            </div>
            {forYou.map((it, i) => (
              <div key={it.t} className={`rv ${i === 0 ? "" : `d${i}`}`} style={{ padding: "20px 0", borderBottom: i === forYou.length - 1 ? "none" : "1px solid rgba(19,19,15,0.1)", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: CORAL, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none", marginTop: 2 }}>
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4l3 3L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: INK, marginBottom: 4 }}>{it.t}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.55, color: SAGE_BODY }}>{it.b}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Not For You */}
        <div style={{ background: INK, padding: "88px 40px 88px 60px" }}>
          <div style={{ maxWidth: 520 }}>
            <div className="rv" style={{ marginBottom: 40 }}>
              <div style={{ height: 18, marginBottom: 18 }} />
              <h2 style={{ ...display, fontWeight: 700, fontSize: "clamp(34px,4vw,52px)", lineHeight: 0.97, letterSpacing: "-0.025em", color: CREAM, margin: 0 }}>
                This is <span style={{ fontWeight: 300, fontStyle: "italic", color: "rgba(244,239,229,0.3)" }}>not for you</span> if…
              </h2>
            </div>
            {notForYou.map((it, i) => (
              <div key={it.t} className={`rv ${i === 0 ? "" : `d${i}`}`} style={{ padding: "20px 0", borderBottom: i === notForYou.length - 1 ? "none" : "1px solid rgba(244,239,229,0.08)", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", border: "1.5px solid rgba(244,239,229,0.18)", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none", marginTop: 2 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="rgba(244,239,229,0.38)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: CREAM, marginBottom: 4 }}>{it.t}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "rgba(244,239,229,0.45)" }}>{it.b}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER NOTE */}
      <section style={{ background: CREAM, padding: "96px 40px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div className="rv" style={{ ...mono, fontSize: 11.5, textTransform: "uppercase", color: CORAL_DARK, marginBottom: 24 }}>Why I built it</div>
          <p className="rv d1" style={{ fontSize: 18, lineHeight: 1.65, color: MUTED, margin: "0 0 28px" }}>For 15 years I watched brilliant founders confuse having a brand with having a plan to grow. Beautiful logos, good websites, and no clarity on who they were for, where those people were or what to do first. What they needed most was the right order. MOXIEMO is built to find what comes first, and MOXIE is built to make sure it happens.</p>
          <p className="rv d2" style={{ ...display, fontSize: 25, color: INK, margin: 0 }}>Karee Laing, Founder</p>
        </div>
      </section>

      {/* §7 CTA */}
      <section style={{ background: SAGE, padding: "120px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="rv" style={{ marginBottom: 48 }}>
            <h2 style={{ ...display, fontWeight: 700, fontSize: "clamp(52px,8.5vw,116px)", lineHeight: 0.91, letterSpacing: "-0.03em", color: INK, margin: "0 0 14px" }}>
              Ready when<br />you are.
            </h2>
            <div style={{ ...display, fontWeight: 300, fontStyle: "italic", fontSize: "clamp(22px,3vw,40px)", lineHeight: 1.2, color: "#6d7a5e" }}>
              Start with the free growth assessment. Then claim one of 100 founding seats at 50% off for life.
            </div>
          </div>
          <div className="rv d1" style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 28 }}>
            <Link to="/brand-audit" style={{ background: INK, color: "#f7f3ea", fontWeight: 700, fontSize: 15.5, padding: "18px 32px", borderRadius: 999, textDecoration: "none", display: "inline-block" }}>
              Get my free growth assessment →
            </Link>
            <Link to="/founding" onClick={trackCtaClick} style={{ whiteSpace: "nowrap", background: "transparent", color: INK, border: "1.5px solid rgba(19,19,15,0.25)", fontWeight: 600, fontSize: 15.5, padding: "17px 32px", borderRadius: 999, textDecoration: "none", display: "inline-block" }}>
              {getCtaLabel()}
            </Link>
          </div>
          <div className="rv d2" style={{ display: "flex", gap: 10, alignItems: "center", ...mono, fontSize: 11.5, letterSpacing: "0.16em", textTransform: "uppercase", color: SAGE_MUTED }}>
            <span style={{ width: 7, height: 7, background: CORAL, display: "inline-block" }} />
            PLANS FROM $99 A MONTH · 50% OFF FOR LIFE FOR 100 FOUNDING MEMBERS
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
