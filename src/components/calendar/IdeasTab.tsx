import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw, X, ArrowRight, AlertTriangle, Lightbulb, Mic, BookOpen, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { asArray } from "./helpers";

function isThisMonth(iso: string | null | undefined) {
  if (!iso) return false;
  const d = new Date(iso); const n = new Date();
  return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}
function isThisWeek(iso: string | null | undefined) {
  if (!iso) return false;
  const d = new Date(iso); const n = new Date();
  const ws = new Date(n); ws.setDate(n.getDate() - n.getDay()); ws.setHours(0,0,0,0);
  const we = new Date(ws); we.setDate(ws.getDate() + 7);
  return d >= ws && d < we;
}

export default function IdeasTab({ ctx }: { ctx: any }) {
  const { strategy, socialPosts, emailSends, ideas, refresh, user, navigate } = ctx;
  const [loadingGen, setLoadingGen] = useState(false);

  const opportunities = ideas.filter((i: any) => !i.dismissed).slice(0, 3);

  async function generate() {
    if (!user) return;
    setLoadingGen(true);
    try {
      const recentPosts = socialPosts.filter((p: any) => p.status === "published").slice(0, 10);
      const recentEmails = emailSends.filter((e: any) => e.status === "sent").slice(0, 5);
      const activeChannels = Array.from(new Set(socialPosts.flatMap((p: any) => p.platforms ?? [])));
      const { data, error } = await supabase.functions.invoke("generate-calendar-ideas", {
        body: { strategy, recentPosts, recentEmails, activeChannels },
      });
      if (error) throw error;
      const newIdeas = (data as any)?.ideas ?? [];
      // Persist
      if (newIdeas.length > 0) {
        await supabase.from("calendar_ideas").insert(newIdeas.map((it: any) => ({
          user_id: user.id,
          idea_text: it.title,
          idea_type: it.type ?? "opportunity",
          channel: it.channel ?? null,
          metadata: { insight: it.insight, action: it.action },
        })));
      }
      void refresh();
      toast.success("Fresh ideas generated");
    } catch (e: any) {
      toast.error("Could not generate ideas", { description: e.message });
    } finally {
      setLoadingGen(false);
    }
  }

  async function dismiss(id: string) {
    await supabase.from("calendar_ideas").update({ dismissed: true }).eq("id", id);
    void refresh();
  }

  // Auto-generate first time if empty
  useEffect(() => {
    if (!user || ideas === null) return;
    // Only first load — skip auto to avoid extra cost
  }, [user, ideas]);

  // Section 2 — content gaps
  const gaps = useMemo(() => {
    const g: any[] = [];
    asArray<string>(strategy?.content_pillars).forEach((pillarRaw: any) => {
      const pillar = typeof pillarRaw === "string" ? pillarRaw : (pillarRaw?.name ?? pillarRaw?.title ?? "");
      if (!pillar) return;
      const has = socialPosts.some((p: any) => p.pillar === pillar && isThisMonth(p.published_at ?? p.scheduled_for));
      if (!has) g.push({ type: "pillar_gap", title: `"${pillar}" hasn't been covered this month`, action: "Create post", channel: "linkedin" });
    });
    if (!emailSends.some((e: any) => isThisWeek(e.sent_at))) {
      g.push({ type: "email_gap", title: "No newsletter sent this week", action: "Write email", channel: "email" });
    }
    const next7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i + 1); return d.toISOString().slice(0, 10);
    });
    const scheduled = new Set(socialPosts.filter((p: any) => p.status === "scheduled" && p.scheduled_for).map((p: any) => p.scheduled_for.slice(0, 10)));
    const empty = next7.filter(d => !scheduled.has(d));
    if (empty.length > 3) {
      g.push({ type: "schedule_gap", title: `${empty.length} empty days next week`, action: "Fill schedule", channel: "linkedin" });
    }
    return g;
  }, [strategy, socialPosts, emailSends]);

  // Section 3 — expansion
  const methodology = strategy?.methodology ?? "your methodology";
  const expansion = [
    { icon: Mail, title: "LinkedIn Newsletter", body: "Your LinkedIn posts are your strongest channel. A LinkedIn newsletter lets your followers subscribe for direct delivery — no algorithm needed.", tag: "Low effort · High reach" },
    { icon: BookOpen, title: "Lead magnet", body: `Turn ${methodology} into a free guide. Offer it as a content upgrade to grow your email list.`, tag: "Medium effort · High impact" },
    { icon: Mic, title: "Podcast pitching", body: "Your positioning is strong enough to pitch podcasts. One appearance can generate 10x more leads than a month of posts.", tag: "Medium effort · Authority building" },
    { icon: Sparkles, title: "Speaking & events", body: "Your themes align with industry conferences. Submit a speaker application to 3 events this quarter.", tag: "Low effort · High credibility" },
  ];

  function actionRoute(channel: string) {
    if (channel === "email") return "/app/email";
    if (channel === "content") return "/app/content";
    return "/app/social?tab=create";
  }

  return (
    <div className="space-y-8">
      {/* Section 1 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-xl">This week's opportunities</h2>
            <p className="text-sm text-muted-foreground">MOXIEMO-generated ideas based on your strategy and recent activity.</p>
          </div>
          <Button variant="outline" size="sm" onClick={generate} disabled={loadingGen}>
            <RefreshCw className={`w-3 h-3 ${loadingGen ? "animate-spin" : ""}`} />
            {opportunities.length === 0 ? "Generate" : "Refresh"}
          </Button>
        </div>
        {loadingGen ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
          </div>
        ) : opportunities.length === 0 ? (
          <Card className="p-6 border-dashed border-border text-center">
            <Sparkles className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Click "Generate" to get 3 fresh marketing opportunities.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {opportunities.map((o: any) => (
              <Card key={o.id} className="p-4 shadow-soft border-border flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-[10px]">{o.idea_type}</Badge>
                  <button onClick={() => dismiss(o.id)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                </div>
                <div className="font-medium text-sm mb-2">{o.idea_text}</div>
                <div className="text-xs text-muted-foreground mb-3 flex-1">{o.metadata?.insight}</div>
                <Button size="sm" onClick={() => navigate(actionRoute(o.channel ?? "linkedin"))}>
                  {o.metadata?.action ?? "Create this"} <ArrowRight className="w-3 h-3" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Section 2 */}
      <section>
        <h2 className="font-display text-xl mb-3">Content gaps</h2>
        {gaps.length === 0 ? (
          <Card className="p-4 border-border text-sm text-muted-foreground">No gaps detected — you're on track.</Card>
        ) : (
          <div className="space-y-2">
            {gaps.map((g, i) => (
              <Card key={i} className="p-3 shadow-soft border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="text-sm truncate">{g.title}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate(actionRoute(g.channel))}>
                  {g.action}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Section 3 */}
      <section>
        <h2 className="font-display text-xl mb-3">Expansion ideas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {expansion.map((e, i) => {
            const Icon = e.icon;
            return (
              <Card key={i} className="p-4 shadow-soft border-border">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-accent-soft flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1">{e.title}</div>
                    <div className="text-xs text-muted-foreground mb-2">{e.body}</div>
                    <Badge variant="outline" className="text-[10px] mb-3">{e.tag}</Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toast.success("Added to Ideas library")}>
                        <Lightbulb className="w-3 h-3" /> Add to plan
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
