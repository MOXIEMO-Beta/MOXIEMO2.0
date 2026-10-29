import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRight, Send } from "lucide-react";
import kareeHeadshotAsset from "@/assets/karee-hero.png.asset.json";
const kareeHeadshot = kareeHeadshotAsset.url;
import radicaHeadshot from "@/assets/radica-headshot.jpeg";
import moxieDevelopers from "@/assets/moxie-developers.jpg";

const DISCORD_URL = "https://discord.com/invite/wa9JFx7nha";
const SIGNUP_URL = "https://buildwithmoxiemo.com/auth?mode=signup";

// Design tokens
const CREAM = "#f4efe5";
const SAGE = "#dce3d2";
const INK = "#13130f";
const DARK_CARD = "#1c1a14";
const CORAL = "#ef6f53";
const CORAL_DARK = "#c75438";
const MUTED = "#56544c";
const LIGHT_MUTED = "#6c6a60";
const MUTED_WARM = "#9a9789";

const display = { fontFamily: "'Newsreader', serif" };
const body = { fontFamily: "'Hanken Grotesk', sans-serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

function Eyebrow({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <span
      style={{
        ...mono,
        display: "inline-block",
        background: onDark ? "rgba(239,111,83,0.15)" : "rgba(239,111,83,0.12)",
        border: `1px solid ${onDark ? "rgba(239,111,83,0.3)" : "rgba(239,111,83,0.28)"}`,
        borderRadius: 999,
        padding: "6px 18px",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.22em",
        color: onDark ? CORAL : CORAL_DARK,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

const primaryBtn: React.CSSProperties = {
  ...body,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: CORAL,
  color: "#fff",
  fontWeight: 600,
  fontSize: 15.5,
  padding: "16px 28px",
  borderRadius: 999,
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  transition: "opacity .2s ease, transform .2s ease",
};

const outlineLight: React.CSSProperties = {
  ...body,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "transparent",
  color: INK,
  fontWeight: 600,
  fontSize: 15.5,
  padding: "15px 28px",
  borderRadius: 999,
  textDecoration: "none",
  border: `2px solid ${INK}`,
  cursor: "pointer",
  transition: "background .2s ease, color .2s ease",
};

const outlineDark: React.CSSProperties = {
  ...body,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "transparent",
  color: CREAM,
  fontWeight: 600,
  fontSize: 15.5,
  padding: "15px 28px",
  borderRadius: 999,
  textDecoration: "none",
  border: "2px solid rgba(244,239,229,0.4)",
  cursor: "pointer",
  transition: "background .2s ease",
};

const features = [
  { icon: "📣", title: "Direct access to Karee", desc: "The founder is in the server. Ask questions, share feedback, and shape the product directly. No support tickets, no middlemen." },
  { icon: "🚀", title: "Release notes first", desc: "Every update, fix, and new feature hits the community before anywhere else. You know what changed and why before it's announced publicly." },
  { icon: "🗺️", title: "Live roadmap access", desc: "See exactly what's being built, what's next, and what's been requested. Your upvotes directly influence what ships." },
  { icon: "🐛", title: "Bug reports that get fixed", desc: "Every bug report gets its own thread, a status tag, and a response. In Review → In Progress → Resolved. Nothing gets lost." },
  { icon: "🏆", title: "Show and tell", desc: "Share what you've built with MOXIEMO. Content that landed. Strategies that worked. Campaigns that converted. This is your stage." },
  { icon: "🔬", title: "Beta-only features", desc: "Founding members get early access to features before they go public. You test it, break it, and shape it before anyone else sees it." },
];

const team = [
  { img: kareeHeadshot, name: "Karee Laing", role: "Founder & CEO", bio: "Building MOXIEMO in public. In the server daily, answering questions, sharing what's coming next, and taking your feedback seriously.", link: "K.Laing in Discord" },
  { img: radicaHeadshot, name: "Radica M.", role: "Community Lead", bio: "Managing the help-desk, onboarding new members, keeping the server structured, and making sure no question goes unanswered.", link: "Radica.M in Discord" },
  { img: moxieDevelopers, name: "MOXIEMO Developers", role: "Engineering & Product", bio: "The technical team behind the platform. Instrumental in Beta 2.0 of MOXIEMO's build, expanding platform capabilities, adding integrations, and making sure everything runs the way it should. They're in the server and they're listening.", link: "moxiedevelopers in Discord" },
];

const beta2 = [
  { label: "Deeper distribution", body: "More channels, more reach, more automation built in from the start." },
  { label: "Deeper insight", body: "Performance intelligence that tells you exactly what to do next." },
  { label: "FOUNDING PRICING: 50% OFF FOR LIFE", body: "100 seats. Founding members get in before the public waitlist opens, at half price for life, as long as they keep their founding membership." },
  { label: "Built on private beta", body: "Every fix, every feature shaped by your feedback. Your fingerprints are on this." },
];

const channelGroups = [
  { label: "START HERE", channels: [{ icon: "📋", name: "rules-and-guidelines" }, { icon: "👋", name: "welcome" }, { icon: "📖", name: "how-to-use-this" }] },
  { label: "NEWS", channels: [{ icon: "📣", name: "announcements" }, { icon: "🚀", name: "release-notes" }, { icon: "🗺️", name: "roadmap" }] },
  { label: "COMMUNITY", channels: [{ icon: "💬", name: "general-chat" }, { icon: "🏆", name: "introductions" }, { icon: "🎯", name: "show-and-tell" }] },
  { label: "SUPPORT", channels: [{ icon: "📋", name: "help-desk" }, { icon: "❓", name: "faq" }, { icon: "🐛", name: "bug-reports" }, { icon: "💡", name: "feature-requests" }] },
  { label: "BETA", channels: [{ icon: "🔒", name: "beta-feedback", active: true }] },
];

const prompts = ["What clicked first?", "What took too long?", "What would you fix?", "What surprised you?", "vs. your old way?"];

const grainOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  zIndex: 9999,
  opacity: 0.45,
  mixBlendMode: "multiply",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
  backgroundSize: "200px",
};

export default function Community() {
  return (
    <div style={{ ...body, background: CREAM, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={grainOverlay} aria-hidden />
      <SiteHeader />

      {/* SECTION 1 — HERO */}
      <section style={{ background: CREAM }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "100px 40px 88px", textAlign: "center" }}>
          <div style={{ marginBottom: 28 }}><Eyebrow>Community</Eyebrow></div>
          <h1 style={{ ...display, fontWeight: 700, fontSize: "clamp(46px, 6.6vw, 92px)", lineHeight: 0.96, letterSpacing: "-0.03em", color: INK, margin: 0 }}>
            You're not building this alone.
          </h1>
          <p style={{ fontSize: 17.5, color: MUTED, maxWidth: 680, margin: "24px auto 30px", lineHeight: 1.55 }}>
            The MOXIEMO beta community is where the platform gets built. Every founding member is a collaborator, not just a user.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" style={primaryBtn}>
              Join the Discord community <ArrowRight size={16} />
            </a>
            <a href={SIGNUP_URL} target="_blank" rel="noopener noreferrer" style={outlineLight}>
              Get started free <ArrowRight size={16} />
            </a>
          </div>
          <p style={{ ...mono, fontSize: 11.5, letterSpacing: "0.14em", color: MUTED_WARM, marginTop: 26, textTransform: "uppercase" }}>
            Est. December 2025 · Founding members only · Free while private beta is open
          </p>
        </div>
      </section>

      {/* SECTION 2 — BETA 2.0 */}
      <section style={{ background: INK, color: CREAM }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px" }}>
          <div className="beta2-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>
            <div>
              <div style={{ marginBottom: 24 }}><Eyebrow onDark>What's next</Eyebrow></div>
              <h2 style={{ ...display, fontWeight: 600, fontSize: "clamp(38px, 4.5vw, 62px)", lineHeight: 1.0, letterSpacing: "-0.02em", color: CREAM, margin: 0 }}>
                Beta 2.0 is coming.<br />
                <span style={{ fontWeight: 340, fontStyle: "italic", color: "#86847a" }}>Get on the list.</span>
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.7, color: "#b3b1a6", maxWidth: 480, margin: "28px 0 32px" }}>
                We are building the autonomous version of MOXIEMO now. Private beta is today's platform. Beta 2.0 is the next one: deeper distribution, deeper insight, built on everything private beta has taught us. Private beta members get first access to the founding seats, before the public waitlist, at 50% off for life. Seats are capped.
              </p>
              <Link to="/beta20-founding" style={primaryBtn}>
                Join the Beta 2.0 waitlist <ArrowRight size={16} />
              </Link>
              <p style={{ ...mono, fontSize: 11.5, letterSpacing: "0.12em", color: "#7a786e", marginTop: 22, textTransform: "uppercase" }}>
                Already in private beta? You get first pick of the founding seats.
              </p>
            </div>
            <div style={{ background: DARK_CARD, border: "1px solid #2a2720", borderRadius: 20, padding: 38 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 30 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: CORAL, display: "inline-block" }} />
                <span style={{ ...mono, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.16em", color: "#7a786e" }}>
                  Beta 2.0 — What changes
                </span>
              </div>
              {beta2.map((row, i) => (
                <div key={row.label} style={{ padding: "20px 0", borderBottom: i < beta2.length - 1 ? "1px solid #2a2720" : "none" }}>
                  <div style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: CORAL, marginBottom: 8 }}>{row.label}</div>
                  <div style={{ fontSize: 15, color: "#c8c6bc", lineHeight: 1.6 }}>{row.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — INSIDE THE COMMUNITY */}
      <section style={{ background: SAGE }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ marginBottom: 24 }}><Eyebrow>Inside the community</Eyebrow></div>
            <h2 style={{ ...display, fontWeight: 600, fontSize: "clamp(36px, 4.5vw, 60px)", lineHeight: 1.05, letterSpacing: "-0.02em", maxWidth: 740, margin: "0 auto", color: INK }}>
              A community built like the product.<br />
              <span style={{ fontWeight: 340, fontStyle: "italic", color: "#6d7a5e" }}>Structured. Intentional. Yours.</span>
            </h2>
            <p style={{ fontSize: 18, color: "#48533c", maxWidth: 540, margin: "24px auto 0", lineHeight: 1.6 }}>
              Not a group chat. A real home base. Channels for feedback, bugs, features, show-and-tell, and direct access to the team building MOXIEMO.
            </p>
          </div>

          {/* Discord mockup */}
          <div style={{ maxWidth: 900, margin: "0 auto", borderRadius: 16, overflow: "hidden", boxShadow: "0 40px 80px -30px rgba(10,20,30,0.48)", border: "1px solid rgba(0,0,0,0.18)", display: "flex", minHeight: 530, background: "#313338" }}>
            <div className="discord-sidebar" style={{ width: 192, background: "#2b2d31", flexShrink: 0 }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: CORAL, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>M</div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: "#f2f3f5" }}>MOXIEMO Server</div>
              </div>
              <div style={{ padding: "9px 16px 4px", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#80848e" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#23a55a", display: "inline-block" }} />
                Online · Founding Members
              </div>
              <div style={{ padding: "12px 8px" }}>
                {channelGroups.map((g) => (
                  <div key={g.label} style={{ marginBottom: 14 }}>
                    <div style={{ ...mono, fontSize: 9, textTransform: "uppercase", color: "#80848e", padding: "0 8px 4px", letterSpacing: "0.1em" }}>{g.label}</div>
                    {g.channels.map((c: any) => (
                      <div key={c.name} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "4px 8px", borderRadius: 4, fontSize: 12.5,
                        color: c.active ? "#f2f3f5" : "#80848e",
                        background: c.active ? "rgba(255,255,255,0.1)" : "transparent",
                      }}>
                        <span>{c.icon}</span><span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, background: "#313338", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: "#f2f3f5" }}># beta-feedback</span>
                <span style={{ fontSize: 13, color: "#80848e" }}>This is an open-ended space for general impressions.</span>
              </div>
              <div style={{ padding: 20, flex: 1 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: CORAL, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>R</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#f2f3f5" }}>Radica M.</span>
                      <span style={{ ...mono, fontWeight: 700, fontSize: 10, background: "#248060", color: "#d4f5e9", padding: "2px 8px", borderRadius: 3 }}>COMMUNITY LEAD</span>
                      <span style={{ fontSize: 11.5, color: "#80848e" }}>Today at 3:00 PM</span>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: "#dcddde" }}>
                      <p style={{ margin: "0 0 10px" }}>Welcome to #beta-feedback.</p>
                      <p style={{ margin: "0 0 10px" }}>This is the unstructured one. No templates, no required fields, no right or wrong way to post here.</p>
                      <p style={{ margin: "0 0 10px" }}>If something is working really well, say so. If something feels off but you can't quite put your finger on why, say that too. First impressions, recurring frustrations, moments of delight — all of it belongs here.</p>
                      <p style={{ margin: 0 }}>The team reads everything posted here. This channel directly shapes how we think about the product. The more honest you are, the more useful it is.</p>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                      {prompts.map((p) => (
                        <span key={p} style={{ background: "#2b2d31", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "5px 13px", fontSize: 12.5, color: "#dcddde" }}>{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding: "12px 20px" }}>
                <div style={{ background: "#383a40", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13.5, color: "#72767d" }}>Share your thoughts in #beta-feedback...</span>
                  <Send size={16} color="#72767d" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHAT FOUNDING MEMBERS GET */}
      <section style={{ background: CREAM }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px" }}>
          <h2 style={{ ...display, fontWeight: 700, fontSize: "clamp(38px, 4.5vw, 64px)", textAlign: "center", maxWidth: 760, margin: "0 auto 64px", color: INK, lineHeight: 1.05, letterSpacing: "-0.025em" }}>
            What founding members get inside the community.
          </h2>
          <div className="feature-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {features.map((f) => (
              <div key={f.title} style={{ background: "#fff", border: "1px solid rgba(19,19,15,0.09)", borderRadius: 16, padding: 32 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(239,111,83,0.11)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 20 }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: 17, color: INK, margin: "0 0 12px" }}>{f.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: LIGHT_MUTED, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — PEOPLE */}
      <section style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px" }}>
          <h2 style={{ ...display, fontWeight: 700, fontSize: "clamp(38px, 4.5vw, 64px)", textAlign: "center", margin: "0 auto 64px", color: INK, lineHeight: 1.05, letterSpacing: "-0.025em" }}>
            The people behind the community.
          </h2>
          <div className="team-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {team.map((p) => (
              <div key={p.name} style={{ background: "#fff", border: "1px solid rgba(19,19,15,0.09)", borderRadius: 16, padding: 36, textAlign: "center" }}>
                <img src={p.img} alt={p.name} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", margin: "0 auto 20px", display: "block" }} />
                <div style={{ fontWeight: 700, fontSize: 17, color: INK, marginBottom: 4 }}>{p.name}</div>
                <div style={{ ...mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: MUTED_WARM, marginBottom: 18 }}>{p.role}</div>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: LIGHT_MUTED, marginBottom: 22 }}>{p.bio}</p>
                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 14, color: CORAL, textDecoration: "none" }}>{p.link}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — FOUNDING MEMBER STORIES */}
      <section style={{ background: INK, color: CREAM }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "96px 40px", textAlign: "center" }}>
          <div style={{ marginBottom: 28 }}><Eyebrow onDark>Founding member stories</Eyebrow></div>
          <h2 style={{ ...display, fontWeight: 700, fontSize: "clamp(44px, 6vw, 84px)", lineHeight: 0.95, letterSpacing: "-0.03em", color: CREAM, margin: 0 }}>
            Your story goes here.
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.65, color: "#b3b1a6", maxWidth: 520, margin: "26px auto 32px" }}>
            We're collecting our first founding member stories. What MOXIEMO helped you build, ship, or grow. If it's made a difference, we want to hear it and share it.
          </p>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" style={outlineDark}>
            Share your story in Discord <ArrowRight size={16} />
          </a>
          <p style={{ ...mono, fontSize: 11.5, letterSpacing: "0.12em", color: "#7a786e", marginTop: 22, textTransform: "uppercase" }}>
            Post in #show-and-tell or DM Radica directly.
          </p>
        </div>
      </section>

      {/* SECTION 7 — CLOSING DUAL CTA */}
      <section style={{ background: SAGE }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "100px 40px", textAlign: "center" }}>
          <h2 style={{ ...display, fontWeight: 700, fontSize: "clamp(40px, 5.5vw, 80px)", lineHeight: 0.97, letterSpacing: "-0.025em", color: INK, margin: 0 }}>
            Ready to be part of this?
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.65, color: "#48533c", maxWidth: 520, margin: "26px auto 34px" }}>
            Join private beta today, free while it's open. Or get on the list for Beta 2.0, with founding pricing locked in for life.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <Link to="/founding" style={primaryBtn}>
              Join private beta <ArrowRight size={16} />
            </Link>
            <Link to="/beta20-founding" style={outlineLight}>
              Join the Beta 2.0 waitlist <ArrowRight size={16} />
            </Link>
          </div>
          <p style={{ ...mono, fontSize: 11.5, letterSpacing: "0.14em", color: "#69745a", marginTop: 24, textTransform: "uppercase" }}>
            Private beta is free while it's open · Beta 2.0 founding members get 50% off for life
          </p>
        </div>
      </section>

      <SiteFooter />

      <style>{`
        @media (max-width: 880px) {
          .beta2-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .feature-grid { grid-template-columns: 1fr !important; }
          .team-grid { grid-template-columns: 1fr !important; }
          .discord-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}