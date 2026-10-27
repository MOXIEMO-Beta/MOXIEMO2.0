import { useEffect, type CSSProperties } from "react";
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

const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };
const display: CSSProperties = { fontFamily: "'Newsreader', Georgia, serif" };

const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
.wm-page{background:${CREAM};color:${INK};font-family:'Hanken Grotesk',system-ui,sans-serif;}
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
    why: "The problem was not capacity. It was system complexity. Adding a person to chaos does not eliminate the chaos.",
  },
  {
    n: "02",
    tool: "Built Zapier automations",
    desc: "Spent hours wiring workflows to connect your tools.",
    happened: "It felt brilliant when it worked. Then one stopped firing. Then another broke silently. Now you are debugging webhooks on Sunday nights.",
    why: "Integration layers add complexity. When tools update, integrations break. You end up maintaining infrastructure, not marketing.",
  },
  {
    n: "03",
    tool: "Looked at HubSpot",
    desc: "Evaluated enterprise marketing automation for your business.",
    happened: "You loved the demo. Then you saw the enterprise price, the months-long implementation, and the mixed reviews. You walked away.",
    why: "Built for enterprises with marketing teams and IT departments. Not for lean, founder-led businesses.",
  },
  {
    n: "04",
    tool: "Tried all-in-one platforms",
    desc: "Consolidated onto Kajabi or Teachable to simplify the stack.",
    happened: "You still needed a separate tool for advanced email. Another for scheduling. Another for social. Another for contracts. Same number of tools, just rearranged.",
    why: "All-in-one platforms do one thing well and need supplements for everything else.",
  },
  {
    n: "05",
    tool: "Used generic AI tools",
    desc: "ChatGPT, Claude, or Jasper to write content faster.",
    happened: "The drafts came out generic. You saved a little time writing and added complexity everywhere else. Still moving content across six platforms.",
    why: "Generic AI does not know your business, your voice, or your strategy. And it does not solve fragmentation.",
  },
];

const convergences = [
  { n: "01", label: "AI matured", h: "The tools caught up to the vision.", b: "ChatGPT proved AI can create quality content. MOXIEMO goes further: AI that knows your business, your voice, and your strategy." },
  { n: "02", label: "Fragmentation hit a breaking point", h: "The market is rejecting complexity.", b: "Companies are walking away from bloated marketing automation. The stack era is over. One system that works is winning." },
  { n: "03", label: "The messy middle is underserved", h: "Nobody is building for you.", b: "Tools are built for startups or enterprises. Founders with real traction and no marketing team get ignored. That is exactly where MOXIEMO fits." },
];

const differences = [
  { n: "01", side: "L", t: "We start with strategy", them: "Jump straight to execution. What do you want to post.", us: "Strategic discovery first. Who you serve, what transformation you provide, and your voice. All before any content gets written." },
  { n: "02", side: "R", t: "Strategy is a living system", them: "A consultant hands you a strategy document you reference manually until it goes stale.", us: "Strategy embedded in every tool. You never forget it, because the system enforces it automatically." },
  { n: "03", side: "L", t: "True consolidation", them: "Integration platforms connect fragmented tools, and all-in-ones still need three or four supplements.", us: "Replaces the tools entirely. No integrations, because everything is native. One login, one source of truth." },
  { n: "04", side: "R", t: "Built for the messy middle", them: "Tools for startups (too simple) or enterprises (too complex and expensive).", us: "Founders past the scrappy start but without a full marketing team. Simple enough to use without training. Sophisticated enough to grow with you." },
  { n: "05", side: "L", t: "AI that knows your business", them: "Generic AI that needs prompting, and produces generic output.", us: "AI trained on your strategic foundation. It knows your voice, your positioning, and your audience. It sounds like you wrote it." },
];

