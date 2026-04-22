import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { MarketingPage } from "./MarketingPage";

const tiers = [
  {
    name: "Starter",
    price: "$149",
    sub: "/month",
    desc: "For solo operators getting strategic.",
    features: ["AI Discovery + Strategy", "Content Studio (50 generations/mo)", "Calendar + 1 channel", "Email support"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Growth",
    price: "$349",
    sub: "/month",
    desc: "For coaches & consultants $600K+.",
    features: ["Everything in Starter", "Unlimited content generations", "All channels + email sequences", "Analytics + audience CRM", "Priority support"],
    cta: "Start free",
    featured: true,
  },
  {
    name: "Scale",
    price: "Custom",
    sub: "",
    desc: "For teams & multi-brand operators.",
    features: ["Everything in Growth", "Multiple brands / workspaces", "Team collaboration", "API access", "Dedicated success manager"],
    cta: "Talk to us",
    featured: false,
  },
];

export default function Pricing() {
  return (
    <MarketingPage
      eyebrow="Pricing"
      title="HONEST PRICING. REAL ROI."
      subtitle="Replace 4-6 tools and save $93K+ annually. Start free — no credit card."
    >
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <Card
            key={t.name}
            className={`p-8 border-border shadow-soft flex flex-col ${t.featured ? "border-accent shadow-lift bg-card relative" : "bg-card"}`}
          >
            {t.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most popular
              </div>
            )}
            <h3 className="font-bold text-lg mb-1">{t.name}</h3>
            <p className="text-sm text-muted-foreground mb-6 font-light">{t.desc}</p>
            <div className="mb-6">
              <span className="font-display text-5xl">{t.price}</span>
              <span className="text-muted-foreground font-light">{t.sub}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {t.features.map((f) => (
                <li key={f} className="flex gap-3 text-sm">
                  <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="font-light">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              className={`w-full h-11 rounded-lg font-semibold ${
                t.featured ? "bg-accent hover:bg-accent/90 text-accent-foreground" : "bg-foreground hover:bg-foreground/90 text-background"
              }`}
            >
              <Link to="/auth">{t.cta}</Link>
            </Button>
          </Card>
        ))}
      </div>
    </MarketingPage>
  );
}