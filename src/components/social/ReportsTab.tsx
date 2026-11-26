import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Linkedin,
  Facebook,
  Instagram,
  Lock,
  ChevronDown,
  Download,
  ExternalLink,
  X,
  Sparkles,
  BarChart3,
  Plus,
  Loader2,
  ArrowUp,
  ArrowDown,
  Pencil,
  Check,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  LabelList,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type Platform = "linkedin" | "facebook" | "instagram";

type SocialPost = {
  id: string;
  platforms: string[] | null;
  content_by_platform: Record<string, string> | null;
  media_urls: unknown;
  image_urls: unknown;
  pillar: string | null;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  platform_post_ids: Record<string, string> | null;
};

type Analytics = {
  id: string;
  post_id: string | null;
  platform: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  engagement_rate: number;
  fetched_at: string;
  raw_data: any;
};

type Strategy = {
  posting_frequency: string | null;
  content_pillars: unknown;
};

type DateRangeKey = "7d" | "30d" | "90d" | "this_month" | "last_month" | "custom";
type PlatformFilter = "all" | Platform;

type Props = {
  userId: string | null;
  onSwitchTab: (tab: "overview" | "create" | "calendar" | "library" | "reports") => void;
  onRepurposePost: (topic: string) => void;
  onCreateWithPillar?: (pillar: string) => void;
};

const PILLAR_COLORS = ["#FF6B5C", "#1e3a5f", "#3cb87a", "#f5a623", "#a855f7"];

function asArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object") {
        const obj = x as Record<string, unknown>;
        return (obj.name as string) || (obj.title as string) || (obj.label as string) || "";
      }
      return "";
    })
    .filter(Boolean);
}

function rangeForKey(key: DateRangeKey, custom: { from?: Date; to?: Date }): { from: Date; to: Date; label: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  if (key === "7d") {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    from.setHours(0, 0, 0, 0);
    return { from, to: end, label: "Last 7 days" };
  }
  if (key === "30d") {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    from.setHours(0, 0, 0, 0);
    return { from, to: end, label: "Last 30 days" };
  }
  if (key === "90d") {
    const from = new Date(now);
    from.setDate(from.getDate() - 90);
    from.setHours(0, 0, 0, 0);
    return { from, to: end, label: "Last 90 days" };
  }
  if (key === "this_month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from, to: end, label: "This month" };
  }
  if (key === "last_month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { from, to, label: "Last month" };
  }
  // custom
  const from = custom.from ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const to = custom.to ?? end;
  return { from, to, label: "Custom range" };
}

function fmtShortDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7; // Monday start
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function PlatformIcon({ p, className }: { p: string; className?: string }) {
  const cls = cn("h-4 w-4", className);
  if (p === "linkedin") return <Linkedin className={cn(cls, "text-[#0A66C2]")} />;
  if (p === "facebook") return <Facebook className={cn(cls, "text-[#1877F2]")} />;
  if (p === "instagram") return <Instagram className={cn(cls, "text-[#DD2A7B]")} />;
  return <span className={cls} />;
}

function getPostText(p: SocialPost) {
  const map = p.content_by_platform || {};
  return Object.values(map).join(" ").trim();
}