const forYou = [
  { t: "You have built something real", b: "Not a side hobby. You are serious about growth, and you need marketing that actually works." },
  { t: "You are done juggling disconnected tools", b: "Tired of paying for tools that do not talk to each other, with no strategy holding them together." },
  { t: "You want strategy and execution, not just post ideas", b: "A complete go-to-market: the strategy, the content, and the distribution. Not a board of prompts." },
  { t: "You want the system to work, with your hand on it", b: "MOXIEMO plans, writes, schedules, and publishes. You review, approve, and steer. You stay the owner without the grind." },
  { t: "You want your time back for the work only you can do", b: "A few minutes steering the system rather than hours building content from scratch." },
  { t: "You want agency-level strategy without the agency price", b: "Real strategy and execution at a price that makes sense for a founder or a growing business." },
];

const notForYou = [
  { t: "You want to hand it off and never look at it again", b: "MOXIEMO runs the work, but you stay the strategic owner. You review and approve. Disappearing completely is not this." },
  { t: "You expect results without strategy", b: "MOXIEMO is built strategy-first. If you just want to post and hope, this is not the fit." },
  { t: "You only want a list of content ideas", b: "MOXIEMO is a full go-to-market system. If all you need is post prompts, this is more than you need." },
  { t: "You do not believe marketing needs a foundation", b: "A brand is not a go-to-market. If you are not willing to get clear on who you are for, the system cannot do its best work." },
  { t: "You are not ready to invest in your marketing yet", b: "MOXIEMO starts at $79 a month, not free. If you cannot commit to investing in your growth right now, this is not the moment." },
];

