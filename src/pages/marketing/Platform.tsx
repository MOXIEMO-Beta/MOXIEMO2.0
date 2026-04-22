import { Card } from "@/components/ui/card";
import { Compass, FileText, Calendar, Mail, BarChart3, Users } from "lucide-react";
import { MarketingPage } from "./MarketingPage";

const modules = [
  { icon: Compass, t: "Strategy Engine", d: "AI Discovery → positioning, pillars, voice, channel, success metrics. Living, editable, referenced by every other module." },
  { icon: FileText, t: "Content Studio", d: "Generate emails, posts, captions in your voice. Approve, edit, schedule — all in one workspace." },
  { icon: Calendar, t: "Calendar", d: "Plan a quarter in minutes. See cadence, gaps, and channel mix at a glance." },
  { icon: Mail, t: "Email & Sequences", d: "Broadcasts and automations that already match your strategy and audience." },
  { icon: BarChart3, t: "Analytics", d: "What's working, what's not — explained against your strategic goals, not vanity metrics." },
  { icon: Users, t: "Audience CRM", d: "One contact list, one truth. Behavior-aware. No more re-tagging across tools." },
];

export default function Platform() {
  return (
    <MarketingPage
      eyebrow="The platform"
      title="ONE PLATFORM. SIX MODULES. ZERO INTEGRATIONS."
      subtitle="MOXIE replaces the tools you stopped wanting to manage. Each module is wired to one shared source of truth — your strategy."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => (
          <Card key={m.t} className="p-7 border-border shadow-soft hover:shadow-card transition group">
            <div className="h-10 w-10 rounded-lg bg-accent-soft flex items-center justify-center mb-4 group-hover:bg-accent transition">
              <m.icon className="h-5 w-5 text-accent group-hover:text-accent-foreground transition" />
            </div>
            <h3 className="font-bold text-lg mb-2">{m.t}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-light">{m.d}</p>
          </Card>
        ))}
      </div>
    </MarketingPage>
  );
}