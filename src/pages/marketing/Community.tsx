import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Send } from "lucide-react";
import kareeHeadshot from "@/assets/karee-headshot.png";
import radicaHeadshot from "@/assets/radica-headshot.jpeg";
import moxieDevelopers from "@/assets/moxie-developers.jpg";

const DISCORD_URL = "https://discord.gg/BGRj8PxW";
const CORAL = "#ff6b6b";

const channelGroups = [
  {
    label: "START HERE",
    channels: [
      { icon: "📋", name: "rules-and-guidelines" },
      { icon: "👋", name: "welcome" },
      { icon: "🗺️", name: "how-to-use-this" },
    ],
  },
  {
    label: "NEWS",
    channels: [
      { icon: "📣", name: "announcements" },
      { icon: "🚀", name: "release-notes" },
      { icon: "🗺️", name: "roadmap" },
    ],
  },
  {
    label: "COMMUNITY",
    channels: [
      { icon: "💬", name: "general-chat" },
      { icon: "🙋", name: "introductions" },
      { icon: "🏆", name: "show-and-tell" },
    ],
  },
  {
    label: "SUPPORT",
    channels: [
      { icon: "🎫", name: "help-desk" },
      { icon: "❓", name: "faq" },
      { icon: "🐛", name: "bug-reports" },
      { icon: "💡", name: "feature-requests" },
    ],
  },
  {
    label: "BETA",
    channels: [{ icon: "🔬", name: "beta-feedback", active: true }],
  },
];

const features = [
  { icon: "📣", title: "Direct access to Karee", desc: "The founder is in the server. Ask questions, share feedback, and shape the product directly — no support tickets, no middlemen." },
  { icon: "🚀", title: "Release notes first", desc: "Every update, fix, and new feature hits the community before anywhere else. You know what changed and why before it's announced publicly." },
  { icon: "🗺️", title: "Live roadmap access", desc: "See exactly what's being built, what's next, and what's been requested. Your upvotes directly influence what ships." },
  { icon: "🐛", title: "Bug reports that get fixed", desc: "Every bug report gets its own thread, a status tag, and a response. In Review → In Progress → Resolved. Nothing gets lost." },
  { icon: "🏆", title: "Show and tell", desc: "Share what you've built with MOXIE — content that landed, strategies that worked, campaigns that converted. This is your stage." },
  { icon: "🔬", title: "Beta-only features", desc: "Founding members get early access to features before they go public. You test it, break it, and shape it before anyone else sees it." },
];

const prompts = [
  "What clicked first?",
  "What took too long?",
  "What would you fix?",
  "What surprised you?",
  "vs. your old way?",
];

function CoralPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-block text-xs font-bold uppercase tracking-[0.25em] mb-6 px-4 py-2 rounded-full" style={{ backgroundColor: "rgba(255,107,107,0.12)", color: CORAL }}>
      {children}
    </div>
  );
}