const tickerPhrases = [
  "You tried every tool",
  "None of them had a foundation",
  "MOXIEMO is the foundation",
  "Strategy first. Always.",
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

export default function WhyMoxie() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".rv,.rvl,.rvr").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="wm-page" style={{ minHeight: "100vh" }}>
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

          <h1 className="rv d1" style={{ ...display, fontWeight: 700, fontSize: "clamp(72px,11vw,164px)", lineHeight: 0.88, letterSpacing: "-0.035em", color: CREAM, margin: "0 0 4px" }}>Not another</h1>
          <h1 className="rv d2" style={{ ...display, fontWeight: 700, fontSize: "clamp(72px,11vw,164px)", lineHeight: 0.88, letterSpacing: "-0.035em", color: CREAM, margin: "0 0 6px" }}>tool.</h1>
          <h1 className="rv d3" style={{ ...display, fontWeight: 300, fontStyle: "italic", fontSize: "clamp(72px,11vw,164px)", lineHeight: 0.88, letterSpacing: "-0.035em", color: "rgba(244,239,229,0.17)", margin: 0 }}>A growth system.</h1>

          <div className="wm-hero-grid rv d4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid rgba(244,239,229,0.1)", marginTop: 80 }}>
            <div style={{ padding: "28px 40px 40px 0", borderRight: "1px solid rgba(244,239,229,0.1)" }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(244,239,229,0.26)", marginBottom: 12 }}>The problem</div>
              <p style={{ fontSize: 15, lineHeight: 1.62, color: "rgba(244,239,229,0.5)", margin: 0 }}>
                Tools bolted onto a go-to-market that was never built. VAs, Zapier, HubSpot, all-in-ones, and generic AI. All failed for the same reason.
              </p>
            </div>
            <div style={{ padding: "28px 40px 40px 40px", borderRight: "1px solid rgba(244,239,229,0.1)" }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(244,239,229,0.26)", marginBottom: 12 }}>The system</div>
              <p style={{ fontSize: 15, lineHeight: 1.62, color: "rgba(244,239,229,0.5)", margin: 0 }}>
                MOXIEMO finds what makes you valuable, builds your strategy, executes the content, and proves it's working. Strategy first. Always.
              </p>
            </div>
            <div style={{ padding: "28px 0 40px 40px" }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(244,239,229,0.26)", marginBottom: 12 }}>Start here</div>
              <p style={{ fontSize: 15, lineHeight: 1.62, color: "rgba(244,239,229,0.5)", margin: "0 0 18px" }}>
                Free Discovery. Build your strategy in one guided session. No credit card required.
              </p>
              <Link to="/auth" style={{ background: CORAL, color: "#fff", fontWeight: 700, fontSize: 14, padding: "14px 24px", borderRadius: 999, textDecoration: "none", display: "inline-block" }}>
                Start free Discovery →
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
                And exactly why none of it stuck.
              </h2>
            </div>
            <div className="rvr">
              <p style={{ fontSize: 18, lineHeight: 1.55, color: MUTED, maxWidth: 460, margin: "0 0 0 auto" }}>
                The problem was never effort, capacity, or the individual tools. It was building execution on a marketing foundation that was never built.
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

      {/* §4 THREE CONVERGENCES */}
      <section style={{ background: SAGE, padding: "96px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 60 }}>
            <div className="rv"><Eyebrow num="04" name="Why now" color={SAGE_MUTED} /></div>
            <h2 className="rv d1" style={{ ...display, fontWeight: 700, fontSize: "clamp(38px,5vw,68px)", lineHeight: 0.95, letterSpacing: "-0.025em", color: INK, margin: 0 }}>
              Three convergences make<br />
              <span style={{ fontWeight: 300, fontStyle: "italic", color: "#6d7a5e" }}>this the right moment.</span>
            </h2>
          </div>

          <div className="wm-conv-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(19,19,15,0.1)" }}>
            {convergences.map((c, i) => (
              <div key={c.n} className={`rv d${i + 1}`} style={{ background: SAGE, padding: "48px 40px" }}>
                <div style={{ ...display, fontWeight: 700, fontSize: 80, color: "rgba(19,19,15,0.08)", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 24 }}>{c.n}</div>
                <div style={{ ...mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: SAGE_MUTED, marginBottom: 13 }}>{c.label}</div>
                <h3 style={{ ...display, fontWeight: 600, fontSize: 25, lineHeight: 1.2, color: INK, margin: "0 0 13px" }}>{c.h}</h3>
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
            <div className="rv"><Eyebrow num="05" name="What makes MOXIEMO unreplicable" /></div>
            <h2 className="rv d1" style={{ ...display, fontWeight: 700, fontSize: "clamp(38px,5vw,68px)", lineHeight: 0.95, letterSpacing: "-0.025em", color: INK, margin: 0 }}>
              Five differences nobody else can copy.
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
                      <span style={{ color: "#3a382f", fontWeight: 600 }}>Everyone else: </span>{d.them}
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
        </div>
      </section>

      {/* §6 SPLIT — IS THIS RIGHT FOR YOU */}
      <section className="wm-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* Left — For You */}
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

        {/* Right — Not For You */}
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

      {/* §7 CTA */}
      <section style={{ background: SAGE, padding: "120px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="rv" style={{ marginBottom: 48 }}>
            <h2 style={{ ...display, fontWeight: 700, fontSize: "clamp(52px,8.5vw,116px)", lineHeight: 0.91, letterSpacing: "-0.03em", color: INK, margin: "0 0 14px" }}>
              Ready when<br />you are.
            </h2>
            <div style={{ ...display, fontWeight: 300, fontStyle: "italic", fontSize: "clamp(22px,3vw,40px)", lineHeight: 1.2, color: "#6d7a5e" }}>
              Start your MOXIEMO Discovery in under a minute.
            </div>
          </div>
          <div className="rv d1" style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 28 }}>
            <Link to="/auth" style={{ background: INK, color: "#f7f3ea", fontWeight: 700, fontSize: 15.5, padding: "18px 32px", borderRadius: 999, textDecoration: "none", display: "inline-block" }}>
              Start free Discovery →
            </Link>
            <Link to="/founding" style={{ background: "transparent", color: INK, border: "1.5px solid rgba(19,19,15,0.25)", fontWeight: 600, fontSize: 15.5, padding: "17px 32px", borderRadius: 999, textDecoration: "none", display: "inline-block" }}>
              Join as Founding Member
            </Link>
          </div>
          <div className="rv d2" style={{ display: "flex", gap: 10, alignItems: "center", ...mono, fontSize: 11.5, letterSpacing: "0.16em", textTransform: "uppercase", color: SAGE_MUTED }}>
            <span style={{ width: 7, height: 7, background: CORAL, display: "inline-block" }} />
            Founding members get free access · No credit card required
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
