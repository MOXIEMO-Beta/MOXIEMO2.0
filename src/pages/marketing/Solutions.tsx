import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import expertiseImg from "@/assets/redesign/expertise-founders.jpg.asset.json";
import serviceImg from "@/assets/redesign/service-businesses.jpg.asset.json";
import growingImg from "@/assets/redesign/growing-businesses.jpg.asset.json";

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

const display: CSSProperties = { fontFamily: "'Newsreader', Georgia, serif" };
const body: CSSProperties = { fontFamily: "'Hanken Grotesk', system-ui, sans-serif" };
const mono: CSSProperties = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };

const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,340;1,400;1,500;1,600&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
.sol-page { background:${CREAM}; color:${INK}; font-family:'Hanken Grotesk', system-ui, sans-serif; }
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
.persona-chip{padding:11px 24px;background:transparent;border:1.5px solid rgba(19,19,15,0.18);border-radius:999px;font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:${MUTED};cursor:pointer;transition:all .22s ease;white-space:nowrap;}
.persona-chip:hover{border-color:${INK};color:${INK};}
.persona-chip.active{background:${INK};border-color:${INK};color:#f7f3ea;}
.sol-cta-primary{background:${CORAL};color:#fff;font-weight:700;font-size:15px;padding:16px 28px;border-radius:999px;display:inline-block;text-decoration:none;transition:background .2s;}
.sol-cta-primary:hover{background:${CORAL_HOVER};}
.sol-cta-secondary{background:transparent;color:${INK};border:1.5px solid rgba(19,19,15,0.25);font-weight:600;font-size:15px;padding:16px 28px;border-radius:999px;display:inline-block;text-decoration:none;transition:border-color .2s;}
.sol-cta-secondary:hover{border-color:${INK};}
@media (max-width: 900px){
  .sol-grid-2,.sol-grid-2-rev,.sol-hero-grid{grid-template-columns:1fr !important;}
  .sol-grid-4{grid-template-columns:1fr 1fr !important;}
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
    t: "The backwards go-to-market problem",
    p: "You are asking \"what should I post this week?\" before you have answered who you are posting for, what they need to hear, or whether you are reaching them where they are.",
    a: "Discovery answers the foundation questions first. Every piece of content and every distribution decision runs from that foundation. Not the other way around.",
  },
  {
    t: "The tool chaos problem",
    p: "You have six tools. The data is scattered. Integrations break. You hired a VA to manage it and spent more time managing the VA than the marketing.",
    a: "One platform handles strategy, content creation, and publishing. Strategy to published, without the stack.",
  },
  {
    t: "The disconnected content problem",
    p: "You post when you remember. You email when you have something to say. Nothing connects to a coherent narrative, and it does not sound like a brand with a strategy behind it.",
    a: "Your content pillars and campaign themes give every piece of content a reason to exist. Random posts become a brand narrative.",
  },
  {
    t: "The blank screen problem",
    p: "It is Wednesday. You open LinkedIn. Nothing comes. You write something generic, delete it, and close the tab.",
    a: "Strategy-aligned topics tied to your content pillars and audience pain points are always waiting. The blank screen is not a MOXIEMO problem.",
  },
  {
    t: "The scale problem",
    p: "You cannot grow without more marketing hours. More marketing hours means less time on the work that actually earns revenue. The equation does not balance.",
    a: "The system scales. You get back the hours that were going to managing tools and starting from scratch each week. That time goes back to your business.",
  },
];

const personas = [
  {
    chip: "Expertise-Based Founders",
    img: expertiseImg.url,
    h: "Coaches, consultants, fractional executives, and advisors.",
    p: "Your expertise is the product. Your marketing should reflect the depth of what you know and the track record you have built. Instead it is inconsistent, disconnected from your positioning, and falling behind the work you do for clients.",
    bullets: [
      "A strategy foundation that reflects your real depth",
      "Content that communicates the transformation you create",
      "A system that runs so you are not choosing between client work and marketing",
    ],
  },
  {
    chip: "Service-Based Businesses",
    img: serviceImg.url,
    h: "Agencies and service businesses that deliver exceptional work.",
    p: "Your own go-to-market is the afterthought. Your team is busy serving clients. Your visibility suffers for it. You know the value is there — the market does not always know you exist.",
    bullets: [
      "A clear positioning and distribution strategy",
      "Content that communicates what you do and why it matters",
      "A system that keeps you visible without pulling the team off client work",
    ],
  },
  {
    chip: "Growing Businesses",
    img: growingImg.url,
    h: "Businesses that have outgrown the scrappy phase and are ready to systematize.",
    p: "Your marketing is still being done the way you did it in year one: manual, fragmented, reactive. You are making real money. You are ready for a system, not another tool.",
    bullets: [
      "A go-to-market that is actually built, not improvised",
      "Content and distribution that runs from strategy",
      "A platform that grows with you into the autonomous phase in Beta 2.0",
    ],
  },
];

const faqGroups: { label: string; items: { q: string; a: string }[] }[] = [
  {
    label: "How It Works",
    items: [
      { q: "What is the difference between having a brand and having a go-to-market?", a: "A brand tells people who you are. A go-to-market answers the harder questions: Who exactly is your ideal customer and what keeps them up at night? Where are they, and are you reaching them there? What do they need to hear from you, and are you saying it in a way that resonates? How do you turn attention into trust and trust into revenue? Most founders have invested in their brand but have never built a real go-to-market underneath it. The content is inconsistent, the distribution is accidental, and the results do not match the effort. That is not a hustle problem. It is a foundation problem. MOXIEMO builds the foundation first." },
      { q: "How does MOXIEMO Discovery actually work?", a: "Discovery is a guided conversation, not a form and not a quiz. MOXIEMO asks you questions about your business: who you serve, the transformation you provide, your voice, your goals, and your biggest marketing challenges. You answer in your own words. Build your foundation in one guided session. When you are done, MOXIEMO synthesizes everything into your complete marketing foundation: positioning, ICP, content pillars, voice guidelines, and channel plan. It does not scrape your website. It builds from you." },
      { q: "How long does it take to get set up?", a: "Start with Discovery in one guided session, review your strategy, and create your first piece of content. There is no onboarding call required and no data migration." },
      { q: "What happens after I complete Discovery?", a: "Your marketing foundation is live in the platform. MOXIEMO uses it to generate content, plan your calendar, and run your campaigns. You never re-explain who you are or what you do. Every tool inside MOXIEMO already knows your strategy, so everything you generate from that point forward is anchored to your positioning, voice, and goals automatically." },
    ],
  },
  {
    label: "The AI Angle",
    items: [
      { q: "Will the content actually sound like me, or will it sound like AI?", a: "It depends on how much you put into Discovery, and that is the honest answer. Before any AI touches your content, it reads your full strategy: your voice, your ideal customer, your positioning, your content pillars, and the exact language you used in Discovery. The more specific you are, the more your content sounds like you. The output is AI-generated, which means you should review it, edit it, and put your real fingerprint on what goes out. MOXIEMO gives you a strong, on-strategy starting point. You make it final." },
      { q: "Do I need to know anything about AI to use MOXIEMO?", a: "No. MOXIEMO is built for operators, not engineers. You do not configure anything, you do not write prompts, and you do not need to understand how the AI works underneath. You answer questions in Discovery, review the content before it publishes, and give a direction when something needs adjusting." },
      { q: "What AI does MOXIEMO use?", a: "MOXIEMO is built on Claude by Anthropic, chosen specifically for its strength in reasoning and voice-accurate writing. That matters when the point is to sound like you rather than like everyone else. Your Discovery responses and strategy data are used only to generate your content. We do not use your data to train AI models." },
    ],
  },
  {
    label: "Practical Concerns",
    items: [
      { q: "What tools does MOXIEMO replace?", a: "For most founders, MOXIEMO replaces a content scheduler, a social publisher, a content planner, a strategy document, and a content calendar tool, along with the time spent coordinating between all of them. Most founding members come in with four to six tools and consolidate to one." },
      { q: "Can I edit the content MOXIEMO generates?", a: "Yes, always. Every piece of content lands in a fully editable area before it goes anywhere. You can rewrite sentences, change the tone, add a personal story, or give MOXIEMO a single instruction like \"make this shorter.\" Nothing publishes without your approval." },
      { q: "What if I want to change my strategy later?", a: "Your strategy is a living document, not a locked file. You can edit any section of your marketing foundation at any time. When you update your strategy, all future content generation automatically reflects the changes. You can also run a full Discovery refresh anytime you want a complete reset." },
    ],
  },
  {
    label: "Pricing and Commitment",
    items: [
      { q: "What does founding member access include?", a: "Founding members get free platform access during the private beta: MOXIEMO Discovery, your complete marketing foundation, content generation, the marketing planner, and LinkedIn publishing. When paid tiers launch publicly, founding members get first access to every new feature and the lowest available pricing. You will always pay less than anyone who joins after you." },
      { q: "Is there a contract, or can I cancel anytime?", a: "No contracts, ever. Paid plans are month to month and you can cancel anytime from your account settings. No fees, no friction, no calls required. For founding members, there is nothing to cancel. Your founding member access is free and it continues." },
      { q: "What happens when the beta ends?", a: "Your founding member access stays free permanently. That is the founding member promise. When we move out of beta, new users pay standard pricing. Founding members who want expanded features get first access and locked-in rates well below what new users pay. The founding member Discord is live — submit feedback, request features, and talk directly with Karee about what comes next." },
    ],
  },
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

  const moves = [
    {
      num: "01",
      label: "Discover",
      h: "Find what makes you",
      hI: "worth choosing.",
      paras: [
        "Discovery is a guided conversation. MOXIEMO asks the questions, you answer in your own words, and the system synthesizes a real marketing foundation underneath your business.",
        "Twenty minutes in, you have positioning, an ideal client framework, brand voice, and content pillars. Not a slide deck. A live foundation that powers everything else.",
      ],
      bullets: [
        "Strategic brand discovery through guided conversation",
        "Positioning, ICP, and messaging framework",
        "Content pillars and brand voice system",
        "Downloadable strategy foundation document",
      ],
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
      label: "Create",
      h: "Turn your strategy into content,",
      hI: "not guesses.",
      paras: [
        "Every piece of content starts from your foundation. The tool already knows your voice, your audience, and what you stand for, so you are not feeding a blank prompt every time.",
        "You generate, you edit, you approve. The starting point is on-strategy. The final word is always yours.",
      ],
      bullets: [
        "Content generated from your strategy, not generic prompts",
        "Social content across Facebook, LinkedIn, Instagram, and YouTube",
        "Email content in your voice",
        "Platform-specific content rules built in",
      ],
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
      label: "Distribute",
      h: "Put it in market.",
      hI: "Deliberately.",
      paras: [
        "Distribution stops being a thing you remember to do on Wednesdays. You see the month at a glance, your campaign themes, and exactly what is going out, where, and when.",
        "Publishing is built in. LinkedIn is live now. Facebook and Instagram are coming next.",
      ],
      bullets: [
        "Marketing planner and content calendar",
        "Campaign planning and quarterly themes",
        "Direct publishing to LinkedIn",
        "Facebook & Instagram publishing  (coming)",
      ],
      mock: (
        <MockupShell title="Marketing Planner">
          <div style={{ padding: "14px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...mono, fontSize: 11, textTransform: "uppercase", color: "rgba(244,239,229,0.65)" }}>June 2025</span>
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
      label: "Grow",
      h: "Prove it is working.",
      hI: "Then do more of it.",
      paras: [
        "Numbers without context are noise. MOXIEMO ties what you posted back to what you said mattered: your pillars, your campaigns, your strategy.",
        "Beta 2.0 closes the loop. The system will recommend what to do more of, what to drop, and where to push next.",
      ],
      bullets: [
        "Insights on your publishing",
        "Performance tied back to your strategy",
        "Autonomous loop with recommendations  (Beta 2.0)",
      ],
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
            <div style={{ border: "1px solid rgba(239,111,83,0.22)", borderRadius: 10, padding: 12, marginTop: 13 }}>
              <div style={{ ...mono, fontSize: 9, textTransform: "uppercase", color: CORAL, marginBottom: 6 }}>Beta 2.0 · Coming</div>
              <div style={{ fontSize: 12.5, color: "rgba(244,239,229,0.55)", lineHeight: 1.5 }}>
                Autonomous loop: plan, create, distribute, and optimize without starting from scratch each cycle.
              </div>
            </div>
          </div>
        </MockupShell>
      ),
    },
  ];

  const features = [
    { phase: "Discover", status: "Live now", items: ["Guided brand discovery","Positioning & ICP framework","Messaging & brand voice","Content pillars","Campaign planning","Strategy foundation doc"], muted: [] as number[] },
    { phase: "Create", status: "Live now", items: ["AI content from your strategy","LinkedIn, Instagram, Facebook","YouTube video content","Email content in your voice","Platform formatting rules"], muted: [] },
    { phase: "Distribute", status: "Live now", items: ["Marketing planner","Content calendar","Direct publishing to LinkedIn","Facebook & Instagram (coming)"], muted: [3] },
    { phase: "Grow", status: "Live now", items: ["Publishing insights","Performance by strategy","Autonomous loop (Beta 2.0)"], muted: [2] },
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
              <span style={{ display: "block", fontWeight: 600, fontSize: "clamp(42px, 5.4vw, 76px)", color: INK }}>Your brand is built.</span>
              <span style={{ display: "block", fontWeight: 340, fontStyle: "italic", fontSize: "clamp(42px, 5.4vw, 76px)", color: "#6d7a5e" }}>Your go-to-market is not.</span>
            </h1>
            <p className="reveal d2" style={{ fontSize: 18, color: SAGE_BODY, maxWidth: 520, marginTop: 28, marginBottom: 40, lineHeight: 1.55 }}>
              MOXIEMO is the AI CMO that builds your strategy, generates your content, and distributes it across channels. One system. One foundation. In order.
            </p>
            <div className="reveal d3" style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              <Link to="/brand-audit" className="sol-cta-primary">Run my free Brand Audit →</Link>
              <Link to="/founding" className="sol-cta-secondary">Join as Founding Member</Link>
            </div>
          </div>

          <div className="reveal-r" style={{ background: INK, borderRadius: 22, padding: "32px 28px", border: "1px solid rgba(244,239,229,0.08)", boxShadow: "0 40px 80px -40px rgba(19,19,15,0.55)" }}>
            <div style={{ ...mono, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(244,239,229,0.35)", marginBottom: 28 }}>
              One system. Four moves.
            </div>
            {[
              { n: "01", l: "Discover", d: "Build your complete marketing foundation through guided conversation." },
              { n: "02", l: "Create", d: "Generate content in your voice, from your strategy, for every platform." },
              { n: "03", l: "Distribute", d: "Publish to your channels with a real calendar and publishing system." },
              { n: "04", l: "Grow", d: "See what performed and close the loop with the autonomous system." },
            ].map((row, i, arr) => {
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
                    {i < arr.length - 1 && <span style={{ width: 1.5, flex: 1, minHeight: 24, background: "rgba(244,239,229,0.1)" }} />}
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
      </section>

      {/* §2 The Problem */}
      <section style={{ background: CREAM }}>
        <div className="mx-auto" style={{ maxWidth: 1200, padding: "100px 40px 0" }}>
          <div className="reveal" style={{ marginBottom: 48 }}>
            <Eyebrow num="01" name="The Problem" />
          </div>
          <div className="reveal" style={{ paddingBottom: 72, borderBottom: "1px solid rgba(19,19,15,0.08)" }}>
            <h2 style={{ ...display, fontWeight: 600, fontSize: "clamp(52px, 7.6vw, 108px)", lineHeight: 0.94, letterSpacing: "-0.03em", color: INK, margin: 0, marginBottom: 6 }}>You have a brand.</h2>
            <p style={{ ...display, fontWeight: 340, fontStyle: "italic", fontSize: "clamp(42px, 6.2vw, 90px)", lineHeight: 0.96, letterSpacing: "-0.03em", color: "#6d7a5e", margin: 0 }}>That is not the same as a go-to-market.</p>
          </div>
          <div className="sol-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, padding: "72px 0 100px", alignItems: "start" }}>
            <div className="reveal-l" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <p style={{ fontSize: 18, color: SAGE_BODY, lineHeight: 1.6, margin: 0 }}>Most founders have done the brand work. A logo, brand colors, a website that looks good, maybe even a brand guide in a folder somewhere.</p>
              <p style={{ fontSize: 18, color: SAGE_BODY, lineHeight: 1.6, margin: 0 }}>But a brand tells people who you are.</p>
              <p style={{ fontSize: 18, color: SAGE_BODY, lineHeight: 1.6, margin: 0 }}>A go-to-market answers harder questions. Who exactly is your ideal customer, and what keeps them up at night? Where are they, and are you reaching them where they actually are? What do they need to hear from you, and are you saying it in a way that resonates?</p>
            </div>
            <div className="reveal-r">
              <p style={{ fontSize: 18, color: SAGE_BODY, lineHeight: 1.6, marginBottom: 32 }}>
                Distribution is not a tactic. It is a decision. Without a real strategy underneath it, even the best content disappears into the noise.
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
              One system. Four moves. <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>In order.</span>
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
              The problems MOXIEMO <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>actually solves.</span>
            </h2>
            <p style={{ fontSize: 17, color: MUTED, maxWidth: 560, marginTop: 18 }}>These are not tool problems. They are go-to-market problems. Five of them. You will recognize at least three.</p>
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
                      <div style={{ display: "flex", gap: 14, marginTop: 22, alignItems: "flex-start" }}>
                        <span style={{ width: 7, height: 7, background: CORAL, marginTop: 8, flexShrink: 0 }} />
                        <div>
                          <div style={{ ...mono, fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.18em", color: "#5f6a52", marginBottom: 6 }}>With MOXIEMO</div>
                          <p style={{ fontSize: 15, color: "#2e3a28", margin: 0, lineHeight: 1.55 }}>{pr.a}</p>
                        </div>
                      </div>
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
              Not for everyone. <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>Built for a specific kind of founder.</span>
            </h2>
            <p style={{ fontSize: 17, color: SAGE_BODY, maxWidth: 560, margin: "20px auto 0" }}>
              For founders and growing businesses who are past the scrappy start and serious about showing up consistently, without hiring a full marketing team.
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
              Everything in one place. <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>Nothing you do not need.</span>
            </h2>
            <p style={{ fontSize: 17, color: MUTED, marginTop: 18 }}>Here is exactly what is live today, and what is arriving in Beta 2.0.</p>
          </div>

          <div className="reveal sol-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2, background: "rgba(19,19,15,0.08)", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
            {features.map((f) => (
              <div key={f.phase} style={{ background: OFFWHITE, padding: "28px 24px" }}>
                <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", color: CORAL, marginBottom: 5, letterSpacing: "0.16em" }}>{f.phase}</div>
                <div style={{ ...mono, fontSize: 9.5, textTransform: "uppercase", color: LIGHT_MUTED, marginBottom: 18, letterSpacing: "0.16em" }}>{f.status}</div>
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

          <div className="reveal sol-grid-2" style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: 20 }}>
            <div style={{ background: INK, borderRadius: 18, padding: "32px 30px" }}>
              <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", color: CORAL, letterSpacing: "0.16em", marginBottom: 8 }}>Beta 2.0 · Coming</div>
              <h4 style={{ ...display, fontWeight: 600, fontSize: 20, color: "#f7f3ea", margin: 0, marginBottom: 18 }}>The autonomous loop</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {["Autonomous plan, create, distribute","Multi-seat access","Email provider integration","MCP integration"].map((x) => (
                  <div key={x} style={{ fontSize: 13.5, color: "rgba(244,239,229,0.6)" }}>{x}</div>
                ))}
              </div>
            </div>
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
              Everything you want to know <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>before you get started.</span>
            </h2>
            <p style={{ fontSize: 17, color: MUTED, maxWidth: 500, margin: "20px auto 0" }}>No fluff. No non-answers. Straight answers to the questions we hear every week.</p>
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
                      <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.7, margin: 0, marginTop: 18, paddingRight: 40 }}>{it.a}</p>
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
            Your go-to-market is not built yet. <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>Build it through one guided session.</span>
          </h2>
          <p className="reveal" style={{ fontSize: 18, color: SAGE_BODY, maxWidth: 520, margin: "28px auto 40px", lineHeight: 1.6 }}>
            Start with Discovery. See what MOXIEMO builds from who you actually are.
          </p>
          <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            <Link to="/brand-audit" style={{ background: CORAL, color: "#fff", fontWeight: 700, fontSize: 16, padding: "17px 30px", borderRadius: 999, textDecoration: "none" }}>Run my free Brand Audit →</Link>
            <Link to="/founding" style={{ background: INK, color: "#f7f3ea", fontWeight: 600, fontSize: 16, padding: "17px 30px", borderRadius: 999, textDecoration: "none" }}>Join as Founding Member</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
