import { Card } from "@/components/ui/card";
import { MarketingPage } from "./MarketingPage";

const audiences = [
  { t: "Coaches", d: "1:1 and group programs. Build a content engine that fills your discovery calls without burning your week." },
  { t: "Consultants", d: "B2B advisory firms. Position sharply, publish consistently, prove ROI on every campaign." },
  { t: "Course creators", d: "Evergreen launches and live cohorts. Strategy-aligned funnels, not a Frankenstack of tools." },
  { t: "Agencies", d: "Run client strategy & execution side-by-side. White-label-ready. (Coming soon.)" },
];

export default function Solutions() {
  return (
    <MarketingPage
      eyebrow="Solutions"
      title="BUILT FOR THE MESSY MIDDLE."
      subtitle="$600K–$2M operators who outgrew DIY tools and don't need an enterprise CRM. MOXIE meets you exactly there."
    >
      <div className="grid md:grid-cols-2 gap-6">
        {audiences.map((a) => (
          <Card key={a.t} className="p-8 border-border shadow-soft hover:shadow-card transition">
            <h3 className="font-display text-3xl mb-3">{a.t.toUpperCase()}</h3>
            <p className="text-muted-foreground leading-relaxed font-light">{a.d}</p>
          </Card>
        ))}
      </div>
    </MarketingPage>
  );
}