export default function ReportsTab({ userId, onSwitchTab, onRepurposePost, onCreateWithPillar }: Props) {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [strategy, setStrategy] = useState<Strategy | null>(null);

  const [rangeKey, setRangeKey] = useState<DateRangeKey>("30d");
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  const [sortBy, setSortBy] = useState<"published" | "likes" | "comments" | "engagement_rate">("published");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [editingMetricsId, setEditingMetricsId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ likes: "", comments: "", shares: "", impressions: "" });
  const [savingMetrics, setSavingMetrics] = useState(false);

  const range = useMemo(() => rangeForKey(rangeKey, customRange), [rangeKey, customRange]);

  // previous period (for delta on Posts Published card)
  const prevRange = useMemo(() => {
    const span = range.to.getTime() - range.from.getTime();
    const to = new Date(range.from.getTime() - 1);
    const from = new Date(to.getTime() - span);
    return { from, to };
  }, [range]);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      setLoading(true);
      const [postsRes, analyticsRes, stratRes] = await Promise.all([
        supabase
          .from("social_posts")
          .select("id, platforms, content_by_platform, media_urls, image_urls, pillar, status, scheduled_for, published_at, created_at, platform_post_ids")
          .eq("user_id", userId)
          .order("published_at", { ascending: false }),
        supabase.from("social_analytics").select("*").eq("user_id", userId),
        supabase
          .from("strategies")
          .select("posting_frequency, content_pillars")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      if (postsRes.error) console.error(postsRes.error);
      if (analyticsRes.error) console.error(analyticsRes.error);
      if (stratRes.error) console.error(stratRes.error);
      setPosts((postsRes.data as unknown as SocialPost[]) ?? []);
      setAnalytics((analyticsRes.data as Analytics[]) ?? []);
      setStrategy((stratRes.data as Strategy | null) ?? null);
      setLoading(false);
    })();
  }, [userId]);

  // analytics by post (pick the most recent per post)
  const analyticsByPost = useMemo(() => {
    const map = new Map<string, Analytics>();
    for (const a of analytics) {
      if (!a.post_id) continue;
      const existing = map.get(a.post_id);
      if (!existing || new Date(a.fetched_at) > new Date(existing.fetched_at)) {
        map.set(a.post_id, a);
      }
    }
    return map;
  }, [analytics]);

  // Filter helpers
  const matchesPlatform = (p: SocialPost) => {
    if (platformFilter === "all") return true;
    return (p.platforms || []).includes(platformFilter);
  };
  const inRange = (iso: string | null, r: { from: Date; to: Date } = range) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d >= r.from && d <= r.to;
  };

  const publishedPosts = useMemo(
    () => posts.filter((p) => p.status === "published" && inRange(p.published_at) && matchesPlatform(p)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, range, platformFilter],
  );

  const prevPublishedCount = useMemo(
    () => posts.filter((p) => p.status === "published" && inRange(p.published_at, prevRange) && matchesPlatform(p)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, prevRange, platformFilter],
  );

  // Summary numbers
  const totalEngagement = useMemo(() => {
    let sum = 0;
    let any = false;
    for (const p of publishedPosts) {
      const a = analyticsByPost.get(p.id);
      if (a) {
        any = true;
        sum += (a.likes || 0) + (a.comments || 0) + (a.shares || 0);
      }
    }
    return { sum, any };
  }, [publishedPosts, analyticsByPost]);

  const avgEngRate = useMemo(() => {
    const rates: number[] = [];
    for (const p of publishedPosts) {
      const a = analyticsByPost.get(p.id);
      if (a && a.engagement_rate) rates.push(Number(a.engagement_rate));
    }
    if (!rates.length) return null;
    return rates.reduce((s, x) => s + x, 0) / rates.length;
  }, [publishedPosts, analyticsByPost]);

  const topPost = useMemo(() => {
    let best: { post: SocialPost; engagement: number } | null = null;
    for (const p of publishedPosts) {
      const a = analyticsByPost.get(p.id);
      if (!a) continue;
      const eng = (a.likes || 0) + (a.comments || 0) + (a.shares || 0);
      if (!best || eng > best.engagement) best = { post: p, engagement: eng };
    }
    return best;
  }, [publishedPosts, analyticsByPost]);

  // Publishing consistency by week
  const weeklyData = useMemo(() => {
    const buckets = new Map<string, { date: Date; count: number }>();
    let cursor = startOfWeek(range.from);
    const last = startOfWeek(range.to);
    while (cursor <= last) {
      const key = cursor.toISOString().slice(0, 10);
      buckets.set(key, { date: new Date(cursor), count: 0 });
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() + 7);
    }
    for (const p of publishedPosts) {
      if (!p.published_at) continue;
      const w = startOfWeek(new Date(p.published_at));
      const key = w.toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (b) b.count += 1;
    }
    return Array.from(buckets.values()).map((b) => ({
      week: fmtShortDate(b.date),
      weekDate: b.date,
      posts: b.count,
    }));
  }, [publishedPosts, range]);

  const targetFreq = useMemo(() => {
    const raw = strategy?.posting_frequency || "";
    const m = raw.match(/(\d+(\.\d+)?)/);
    return m ? parseFloat(m[1]) : 5;
  }, [strategy]);

  // Sorted table rows
  const sortedRows = useMemo(() => {
    const arr = [...publishedPosts];
    arr.sort((a, b) => {
      const aA = analyticsByPost.get(a.id);
      const bA = analyticsByPost.get(b.id);
      let cmp = 0;
      if (sortBy === "published") {
        cmp = new Date(a.published_at || 0).getTime() - new Date(b.published_at || 0).getTime();
      } else if (sortBy === "likes") {
        cmp = (aA?.likes || 0) - (bA?.likes || 0);
      } else if (sortBy === "comments") {
        cmp = (aA?.comments || 0) - (bA?.comments || 0);
      } else {
        cmp = (aA?.engagement_rate || 0) - (bA?.engagement_rate || 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [publishedPosts, analyticsByPost, sortBy, sortDir]);

  const toggleSort = (col: "published" | "likes" | "comments" | "engagement_rate") => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir(col === "published" ? "desc" : "desc");
    }
  };

  // Pillar performance
  const pillars = useMemo(() => asArray(strategy?.content_pillars), [strategy]);
  const pillarPerf = useMemo(() => {
    type Row = { pillar: string; rate: number; postCount: number };
    const map = new Map<string, { rates: number[]; count: number }>();
    for (const p of publishedPosts) {
      if (!p.pillar) continue;
      const a = analyticsByPost.get(p.id);
      const entry = map.get(p.pillar) || { rates: [], count: 0 };
      entry.count += 1;
      if (a && a.engagement_rate) entry.rates.push(Number(a.engagement_rate));
      map.set(p.pillar, entry);
    }
    const rows: Row[] = [];
    for (const [pillar, { rates, count }] of map.entries()) {
      const rate = rates.length ? rates.reduce((s, x) => s + x, 0) / rates.length : 0;
      rows.push({ pillar, rate, postCount: count });
    }
    rows.sort((a, b) => b.rate - a.rate);
    return rows;
  }, [publishedPosts, analyticsByPost]);

  const moxieInsight = useMemo(() => {
    if (pillarPerf.length < 2) return null;
    const top = pillarPerf[0];
    const others = pillarPerf.slice(1);
    const otherAvg = others.reduce((s, r) => s + r.rate, 0) / Math.max(others.length, 1);
    if (otherAvg === 0 || top.rate === 0) return null;
    const ratio = top.rate / otherAvg;
    if (ratio < 1.5) return null;
    return { topPillar: top.pillar, ratio };
  }, [pillarPerf]);

  // Platform comparison
  const platformBreakdown = useMemo(() => {
    const list: Platform[] = ["linkedin", "facebook", "instagram"];
    return list.map((pl) => {
      const ps = publishedPosts.filter((p) => (p.platforms || []).includes(pl));
      const rates: number[] = [];
      let impressions = 0;
      let hasAnalytics = false;
      for (const p of ps) {
        const a = analyticsByPost.get(p.id);
        if (a) {
          hasAnalytics = true;
          if (a.engagement_rate) rates.push(Number(a.engagement_rate));
          impressions += a.impressions || 0;
        }
      }
      const avgRate = rates.length ? rates.reduce((s, x) => s + x, 0) / rates.length : null;
      return { platform: pl, postCount: ps.length, avgRate, impressions, hasAnalytics };
    });
  }, [publishedPosts, analyticsByPost]);

  const activePlatformCount = platformBreakdown.filter((p) => p.postCount > 0).length;

  // Total published count (across all time, not just range) for unlock progress
  const totalPublishedAll = useMemo(
    () => posts.filter((p) => p.status === "published").length,
    [posts],
  );

  // MOXIEMO recommendations
  const recommendations = useMemo(() => {
    const recs: { icon: string; title: string; insight: string; action: string; tab: "create" | "calendar" | "library"; pillar?: string }[] = [];
    const weeks = Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    const avgPostsPerWeek = publishedPosts.length / weeks;
    if (avgPostsPerWeek < targetFreq * 0.7) {
      recs.push({
        icon: "📅",
        title: "Boost your consistency",
        insight: `You're publishing ${avgPostsPerWeek.toFixed(1)} posts/week vs your target of ${targetFreq}. Consistency is the #1 driver of LinkedIn growth.`,
        action: "Schedule a week of posts",
        tab: "calendar",
      });
    }
    if (pillarPerf.length > 0 && publishedPosts.length > 0) {
      const top = pillarPerf[0];
      const ratio = top.postCount / publishedPosts.length;
      if (ratio < 0.4) {
        recs.push({
          icon: "🎯",
          title: `Post more about "${top.pillar}"`,
          insight: `Your ${top.pillar} posts get the most engagement but only make up ${Math.round(ratio * 100)}% of your content. Double down on what's working.`,
          action: `Create a ${top.pillar} post`,
          tab: "create",
          pillar: top.pillar,
        });
      }
    }
    if (publishedPosts.length > 0) {
      const withQ = publishedPosts.filter((p) => getPostText(p).includes("?")).length;
      if (withQ / publishedPosts.length < 0.5) {
        recs.push({
          icon: "💬",
          title: "Add more engagement questions",
          insight: "Posts ending with a question get 3x more comments on LinkedIn. Less than half your posts currently end with one.",
          action: "Generate a question-based post",
          tab: "create",
        });
      }
      const withImg = publishedPosts.filter((p) => {
        const m = Array.isArray(p.media_urls) ? p.media_urls.length : 0;
        const i = Array.isArray(p.image_urls) ? p.image_urls.length : 0;
        return m + i > 0;
      }).length;
      if (withImg / publishedPosts.length < 0.3) {
        recs.push({
          icon: "🖼",
          title: "Add more visual content",
          insight: `Posts with images get 2x more impressions than text-only posts. Only ${Math.round((withImg / publishedPosts.length) * 100)}% of your posts include an image.`,
          action: "Upload images to Library",
          tab: "library",
        });
      }
    }
    return recs.slice(0, 3);
  }, [publishedPosts, pillarPerf, targetFreq, range]);

  // Manual analytics save
  const startEditMetrics = (postId: string) => {
    const a = analyticsByPost.get(postId);
    setEditForm({
      likes: a?.likes?.toString() ?? "",
      comments: a?.comments?.toString() ?? "",
      shares: a?.shares?.toString() ?? "",
      impressions: a?.impressions?.toString() ?? "",
    });
    setEditingMetricsId(postId);
  };

  const saveMetrics = async (post: SocialPost) => {
    if (!userId) return;
    setSavingMetrics(true);
    const likes = parseInt(editForm.likes) || 0;
    const comments = parseInt(editForm.comments) || 0;
    const shares = parseInt(editForm.shares) || 0;
    const impressions = parseInt(editForm.impressions) || 0;
    const engagement_rate = impressions > 0 ? Math.round(((likes + comments + shares) / impressions) * 1000) / 10 : 0;
    const platform = (post.platforms && post.platforms[0]) || "linkedin";
    const existing = analyticsByPost.get(post.id);
    let error;
    if (existing) {
      const res = await supabase
        .from("social_analytics")
        .update({
          likes,
          comments,
          shares,
          impressions,
          engagement_rate,
          fetched_at: new Date().toISOString(),
          raw_data: { ...(existing.raw_data || {}), source: "manual" },
        })
        .eq("id", existing.id);
      error = res.error;
    } else {
      const res = await supabase.from("social_analytics").insert({
        user_id: userId,
        post_id: post.id,
        platform,
        likes,
        comments,
        shares,
        impressions,
        reach: 0,
        engagement_rate,
        raw_data: { source: "manual" },
      });
      error = res.error;
    }
    setSavingMetrics(false);
    if (error) {
      toast.error("Couldn't save metrics");
      return;
    }
    // refresh
    const { data } = await supabase.from("social_analytics").select("*").eq("user_id", userId);
    setAnalytics((data as Analytics[]) ?? []);
    setEditingMetricsId(null);
    toast.success("Metrics saved");
  };

  // Export
  const handleExport = () => {
    const headers = ["Platform", "Post preview", "Pillar", "Published", "Likes", "Comments", "Shares", "Impressions", "Engagement rate"];
    const rows = sortedRows.map((p) => {
      const a = analyticsByPost.get(p.id);
      const text = getPostText(p).replace(/\s+/g, " ").slice(0, 100);
      return [
        (p.platforms || []).join("|"),
        text,
        p.pillar || "",
        p.published_at ? new Date(p.published_at).toISOString().slice(0, 10) : "",
        a?.likes ?? "",
        a?.comments ?? "",
        a?.shares ?? "",
        a?.impressions ?? "",
        a?.engagement_rate ? `${a.engagement_rate}%` : "",
      ];
    });
    const escape = (v: any) => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `MOXIE_Social_Report_${range.label.replace(/\s+/g, "_")}_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedPost = selectedPostId ? posts.find((p) => p.id === selectedPostId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading reports…
      </div>
    );
  }

  // Posts published delta
  const publishedNow = publishedPosts.length;
  const delta = publishedNow - prevPublishedCount;
  const deltaPct = prevPublishedCount > 0 ? Math.round((delta / prevPublishedCount) * 100) : null;

  return (
    <div className="space-y-8">
      {/* TOP BAR */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Reports</h2>
          <p className="text-sm text-muted-foreground">
            Track your social performance and understand what content works.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Date range */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {range.label} <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 bg-popover">
              <DropdownMenuItem onClick={() => setRangeKey("7d")}>Last 7 days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRangeKey("30d")}>Last 30 days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRangeKey("90d")}>Last 90 days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRangeKey("this_month")}>This month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRangeKey("last_month")}>Last month</DropdownMenuItem>
              <Popover>
                <PopoverTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Custom range…</DropdownMenuItem>
                </PopoverTrigger>
                <PopoverContent className="w-auto bg-popover p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={{ from: customRange.from, to: customRange.to }}
                    onSelect={(r: any) => {
                      setCustomRange({ from: r?.from, to: r?.to });
                      if (r?.from && r?.to) setRangeKey("custom");
                    }}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Platform filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 capitalize">
                {platformFilter === "all" ? "All platforms" : platformFilter}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50 bg-popover">
              <DropdownMenuItem onClick={() => setPlatformFilter("all")}>All platforms</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPlatformFilter("linkedin")}>LinkedIn</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPlatformFilter("facebook")}>Facebook</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPlatformFilter("instagram")}>Instagram</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> Export report
          </Button>
        </div>
      </div>

      {/* SECTION 1 — Summary cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="space-y-1 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Posts published</p>
          {publishedNow === 0 ? (
            <>
              <p className="text-3xl font-semibold text-muted-foreground/60">—</p>
              <p className="text-xs text-muted-foreground">Publish your first post to start tracking</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-semibold text-foreground">{publishedNow}</p>
              {deltaPct !== null ? (
            <p
              className={cn(
                "flex items-center gap-1 text-xs",
                delta >= 0 ? "text-emerald-600" : "text-red-600",
              )}
            >
              {delta >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(deltaPct)}% vs {prevPublishedCount} last period
            </p>
              ) : (
                <p className="text-xs text-muted-foreground">vs 0 last period</p>
              )}
            </>
          )}
        </Card>

        <Card className="space-y-1 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total engagement</p>
          {totalEngagement.any ? (
            <>
              <p className="text-2xl font-semibold text-foreground">{totalEngagement.sum.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">likes, comments + shares</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-semibold text-muted-foreground/60">—</p>
              <p className="text-xs text-muted-foreground">Engagement data appears after publishing</p>
            </>
          )}
        </Card>

        <Card className="space-y-1 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg engagement rate</p>
          {avgEngRate !== null ? (
            <>
              <p className="text-2xl font-semibold text-foreground">{avgEngRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Industry avg: 2-3% for B2B</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-semibold text-muted-foreground/60">—</p>
              <p className="text-xs text-muted-foreground">Industry avg for B2B founders: 2–3%</p>
            </>
          )}
        </Card>

        <Card className="space-y-1 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Top performing post</p>
          {topPost ? (
            <>
              <p className="line-clamp-2 text-sm font-medium text-foreground">
                {getPostText(topPost.post).slice(0, 40)}
                {getPostText(topPost.post).length > 40 ? "…" : ""}
              </p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  {(topPost.post.platforms || []).slice(0, 2).map((pl) => (
                    <PlatformIcon key={pl} p={pl} />
                  ))}
                  <span className="text-xs text-muted-foreground">{topPost.engagement} eng.</span>
                </div>
                <button
                  onClick={() => setSelectedPostId(topPost.post.id)}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  View post →
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-3xl font-semibold text-muted-foreground/60">—</p>
              <p className="text-xs text-muted-foreground">Your best post will appear here</p>
            </>
          )}
        </Card>
      </section>

      {/* SECTION 2 — Publishing consistency */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Publishing consistency</h3>
          <p className="text-xs text-muted-foreground">Posts published per week</p>
        </div>
        <Card className="p-4">
          {publishedPosts.length === 0 ? (
            <div className="space-y-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { week: "W1", placeholder: 2 },
                      { week: "W2", placeholder: 4 },
                      { week: "W3", placeholder: 3 },
                      { week: "W4", placeholder: 5 },
                    ]}
                    margin={{ top: 16, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, Math.max(targetFreq + 1, 6)]} />
                    <ReferenceLine
                      y={targetFreq}
                      stroke="#FF6B5C"
                      strokeDasharray="4 4"
                      label={{ value: `Your target: ${targetFreq}/wk`, position: "insideTopRight", fill: "#FF6B5C", fontSize: 11 }}
                    />
                    <Bar
                      dataKey="placeholder"
                      fill="transparent"
                      stroke="hsl(var(--border))"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>
                    Your consistency chart builds as you publish. Aim for{" "}
                    <span className="font-semibold">{targetFreq} posts/week</span> based on your strategy.
                  </span>
                </div>
                <Button size="sm" onClick={() => onSwitchTab("create")} className="gap-1 shrink-0">
                  <Plus className="h-3.5 w-3.5" /> Schedule your first post →
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RTooltip
                    contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                    formatter={(v: any) => [`${v} posts published`, ""]}
                    labelFormatter={(l) => `Week of ${l}`}
                  />
                  <ReferenceLine
                    y={targetFreq}
                    stroke="#1e3a5f"
                    strokeDasharray="4 4"
                    label={{ value: `Your target: ${targetFreq} posts/week`, position: "insideTopRight", fill: "#1e3a5f", fontSize: 11 }}
                  />
                  <Bar dataKey="posts" fill="#FF6B5C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </section>

      {/* SECTION 3 — Post performance */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Post performance</h3>
          <p className="text-xs text-muted-foreground">Click any post to see full details</p>
        </div>
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-foreground/80">
          💡 Beta 1: Log your post metrics manually below. Automatic analytics sync coming once platform API permissions are confirmed.
        </div>
        <Card className="overflow-hidden">
          {sortedRows.length === 0 ? (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="w-8 px-3 py-2"></th>
                      <th className="px-3 py-2 text-left">Platform</th>
                      <th className="px-3 py-2 text-left">Post preview</th>
                      <th className="px-3 py-2 text-left">Pillar</th>
                      <th className="px-3 py-2 text-left">Published</th>
                      <th className="px-3 py-2 text-right">Likes</th>
                      <th className="px-3 py-2 text-right">Comments</th>
                      <th className="px-3 py-2 text-right">Shares</th>
                      <th className="px-3 py-2 text-right">Eng. rate</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2].map((i) => (
                      <tr key={i} className="border-b border-border/50">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="px-3 py-3">
                            <div className="h-3 w-full animate-pulse rounded bg-muted" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <BarChart3 className="h-8 w-8 text-accent" />
                <p className="text-sm font-medium text-foreground">No published posts yet</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Publish your first post and log your metrics to see performance data here.
                </p>
                <Button size="sm" onClick={() => onSwitchTab("create")} className="mt-1 gap-1">
                  <Plus className="h-3.5 w-3.5" /> Create a post →
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-8 px-3 py-2"></th>
                    <th className="px-3 py-2 text-left">Platform</th>
                    <th className="px-3 py-2 text-left">Post preview</th>
                    <th className="px-3 py-2 text-left">Pillar</th>
                    <th className="cursor-pointer px-3 py-2 text-left" onClick={() => toggleSort("published")}>
                      Published {sortBy === "published" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                    </th>
                    <th className="cursor-pointer px-3 py-2 text-right" onClick={() => toggleSort("likes")}>
                      Likes {sortBy === "likes" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                    </th>
                    <th className="cursor-pointer px-3 py-2 text-right" onClick={() => toggleSort("comments")}>
                      Comments {sortBy === "comments" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                    </th>
                    <th className="px-3 py-2 text-right">Shares</th>
                    <th className="cursor-pointer px-3 py-2 text-right" onClick={() => toggleSort("engagement_rate")}>
                      Eng. rate {sortBy === "engagement_rate" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                    </th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((p, idx) => {
                    const a = analyticsByPost.get(p.id);
                    const text = getPostText(p);
                    const isManual = a?.raw_data?.source === "manual";
                    const editing = editingMetricsId === p.id;
                    const dotColor = PILLAR_COLORS[idx % PILLAR_COLORS.length];
                    return (
                      <tr
                        key={p.id}
                        className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30"
                        onClick={() => setSelectedPostId(p.id)}
                      >
                        <td className="px-3 py-3">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: dotColor }}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            {(p.platforms || []).map((pl) => (
                              <PlatformIcon key={pl} p={pl} />
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-foreground/90">
                          <span className="line-clamp-1">{text.slice(0, 60)}{text.length > 60 ? "…" : ""}</span>
                          {isManual && (
                            <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-muted-foreground">
                              manually logged
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {p.pillar ? (
                            <Badge className="bg-accent/15 text-accent hover:bg-accent/20">{p.pillar}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {p.published_at ? fmtShortDate(new Date(p.published_at)) : "—"}
                        </td>
                        {editing ? (
                          <td colSpan={5} className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-wrap items-center gap-2">
                              <Input
                                className="h-8 w-20"
                                placeholder="Likes"
                                value={editForm.likes}
                                onChange={(e) => setEditForm({ ...editForm, likes: e.target.value })}
                              />
                              <Input
                                className="h-8 w-24"
                                placeholder="Comments"
                                value={editForm.comments}
                                onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })}
                              />
                              <Input
                                className="h-8 w-20"
                                placeholder="Shares"
                                value={editForm.shares}
                                onChange={(e) => setEditForm({ ...editForm, shares: e.target.value })}
                              />
                              <Input
                                className="h-8 w-24"
                                placeholder="Impressions"
                                value={editForm.impressions}
                                onChange={(e) => setEditForm({ ...editForm, impressions: e.target.value })}
                              />
                              <Button
                                size="sm"
                                className="h-8"
                                disabled={savingMetrics}
                                onClick={() => saveMetrics(p)}
                              >
                                {savingMetrics ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => setEditingMetricsId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-3 py-3 text-right tabular-nums">{a?.likes ?? "—"}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{a?.comments ?? "—"}</td>
                            <td className="px-3 py-3 text-right tabular-nums">{a?.shares ?? "—"}</td>
                            <td className="px-3 py-3 text-right tabular-nums">
                              {a?.engagement_rate ? `${Number(a.engagement_rate).toFixed(1)}%` : "—"}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditMetrics(p.id);
                                }}
                              >
                                <Pencil className="h-3 w-3" /> Log
                              </Button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      {/* SECTION 4 — Pillar performance */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Which pillars perform best?</h3>
          <p className="text-xs text-muted-foreground">Average engagement by content pillar</p>
        </div>
        <Card className="p-4">
          {pillarPerf.length === 0 ? (
            <div className="space-y-4">
              {pillars.length > 0 ? (
                <div className="space-y-2">
                  {pillars.map((pillar, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-32 shrink-0 truncate text-xs font-medium text-foreground" title={pillar}>
                        {pillar}
                      </div>
                      <div className="relative h-6 flex-1 rounded border border-dashed border-border bg-muted/20" />
                      <div className="w-12 shrink-0 text-right text-xs text-muted-foreground">—</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Add content pillars in your strategy to see them here.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Post and tag content by pillar to see which themes resonate most with your audience.
              </p>
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-accent">
                  <Sparkles className="h-4 w-4" /> MOXIEMO Insight
                </div>
                <p className="text-sm text-foreground">
                  Tag your posts with content pillars as you publish. MOXIEMO will show you which themes drive the most engagement for your specific audience.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 gap-1"
                  onClick={() => onSwitchTab("create")}
                >
                  <Plus className="h-3.5 w-3.5" /> Create a pillar-tagged post →
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div style={{ height: Math.max(120, pillarPerf.length * 44) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pillarPerf} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" />
                    <YAxis
                      type="category"
                      dataKey="pillar"
                      width={140}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                    />
                    <RTooltip
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                      formatter={(v: any, _n, p: any) => [`${Number(v).toFixed(1)}% (${p.payload.postCount} posts)`, p.payload.pillar]}
                    />
                    <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                      {pillarPerf.map((_, i) => (
                        <Bar key={i} dataKey="rate" fill={PILLAR_COLORS[i % PILLAR_COLORS.length]} />
                      ))}
                      <LabelList
                        dataKey="rate"
                        position="right"
                        formatter={(v: any) => `${Number(v).toFixed(1)}%`}
                        style={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {moxieInsight ? (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-accent">
                    <Sparkles className="h-4 w-4" /> MOXIEMO Insight
                  </div>
                  <p className="text-sm text-foreground">
                    "{moxieInsight.topPillar}" posts get {moxieInsight.ratio.toFixed(1)}x more engagement than your other
                    pillars. Consider posting more on this theme.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 gap-1"
                    onClick={() => {
                      onCreateWithPillar?.(moxieInsight.topPillar);
                      onSwitchTab("create");
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Create a {moxieInsight.topPillar} post
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Post more content to see which pillars resonate most with your audience.
                </p>
              )}
            </div>
          )}
        </Card>
      </section>

      {/* SECTION 5 — Best times */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Your best times to post</h3>
        </div>
        <Card className="space-y-4 p-5">
          <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            📊 Based on B2B industry benchmarks (your data will personalize this after 10+ published posts)
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Linkedin className="h-4 w-4 text-[#0A66C2]" /> LinkedIn
              </div>
              <p className="text-xs text-muted-foreground">Best days: Tuesday, Wednesday, Thursday</p>
              <p className="text-xs text-muted-foreground">Best times: 7–9 AM · 12 PM · 5–6 PM ET</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Instagram className="h-4 w-4 text-[#DD2A7B]" /> Instagram
              </div>
              <p className="text-xs text-muted-foreground">Best days: Tuesday, Friday</p>
              <p className="text-xs text-muted-foreground">Best times: 11 AM · 2 PM · 7 PM ET</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Facebook className="h-4 w-4 text-[#1877F2]" /> Facebook
              </div>
              <p className="text-xs text-muted-foreground">Best days: Wednesday, Thursday</p>
              <p className="text-xs text-muted-foreground">Best times: 1 PM · 3 PM ET</p>
            </div>
          </div>
          {totalPublishedAll < 10 && (
            <div className="space-y-1.5 border-t border-border pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{totalPublishedAll} of 10 posts published</span>
                <span className="text-muted-foreground">{Math.round((totalPublishedAll / 10) * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${Math.min(100, (totalPublishedAll / 10) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Publish 10 posts to unlock your personalized best times based on YOUR audience data.
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* SECTION 6 — Platform breakdown */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Platform breakdown</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {platformBreakdown.map((p) => {
            const isLinkedIn = p.platform === "linkedin";
            const pending = !isLinkedIn;
            return (
              <Card key={p.platform} className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlatformIcon p={p.platform} className="h-5 w-5" />
                    <span className="text-sm font-semibold capitalize text-foreground">{p.platform}</span>
                  </div>
                  {pending ? (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending Meta ⚠</Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Connected ✓</Badge>
                  )}
                </div>
                <div className="space-y-0.5 text-sm">
                  <p className="text-foreground">{p.postCount} posts published</p>
                  <p className="text-muted-foreground">
                    {pending ? "— (pending)" : p.avgRate !== null ? `${p.avgRate.toFixed(1)}% avg eng.` : "— avg eng."}
                  </p>
                  <p className="text-muted-foreground">
                    {pending ? "—" : p.impressions > 0 ? `${p.impressions.toLocaleString()} impressions` : "— impressions"}
                  </p>
                </div>
                {pending && (
                  <p className="text-xs text-muted-foreground">Available after Meta verification</p>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* SECTION 7 — MOXIEMO Recommendations */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">MOXIEMO Recommendations</h3>
          <p className="text-xs text-muted-foreground">Based on your strategy and performance data</p>
        </div>
        {totalPublishedAll < 5 ? (
          <Card className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-accent">
              <Sparkles className="h-4 w-4" /> MOXIEMO Recommendations unlock as you post
            </div>
            <p className="text-sm text-foreground">
              Publish <span className="font-semibold">5 posts</span> to get your first personalized recommendations.
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{totalPublishedAll} / 5 posts published</span>
                <span className="text-muted-foreground">{Math.round((totalPublishedAll / 5) * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${Math.min(100, (totalPublishedAll / 5) * 100)}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              MOXIEMO will analyze your content and tell you exactly what to do more of, less of, and differently.
            </p>
            <div>
              <Button size="sm" onClick={() => onSwitchTab("create")} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Create your first post →
              </Button>
            </div>
          </Card>
        ) : recommendations.length === 0 ? (
          <Card className="p-5 text-sm text-muted-foreground">
            You're crushing it on every dimension we track right now. Keep going!
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {recommendations.map((r, i) => (
              <Card key={i} className="flex flex-col gap-3 p-4">
                <div className="text-2xl">{r.icon}</div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.insight}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-auto gap-1"
                  onClick={() => {
                    if (r.pillar) onCreateWithPillar?.(r.pillar);
                    onSwitchTab(r.tab);
                  }}
                >
                  {r.action} →
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Side panel for selected post */}
      {selectedPost && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedPostId(null)}
          />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {(selectedPost.platforms || []).map((pl) => (
                    <PlatformIcon key={pl} p={pl} />
                  ))}
                  <span className="text-xs text-muted-foreground">
                    Published:{" "}
                    {selectedPost.published_at ? fmtShortDate(new Date(selectedPost.published_at)) : "—"}
                  </span>
                </div>
                {selectedPost.pillar && (
                  <Badge className="bg-accent/15 text-accent hover:bg-accent/20">{selectedPost.pillar}</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPostId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="whitespace-pre-wrap rounded-md border border-border bg-muted/20 p-3 text-sm text-foreground/90">
                {getPostText(selectedPost) || "(no content)"}
              </div>
              {(() => {
                const imgs = [
                  ...(Array.isArray(selectedPost.image_urls) ? (selectedPost.image_urls as string[]) : []),
                  ...(Array.isArray(selectedPost.media_urls) ? (selectedPost.media_urls as string[]) : []),
                ];
                if (imgs.length === 0) return null;
                return (
                  <div className="grid grid-cols-2 gap-2">
                    {imgs.slice(0, 4).map((url, i) => (
                      <img key={i} src={url} alt="" className="rounded-md border border-border object-cover" />
                    ))}
                  </div>
                );
              })()}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Performance</p>
                {(() => {
                  const a = analyticsByPost.get(selectedPost.id);
                  const rows: { label: string; value: string }[] = [
                    { label: "👍 Likes", value: a?.likes != null ? String(a.likes) : "—" },
                    { label: "💬 Comments", value: a?.comments != null ? String(a.comments) : "—" },
                    { label: "🔁 Shares", value: a?.shares != null ? String(a.shares) : "—" },
                  ];
                  if (a?.impressions) rows.push({ label: "👁 Impressions", value: a.impressions.toLocaleString() });
                  rows.push({
                    label: "📊 Eng. rate",
                    value: a?.engagement_rate ? `${Number(a.engagement_rate).toFixed(1)}%` : "—",
                  });
                  return (
                    <div className="space-y-1.5">
                      {rows.map((r) => (
                        <div key={r.label} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{r.label}</span>
                          <span className="font-medium tabular-nums text-foreground">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-border p-4">
              <Button
                size="sm"
                className="gap-1"
                onClick={() => {
                  const text = getPostText(selectedPost);
                  onRepurposePost(`Repurposing: ${text.slice(0, 80)}`);
                  setSelectedPostId(null);
                  onSwitchTab("create");
                }}
              >
                Repurpose this post →
              </Button>
              {selectedPost.platform_post_ids?.linkedin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => {
                    const id = selectedPost.platform_post_ids!.linkedin;
                    const url = id.startsWith("http")
                      ? id
                      : `https://www.linkedin.com/feed/update/${encodeURIComponent(id)}/`;
                    window.open(url, "_blank", "noopener");
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View on LinkedIn
                </Button>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
