import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { MarketingPage } from "./MarketingPage";
import { StatsBar } from "@/components/StatsBar";

const tiers = [
  {
    name: "Founding Member",
    price: "Free",
    sub: " — forever",
    annual: "Locked in before public pricing",
    desc: "For early believers who joined before the world caught on.",
    features: [
      "AI strategic discovery (1 brand strategy)",
      "25 content generations per month",
      "Marketing Planner access",
      "Social publishing: LinkedIn only",
      "Email content generation (draft only — no ESP connection)",
      "2 active campaigns",
      "Standard support",
    ],
    replaces: "Your scattered tool experiments",
    savings: "100% — free forever",
    cta: "Join as a Founding Member →",
    featured: false,
    foundingMember: true,
    note: "Founding Member access is by invitation only and will no longer be available after beta closes.",
  },
  {
    name: "Foundation",
    price: "$79",
    sub: "/month",
    annual: "or $790/year (save $158)",
    desc: "For founders ready to build a real marketing strategy and stop winging it.",
    features: ["Complete AI strategic discovery", "Marketing strategy foundation", "Marketing Planner access", "100 content generations per month", "Social publishing: LinkedIn + Facebook + Instagram", "Email content generation + draft sync to your ESP (Kit, Mailchimp, Beehiiv)", "Up to 5 active campaigns", "Basic analytics dashboard", "Standard support (24-hour response)"],
    replaces: "ConvertKit + Buffer + scheduling tool",
    savings: "~$60/mo + 12 hours/week",
    cta: "Start free discovery",
    featured: false,
  },
  {
    name: "Growth",
    price: "$129",
    sub: "/month",
    annual: "or $1,290/year (save $258)",
    desc: "For established founders scaling their expertise to $1M+.",
    features: ["Everything in Foundation", "Unlimited content creation", "5 publishing platforms: LinkedIn + Facebook + Instagram + Pinterest + Threads", "Campaign builder (launches, sequences, evergreen)", "Full ESP sync (Kit, Mailchimp, Beehiiv, ActiveCampaign)", "Advanced analytics (attribution + ROI)", "Lead magnet creation", "Priority support (12-hour response)", "Quarterly strategy refinement calls"],
    replaces: "ConvertKit + Buffer + Kajabi + scheduling",
    savings: "~$372/mo + 18 hours/week",
    cta: "Start free discovery",
    featured: true,
  },
  {
    name: "Scale",
    price: "$189",
    sub: "/month",
    annual: "or $1,890/year (save $378)",
    desc: "For agencies and multi-brand operators running at full capacity.",
    features: ["Everything in Growth", "Full platform suite: LinkedIn + Facebook + Instagram + Pinterest + Threads + TikTok + YouTube + Google Business", "Team collaboration (up to 5 users)", "Multiple brand workspaces", "Custom integrations", "Dedicated account manager", "White-glove onboarding + migration", "Monthly strategy check-in calls", "SLA guarantees", "Priority feature requests"],
    replaces: "Full martech stack",
    savings: "$1,000+/mo + team capacity",
    cta: "Join the waitlist",
    featured: false,
    coralCta: true,
    comingSoon: true,
  },
];

const universal = ["20-min AI strategic discovery", "Marketing strategy foundation", "Brand voice & positioning", "Unlimited strategy updates", "Mobile app (iOS + Android)", "Data export anytime", "99.9% uptime SLA", "SOC 2 Type II security", "GDPR compliance", "30-day money-back guarantee"];

const faqs = [
  { q: "Why is MOXIEMO cheaper than my current tool stack?", a: "We're one platform replacing 4–6 tools. No integrations, no middleware, no complexity. Lower costs = lower price." },
  { q: "What happens to my data if I cancel?", a: "You export everything (subscribers, content, analytics) before canceling. Your data is always yours. We delete it within 30 days of account closure." },
  { q: "Can I switch plans?", a: "Yes, anytime. Upgrade immediately. Downgrade at next billing cycle. Prorated automatically." },
  { q: "Is there a free trial?", a: "The discovery is free — no credit card required. You see your complete strategy foundation before deciding. Better than a generic trial." },
];

