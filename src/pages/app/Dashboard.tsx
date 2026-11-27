import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDateUS } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/hooks/useBrand";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Flame,
  Mail,
  Calendar as CalendarIcon,
  PenSquare,
  Linkedin,
  Facebook,
  Instagram,
  Send,
  CheckCircle,
  User as UserIcon,
  BarChart3,
  Rocket,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useGoalDefinitions } from "@/hooks/useGoalDefinitions";

type AnyRow = any;

// ---------- brand tokens ----------
const CORAL = "#E85A46";
const CORAL_LIGHT = "#FF8A6B";
const CORAL_TINT = "#FBE4DD";
const SAGE = "#B8C5A6";
const SAGE_TINT = "#E7EBDF";
const SAGE_LABEL = "#4F5A3E";
const TAUPE = "#D8CEBD";
const TAUPE_TINT = "#EDE7DB";
const TAUPE_LABEL = "#6B6250";
const NAVY = "#14243D";
const INK = "#0E0F10";
const NAVY_MUTED = "#AEB9C9";
const NAVY_TINT = "#F4C9BC";

// Gradient tokens for the three-color stat row + navy North Star.
const GRAD_TODAY = "linear-gradient(135deg, #EA6350 0%, #E1503B 100%)";
const GRAD_WEEK = "linear-gradient(135deg, #BFCBAE 0%, #AEBB9B 100%)";
const GRAD_MONTH = "linear-gradient(135deg, #E3D6BE 0%, #D6C6A8 100%)";
const GRAD_NAVY = "linear-gradient(135deg, #1B2A3C 0%, #13202E 100%)";
const SHADOW_TODAY = "0 12px 28px -12px rgba(226, 83, 60, 0.55)";
const SHADOW_WEEK = "0 12px 28px -12px rgba(140, 160, 120, 0.45)";
const SHADOW_MONTH = "0 12px 28px -12px rgba(180, 155, 110, 0.45)";
const PAPER = "#F4F2ED";
const HAIRLINE = "#EAE7E1";
const CARD_SHADOW = "0 1px 2px rgba(21,23,28,0.03)";
const CARD_SHADOW_HOVER = "0 10px 24px rgba(21,23,28,0.07)";

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
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "metric";
}
function weeksSince(startIso: string | null | undefined): number {
  if (!startIso) return 1;
  const start = new Date(startIso);
  if (isNaN(start.getTime())) return 1;
  const days = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return Math.min(52, Math.max(1, Math.floor(days / 7) + 1));
}
function lastReported<T = number>(entries: AnyRow[], key: string): T | null {
  for (const e of entries) {
    const v = e?.[key];
    if (typeof v === "number" && !isNaN(v)) return v as unknown as T;
  }
  return null;
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
  const { brandId } = useBrand();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<AnyRow>(null);
  const [strategy, setStrategy] = useState<AnyRow>(null);
  const [socialPosts, setSocialPosts] = useState<AnyRow[]>([]);
  const [contentItems, setContentItems] = useState<AnyRow[]>([]);
  const [emailSends, setEmailSends] = useState<AnyRow[]>([]);
  const [socialConnections, setSocialConnections] = useState<AnyRow[]>([]);
  const [discovery, setDiscovery] = useState<AnyRow>(null);
  const [goalEntries, setGoalEntries] = useState<AnyRow[]>([]);
  const [bestPost, setBestPost] = useState<{ impressions: number; engagement: number; text: string; pillar: string | null } | null>(null);
  const [pageTopPost, setPageTopPost] = useState<{
    text: string; impressions: number; reactions: number; comments: number; clicks: number; engagementPct: number | null;
  } | null>(null);
  const [pageHasData, setPageHasData] = useState<boolean | null>(null);

  // Lane 3 firstMove modal + local dismissal (per user).
  const [firstMoveOpen, setFirstMoveOpen] = useState(false);
  const firstMoveKey = user?.id ? `moxiemo:firstMove:dismissed:${user.id}` : null;
  const [firstMoveDismissed, setFirstMoveDismissed] = useState<boolean>(false);
  useEffect(() => {
    if (!firstMoveKey) { setFirstMoveDismissed(false); return; }
    try { setFirstMoveDismissed(localStorage.getItem(firstMoveKey) === "1"); }
    catch { setFirstMoveDismissed(false); }
  }, [firstMoveKey]);
  const dismissFirstMove = () => {
    setFirstMoveDismissed(true);
    setFirstMoveOpen(false);
    try { if (firstMoveKey) localStorage.setItem(firstMoveKey, "1"); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!user) return;
    // Reset on user change to prevent prior session data bleeding through.
    setProfile(null); setStrategy(null); setSocialPosts([]); setContentItems([]);
    setEmailSends([]); setSocialConnections([]); setDiscovery(null); setGoalEntries([]);
    setBestPost(null); setPageTopPost(null); setPageHasData(null);
    (async () => {
      try {
        const strategyQ = supabase.from("strategies").select("positioning_statement, strength_score, success_definition, business_goal, content_pillars, primary_channel, posting_frequency, ideal_client, voice_attributes, enhanced_foundation, archetype, strategy_lane, created_at");
        const discoveryQ = supabase.from("discovery_sessions").select("status, messages");
        const [profileRes, strategyRes, socialPostsRes, contentItemsRes, goalRes, emailSendsRes, socialConnectionsRes, discoveryRes, analyticsRes] = await Promise.all([
          supabase.from("profiles").select("full_name, business_name, role, plan, intended_use").eq("id", user.id).maybeSingle(),
          (brandId ? strategyQ.eq("brand_id", brandId) : strategyQ.eq("user_id", user.id)).maybeSingle(),
          supabase.from("social_posts").select("id, status, platforms, pillar, scheduled_at, published_at, content_by_platform, topic, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
          supabase.from("content_items").select("id, status, platform, topic, body, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabase.from("goal_entries").select("*").eq("user_id", user.id).order("week_of", { ascending: false }).limit(24),
          supabase.from("email_sends").select("id, subject, sent_at, recipient_count, status").eq("user_id", user.id).order("sent_at", { ascending: false }).limit(10),
          supabase.from("social_connections").select("platform, profile_name, connected_at").eq("user_id", user.id),
          (brandId ? discoveryQ.eq("brand_id", brandId) : discoveryQ.eq("user_id", user.id)).maybeSingle(),
          supabase.from("social_analytics").select("impressions, engagement_rate, post_id, platform, social_posts(content_by_platform, topic, pillar)").eq("user_id", user.id).eq("platform", "linkedin").order("impressions", { ascending: false }).limit(1),
        ]);

        setProfile(profileRes.data ?? null);
        setStrategy(strategyRes.data ?? null);
        setSocialPosts(socialPostsRes.data ?? []);
        setContentItems(contentItemsRes.data ?? []);
        setEmailSends(emailSendsRes.data ?? []);
        setSocialConnections(socialConnectionsRes.data ?? []);
        setDiscovery(discoveryRes.data ?? null);
        setGoalEntries(goalRes.data ?? []);
        const top = (analyticsRes.data ?? [])[0];
        if (top) {
          const postData = (top as any).social_posts ?? null;
          setBestPost({
            impressions: top.impressions ?? 0,
            engagement: top.engagement_rate ?? 0,
            text: postData ? getPostPreview(postData, 90) : "",
            pillar: postData?.pillar ?? null,
          });
        }
      } catch {
        // silent: empty state renders when data is unavailable
      } finally {
        setLoading(false);
      }
    })();
  }, [user, brandId]);

  const goalDefOpts = useMemo(
    () => ({ autoGenerate: true, hasStrategy: !!strategy?.positioning_statement, debugSource: "Dashboard North Star" }),
    [strategy?.positioning_statement],
  );
  const { goals: goalDefs } = useGoalDefinitions(goalDefOpts);

  // Live LinkedIn Page leaderboard — powers Best post + "Your marketing is landing".
  // No dependency on personal analytics; quiet state only if the Page genuinely has none.
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("linkedin-page-analytics", {
          method: "POST",
          body: { days: 30 },
        });
        if (error) throw error;
        const resp: any = data;
        const posts: any[] = Array.isArray(resp?.topPosts) ? resp.topPosts : [];
        if (posts.length > 0) {
          const t = posts[0];
          setPageTopPost({
            text: (t?.text ?? "").toString(),
            impressions: Number(t?.impressions ?? 0),
            reactions: Number(t?.reactions ?? 0),
            comments: Number(t?.comments ?? 0),
            clicks: Number(t?.clicks ?? 0),
            engagementPct: t?.engagementPct ?? null,
          });
          setPageHasData(true);
        } else {
          setPageHasData(resp?.status === "ok" || resp?.status === "empty" ? false : null);
        }
      } catch {
        setPageHasData(null);
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

  const postsScheduledToday = socialPosts.filter((p) => p.status === "scheduled" && isToday(p.scheduled_at));
  const draftPosts = socialPosts.filter((p) => p.status === "draft");
  const draftContentItems = contentItems.filter((c) => c.status === "draft");
  const totalDrafts = draftPosts.length + draftContentItems.length;

  const weekNum = useMemo(() => weeksSince(strategy?.created_at ?? null), [strategy]);
  const subtitle = useMemo(() => {
    if (!hasStrategy) return "Set up your engine. It powers everything you publish.";
    const parts = [`Week ${weekNum} of 52.`, "Your engine is producing."];
    if (totalDrafts > 0) parts.push(`${totalDrafts} draft${totalDrafts === 1 ? "" : "s"} ${totalDrafts === 1 ? "is" : "are"} ready for you.`);
    return parts.join(" ");
  }, [hasStrategy, weekNum, totalDrafts]);

  // ---------- stats ----------
  const thisWeekPubPosts = socialPosts.filter((p) => isThisWeek(p.published_at));
  const thisWeekEmails = emailSends.filter((e) => isThisWeek(e.sent_at));
  const thisWeekContent = contentItems.filter((c) => isThisWeek(c.created_at));
  const totalGenerated = socialPosts.length + contentItems.length;
  const publishedCount = socialPosts.filter((p) => p.published_at).length;
  const hoursSaved = totalGenerated * 0.5 + publishedCount * 1.5;

  const scheduledNext7 = socialPosts.filter((p) => p.status === "scheduled" && isNext7Days(p.scheduled_at));

  const alignment = strategy?.strength_score ?? 0;
  const pillars: string[] = useMemo(() => {
    const cp = strategy?.content_pillars;
    if (!Array.isArray(cp)) return [];
    return cp.map((p: any) => (typeof p === "string" ? p : p?.name ?? p?.title ?? "")).filter(Boolean);
  }, [strategy]);
  const pillarsCoveredWeek = new Set(
    socialPosts
      .filter((p) => isThisWeek(p.created_at) || isThisWeek(p.published_at))
      .map((p) => p.pillar)
      .filter(Boolean)
  ).size;
  const pillarsTotal = Math.max(pillars.length, 5);

  // Goals numbers (same source as Goals page)
  const payingNow = lastReported<number>(goalEntries, "paying_users") ?? 0;
  const mrrNow = lastReported<number>(goalEntries, "mrr");
  const retentionNow = lastReported<number>(goalEntries, "retention_pct");
  const testimonialsNow = lastReported<number>(goalEntries, "testimonials");
  const discoveryNow = lastReported<number>(goalEntries, "discovery_calls");

  // North Star + SMART cards come from goal_definitions (per-user), never hardcoded.
  const ns = goalDefs?.north_star ?? null;
  const parseTargetNumber = (target?: string | null): number | null => {
    if (!target) return null;
    const m = String(target).replace(/[,$]/g, "").match(/(\d+(?:\.\d+)?)/);
    if (!m) return null;
    const n = parseFloat(m[1]);
    if (isNaN(n)) return null;
    if (/k/i.test(target)) return n * 1000;
    if (/m/i.test(target)) return n * 1_000_000;
    return n;
  };
  const metricNow = (key?: string | null): number | null => {
    switch (key) {
      case "paying_users": return payingNow;
      case "mrr": return mrrNow;
      case "retention_pct": return retentionNow;
      case "testimonials": return testimonialsNow;
      case "discovery_calls": return discoveryNow;
      default: {
        if (!key) return null;
        // Fallback: dynamic metric_key stored on goal_entries.value.
        for (const e of goalEntries) {
          if (e?.metric_key === key && typeof e?.value === "number" && !isNaN(e.value)) {
            return e.value as number;
          }
        }
        return null;
      }
    }
  };
  const formatMetric = (key?: string | null): string => {
    const v = metricNow(key);
    if (v === null || v === undefined) return "Not reported";
    if (key === "mrr") return `$${v.toLocaleString()}`;
    if (key === "retention_pct") return `${v}%`;
    return String(v);
  };
  const nsTargetNum = parseTargetNumber(ns?.target_value);
  const nsCurrent = metricNow(ns?.metric_key) ?? 0;
  const payingPct = nsTargetNum ? Math.min(100, (nsCurrent / nsTargetNum) * 100) : 0;

  const stats = [
    { label: "Hours saved", value: hoursSaved.toFixed(1), delta: "All-time", icon: Clock, tint: CORAL_TINT, color: CORAL },
    { label: "Pieces generated", value: String(totalGenerated), delta: totalGenerated > 0 ? "All-time" : "None yet", icon: Zap, tint: SAGE_TINT, color: SAGE_LABEL },
    { label: "Alignment", value: `${alignment}%`, delta: "Strategy strength", icon: Target, tint: TAUPE_TINT, color: TAUPE_LABEL },
    {
      label: "Best post",
      value: pageTopPost ? String(pageTopPost.impressions) : (pageHasData === false ? "0" : "0"),
      delta: pageTopPost ? "Impressions on top Page post" : (pageHasData === false ? "No Page posts yet" : "Loading"),
      icon: TrendingUp,
      tint: "#EFF3F8",
      color: NAVY,
    },
  ];

  // ---------- focus items ----------
  const focusItems = useMemo(() => {
    const items: any[] = [];

    // Lane 3 (offer_gtm) surfaces the strategy's firstMove as the top focus,
    // pinned until the founder marks it done. Never rendered for other lanes.
    const ef = strategy?.enhanced_foundation ?? {};
    const fm = ef?.firstMove ?? null;
    const isOfferGtm = strategy?.strategy_lane === "offer_gtm";
    if (isOfferGtm && fm && typeof fm === "object" && fm.copy && !firstMoveDismissed) {
      const typeLabel = fm.type === "dm" ? "Send DM"
        : fm.type === "email" ? "Send email"
        : fm.type === "post" ? "Publish post"
        : "Make first move";
      items.push({
        icon: Rocket,
        label: typeLabel + " to the warm list",
        detail: fm.why || "Your launch starts here. Open to see the full message.",
        action: "Open",
        route: "/app/strategy",
        urgent: true,
        onClick: () => setFirstMoveOpen(true),
      });
    }

    if (totalDrafts > 0) {
      items.push({
        icon: PenSquare,
        label: `Review ${totalDrafts} draft${totalDrafts === 1 ? "" : "s"}`,
        detail: "Approve and queue what is ready.",
        action: "Review",
        route: "/app/content",
        urgent: true,
      });
    }
    // untested pillar
    const usedPillars = new Set(socialPosts.map((p) => p.pillar).filter(Boolean));
    const untested = pillars.find((name) => !usedPillars.has(name));
    if (untested) {
      items.push({
        icon: Sparkles,
        label: `Generate a post for the ${untested} pillar`,
        detail: "This pillar has no content yet.",
        action: "Generate",
        route: "/app/content",
        urgent: false,
      });
    }
    if (postsScheduledToday.length > 0) {
      items.push({
        icon: Send,
        label: `Publish ${postsScheduledToday.length} scheduled post${postsScheduledToday.length === 1 ? "" : "s"}`,
        detail: "Ready to go out today.",
        action: "Open",
        route: "/app/social",
        urgent: true,
      });
    }
    if (items.length === 0) {
      items.push({
        icon: Flame,
        label: "Log this week's numbers",
        detail: "Two minutes keeps your goals honest.",
        action: "Open",
        route: "/app/goals",
        urgent: false,
      });
    }
    return [...items].sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)).slice(0, 3);
  }, [postsScheduledToday, socialPosts, totalDrafts, pillars, strategy, firstMoveDismissed]);

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
      label: "Run MOXIEMO Discovery",
      done: discoveryComplete,
      active: !discoveryComplete,
      to: "/app/discovery",
      desc: "20-min conversation that extracts your foundation",
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
      desc: "Strategy-aligned content, ready in minutes",
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
      <div className="w-full px-6 lg:px-10 py-12">
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

  const archetypeObj = strategy?.enhanced_foundation?.brandArchetype ?? (strategy as any)?.archetype ?? null;
  const archetype = archetypeObj?.name || archetypeObj?.icon || null;
  const idealClient = strategy?.ideal_client || strategy?.enhanced_foundation?.idealClient?.title || null;
  const voiceAttrs: string[] = Array.isArray(strategy?.voice_attributes)
    ? strategy.voice_attributes
        .map((v: any) => (typeof v === "string" ? v : v?.name ?? v?.attribute ?? v?.label ?? ""))
        .filter(Boolean)
    : [];
  const strengthScore = strategy?.strength_score ?? 0;

  const smartGoals = (goalDefs?.smart_cards ?? []).map((c) => ({
    category: c.category || "Goal",
    tracked: c.tracked_by === "moxiemo",
    title: c.title || "Untitled",
    target: c.target || "—",
    now: formatMetric((c.metric_key && String(c.metric_key)) || slugify(c.title || "Goal")),
  }));

  return (
    <>
    <div
      className="w-full px-6 lg:px-10 pt-6 pb-10 space-y-8 dashboard-skin bg-brand-paper min-h-dvh"
    >
      <style>{`
        .dashboard-skin .stat-card { transition: transform 220ms ease, box-shadow 220ms ease; }
        .dashboard-skin .stat-card:hover { transform: translateY(-3px); }
        .dashboard-skin .grid-4up { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        @media (max-width: 999px) { .dashboard-skin .grid-4up { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 639px) { .dashboard-skin .grid-4up { grid-template-columns: minmax(0, 1fr); } }
        .dashboard-skin .paper-card {
          background: #FFFFFF; border: 1px solid ${HAIRLINE}; border-radius: 16px;
          box-shadow: ${CARD_SHADOW}; transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .dashboard-skin .paper-card:hover { transform: translateY(-2px); box-shadow: ${CARD_SHADOW_HOVER}; }
        .dashboard-skin .ns-node {
          position: absolute; top: 50%; transform: translate(-50%, -50%);
          width: 14px; height: 14px; border-radius: 999px; background: ${CORAL};
          box-shadow: 0 0 0 4px rgba(232,90,70,0.25), 0 0 18px rgba(232,90,70,0.65);
          animation: nsPulse 2.2s ease-in-out infinite;
        }
        @keyframes nsPulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(232,90,70,0.25), 0 0 18px rgba(232,90,70,0.55); }
          50%     { box-shadow: 0 0 0 6px rgba(232,90,70,0.18), 0 0 24px rgba(232,90,70,0.85); }
        }
        .dashboard-skin .live-dot { animation: liveDot 1.6s ease-in-out infinite; }
        @keyframes liveDot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
      {/* 1. GREETING */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl tracking-[-0.03em] leading-[1] mb-3 text-foreground">
            {greeting}, {firstName}.
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">{subtitle}</p>
        </div>
        {hasStrategy && (
          <Link
            to="/app/strategy"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold self-start lg:self-end bg-brand-coral-tint text-brand-coral-solid"
          >
            <Compass className="h-4 w-4" /> Strategy {strengthScore} / 100
          </Link>
        )}
      </header>

      {/* 2. RHYTHM STRIP */}
      {hasStrategy && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RhythmTile
            eyebrow="Today"
            title={totalDrafts > 0 ? `Review ${totalDrafts} draft${totalDrafts === 1 ? "" : "s"}` : "Nothing urgent today"}
            sub={totalDrafts > 0 ? "Approve and queue" : "Your engine is caught up"}
            bg={GRAD_TODAY}
            shadow={SHADOW_TODAY}
            fg="#FFFFFF"
            labelColor="#FFE1D9"
            to={totalDrafts > 0 ? "/app/content" : "/app/content"}
          />
          <RhythmTile
            eyebrow="This week"
            title={`${pillarsCoveredWeek} of ${pillarsTotal} pillars covered`}
            sub="Log your numbers"
            bg={GRAD_WEEK}
            shadow={SHADOW_WEEK}
            fg={INK}
            labelColor={SAGE_LABEL}
            to="/app/goals"
          />
          <RhythmTile
            eyebrow="This month"
            title={ns && nsTargetNum ? `${nsCurrent} of ${ns.target_value}` : "Set your North Star"}
            sub={ns ? "See your goals" : "Generating your goals…"}
            bg={GRAD_MONTH}
            shadow={SHADOW_MONTH}
            fg={INK}
            labelColor={TAUPE_LABEL}
            to="/app/goals"
          />
        </section>
      )}

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
                  Four steps. Start with one guided session. Then MOXIEMO runs the rest.
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

      {hasStrategy && (
        <>
          {/* 3. NORTH STAR BAND */}
          <section
            className="relative overflow-hidden rounded-2xl p-8 md:p-10 shadow-[0_18px_40px_-18px_rgba(20,36,61,0.55)]"
            style={{ background: GRAD_NAVY }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-brand-coral-light">★ North star</span>
              <span className="text-[11px] uppercase tracking-wider font-semibold rounded-full px-2.5 py-1 bg-white/[0.12] text-white/70">
                Week {weekNum} of 52
              </span>
            </div>
            <h2 className="font-display font-bold text-[26px] md:text-[32px] leading-tight text-white">
              {ns?.title || "Your North Star, forming"}
            </h2>
            <p className="mt-2 text-sm md:text-base font-medium text-brand-coral-tint">
              {ns ? [ns.target_value, formatDateUS(ns.deadline, "long")].filter(Boolean).join(" · ") : "Personalized from your strategy"}
            </p>
            <div className="mt-6">
              <div className="relative h-3 rounded-full bg-white/[0.14]">
                <div className="h-full rounded-full transition-all bg-accent" style={{ width: `${payingPct}%` }} />
                {[25, 50, 75].map((t) => (
                  <div key={t} className="absolute top-0 bottom-0 w-px bg-white/40" style={{ left: `${t}%` }} />
                ))}
                <div className="ns-node" style={{ left: `${Math.max(2, Math.min(98, payingPct))}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[11px] font-semibold text-brand-navy-muted">
                <span>0</span><span>25%</span><span>50%</span><span>75%</span><span>{ns?.target_value || "Target"}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-brand-navy-muted">
              {ns?.lever || "Your personal goals appear as soon as your strategy is set."}
            </div>
          </section>

          {/* 4. SMART GOALS AT A GLANCE */}
          <section>
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-display text-xl tracking-tight text-foreground">Your goals, at a glance</h2>
              <Link to="/app/goals" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                Open Goals <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid-4up">
              {smartGoals.map((g) => (
                <Link key={g.category} to="/app/goals" className="paper-card p-5 block min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground truncate min-w-0">{g.category}</span>
                    {g.tracked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0 bg-[#E4F3E9] text-[#1F9254]">
                        <CheckCircle className="h-3 w-3" /> Tracked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0 bg-[#FBEFD9] text-[#B5791C]">
                        <UserIcon className="h-3 w-3" /> Reported
                      </span>
                    )}
                  </div>
                  <div className="font-display font-semibold text-sm mb-3 text-foreground">{g.title}</div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Now</div>
                      <div className="font-display text-lg font-semibold text-foreground">{g.now}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Target</div>
                      <div className="font-display text-lg font-semibold text-accent">{g.target}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* 5. ENGINE PERFORMANCE */}
          <section>
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-display text-xl tracking-tight text-foreground">Engine performance</h2>
              <Link to="/app/analytics" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                Full analytics <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid-4up">
              {stats.map((s) => (
                <div key={s.label} className="paper-card p-5 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground truncate min-w-0">{s.label}</span>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.tint }}>
                      <s.icon className="h-4 w-4" style={{ color: s.color }} />
                    </div>
                  </div>
                  <div className="font-display text-3xl tracking-tight mb-1 text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.delta}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 6. STRATEGY RECAP */}
          <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl tracking-tight text-foreground">Strategy recap</h2>
              <Link to="/app/strategy" className="text-sm font-medium hover:underline flex items-center gap-1 text-accent">
                Open strategy <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="text-base leading-relaxed mb-5 text-foreground">
              {strategy?.positioning_statement}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <RecapItem label="Archetype" value={archetype || "Not set"} />
              <RecapItem label="Ideal client" value={idealClient || "Not set"} />
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">Voice</div>
                {voiceAttrs.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {voiceAttrs.map((v) => (
                      <span
                        key={v}
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-brand-coral-tint text-[#C24B38] border border-[#F6D4CC]"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm font-medium text-foreground leading-snug">Not set</div>
                )}
              </div>
            </div>
            {pillars.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Content pillars</div>
                <div className="flex flex-wrap gap-2">
                  {pillars.slice(0, 5).map((p) => (
                    <span key={p} className="rounded-full px-3 py-1 text-xs font-medium bg-brand-coral-tint text-accent">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 7. TWO-UP: focus + landing */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-7 border-border shadow-soft">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-brand-coral-tint">
                    <Flame className="h-4 w-4 text-accent" />
                  </div>
                  <h3 className="font-semibold text-base">Today's focus</h3>
                </div>
              </div>
              <div className="space-y-2">
                {focusItems.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => (f.onClick ? f.onClick() : navigate(f.route))}
                    className="w-full text-left group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-foreground/30 hover:shadow-soft transition"
                    style={f.urgent ? { borderLeft: "4px solid hsl(var(--accent))" } : undefined}
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                      <f.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate mb-1">{f.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{f.detail}</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0 bg-brand-coral-tint text-accent">
                      {f.action}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-7 border-border shadow-soft">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[#EFF3F8]">
                    <BarChart3 className="h-4 w-4 text-brand-navy" />
                  </div>
                  <h3 className="font-semibold text-base">Your marketing is landing</h3>
                </div>
                {pageTopPost && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-[#E4F3E9] text-[#1F9254]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 live-dot" /> Live
                  </span>
                )}
              </div>
              {pageTopPost ? (
                <div className="space-y-4">
                  <div className="text-sm leading-relaxed text-foreground">
                    {pageTopPost.text ? (pageTopPost.text.length > 140 ? pageTopPost.text.slice(0, 140) + "..." : pageTopPost.text) : "Top LinkedIn Page post"}
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Impressions</div>
                      <div className="font-display text-2xl font-semibold text-foreground">{pageTopPost.impressions}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Engagement</div>
                      <div className="font-display text-2xl font-semibold text-foreground">
                        {pageTopPost.engagementPct != null
                          ? `${(pageTopPost.engagementPct * 100).toFixed(1)}%`
                          : `${pageTopPost.reactions + pageTopPost.comments}`}
                      </div>
                    </div>
                  </div>
                  <Link to="/app/analytics" className="inline-flex items-center gap-1 text-sm font-medium hover:underline text-accent">
                    See full analytics <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4">
                  {pageHasData === false
                    ? "No LinkedIn Page posts in the last 30 days. Publish to your Page and the top performer will land here."
                    : "Reading your LinkedIn Page leaderboard."}
                </div>
              )}
            </Card>
          </section>
        </>
      )}

      {/* Two-column workspace */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* This week from your strategy */}
        <Card className="p-7 border-border shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-brand-sage-tint">
                <CalendarIcon className="h-4 w-4 text-[#4F5A3E]" />
              </div>
              <div>
                <h3 className="font-semibold text-base">This week from your strategy</h3>
                <p className="text-xs text-muted-foreground">Drafts ready to review and queue</p>
              </div>
            </div>
            <Link to="/app/content" className="text-xs text-accent hover:underline font-medium">
              View all
            </Link>
          </div>
          {draftPosts.length > 0 ? (
            <div className="space-y-2">
              {draftPosts.slice(0, 5).map((p, i) => (
                <button
                  key={i}
                  onClick={() => navigate("/app/content")}
                  className="w-full text-left group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-foreground/30 hover:shadow-soft transition"
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
                    <PenSquare className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate mb-1">{getPostPreview(p, 70) || p.topic || "Untitled draft"}</div>
                    <div className="text-xs text-muted-foreground truncate">{(p.platforms ?? []).join(", ") || "social"}{p.pillar ? ` · ${p.pillar}` : ""}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No drafts waiting"
              body="Generate the next batch when you are ready."
              cta={{ to: "/app/content", label: "Browse content" }}
            />
          )}
        </Card>

        {/* Platforms + activity */}
        <div className="space-y-4">
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
    {firstMoveOpen && strategy?.enhanced_foundation?.firstMove ? (
      <FirstMoveModal
        firstMove={strategy.enhanced_foundation.firstMove}
        onClose={() => setFirstMoveOpen(false)}
        onDone={dismissFirstMove}
      />
    ) : null}
    </>
  );
}

function FirstMoveModal({
  firstMove,
  onClose,
  onDone,
}: {
  firstMove: any;
  onClose: () => void;
  onDone: () => void;
}) {
  const typeLabel = firstMove.type === "dm" ? "Direct message"
    : firstMove.type === "email" ? "Email"
    : firstMove.type === "post" ? "Post"
    : "First move";
  const copy = String(firstMove.copy ?? "").trim();
  const audience = String(firstMove.audience ?? "").trim();
  const why = String(firstMove.why ?? "").trim();
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(copy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/55"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-background p-7 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">First move</div>
            <h3 className="font-display text-2xl tracking-[-0.02em]">{typeLabel}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {audience ? (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Send to</div>
            <div className="text-sm">{audience}</div>
          </div>
        ) : null}
        {copy ? (
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Message</div>
            <div
              className="text-sm whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-4 leading-relaxed max-h-80 overflow-y-auto"
            >
              {copy}
            </div>
          </div>
        ) : null}
        {why ? (
          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Why this first</div>
            <div className="text-sm text-muted-foreground">{why}</div>
          </div>
        ) : null}
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={doCopy}>{copied ? "Copied" : "Copy message"}</Button>
          <Button size="sm" onClick={onDone} className="bg-accent text-white hover:bg-accent/90">Mark as sent</Button>
        </div>
      </div>
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

function RhythmTile({
  eyebrow, title, sub, bg, fg, labelColor, to, shadow,
}: {
  eyebrow: string; title: string; sub: string; bg: string; fg: string; labelColor: string; to: string; shadow?: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl p-6 flex flex-col justify-between transition hover:-translate-y-1 min-h-[140px]"
      style={{ background: bg, color: fg, boxShadow: shadow }}
    >
      <div className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: labelColor }}>{eyebrow}</div>
      <div>
        <div className="font-display text-lg md:text-xl font-semibold leading-tight" style={{ color: fg }}>{title}</div>
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: labelColor }}>
          {sub} <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
        </div>
      </div>
    </Link>
  );
}

function RecapItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">{label}</div>
      <div className="text-sm font-medium text-foreground leading-snug">{value}</div>
    </div>
  );
}
