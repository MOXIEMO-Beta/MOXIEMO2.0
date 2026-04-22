import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Compass } from "lucide-react";

export default function Strategy() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("strategies").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setStrategy(data); setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;

  if (!strategy) {
    return (
      <div className="px-6 lg:px-10 py-16 max-w-3xl mx-auto text-center">
        <div className="h-16 w-16 rounded-2xl bg-foreground mx-auto mb-6 flex items-center justify-center"><Compass className="h-7 w-7 text-accent" /></div>
        <h1 className="font-display text-4xl mb-3">No strategy yet</h1>
        <p className="text-muted-foreground mb-8">Run AI Discovery to extract your positioning, voice, and content foundation.</p>
        <Button asChild className="bg-foreground text-background hover:bg-foreground/90 h-11 rounded-lg">
          <Link to="/app/discovery"><Sparkles className="mr-2 h-4 w-4 text-accent" /> Begin discovery</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Your strategy</div>
        <h1 className="font-display text-4xl mb-3">Marketing foundation</h1>
        <p className="text-muted-foreground max-w-2xl">This strategy powers every piece of content, email, and post MOXIE generates. Update it any time — your execution layer adapts automatically.</p>
      </div>

      <Card className="p-8 mb-6 bg-foreground text-background border-0">
        <div className="text-xs uppercase tracking-wider text-accent mb-3">Positioning statement</div>
        <p className="font-display text-2xl leading-relaxed">{strategy.positioning_statement}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Ideal client", value: strategy.ideal_client },
          { label: "Pain point", value: strategy.pain_point },
          { label: "Transformation", value: strategy.transformation },
        ].map((s) => (
          <Card key={s.label} className="p-5 border-border shadow-soft">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{s.label}</div>
            <p className="text-sm leading-relaxed">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-6 border-border shadow-soft">
          <h3 className="font-medium mb-4">Voice</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {(strategy.voice_attributes || []).map((v: string) => (
              <Badge key={v} variant="secondary" className="bg-accent-soft text-accent border-0 hover:bg-accent-soft">{v}</Badge>
            ))}
          </div>
          {strategy.anti_positioning && (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Never sound like</div>
              <p className="text-sm text-muted-foreground italic">{strategy.anti_positioning}</p>
            </div>
          )}
        </Card>
        <Card className="p-6 border-border shadow-soft">
          <h3 className="font-medium mb-4">Channel & cadence</h3>
          <div className="space-y-3 text-sm">
            <div><div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Primary channel</div><div className="font-medium">{strategy.primary_channel}</div></div>
            {strategy.posting_frequency && <div><div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Frequency</div><div>{strategy.posting_frequency}</div></div>}
            {strategy.time_capacity && <div><div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Time capacity</div><div>{strategy.time_capacity}</div></div>}
          </div>
        </Card>
      </div>

      <Card className="p-6 border-border shadow-soft mb-6">
        <h3 className="font-medium mb-4">Content pillars</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(strategy.content_pillars || []).map((p: any, i: number) => (
            <div key={i} className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-display text-2xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-medium">{p.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">{p.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 border-border shadow-soft">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Success looks like</div>
          <p>{strategy.success_definition}</p>
        </Card>
        <Card className="p-6 border-border shadow-soft">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Business goal</div>
          <p>{strategy.business_goal}</p>
        </Card>
      </div>
    </div>
  );
}