export default function Community() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* SECTION 1 — HERO */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <CoralPill>Community</CoralPill>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.02] tracking-[-0.04em] mb-6 text-foreground">
            You're not building this alone.
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light mb-10">
            The MOXIE beta community is where the platform gets built.
            <br />
            Every founding member is a collaborator, not just a user.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Button asChild size="lg" className="h-12 px-8 rounded-full font-semibold text-white hover:opacity-90" style={{ backgroundColor: CORAL }}>
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                Join the Discord community <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-full font-semibold border-foreground text-foreground hover:bg-foreground hover:text-background">
              <Link to="/auth?mode=signup">
                Get started free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Est. April 2026 · Founding members only · Free forever</p>
        </div>
      </section>

      {/* SECTION 2 — DISCORD SHOWCASE */}
      <section className="bg-white" style={{ paddingTop: 100, paddingBottom: 100 }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <CoralPill>Inside the community</CoralPill>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-5">
              A community built like the product.
              <br />
              Structured. Intentional. Yours.
            </h2>
            <p className="text-muted-foreground font-light max-w-[560px] mx-auto leading-relaxed">
              Not a group chat. A real home base — with channels for feedback, bugs, features, show-and-tell, and direct access to the team building MOXIE.
            </p>
          </div>

          {/* Discord mockup */}
          <div
            className="mx-auto rounded-[20px] overflow-hidden grid grid-cols-1 md:grid-cols-[220px_1fr]"
            style={{
              maxWidth: 900,
              backgroundColor: "#1a1d23",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              minHeight: 506,
            }}
          >
            {/* Left sidebar */}
            <div style={{ backgroundColor: "#111318" }} className="p-4 hidden md:block">
              <div className="flex items-center gap-2 pb-4 border-b border-white/5">
                <div className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: CORAL }}>M</div>
                <span className="text-white font-bold text-sm">MOXIE Server</span>
              </div>
              <div className="text-[11px] mt-3 mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                <span style={{ color: "#3ba55c" }}>●</span> Online · Founding Members
              </div>
              <div className="space-y-4">
                {channelGroups.map((g) => (
                  <div key={g.label}>
                    <div className="text-[10px] font-bold tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>{g.label}</div>
                    <div className="space-y-0.5">
                      {g.channels.map((c) => (
                        <div
                          key={c.name}
                          className="text-[13px] py-1 px-2 rounded flex items-center gap-1.5"
                          style={
                            c.active
                              ? { color: "#fff", borderLeft: `2px solid ${CORAL}`, backgroundColor: "rgba(255,107,107,0.08)", paddingLeft: 6 }
                              : { color: "rgba(255,255,255,0.5)" }
                          }
                        >
                          <span>{c.icon}</span>
                          <span className="truncate">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main area */}
            <div className="flex flex-col" style={{ backgroundColor: "#1a1d23" }}>
              <div className="px-5 py-3 border-b border-white/5 flex items-baseline gap-3">
                <span className="text-white font-bold text-sm"># beta-feedback</span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>This is an open-ended space for general impressions.</span>
              </div>
              <div className="px-5 py-5 flex-1">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0" style={{ backgroundColor: CORAL }}>R</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-bold text-sm">Radica M.</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,107,107,0.15)", color: CORAL }}>Community Lead</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Today at 3:00 PM</span>
                    </div>
                    <div className="text-white text-sm leading-[1.6] space-y-3" style={{ color: "rgba(255,255,255,0.92)" }}>
                      <p>Welcome to #beta-feedback.</p>
                      <p>This is the unstructured one. No templates, no required fields, no right or wrong way to post here.</p>
                      <p>If something is working really well, say so. If something feels off but you can't quite put your finger on why, say that too. First impressions, recurring frustrations, moments of delight — all of it belongs here.</p>
                      <p>The team reads everything posted here. This channel directly shapes how we think about the product. The more honest you are, the more useful it is.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {prompts.map((p) => (
                        <span key={p} className="text-xs px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: "#2a2d33" }}>{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5">
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ backgroundColor: "#2a2d33" }}>
                  <span className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.4)" }}>Share your thoughts in #beta-feedback...</span>
                  <Send className="h-4 w-4" style={{ color: CORAL }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — WHAT YOU GET */}
      <section style={{ backgroundColor: "#f8f8f8", paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center text-foreground mb-14">
            What founding members get
            <br />
            inside the community.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-7 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5" style={{ backgroundColor: "rgba(255,107,107,0.12)" }}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — TEAM */}
      <section className="bg-white" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-[1100px] mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center text-foreground mb-14">
            The people behind the community.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-border rounded-2xl p-7 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <img src={kareeHeadshot} alt="Karee Laing" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
              <h3 className="text-lg font-bold text-foreground">Karee Laing</h3>
              <p className="text-sm text-muted-foreground font-light mb-3">Founder & CEO</p>
              <p className="text-sm text-muted-foreground leading-relaxed font-light mb-4">
                Building MOXIE in public. In the server daily — answering questions, sharing what's coming next, and taking your feedback seriously.
              </p>
              <p className="text-sm font-semibold" style={{ color: CORAL }}>K.Laing in Discord</p>
            </div>
            <div className="bg-white border border-border rounded-2xl p-7 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <img src={radicaHeadshot} alt="Radica M." className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
              <h3 className="text-lg font-bold text-foreground">Radica M.</h3>
              <p className="text-sm text-muted-foreground font-light mb-3">Community Lead</p>
              <p className="text-sm text-muted-foreground leading-relaxed font-light mb-4">
                Managing the help-desk, onboarding new members, keeping the server structured, and making sure no question goes unanswered.
              </p>
              <p className="text-sm font-semibold" style={{ color: CORAL }}>Radica.M in Discord</p>
            </div>
            <div className="bg-white border border-border rounded-2xl p-7 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <img src={moxieDevelopers} alt="MOXIE Developers" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
              <h3 className="text-lg font-bold text-foreground">MOXIE Developers</h3>
              <p className="text-sm text-muted-foreground font-light mb-3">Engineering & Product</p>
              <p className="text-sm text-muted-foreground leading-relaxed font-light mb-4">
                The technical team behind the platform. Instrumental in Phase 2 of MOXIE's build — expanding platform capabilities, adding integrations, and making sure everything runs the way it should. They're in the server and they're listening.
              </p>
              <p className="text-sm font-semibold" style={{ color: CORAL }}>moxiedevelopers in Discord</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — SHARE YOUR STORY */}
      <section style={{ backgroundColor: "#101116", paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <CoralPill>Founding member stories</CoralPill>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-5">
            Your story goes here.
          </h2>
          <p className="font-light max-w-[500px] mx-auto leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            We're collecting our first founding member stories. If MOXIE has made a difference in how you work — we want to hear it and share it.
          </p>
          <Button asChild size="lg" variant="outline" className="h-12 px-8 rounded-full font-semibold text-white hover:opacity-90" style={{ borderColor: CORAL, backgroundColor: "transparent" }}>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
              Share your story in Discord <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="text-sm mt-5" style={{ color: "rgba(255,255,255,0.4)" }}>Post in #show-and-tell or DM Radica directly.</p>
        </div>
      </section>

      {/* SECTION 6 — FINAL CTA */}
      <section className="bg-white" style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Ready to join the founding community?
          </h2>
          <p className="text-muted-foreground font-light mb-8">
            Spots are limited. Once we hit capacity, we close the waitlist.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-5">
            <Button asChild size="lg" className="h-12 px-8 rounded-full font-semibold text-white hover:opacity-90" style={{ backgroundColor: CORAL }}>
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
                Join the Discord <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-full font-semibold border-foreground text-foreground hover:bg-foreground hover:text-background">
              <Link to="/auth?mode=signup">
                Get platform access <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Free forever · Founded April 2026 · Built with founding members</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
