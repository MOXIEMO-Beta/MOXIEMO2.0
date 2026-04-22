import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Mail, Linkedin } from "lucide-react";

const items = [
  { ch: "LinkedIn", icon: Linkedin, title: "The hidden cost of being a brilliant operator", status: "Ready to review", pillar: "Identity reclamation" },
  { ch: "Email", icon: Mail, title: "Why your $600K business feels like a $60K hustle", status: "Drafted", pillar: "Strategic CEO" },
  { ch: "LinkedIn", icon: Linkedin, title: "3 questions to ask before hiring a VA", status: "Scheduled", pillar: "Operator → leader" },
  { ch: "LinkedIn", icon: Linkedin, title: "Stop integrating tools. Start replacing them.", status: "Generated", pillar: "Tool fragmentation" },
  { ch: "Email", icon: Mail, title: "The 18-hour audit", status: "Generated", pillar: "Time as currency" },
];

export default function Content() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl mb-2">Content</h1>
          <p className="text-muted-foreground">Strategy-aligned posts, emails, and copy — ready to review.</p>
        </div>
        <Button className="bg-foreground text-background hover:bg-foreground/90 h-10 rounded-lg"><Plus className="mr-2 h-4 w-4" /> New piece</Button>
      </div>

      <div className="grid gap-3">
        {items.map((it, i) => (
          <Card key={i} className="p-5 border-border shadow-soft hover:shadow-card transition cursor-pointer flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><it.icon className="h-5 w-5 text-foreground" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span className="px-1.5 py-0.5 rounded bg-muted">{it.ch}</span>
                <span>•</span>
                <span>{it.pillar}</span>
              </div>
              <div className="font-medium truncate">{it.title}</div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent-soft text-accent font-medium flex-shrink-0">{it.status}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}