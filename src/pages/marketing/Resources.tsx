import { useState, useRef, FormEvent, type CSSProperties } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RouteMetadata } from "@/components/RouteMetadata";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const collage1 = { url: "/01-hero.png" };
const collage2 = { url: "/05-how-it-works.png" };
const collage3 = { url: "/07-how-we-start.png" };
const collage4 = { url: "/11-meet-moxie.png" };
const collage5 = { url: "/13-phone-full.png" };

/* ───────────── design tokens ───────────── */
const CREAM = "#f4efe5";
const SAGE = "#dce3d2";
const CARD_BG = "#fbf9f3";
const INK = "#13130f";
const CORAL = "#ef6f53";
const CORAL_HOVER = "#d85f44";
const MUTED = "#56544c";
const LIGHT_MUTED = "#6c6a60";
const SAGE_TEXT = "#48533c";
const SAGE_MUTED = "#5f6a52";
const BORDER = "#e6e0d2";
const CARD_BORDER = "#ddd8cb";
const CARD_BORDER_HOVER = "#d8cdb8";

const serif: CSSProperties = { fontFamily: "'Fraunces Variable', Georgia, serif" };
const sans: CSSProperties = { fontFamily: "'DM Sans Variable', system-ui, sans-serif" };
const mono: CSSProperties = { fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace" };

/* ───────────── shared bits ───────────── */
function Eyebrow({
  children,
  color = "#8a887e",
  squareColor = CORAL,
  squareSize = 8,
  size = 12,
  spacing = "0.2em",
  style,
}: {
  children: React.ReactNode;
  color?: string;
  squareColor?: string;
  squareSize?: number;
  size?: number;
  spacing?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        ...mono,
        fontSize: size,
        letterSpacing: spacing,
        textTransform: "uppercase",
        color,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        ...style,
      }}
    >
      <span style={{ width: squareSize, height: squareSize, background: squareColor, display: "inline-block" }} />
      <span>{children}</span>
    </div>
  );
}

/* ───────────── 1. HERO ───────────── */
function Hero() {
  return (
    <section style={{ background: SAGE }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "100px 40px 96px", textAlign: "center" }}>
        <div style={{ marginBottom: 28, display: "flex", justifyContent: "center" }}>
          <Eyebrow color={SAGE_MUTED}>§ · AI Prompt Packs & Toolkits</Eyebrow>
        </div>
        <h1
          style={{
            ...serif,
            fontWeight: 600,
            fontSize: "clamp(42px, 5.6vw, 82px)",
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
            color: INK,
            margin: 0,
          }}
        >
          AI systems and tools
          <br />
          <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>
            for founders, builders &amp; strategic thinkers.
          </span>
        </h1>
        <p
          style={{
            ...sans,
            fontSize: 19,
            lineHeight: 1.55,
            color: SAGE_TEXT,
            maxWidth: 600,
            margin: "32px auto 14px",
          }}
        >
          The exact prompts, frameworks, and toolkits to turn ideas into execution, with clarity, speed, and strategy.
        </p>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
          <Eyebrow color={SAGE_MUTED} squareSize={7} size={11.5} spacing="0.16em">
            Free for everyone · No signup required
          </Eyebrow>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 2. EARLY ACCESS ───────────── */
function EarlyAccess() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hover, setHover] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("resources_waitlist").insert({ email: email.trim().toLowerCase() });
    setLoading(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error("Something went wrong. Try again.");
      return;
    }
    setSubmitted(true);
    setEmail("");
  }

  return (
    <section style={{ background: CREAM }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 40px 8px" }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: INK,
            borderRadius: 24,
            padding: "64px 56px",
            boxShadow: "0 40px 80px -50px rgba(19,19,15,0.6)",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -80,
              top: -80,
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(239,111,83,0.28) 0%, rgba(239,111,83,0) 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            className="ea-grid"
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "1.05fr 0.95fr",
              gap: 56,
              alignItems: "center",
            }}
          >
            <div>
              <Eyebrow color={CORAL} squareSize={7} size={11.5} spacing="0.2em" style={{ marginBottom: 22 }}>
                New packs
              </Eyebrow>
              <h2
                style={{
                  ...serif,
                  fontWeight: 600,
                  fontSize: "clamp(30px, 3.4vw, 46px)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.02em",
                  color: CREAM,
                  margin: 0,
                }}
              >
                Get every new pack
                <br />
                <span style={{ fontWeight: 340, fontStyle: "italic", color: "#c8c6bc" }}>
                  when it drops.
                </span>
              </h2>
              <p
                style={{
                  ...sans,
                  fontSize: 17,
                  lineHeight: 1.6,
                  color: "rgba(244,239,229,0.66)",
                  maxWidth: 420,
                  marginTop: 22,
                }}
              >
                We will email you each new prompt, framework and toolkit as soon as it is ready. Free, like everything here.
              </p>
            </div>
            <div>
              {submitted ? (
                <p style={{ ...sans, color: CREAM, fontSize: 17, fontWeight: 500 }}>You are on the list.</p>
              ) : (
                <form
                  onSubmit={onSubmit}
                  style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
                >
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                      ...sans,
                      flex: "1 1 240px",
                      minWidth: 0,
                      background: "rgba(244,239,229,0.06)",
                      border: `1.5px solid ${focused ? CORAL : "rgba(244,239,229,0.2)"}`,
                      borderRadius: 999,
                      padding: "16px 22px",
                      fontSize: 15,
                      color: CREAM,
                      outline: "none",
                      transition: "border-color .2s",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    style={{
                      ...sans,
                      flex: "none",
                      background: hover ? CORAL_HOVER : CORAL,
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 15,
                      padding: "16px 28px",
                      borderRadius: 999,
                      border: 0,
                      cursor: loading ? "default" : "pointer",
                      transition: "background .2s",
                    }}
                  >
                    Send me new packs →
                  </button>
                </form>
              )}
              <div style={{ marginTop: 16 }}>
                <Eyebrow color="rgba(244,239,229,0.4)" squareSize={6} size={11} spacing="0.14em">
                  Free · No spam
                </Eyebrow>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 820px) {
          .ea-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  );
}

