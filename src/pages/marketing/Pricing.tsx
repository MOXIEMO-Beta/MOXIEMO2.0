import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { MarketingPage } from "./MarketingPage";
import { StatsBar } from "@/components/StatsBar";

const tiers = [
  {
    name: "Starter",
    price: "$129",
    sub: "/month",
    annual: "or $1,290/year (save $258)",
    desc: "For solo coaches starting to systematize marketing.",
    features: ["Complete AI strategic discovery", "Marketing strategy foundation", "90-day content calendar", "Email marketing (up to 5,000 subscribers)", "Social publishing (LinkedIn + 1 platform)", "Content creation (10 pieces/month)", "Basic analytics dashboard", "Standard support (24-hour response)"],
    replaces: "ConvertKit + Buffer + scheduling tool",
    savings: "~$60/mo + 12 hours/week",
    cta: "Start free discovery",
    featured: false,
  },
  {
    name: "Professional",
    price: "$179",
    sub: "/month",
    annual: "or $1,790/year (save $358)",
    desc: "For established coaches and consultants scaling to $1M+.",
    features: ["Everything in Starter", "Unlimited subscribers", "Social: LinkedIn + Instagram + Facebook", "Unlimited content creation", "Advanced analytics (attribution + ROI)", "Campaign sequences (launches, evergreen)", "Lead magnet creation", "Priority support (12-hour response)", "Quarterly strategy refinement calls"],
    replaces: "ConvertKit + Buffer + Kajabi + scheduling",
    savings: "~$372/mo + 18 hours/week",
    cta: "Start free discovery",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    sub: "",
    annual: "Starting at $499/month",
    desc: "For agencies and multi-coach practices.",
    features: ["Everything in Professional", "Team collaboration (5+ users)", "White-label options", "Custom integrations", "Dedicated account manager", "White-glove migration", "Monthly strategy sessions", "Custom feature development", "SLA guarantees"],
    replaces: "Full martech stack",
    savings: "$1,000+/mo + team capacity",
    cta: "Book enterprise demo",
    featured: false,
  },
];

const universal = ["30-min AI strategic discovery", "Marketing strategy foundation", "Brand voice & positioning", "Unlimited strategy updates", "Mobile app (iOS + Android)", "Data export anytime", "99.9% uptime SLA", "SOC 2 Type II security", "GDPR compliance", "30-day money-back guarantee"];

const faqs = [
  { q: "Why is MOXIE cheaper than my current tool stack?", a: "We're one platform replacing 4–6 tools. No integrations, no middleware, no complexity. Lower costs = lower price." },
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
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((t) => (
              <Card key={t.name} className={`p-8 border-border shadow-soft flex flex-col ${t.featured ? "border-accent shadow-lift bg-card relative ring-1 ring-accent" : "bg-card"}`}>
                {t.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most popular
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
                <Button asChild className={`w-full h-11 rounded-full font-semibold ${t.featured ? "bg-accent hover:bg-accent/90 text-accent-foreground" : "bg-foreground hover:bg-foreground/90 text-background"}`}>
                  <Link to="/auth">{t.cta}</Link>
                </Button>
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
          <p className="text-muted-foreground font-light leading-relaxed mb-3">Try MOXIE for 30 days. Complete the discovery. Generate content. Publish it. If we don't save you 10+ hours, create strategy that sounds like you, and simplify your workflow — full refund. No hoops.</p>
          <p className="text-sm text-muted-foreground font-light italic">92% of users who complete discovery stay long-term.</p>
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