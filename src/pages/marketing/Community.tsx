import { Card } from "@/components/ui/card";
import { Users, MessageCircle, Calendar, BookOpen } from "lucide-react";
import { MarketingPage } from "./MarketingPage";

const items = [
  { icon: Users, t: "The Operators Circle", d: "Private community of $600K+ coaches and consultants running MOXIE." },
  { icon: MessageCircle, t: "Office hours", d: "Weekly live sessions with the MOXIE team and guest strategists." },
  { icon: Calendar, t: "Quarterly summits", d: "Virtual + in-person events. Sharpen positioning, swap playbooks." },
  { icon: BookOpen, t: "The playbook library", d: "Real campaigns, real strategies, real numbers — from real operators." },
];

export default function Community() {
  return (
    <MarketingPage
      eyebrow="Community"
      title="OPERATORS WHO BUILD ALONGSIDE YOU."
      subtitle="MOXIE isn't just a platform. It's a working circle of coaches and consultants who've been where you are."
    >
      <div className="grid md:grid-cols-2 gap-6">
        {items.map((i) => (
          <Card key={i.t} className="p-7 border-border shadow-soft hover:shadow-card transition group">
            <div className="h-10 w-10 rounded-lg bg-accent-soft flex items-center justify-center mb-4 group-hover:bg-accent transition">
              <i.icon className="h-5 w-5 text-accent group-hover:text-accent-foreground transition" />
            </div>
            <h3 className="font-bold text-lg mb-2">{i.t}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-light">{i.d}</p>
          </Card>
        ))}
      </div>
    </MarketingPage>
  );
}