/* ───────────── 3. DROPPING SOON ───────────── */
type DropCard = {
  category: string;
  title: string;
  body: string;
  image: string;
  objectPosition: string;
  viz: React.ReactNode;
};

function ProgressRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ ...mono, fontSize: 9, color: "rgba(244,239,229,0.6)", width: 80, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 6, background: "rgba(244,239,229,0.14)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function Viz1() {
  return (
    <div>
      <ProgressRow label="Positioning" pct={100} color={CORAL} />
      <ProgressRow label="Ideal client" pct={78} color="rgba(239,111,83,0.75)" />
      <ProgressRow label="Voice" pct={64} color="rgba(239,111,83,0.6)" />
      <div style={{ marginBottom: -8 }}>
        <ProgressRow label="Pillars" pct={90} color={CORAL} />
      </div>
    </div>
  );
}

function Viz2() {
  const heights = [24, 34, 46, 60, 76, 90, 100];
  return (
    <div>
      <div style={{ ...mono, fontSize: 10, color: CORAL, marginBottom: 10, letterSpacing: "0.1em" }}>↑ 340% REACH</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 62 }}>
        {heights.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              background: i >= 4 ? CORAL : `rgba(244,239,229,${0.2 + i * 0.025})`,
              borderRadius: "3px 3px 0 0",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Viz3() {
  const left = [92, 72, 84, 60];
  const right = [96, 78, 88, 66];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <div>
        <div style={{ ...mono, fontSize: 9, color: "rgba(244,239,229,0.45)", marginBottom: 9, letterSpacing: "0.1em" }}>GENERIC</div>
        {left.map((w, i) => (
          <div key={i} style={{ height: 6, width: `${w}%`, background: "rgba(244,239,229,0.16)", borderRadius: 3, marginBottom: 6 }} />
        ))}
      </div>
      <div>
        <div style={{ ...mono, fontSize: 9, color: CORAL, marginBottom: 9, letterSpacing: "0.1em" }}>YOUR VOICE</div>
        {right.map((w, i) => (
          <div key={i} style={{ height: 6, width: `${w}%`, background: i % 2 === 0 ? CORAL : "rgba(239,111,83,0.6)", borderRadius: 3, marginBottom: 6 }} />
        ))}
      </div>
    </div>
  );
}

