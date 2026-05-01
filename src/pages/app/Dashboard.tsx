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
  Flame,
  Mail,
  Calendar as CalendarIcon,
  PenSquare,
  Linkedin,
  Facebook,
  Instagram,
  Send,
} from "lucide-react";
import { toast } from "sonner";

type AnyRow = any;

// ---------- date helpers ----------
function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}
function isThisWeek(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return d >= weekStart && d < weekEnd;
}
function isLastWeek(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() - 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return d >= weekStart && d < weekEnd;
}
function isLast30Days(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  return d >= cutoff;
}
function isNext7Days(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const end = new Date();
  end.setDate(now.getDate() + 7);
  return d >= now && d <= end;
}
function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function getPostPreview(post: AnyRow, maxLen = 60): string {
  const content = post?.content_by_platform;
  let text = "";
  if (content && typeof content === "object") {
    const first = Object.values(content)[0];
    text = typeof first === "string" ? first : (first as any)?.text ?? "";
  }
  if (!text) return post?.topic ?? "";
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [profile, setProfile] = useState<AnyRow>(null);
  const [strategy, setStrategy] = useState<AnyRow>(null);
  const [socialPosts, setSocialPosts] = useState<AnyRow[]>([]);
  const [contentItems, setContentItems] = useState<AnyRow[]>([]);
  const [emailSends, setEmailSends] = useState<AnyRow[]>([]);
  const [socialConnections, setSocialConnections] = useState<AnyRow[]>([]);
  const [discovery, setDiscovery] = useState<AnyRow>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [profileRes, strategyRes, socialPostsRes, contentItemsRes, , emailSendsRes, socialConnectionsRes, discoveryRes] = await Promise.all([
          supabase.from("profiles").select("full_name, business_name, role, plan, intended_use").eq("id", user.id).maybeSingle(),
          supabase.from("strategies").select("positioning_statement, strength_score, success_definition, business_goal, content_pillars, primary_channel, posting_frequency").eq("user_id", user.id).maybeSingle(),
          supabase.from("social_posts").select("id, status, platforms, pillar, scheduled_for, published_at, content_by_platform, topic, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
          supabase.from("content_items").select("id, status, platform, topic, body, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabase.from("goal_entries").select("*").eq("user_id", user.id).order("week_of", { ascending: false }).limit(4),
          supabase.from("email_sends").select("id, subject, sent_at, recipient_count, status").eq("user_id", user.id).order("sent_at", { ascending: false }).limit(10),
          supabase.from("social_connections").select("platform, profile_name, connected_at").eq("user_id", user.id),
          supabase.from("discovery_sessions").select("status, messages").eq("user_id", user.id).maybeSingle(),
        ]);

        setProfile(profileRes.data ?? null);
        setStrategy(strategyRes.data ?? null);
        setSocialPosts(socialPostsRes.data ?? []);
        setContentItems(contentItemsRes.data ?? []);
        setEmailSends(emailSendsRes.data ?? []);
        setSocialConnections(socialConnectionsRes.data ?? []);
        setDiscovery(discoveryRes.data ?? null);
      } catch (e) {
        console.error("Dashboard data load failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // ---------- derived ----------
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const hasStrategy = !!strategy?.positioning_statement;
  const discoveryStarted = !!discovery && Array.isArray(discovery.messages) && discovery.messages.length > 0;
  const discoveryComplete = discovery?.status === "completed";

  const postsScheduledToday = socialPosts.filter((p) => p.status === "scheduled" && isToday(p.scheduled_for));
  const draftPosts = socialPosts.filter((p) => p.status === "draft");
  const draftContentItems = contentItems.filter((c) => c.status === "draft");
  const totalDrafts = draftPosts.length + draftContentItems.length;

  const subtitle = useMemo(() => {
    if (postsScheduledToday.length > 0) {
      return `You have ${postsScheduledToday.length} post${postsScheduledToday.length === 1 ? "" : "s"} scheduled today.`;
    }
    if (totalDrafts > 0) {
      return `You have ${totalDrafts} draft${totalDrafts === 1 ? "" : "s"} ready to review.`;
    }
    if (hasStrategy && (strategy?.strength_score ?? 0) < 80) {
      return "Your strategy needs some refinement — strengthen it to unlock better content.";
    }
    if (hasStrategy) return "Your marketing engine is running. Here's what needs your attention today.";
    return "Let's build the strategy that powers everything else you publish.";
  }, [postsScheduledToday.length, totalDrafts, hasStrategy, strategy]);

  // ---------- stats ----------
  const thisWeekPubPosts = socialPosts.filter((p) => isThisWeek(p.published_at));
  const thisWeekEmails = emailSends.filter((e) => isThisWeek(e.sent_at));
  const thisWeekContent = contentItems.filter((c) => isThisWeek(c.created_at));
  const hoursSaved = thisWeekPubPosts.length * 1.5 + thisWeekEmails.length * 2 + thisWeekContent.length * 0.5;

  const lastWeekPubPosts = socialPosts.filter((p) => isLastWeek(p.published_at));
  const lastWeekEmails = emailSends.filter((e) => isLastWeek(e.sent_at));
  const lastWeekContent = contentItems.filter((c) => isLastWeek(c.created_at));
  const lastWeekHours = lastWeekPubPosts.length * 1.5 + lastWeekEmails.length * 2 + lastWeekContent.length * 0.5;
  const hoursDelta = hoursSaved - lastWeekHours;

  const scheduledNext7 = socialPosts.filter((p) => p.status === "scheduled" && isNext7Days(p.scheduled_for));

  const last30Posts = socialPosts.filter((p) => isLast30Days(p.created_at || p.scheduled_for));
  const withPillar = last30Posts.filter((p) => p.pillar);
  const alignment = last30Posts.length > 0 ? Math.round((withPillar.length / last30Posts.length) * 100) : 0;

  const totalGenerated = socialPosts.length + contentItems.length;

  const stats = [
    {
      label: "Hours saved",
      value: hoursSaved > 0 ? hoursSaved.toFixed(1) : "—",
      delta:
        hoursSaved > 0
          ? `${hoursDelta >= 0 ? "+" : ""}${hoursDelta.toFixed(1)} vs. last wk`
          : hasStrategy
          ? "Publish to start tracking"
          : "Run discovery",
      icon: Clock,
    },
    {
      label: "Content scheduled",
      value: scheduledNext7.length > 0 ? String(scheduledNext7.length) : "—",
      delta: scheduledNext7.length > 0 ? "Next 7 days" : "Nothing scheduled",
      icon: FileText,
    },
    {
      label: "Strategic alignment",
      value: last30Posts.length > 0 ? `${alignment}%` : "—",
      delta: last30Posts.length > 0 ? "Matched to pillars" : "Create tagged posts to track",
      icon: Target,
    },
    {
      label: "Pieces generated",
      value: totalGenerated > 0 ? String(totalGenerated) : "—",
      delta: totalGenerated > 0 ? "All-time" : "—",
      icon: Zap,
    },
  ];

  // ---------- focus items ----------
  const focusItems = useMemo(() => {
    const items: any[] = [];

    postsScheduledToday.forEach((p) => {
      items.push({
        type: "post",
        icon: Send,
        label: `Publish to ${(p.platforms ?? []).join(", ") || "social"}`,
        detail: getPostPreview(p, 60) || "Scheduled for today",
        action: "Open Social",
        route: "/app/social",
        urgent: true,
      });
    });

    if (!hasStrategy) {
      items.push({
        type: "strategy",
        icon: Compass,
        label: "Complete your strategy",
        detail: "Everything in MOXIE flows from your strategy",
        action: "Start Discovery",
        route: "/app/discovery",
        urgent: true,
      });
    }

    const thisWeekScheduled = socialPosts.filter((p) => p.status === "scheduled" && isThisWeek(p.scheduled_for));
    if (thisWeekScheduled.length === 0 && hasStrategy) {
      items.push({
        type: "calendar",
        icon: CalendarIcon,
        label: "Nothing scheduled this week",
        detail: "Plan your content to stay consistent",
        action: "Open Calendar",
        route: "/app/social",
        urgent: false,
      });
    }

    if (totalDrafts > 0) {
      items.push({
        type: "draft",
        icon: PenSquare,
        label: `${totalDrafts} draft${totalDrafts === 1 ? "" : "s"} waiting for review`,
        detail: "Review and queue your drafts to stay consistent",
        action: "Review drafts",
        route: "/app/content",
        urgent: false,
      });
    }

    if (thisWeekEmails.length === 0 && strategy?.success_definition) {
      items.push({
        type: "email",
        icon: Mail,
        label: "No newsletter sent this week",
        detail: "Keep your audience warm with a weekly send",
        action: "Write email",
        route: "/app/email",
        urgent: false,
      });
    }

    return [...items].sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)).slice(0, 3);
  }, [postsScheduledToday, hasStrategy, socialPosts, totalDrafts, thisWeekEmails.length, strategy]);

  // ---------- quick actions w/ live subtitles ----------
  const lastGeneratedPost = socialPosts[0]?.created_at || contentItems[0]?.created_at || null;
  const quickActions = [
    {
      label: "New post",
      sub: lastGeneratedPost ? `Last generated ${timeAgo(lastGeneratedPost)}` : "No posts yet",
      icon: FileText,
      to: "/app/content",
      color: "accent",
    },
    {
      label: "Plan week",
      sub: scheduledNext7.length > 0 ? `${scheduledNext7.length} scheduled this week` : "Nothing scheduled yet",
      icon: CalendarDays,
      to: "/app/calendar",
      color: "ink",
    },
    {
      label: "Open strategy",
      sub: strategy?.strength_score != null ? `Strength: ${strategy.strength_score}/100` : "Not started",
      icon: Compass,
      to: "/app/strategy",
      color: "ink",
    },
    {
      label: "View analytics",
      sub: thisWeekPubPosts.length > 0 || socialPosts.some((p) => p.published_at)
        ? `${socialPosts.filter((p) => p.published_at).length} posts published`
        : "No data yet",
      icon: TrendingUp,
      to: "/app/analytics",
      color: "ink",
    },
  ];

  // ---------- platforms ----------
  const platformList = [
    { key: "linkedin", label: "LinkedIn", icon: Linkedin },
    { key: "facebook", label: "Facebook", icon: Facebook },
    { key: "instagram", label: "Instagram", icon: Instagram },
  ];
  function connectionFor(key: string) {
    return socialConnections.find((c) => (c.platform || "").toLowerCase() === key);
  }

  // ---------- recent activity ----------
  const activity = useMemo(() => {
    const items: any[] = [];
    socialPosts.forEach((p) => {
      if (p.published_at) {
        items.push({
          ts: p.published_at,
          icon: Send,
          label: `Published to ${(p.platforms ?? []).join(", ") || "social"}`,
        });
      } else if (p.created_at) {
        items.push({
          ts: p.created_at,
          icon: PenSquare,
          label: `Created ${p.status || "draft"} post${p.topic ? `: ${p.topic}` : ""}`,
        });
      }
    });
    emailSends.forEach((e) => {
      if (e.sent_at) {
        items.push({
          ts: e.sent_at,
          icon: Mail,
          label: `Sent email${e.subject ? `: ${e.subject}` : ""}`,
        });
      }
    });
    contentItems.forEach((c) => {
      items.push({
        ts: c.created_at,
        icon: FileText,
        label: `Created draft${c.topic ? `: ${c.topic}` : ""}`,
      });
    });
    return items
      .filter((i) => i.ts)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 5);
  }, [socialPosts, emailSends, contentItems]);

  // ---------- setup checklist ----------
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
      done: socialPosts.length + contentItems.length > 0,
      active: hasStrategy && socialPosts.length + contentItems.length === 0,
      to: "/app/content",
      desc: "A week of strategy-aligned posts in minutes",
    },
    {
      label: "Schedule your calendar",
      done: scheduledNext7.length > 0,
      active: socialPosts.length + contentItems.length > 0 && scheduledNext7.length === 0,
      to: "/app/calendar",
      desc: "Plan and auto-publish across channels",
    },
  ];
  const completedSteps = setupSteps.filter((s) => s.done).length;
  const setupProgress = Math.round((completedSteps / setupSteps.length) * 100);

  if (loading) {
    return (
      <div className="px-6 lg:px-10 py-12 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-12 w-72 bg-muted rounded-lg" />
          <div className="h-40 bg-muted rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="h-28 bg-muted rounded-2xl" />
            <div className="h-28 bg-muted rounded-2xl" />
            <div className="h-28 bg-muted rounded-2xl" />
            <div className="h-28 bg-muted rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
            <div className="h-80 bg-muted rounded-2xl" />
            <div className="h-80 bg-muted rounded-2xl" />
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
          <p className="text-lg text-muted-foreground font-light max-w-xl">{subtitle}</p>
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
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  a.color === "accent" ? "bg-accent-soft text-accent" : "bg-muted text-foreground"
                }`}
              >
                <a.icon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{a.label}</div>
                <div className="text-[11px] text-muted-foreground truncate">{a.sub}</div>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Setup checklist — show until strategy exists */}
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
                  Four steps. About 15-20 minutes total. Then MOXIE runs the rest.
                </p>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1 h-1.5 rounded-full bg-background/15 overflow-hidden">
                    <div className="h-full bg-accent transition-all duration-500" style={{ width: `${setupProgress}%` }} />
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
          {stats.map((s) => (
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
          {focusItems.length > 0 ? (
            <div className="space-y-2">
              {focusItems.map((f, i) => (
                <button
                  key={i}
                  onClick={() => navigate(f.route)}
                  className={`w-full text-left group flex items-center gap-4 p-4 rounded-xl border transition cursor-pointer ${
                    f.urgent
                      ? "border-l-4 border-l-accent border-border hover:shadow-soft"
                      : "border-border hover:border-foreground/30 hover:shadow-soft"
                  }`}
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate mb-1">{f.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{f.detail}</div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0 bg-accent-soft text-accent">
                    {f.action}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="You're all caught up"
              body="Nothing urgent right now. MOXIE will surface items here as they come up."
              cta={{ to: "/app/content", label: "Browse content" }}
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
                  <div className="text-sm leading-snug">
                    {strategy.positioning_statement?.length > 120
                      ? strategy.positioning_statement.slice(0, 120) + "..."
                      : strategy.positioning_statement}
                  </div>
                </div>
                {strategy.strength_score != null && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                        Strength
                      </div>
                      <div className="text-xs font-semibold">{strategy.strength_score}/100</div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${Math.min(100, strategy.strength_score)}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">
                      Channel
                    </div>
                    <div className="text-sm font-medium">{strategy.primary_channel || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">
                      Cadence
                    </div>
                    <div className="text-sm font-medium">{strategy.posting_frequency || "—"}</div>
                  </div>
                </div>
                {strategy.success_definition && (
                  <>
                    <div className="h-px bg-border" />
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">
                        Success target
                      </div>
                      <div className="text-sm">{strategy.success_definition}</div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="Strategy in waiting"
                body="Complete discovery and your strategy lives here — editable, exportable, always alive."
                cta={{ to: "/app/discovery", label: discoveryStarted ? "Continue" : "Start Discovery" }}
              />
            )}
          </Card>

          {/* Connected platforms */}
          <Card className="p-7 border-border shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base">Connected platforms</h3>
              <Link to="/app/social" className="text-xs text-accent hover:underline font-medium">
                Manage
              </Link>
            </div>
            <ul className="space-y-2.5">
              {platformList.map((p) => {
                const conn = connectionFor(p.key);
                const connected = !!conn;
                return (
                  <li key={p.key} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <p.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.label}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {connected ? conn.profile_name || "Connected" : "Not connected"}
                      </div>
                    </div>
                    {connected ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                    ) : (
                      <Link
                        to="/app/social"
                        className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1"
                      >
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                        Connect
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Recent activity */}
          <Card className="p-7 border-border shadow-soft">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-base">Recent activity</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Live</span>
            </div>
            {activity.length > 0 ? (
              <ul className="space-y-3.5">
                {activity.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <a.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-snug">{a.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{timeAgo(a.ts)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No activity yet. Create your first post to get started.</p>
            )}
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
