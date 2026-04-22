import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Clock, FileText, Target, TrendingUp, CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<any>(null);
  const [discovery, setDiscovery] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [s, d, p] = await Promise.all([
        supabase.from("strategies").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("discovery_sessions").select("status, messages").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      setStrategy(s.data); setDiscovery(d.data); setProfile(p.data);
    })();
  }, [user]);

  const hasStrategy = !!strategy;
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Hey {firstName}.</h1>
        <p className="text-muted-foreground">{hasStrategy ? "Here's how your marketing engine is doing." : "Let's build the strategy that powers everything else."}</p>
      </div>

      {!hasStrategy && (
        <Card className="p-8 mb-8 bg-foreground text-background border-0 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative z-10 flex items-start gap-6 flex-col md:flex-row md:items-center justify-between">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-3 text-accent text-sm font-medium"><Sparkles className="h-4 w-4" /> Start here</div>
              <h2 className="font-display text-3xl mb-2">Run AI Discovery</h2>
              <p className="text-background/70">A 30-45 minute guided conversation. MOXIE extracts your positioning, voice, audience, and goals — then builds the foundation for everything you'll publish.</p>
            </div>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground h-11 px-6 rounded-lg flex-shrink-0">
              <Link to="/app/discovery">{discovery && discovery.messages?.length > 0 ? "Continue" : "Begin discovery"} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Hours saved this week", value: hasStrategy ? "18" : "—", sub: "vs. tool-juggling baseline", icon: Clock },
          { label: "Content scheduled", value: hasStrategy ? "12" : "—", sub: "across this week", icon: FileText },
          { label: "Strategic alignment", value: hasStrategy ? "94%" : "—", sub: "content matched to pillars", icon: Target },
        ].map((s) => (
          <Card key={s.label} className="p-5 border-border shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="font-display text-3xl mb-1">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6 border-border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Today's content</h3>
            <Link to="/app/content" className="text-xs text-accent hover:underline">View all →</Link>
          </div>
          {hasStrategy ? (
            <div className="space-y-3">
              {[
                { ch: "LinkedIn", title: "The hidden cost of being a brilliant operator", status: "Ready to review" },
                { ch: "Email", title: "Why your $600K business feels like a $60K hustle", status: "Drafted" },
                { ch: "LinkedIn", title: "3 questions to ask before hiring a VA", status: "Scheduled" },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-foreground/30 transition cursor-pointer">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><span className="px-1.5 py-0.5 rounded bg-muted">{c.ch}</span>{c.status}</div>
                    <div className="text-sm font-medium truncate">{c.title}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Complete discovery to start generating strategy-aligned content.</p>
          )}
        </Card>
        <Card className="p-6 border-border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Strategy snapshot</h3>
            <Link to="/app/strategy" className="text-xs text-accent hover:underline">Open strategy →</Link>
          </div>
          {hasStrategy ? (
            <div className="space-y-3 text-sm">
              <div><div className="text-xs text-muted-foreground mb-1">Positioning</div><div>{strategy.positioning_statement}</div></div>
              <div><div className="text-xs text-muted-foreground mb-1">Primary channel</div><div className="font-medium">{strategy.primary_channel}</div></div>
              <div><div className="text-xs text-muted-foreground mb-1">Success target</div><div>{strategy.success_definition}</div></div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Your strategy will appear here after discovery.</div>
          )}
        </Card>
      </div>
    </div>
  );
}