function Viz4() {
  const monthDots = [
    [true, true, true, true, true, true],
    [true, true, true, true, true, false],
    [true, true, false, false, false, false],
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 12 }}>
        {monthDots.map((m, mi) => (
          <div key={mi}>
            <div style={{ ...mono, fontSize: 8.5, color: "rgba(244,239,229,0.45)", marginBottom: 7, letterSpacing: "0.1em" }}>M{mi + 1}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 7px)", gridAutoRows: "7px", gap: 4 }}>
              {m.map((on, i) => (
                <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: on ? CORAL : "rgba(244,239,229,0.2)" }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 5, background: "rgba(244,239,229,0.14)", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ width: "71%", height: "100%", background: CORAL }} />
      </div>
      <div style={{ ...mono, fontSize: 8.5, color: "rgba(244,239,229,0.5)", letterSpacing: "0.1em" }}>71% OF QUARTER PLANNED</div>
    </div>
  );
}

function Viz5() {
  const tiles = [
    { label: "One-liner", accent: false },
    { label: "Elevator", accent: false },
    { label: "Bio", accent: false },
    { label: "Signature", accent: true },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
      {tiles.map((t) => (
        <div
          key={t.label}
          style={{
            ...mono,
            fontSize: 10,
            padding: "9px 11px",
            borderRadius: 8,
            textAlign: "center",
            color: t.accent ? CORAL : "rgba(244,239,229,0.72)",
            border: `1px solid ${t.accent ? CORAL : "rgba(244,239,229,0.2)"}`,
          }}
        >
          {t.label}
        </div>
      ))}
    </div>
  );
}

const DROPS: DropCard[] = [
  {
    category: "WORKSHEET",
    title: "The Brand Architecture Worksheet",
    body: "Map your positioning, ideal client, voice, and content pillars in one structured doc.",
    image: collage1.url,
    objectPosition: "center 18%",
    viz: <Viz1 />,
  },
  {
    category: "GUIDE",
    title: "The Founder's LinkedIn Playbook",
    body: "Data-backed posting strategy for founders and growing businesses: hooks, cadence, and content that converts.",
    image: collage2.url,
    objectPosition: "center 12%",
    viz: <Viz2 />,
  },
  {
    category: "TOOLKIT",
    title: "The Anti-AI-Slop Content Kit",
    body: "How to use AI for content without losing your voice, your authority, or your audience's trust.",
    image: collage3.url,
    objectPosition: "center 15%",
    viz: <Viz3 />,
  },
  {
    category: "FRAMEWORK",
    title: "The 90-Day Marketing Engine",
    body: "Build a quarter of strategy-aligned content in one afternoon. Calendar, pillars, and platform plan included.",
    image: collage4.url,
    objectPosition: "center 20%",
    viz: <Viz4 />,
  },
  {
    category: "TEMPLATE",
    title: "The Messaging Vault",
    body: "One-liner, elevator pitch, bio, and email signature, all written from your Brand Architecture.",
    image: collage5.url,
    objectPosition: "center 16%",
    viz: <Viz5 />,
  },
];