export default function Pricing() {
  return (
    <MarketingPage
      eyebrow="Pricing"
      title="Simple pricing. Serious ROI."
      subtitle="Replace $400–$800/month in fragmented tools. Eliminate 18 hours/week of wasted time. One platform, one price, zero complexity."
    >
      <div className="space-y-24">
        {/* Tiers */}
        <section>
          {/* Founding Member Banner */}
          <div className="mb-8 rounded-xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6" style={{ backgroundColor: "#ff6b6b", color: "#ffffff" }}>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-[1.5px] mb-2 opacity-90">🎉  Founding Members — Limited Spots</p>
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Join now and lock in free access, forever.</h3>
            <p className="text-sm md:text-base opacity-95 font-light">Every founding member gets a personal 1:1 kickoff call with our team. Your access is free, your plan never expires, and you will never be charged regardless of how our pricing changes.</p>
            </div>
            <Button asChild className="h-12 px-6 rounded-full font-semibold bg-white hover:bg-white/90 text-foreground whitespace-nowrap">
              <Link to="/founding">Join as a Founding Member →</Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((t) => (
              <Card key={t.name} className={`p-8 border-border shadow-soft flex flex-col ${t.featured ? "border-accent shadow-lift bg-card relative ring-1 ring-accent" : "bg-card"}`}>
                {t.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most popular
                  </div>
                )}
                {(t as any).comingSoon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Coming soon
                  </div>
                )}
                {(t as any).foundingMember && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider text-white" style={{ backgroundColor: "#ff6b6b" }}>
                    Founding Member
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1">{t.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 font-light min-h-[40px]">{t.desc}</p>
                <div className="mb-1">
                  <span className="font-display text-5xl">{t.price}</span>
                  <span className="text-muted-foreground font-light">{t.sub}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-6 font-light">{t.annual}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm">
                      <Check className="h-4 w-4 text-accent flex-shrink-0 mt-1" />
                      <span className="font-light">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border pt-5 mb-5 space-y-1">
                  <p className="text-xs"><span className="text-muted-foreground">Replaces:</span> <span className="font-medium">{t.replaces}</span></p>
                  <p className="text-xs"><span className="text-muted-foreground">Savings:</span> <span className="font-medium text-accent">{t.savings}</span></p>
                </div>
                <Button asChild className={`w-full min-h-11 h-auto py-2 rounded-full font-semibold text-sm whitespace-normal text-center leading-tight ${t.featured ? "bg-accent hover:bg-accent/90 text-accent-foreground" : (t as any).coralCta ? "text-white hover:opacity-90" : "bg-foreground hover:bg-foreground/90 text-background"}`} style={(t as any).coralCta ? { backgroundColor: "#ff6b6b" } : undefined}>
                  {(t as any).comingSoon ? (
                    <a href="mailto:hello@buildwithmoxiemo.com?subject=Scale%20plan%20waitlist">{t.cta}</a>
                  ) : (t as any).foundingMember ? (
                    <Link to="/founding">{t.cta}</Link>
                  ) : (
                    <Link to="/auth">{t.cta}</Link>
                  )}
                </Button>
                {(t as any).note && (
                  <p className="text-[11px] text-muted-foreground font-light italic mt-3 leading-relaxed">{(t as any).note}</p>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Universal features */}
        <section>
          <StatsBar />
        </section>

        {/* Universal features */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Every plan includes the essentials.</h2>
            <p className="text-muted-foreground text-lg font-light">Strategy, security, and support — never paywalled.</p>
          </div>
          <Card className="p-8 md:p-12 border-border shadow-soft bg-muted/40">
            <ul className="grid md:grid-cols-2 gap-x-8 gap-y-3">
              {universal.map((u) => (
                <li key={u} className="flex gap-3 text-sm font-medium"><Check className="h-4 w-4 text-accent mt-0.5" />{u}</li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Guarantee */}
        <section className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-accent-soft mb-6">
            <Shield className="h-7 w-7 text-accent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Zero-risk 30-day guarantee.</h2>
          <p className="text-muted-foreground font-light leading-relaxed mb-3">Try MOXIEMO for 30 days. Complete the discovery. Generate content. Publish it. If we don't save you 10+ hours, create strategy that sounds like you, and simplify your workflow — full refund. No hoops.</p>
          <p className="text-sm text-muted-foreground font-light italic">Most founders who complete Discovery never look back. Your strategy is yours to keep — regardless.</p>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-10">Pricing questions, answered.</h2>
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {faqs.map((f) => (
              <Card key={f.q} className="p-6 border-border shadow-soft">
                <h3 className="font-bold mb-2">{f.q}</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">{f.a}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </MarketingPage>
  );
}