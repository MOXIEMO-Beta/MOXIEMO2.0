import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Clock,
  FileText,
  Target,
  TrendingUp,
  CalendarDays,
  Compass,
  Zap,
  CheckCircle2,
  Search,
  Plus,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

type Strategy = any;
type Discovery = { status?: string; messages?: any[] } | null;
type Profile = { full_name?: string | null; business_name?: string | null } | null;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [strategy, setStrategy] = useState<Strategy>(null);
  const [discovery, setDiscovery] = useState<Discovery>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [s, d, p] = await Promise.all([
        supabase.from("strategies").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("discovery_sessions").select("status, messages").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      setStrategy(s.data);
      setDiscovery(d.data as Discovery);
      setProfile(p.data as Profile);
      setLoading(false);
    })();
  }, [user]);

  const hasStrategy = !!strategy;
  const discoveryStarted = !!discovery && Array.isArray(discovery.messages) && discovery.messages.length > 0;
  const discoveryComplete = discovery?.status === "completed";
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const setupSteps = [
    {
      label: "Run MOXIE Discovery",
      done: discoveryComplete,
      active: !discoveryComplete,
      to: "/app/discovery",
      desc: "30-min conversation that extracts your foundation",
    },
    {
      label: "Review your Strategy",
      done: hasStrategy,
      active: discoveryComplete && !hasStrategy,
      to: "/app/strategy",
      desc: "Positioning, voice, pillars, and goals",
    },
    {
      label: "Generate first content batch",
      done: false,
      active: hasStrategy,
      to: "/app/content",
      desc: "A week of strategy-aligned posts in minutes",
    },
    {
      label: "Schedule your calendar",
      done: false,
      active: false,
      to: "/app/calendar",
      desc: "Plan and auto-publish across channels",
    },
  ];
  const completedSteps = setupSteps.filter((s) => s.done).length;
  const setupProgress = Math.round((completedSteps / setupSteps.length) * 100);

  async function testConnection() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      console.log("Testing connection to:", `${supabaseUrl}/functions/v1/discovery-chat`);
      console.log("Auth token available:", !!session?.access_token);
      console.log("Anon key available:", !!supabaseKey);

      const resp = await fetch(`${supabaseUrl}/functions/v1/discovery-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? supabaseKey}`,
          "apikey": supabaseKey ?? "",
        },
        body: JSON.stringify({ messages: [], userContext: { firstName: "Test", role: "Founder" } }),
      });

      console.log("Response status:", resp.status);
      console.log("Response headers:", Object.fromEntries(resp.headers.entries()));

      if (!resp.ok) {
        const text = await resp.text();
        console.error("Error response:", text);
        toast.error(`Connection test failed: ${resp.status}`, { description: text.slice(0, 200) });
      } else {
        toast.success(`Connection test passed: ${resp.status}`);
      }
    } catch (e: any) {
      console.error("Connection test error:", e);
      toast.error("Connection test threw an error", { description: e?.message });
    }
  }

  const quickActions = [
    { label: "New post", icon: FileText, to: "/app/content", color: "accent" },
    { label: "Plan week", icon: CalendarDays, to: "/app/calendar", color: "ink" },
    { label: "Open strategy", icon: Compass, to: "/app/strategy", color: "ink" },
    { label: "View analytics", icon: TrendingUp, to: "/app/analytics", color: "ink" },
  ];

  if (loading) {
    return (
      <div className="px-6 lg:px-10 py-12 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-12 w-72 bg-muted rounded-lg" />
          <div className="h-40 bg-muted rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="h-32 bg-muted rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-10 py-10 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-accent px-3 py-1.5 rounded-full bg-accent-soft mb-4">
            Workspace
          </span>
          <h1 className="font-display text-5xl md:text-6xl tracking-[-0.04em] leading-[0.95] mb-3">
            {greeting}, {firstName}.
          </h1>
          <p className="text-lg text-muted-foreground font-light max-w-xl">
            {hasStrategy
              ? "Your marketing engine is running. Here's what needs your attention today."
              : "Let's build the strategy that powers everything else you publish."}
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) navigate(`/app/content?q=${encodeURIComponent(query)}`);
            }}
            placeholder="Search content, ideas, briefs…"
            className="pl-10 h-11 rounded-xl border-border bg-muted/40 focus-visible:bg-background"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>
      </header>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="group flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:border-foreground/30 hover:shadow-card transition-all"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                  a.color === "accent" ? "bg-accent-soft text-accent" : "bg-muted text-foreground"
                }`}
              >
                <a.icon className="h-[18px] w-[18px]" />
              </div>
              <span className="font-medium text-sm">{a.label}</span>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
          </Link>
        ))}
      </div>

      {/* Setup checklist — show until strategy exists OR collapse to thin progress */}
      {!hasStrategy ? (
        <Card className="p-0 overflow-hidden border-0 shadow-lift bg-foreground text-background">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-0">
            <div className="p-8 lg:p-10 relative overflow-hidden">
              <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.25em] text-accent px-3 py-1.5 rounded-full bg-accent/10 mb-5">
                  <Sparkles className="h-3 w-3" /> Start here
                </span>
                <h2 className="font-display text-4xl md:text-5xl tracking-[-0.04em] leading-[1] mb-3">
                  Set up your engine.
                </h2>
                <p className="text-background/70 text-lg font-light mb-7 max-w-md">
                  Four steps. About 45 minutes total. Then MOXIE runs the rest.
                </p>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1 h-1.5 rounded-full bg-background/15 overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-500"
                      style={{ width: `${setupProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-background/60 font-medium">
                    {completedSteps}/{setupSteps.length}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 lg:p-8 bg-background text-foreground">
              <ol className="space-y-1">
                {setupSteps.map((step, i) => (
                  <li key={step.label}>
                    <Link
                      to={step.to}
                      className={`flex items-start gap-3 p-3 rounded-lg transition group ${
                        step.active ? "bg-accent-soft" : "hover:bg-muted"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-bold ${
                          step.done
                            ? "bg-foreground text-background"
                            : step.active
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold ${step.done ? "line-through text-muted-foreground" : ""}`}>
                          {step.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{step.desc}</div>
                        {step.label === "Run MOXIE Discovery" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              testConnection();
                            }}
                            className="mt-2 h-7 px-2 text-xs"
                          >
                            Test connection
                          </Button>
                        )}
                      </div>
                      {step.active && (
                        <ArrowRight className="h-4 w-4 text-accent flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition" />
                      )}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Stats row */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-accent px-2.5 py-1 rounded-full bg-accent-soft mb-2">
              This week
            </span>
            <h2 className="font-display text-2xl tracking-[-0.02em]">Engine performance</h2>
          </div>
          <Link to="/app/analytics" className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-1">
            Full analytics <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { label: "Hours saved", value: hasStrategy ? "18.4" : "—", delta: hasStrategy ? "+3.2 vs. last wk" : "Run discovery", icon: Clock },
            { label: "Content scheduled", value: hasStrategy ? "12" : "—", delta: hasStrategy ? "Next 7 days" : "—", icon: FileText },
            { label: "Strategic alignment", value: hasStrategy ? "94%" : "—", delta: hasStrategy ? "Matched to pillars" : "—", icon: Target },
            { label: "Pieces generated", value: hasStrategy ? "47" : "—", delta: hasStrategy ? "All-time" : "—", icon: Zap },
          ].map((s) => (
            <Card key={s.label} className="p-5 border-border shadow-soft hover:shadow-card transition group">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {s.label}
                </span>
                <s.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition" />
              </div>
              <div className="font-display text-4xl tracking-[-0.03em] mb-1.5">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.delta}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Two-column workspace */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Today's focus */}
        <Card className="p-7 border-border shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent-soft flex items-center justify-center">
                <Flame className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Today's focus</h3>
                <p className="text-xs text-muted-foreground">Priority queue, ranked by MOXIE</p>
              </div>
            </div>
            <Link to="/app/content" className="text-xs text-accent hover:underline font-medium">
              View all
            </Link>
          </div>
          {hasStrategy ? (
            <div className="space-y-2">
              {[
                { ch: "LinkedIn", title: "The hidden cost of being a brilliant operator", status: "Ready to review", priority: "High" },
                { ch: "Email", title: "Why your $600K business feels like a $60K hustle", status: "Drafted", priority: "Medium" },
                { ch: "LinkedIn", title: "3 questions to ask before hiring a VA", status: "Scheduled · Thu 9am", priority: "Low" },
                { ch: "LinkedIn", title: "Stop integrating tools. Start replacing them.", status: "Generated", priority: "Medium" },
              ].map((c, i) => (
                <Link
                  to="/app/content"
                  key={i}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-foreground/30 hover:shadow-soft transition cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {c.ch.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate mb-1">{c.title}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{c.ch}</span>
                      <span>·</span>
                      <span>{c.status}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0 ${
                      c.priority === "High"
                        ? "bg-accent-soft text-accent"
                        : c.priority === "Medium"
                        ? "bg-muted text-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.priority}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No content yet"
              body="Once your strategy is in place, MOXIE generates a prioritized queue every morning."
              cta={{ to: "/app/discovery", label: discoveryStarted ? "Continue discovery" : "Begin discovery" }}
            />
          )}
        </Card>

        {/* Strategy snapshot + activity */}
        <div className="space-y-4">
          <Card className="p-7 border-border shadow-soft">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center">
                  <Compass className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-base">Strategy snapshot</h3>
              </div>
              <Link to="/app/strategy" className="text-xs text-accent hover:underline font-medium">
                Open
              </Link>
            </div>
            {hasStrategy ? (
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">
                    Positioning
                  </div>
                  <div className="text-sm leading-snug">{strategy.positioning_statement}</div>
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">
                      Channel
                    </div>
                    <div className="text-sm font-medium">{strategy.primary_channel}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">
                      Cadence
                    </div>
                    <div className="text-sm font-medium">{strategy.posting_frequency}</div>
                  </div>
                </div>
                <div className="h-px bg-border" />
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">
                    Success target
                  </div>
                  <div className="text-sm">{strategy.success_definition}</div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="Strategy in waiting"
                body="Complete discovery and your strategy lives here — editable, exportable, always alive."
                cta={{ to: "/app/discovery", label: discoveryStarted ? "Continue" : "Start" }}
              />
            )}
          </Card>

          <Card className="p-7 border-border shadow-soft">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-base">Recent activity</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Live</span>
            </div>
            <ul className="space-y-3.5">
              {(hasStrategy
                ? [
                    { t: "MOXIE generated 4 LinkedIn drafts", time: "12m ago", dot: "accent" },
                    { t: "Strategy refined: voice attributes updated", time: "2h ago", dot: "ink" },
                    { t: "Weekly plan auto-scheduled", time: "Yesterday", dot: "ink" },
                    { t: "Discovery completed", time: "3 days ago", dot: "ink" },
                  ]
                : discoveryStarted
                ? [{ t: "Discovery in progress", time: "Resume anytime", dot: "accent" }]
                : [{ t: "Welcome to MOXIE", time: "Just now", dot: "accent" }]
              ).map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div
                    className={`h-2 w-2 rounded-full flex-shrink-0 mt-1.5 ${
                      a.dot === "accent" ? "bg-accent" : "bg-foreground/40"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-snug">{a.t}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{a.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: any;
  title: string;
  body: string;
  cta: { to: string; label: string };
}) {
  return (
    <div className="text-center py-8 px-4">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="font-semibold mb-1.5">{title}</div>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto leading-relaxed">{body}</p>
      <Button asChild size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-lg">
        <Link to={cta.to}>
          {cta.label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