function DroppingSoon() {
  const railRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [prevHover, setPrevHover] = useState(false);
  const [nextHover, setNextHover] = useState(false);

  const scroll = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * 384, behavior: "smooth" });
  };

  return (
    <section style={{ background: CREAM }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 40px 24px" }}>
        <div
          className="ds-head"
          style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 38 }}
        >
          <div>
            <Eyebrow style={{ marginBottom: 18 }}>§ 01 · Dropping Soon</Eyebrow>
            <h2
              style={{
                ...serif,
                fontWeight: 600,
                fontSize: "clamp(30px, 3.6vw, 50px)",
                lineHeight: 1.04,
                letterSpacing: "-0.02em",
                color: INK,
                margin: 0,
              }}
            >
              Flagship packs,
              <br />
              <span style={{ fontWeight: 340, fontStyle: "italic", color: "#9a988e" }}>on the way.</span>
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14, maxWidth: 360 }}>
            <p style={{ ...sans, fontSize: 16, color: MUTED, textAlign: "right", margin: 0, lineHeight: 1.55 }}>
              Bigger, deeper builds we are finishing now. Sign up above to hear when each one is ready.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                aria-label="Previous"
                onClick={() => scroll(-1)}
                onMouseEnter={() => setPrevHover(true)}
                onMouseLeave={() => setPrevHover(false)}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  border: `1.5px solid ${CARD_BORDER_HOVER}`,
                  background: prevHover ? INK : "transparent",
                  color: prevHover ? "#f7f3ea" : INK,
                  cursor: "pointer",
                  fontSize: 18,
                  transition: "background .2s, color .2s",
                }}
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={() => scroll(1)}
                onMouseEnter={() => setNextHover(true)}
                onMouseLeave={() => setNextHover(false)}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  border: 0,
                  background: nextHover ? CORAL_HOVER : CORAL,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 18,
                  transition: "background .2s",
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>

        <div
          ref={railRef}
          className="cs-rail"
          style={{
            display: "flex",
            gap: 24,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollPaddingLeft: 4,
            padding: "4px 4px 24px",
            margin: "0 -4px",
          }}
        >
          {DROPS.map((c, i) => (
            <article
              key={c.title}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{
                flex: "none",
                width: 360,
                scrollSnapAlign: "start",
                background: INK,
                border: "1px solid rgba(244,239,229,0.08)",
                borderRadius: 20,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "transform .25s ease, box-shadow .25s ease",
                transform: hoverIdx === i ? "translateY(-5px)" : "none",
                boxShadow: hoverIdx === i ? "0 34px 64px -36px rgba(19,19,15,0.6)" : "none",
              }}
            >
              <div style={{ position: "relative", height: 300, overflow: "hidden" }}>
                <img
                  src={c.image}
                  alt=""
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: c.objectPosition,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(19,19,15,0.05) 0%, rgba(19,19,15,0.5) 52%, #13130f 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 18,
                    right: 18,
                    bottom: 16,
                    background: "rgba(13,13,10,0.55)",
                    backdropFilter: "blur(9px)",
                    WebkitBackdropFilter: "blur(9px)",
                    border: "1px solid rgba(244,239,229,0.14)",
                    borderRadius: 13,
                    padding: "15px 16px",
                  }}
                >
                  {c.viz}
                </div>
              </div>
              <div style={{ padding: "22px 24px 26px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    ...mono,
                    fontSize: 10.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: CORAL,
                    marginBottom: 13,
                  }}
                >
                  {c.category}
                </div>
                <h3 style={{ ...serif, fontWeight: 600, fontSize: 22, lineHeight: 1.14, color: "#f7f3ea", margin: 0 }}>
                  {c.title}
                </h3>
                <p style={{ ...sans, fontSize: 14, color: "rgba(244,239,229,0.6)", lineHeight: 1.6, flex: 1, marginTop: 12, marginBottom: 20 }}>
                  {c.body}
                </p>
                <div style={{ ...mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "#c8c6bc" }}>
                  Coming soon →
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 720px) {
          .ds-head { flex-direction: column; align-items: flex-start !important; }
          .ds-head p { text-align: left !important; }
        }
      `}</style>
    </section>
  );
}

/* ───────────── 4. THE LIBRARY ───────────── */
type LibCat = "Prompt" | "Framework" | "Guide" | "Toolkit" | "Checklist";
type LibCard = { category: LibCat; title: string; description: string; cta: string; link: string };

const LIB: LibCard[] = [
  { category: "Framework", title: "Website Copy Framework", description: "The structure behind high-converting websites. The exact prompts and frameworks used to build CRO-optimized headlines, CTA formulas, and audience-specific copy templates.", cta: "Download the framework", link: "https://docs.google.com/document/d/1YYpJRhy2Hou4BSmwA1HzzA7OcnTaFJuo/" },
  { category: "Framework", title: "Pitch Deck Framework", description: "Build decks investors cannot ignore. Deep research prompts, structure templates, and storytelling cues designed to win attention and funding.", cta: "Access the framework", link: "https://docs.google.com/document/d/1sTyGI--JHZFEQEMVj63FrrMRjjC0a4Dr/" },
  { category: "Prompt", title: "ChatGPT Founder Brain Prompt", description: "Train ChatGPT to think like you. Turn your AI into a second brain that remembers context, challenges your thinking, and co-creates with your style.", cta: "Activate the prompt", link: "https://docs.google.com/document/d/1sM_9i0uVd6HTKmbp8XmkM2sFO6odnt8M/" },
  { category: "Prompt", title: "Market Size Prompt", description: "Validate your market with precision. A guided prompt for calculating TAM, SAM, and SOM. Ideal for investor decks, pitch prep, or sizing your growth ceiling.", cta: "Run the prompt", link: "https://docs.google.com/document/d/1v26SLGIl7wpyWCHTEMOiJrdxcrhtheXq/" },
  { category: "Prompt", title: "Competitor Prompt", description: "Know your landscape before you build. A single, powerful prompt that reveals competitor insights, positioning angles, and market opportunities.", cta: "Download the prompt", link: "https://docs.google.com/document/d/1pysYBdURqICRE-GaxZH-59UkHxlB2S8h/" },
  { category: "Guide", title: "How to Create a Brand with AI", description: "From concept to creation, all inside AI. A full step-by-step system for building brands, including prompts, tools, and real examples.", cta: "Unlock the guide", link: "https://docs.google.com/document/d/1RIMDlqXAFp28ZrWj_riUNlEJsgMeaETr/" },
  { category: "Toolkit", title: "Marketing Checklist", description: "Your AI-assisted marketing playbook. A complete list of how to market your brand, with prompts, strategies, and AI shortcuts for faster execution.", cta: "Get the checklist", link: "https://docs.google.com/document/d/1sG_Nc9yKpZ76BYmh_cuzQMBUzO8F-Xwq/" },
  { category: "Toolkit", title: "Content Custom GPTs", description: "Generate ideas that go viral, on purpose. Two custom GPTs: one for crafting viral hooks, another for refining storytelling scripts built to convert.", cta: "Try the GPTs", link: "https://docs.google.com/document/d/1MTkygCM2DE7knXu2BsVRUHb_Nax69TQN/" },
  { category: "Checklist", title: "Business Stage Checklist with AI Tools", description: "Every stage. Every advantage. This checklist maps each phase of building a business, and the AI tools that give you leverage at each step.", cta: "Access the checklist", link: "https://docs.google.com/document/d/1R41X9bXTcCVUg4y94iLpOTbadRzoC1fq/" },
  { category: "Guide", title: "AI Tools Guide", description: "The exact AI stack behind modern creative teams. Explore the tools actually used, from research and branding to mockups and MVPs.", cta: "Explore the guide", link: "https://docs.google.com/document/d/1LFoxWFYIBPrgMlVZQaXgcNKqWAkPGzbA/" },
  { category: "Framework", title: "Deep Research Framework", description: "Research like a strategist, not a student. Prompt AI for true insight: validating demand, analyzing competitors, and surfacing pricing models.", cta: "Get the framework", link: "https://docs.google.com/document/d/121TF2julvfRkKT8HX8xbLEDSDPbz0NbF/" },
  { category: "Framework", title: "How to Find a Business Idea with AI", description: "AI will not hand you a million-dollar idea, but it can help you discover one. Identify market gaps, validate ideas, and uncover opportunities worth building.", cta: "Get the framework", link: "https://docs.google.com/document/d/1Q-lB4UvQsX0Y_6lEftZ8GNOjCa7EXmeD/" },
  { category: "Toolkit", title: "Branding Prompts", description: "Turn AI into your brand architect. The exact prompts used to build brand identity, from tone and color to logos, visual direction, and messaging.", cta: "Access the toolkit", link: "https://docs.google.com/document/d/1uQRGPQ0UAGdBb6dAG4JvCiKEXoFpfYlw/" },
  { category: "Guide", title: "High-Performance ChatGPT Setup", description: "Build your AI to think like a founder. A step-by-step guide to configure ChatGPT as your strategist, co-founder, and creative coach.", cta: "Download the guide", link: "https://docs.google.com/document/d/1WBtfWMB5eAeA83URVdmJ9AoY0ELuL5SW/" },
  { category: "Prompt", title: "AI Thought Partner Prompts", description: "Stop outsourcing your ideas. Sharpen them. These prompts transform AI from a yes-machine into your boldest creative challenger.", cta: "Unlock the prompts", link: "https://docs.google.com/document/d/1NYu8nCgjf0lB9XbOUBK9jn51OvpiwRz6/" },
];

const FILTERS: Array<"All" | LibCat> = ["All", "Prompt", "Framework", "Guide", "Toolkit", "Checklist"];

function Library() {
  const [filter, setFilter] = useState<"All" | LibCat>("All");
  const [hover, setHover] = useState<string | null>(null);
  return (
    <section style={{ background: CREAM }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 40px 120px" }}>
        <Eyebrow style={{ marginBottom: 18 }}>§ 02 · The Library</Eyebrow>
        <h2
          style={{
            ...serif,
            fontWeight: 600,
            fontSize: "clamp(32px, 4.2vw, 58px)",
            lineHeight: 0.98,
            letterSpacing: "-0.025em",
            color: INK,
            margin: "0 0 36px",
            maxWidth: 760,
          }}
        >
          Browse the full toolkit,{" "}
          <span style={{ fontWeight: 340, fontStyle: "italic", color: "#9a988e" }}>free.</span>
        </h2>

        <div
          style={{
            borderTop: "1px solid rgba(19,19,15,0.08)",
            paddingTop: 32,
            marginBottom: 44,
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  ...mono,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  padding: "10px 20px",
                  borderRadius: 999,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: active ? INK : "transparent",
                  color: active ? "#f7f3ea" : MUTED,
                  border: `1.5px solid ${active ? INK : CARD_BORDER_HOVER}`,
                }}
              >
                {f}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
            gap: 24,
          }}
        >
          {LIB.filter((c) => filter === "All" || c.category === filter).map((c) => {
            const isHover = hover === c.title;
            return (
              <article
                key={c.title}
                onMouseEnter={() => setHover(c.title)}
                onMouseLeave={() => setHover(null)}
                style={{
                  background: CARD_BG,
                  border: `1px solid ${isHover ? CARD_BORDER_HOVER : BORDER}`,
                  borderRadius: 18,
                  padding: "30px 30px 28px",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform .25s ease, box-shadow .25s ease, border-color .25s ease",
                  transform: isHover ? "translateY(-4px)" : "none",
                  boxShadow: isHover ? "0 28px 50px -34px rgba(30,45,55,0.4)" : "none",
                }}
              >
                <Eyebrow color={CORAL} squareSize={7} size={11} spacing="0.18em" style={{ marginBottom: 18 }}>
                  {c.category}
                </Eyebrow>
                <h3
                  style={{
                    ...serif,
                    fontWeight: 600,
                    fontSize: 23,
                    lineHeight: 1.14,
                    letterSpacing: "-0.015em",
                    color: INK,
                    margin: "0 0 12px",
                  }}
                >
                  {c.title}
                </h3>
                <p style={{ ...sans, fontSize: 14.5, lineHeight: 1.6, color: MUTED, flex: 1, marginBottom: 26 }}>
                  {c.description}
                </p>
                <a
                  href={c.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lib-cta"
                  style={{
                    ...mono,
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    padding: "14px 16px",
                    borderRadius: 999,
                    textAlign: "center",
                    textDecoration: "none",
                    border: `1.5px solid ${CORAL}`,
                    color: CORAL,
                    background: "transparent",
                    transition: "background .2s ease, color .2s ease, border-color .2s ease",
                    display: "block",
                  }}
                >
                  {c.cta}
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ───────────── PAGE ───────────── */
export default function Resources() {
  return (
    <div style={{ background: CREAM, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <RouteMetadata title="Free AI prompt packs and toolkits | MOXIEMO" description="Free prompts, frameworks and toolkits for founders and growing businesses, from website copy to pitch decks to deep research. No signup required." />
      <style>{`
        .lib-cta:hover, .lib-cta:active {
          background: ${CORAL} !important;
          color: #fff !important;
          border-color: ${CORAL} !important;
        }
        .lib-cta:active { background: ${CORAL_HOVER} !important; }
        .cs-rail::-webkit-scrollbar { height: 8px; }
        .cs-rail::-webkit-scrollbar-track { background: rgba(19,19,15,0.06); border-radius: 99px; }
        .cs-rail::-webkit-scrollbar-thumb { background: rgba(19,19,15,0.2); border-radius: 99px; }
        .cs-rail { scrollbar-width: thin; scrollbar-color: rgba(19,19,15,0.2) transparent; }
      `}</style>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0.5,
          mixBlendMode: "multiply",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
          backgroundSize: "200px",
        }}
      />
      <SiteHeader />
      <main style={{ flex: 1 }}>
        <Hero />
        <EarlyAccess />
        <DroppingSoon />
        <Library />
      </main>
      <SiteFooter />
    </div>
  );
}
