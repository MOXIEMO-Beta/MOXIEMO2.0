import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Download,
  ChevronDown,
  Linkedin,
  Facebook,
  Instagram,
  TrendingUp,
  TrendingDown,
  FileText,
  Send,
  Mail,
  Target,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  BarChart,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type DateRangeKey = "7d" | "30d" | "90d" | "this_month" | "last_month";
type PlatformFilter = "all" | "linkedin" | "facebook" | "instagram";

const PILLAR_COLORS = ["#ff6b6b", "#1e3a5f", "#3cb87a", "#f5a623", "#a855f7"];

function rangeForKey(key: DateRangeKey): { from: Date; to: Date; label: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  if (key === "7d") {
    const from = new Date(now); from.setDate(from.getDate() - 7); from.setHours(0,0,0,0);
    return { from, to: end, label: "Last 7 days" };
  }
  if (key === "30d") {
    const from = new Date(now); from.setDate(from.getDate() - 30); from.setHours(0,0,0,0);
    return { from, to: end, label: "Last 30 days" };
  }
  if (key === "90d") {
    const from = new Date(now); from.setDate(from.getDate() - 90); from.setHours(0,0,0,0);
    return { from, to: end, label: "Last 90 days" };
  }
  if (key === "this_month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from, to: end, label: "This month" };
  }
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { from, to, label: "Last month" };
}

function asArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => {
    if (typeof x === "string") return x;
    if (x && typeof x === "object") {
      const o = x as Record<string, unknown>;
      return (o.name as string) || (o.title as string) || (o.label as string) || "";
    }
    return "";
  }).filter(Boolean);
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0,0,0,0);
  return x;
}

function fmtShortDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PlatformIcon({ p }: { p: string }) {
  if (p === "linkedin") return <Linkedin className="h-4 w-4 text-[#0A66C2]" />;
  if (p === "facebook") return <Facebook className="h-4 w-4 text-[#1877F2]" />;
  if (p === "instagram") return <Instagram className="h-4 w-4 text-[#DD2A7B]" />;
  return null;
}

function csvEscape(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

export default function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("30d");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  const [strategy, setStrategy] = useState<any>(null);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  const [socialAnalytics, setSocialAnalytics] = useState<any[]>([]);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [emailSends, setEmailSends] = useState<any[]>([]);
  const [goalEntries, setGoalEntries] = useState<any[]>([]);

  const range = useMemo(() => rangeForKey(rangeKey), [rangeKey]);
  const prevRange = useMemo(() => {
    const span = range.to.getTime() - range.from.getTime();
    const to = new Date(range.from.getTime() - 1);
    const from = new Date(to.getTime() - span);
    return { from, to, label: "previous period" };
  }, [range]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        supabase.from("strategies").select("positioning_statement, success_definition, posting_frequency, content_pillars, primary_channel").eq("user_id", user.id).maybeSingle(),
        supabase.from("social_posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("social_analytics").select("*").eq("user_id", user.id).order("fetched_at", { ascending: false }),
        supabase.from("content_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("email_sends").select("*").eq("user_id", user.id).order("sent_at", { ascending: false }),
        supabase.from("goal_entries").select("*").eq("user_id", user.id).order("week_of", { ascending: false }).limit(12),
      ]);
      const get = (i: number) => results[i].status === "fulfilled" ? (results[i] as any).value?.data ?? null : null;
      setStrategy(get(0));
      setSocialPosts(get(1) ?? []);
      setSocialAnalytics(get(2) ?? []);
      setContentItems(get(3) ?? []);
      setEmailSends(get(4) ?? []);
      setGoalEntries(get(5) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const inRange = (iso: string | null | undefined, r = range) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d >= r.from && d <= r.to;
  };

  // Most-recent analytics per post
  const analyticsByPost = useMemo(() => {
    const m = new Map<string, any>();
    for (const a of socialAnalytics) {
      if (!a.post_id) continue;
      const e = m.get(a.post_id);
      if (!e || new Date(a.fetched_at) > new Date(e.fetched_at)) m.set(a.post_id, a);
    }
    return m;
  }, [socialAnalytics]);

  // SECTION 1 stats
  const contentCreatedNow = useMemo(() => {
    const a = socialPosts.filter(p => inRange(p.created_at)).length;
    const b = contentItems.filter(c => inRange(c.created_at)).length;
    return a + b;
  }, [socialPosts, contentItems, range]);
  const contentCreatedPrev = useMemo(() => {
    const a = socialPosts.filter(p => inRange(p.created_at, prevRange)).length;
    const b = contentItems.filter(c => inRange(c.created_at, prevRange)).length;
    return a + b;
  }, [socialPosts, contentItems, prevRange]);

  const publishedInRange = useMemo(
    () => socialPosts.filter(p => p.status === "published" && inRange(p.published_at)),
    [socialPosts, range]
  );
  const publishedPlatformBreakdown = useMemo(() => {
    const map: Record<string, number> = { linkedin: 0, facebook: 0, instagram: 0 };
    for (const p of publishedInRange) {
      for (const pl of (p.platforms || [])) {
        if (map[pl] !== undefined) map[pl] += 1;
      }
    }
    return map;
  }, [publishedInRange]);

  const emailsInRange = useMemo(
    () => emailSends.filter(e => e.status === "sent" && inRange(e.sent_at)),
    [emailSends, range]
  );
  const totalRecipients = useMemo(
    () => emailsInRange.reduce((s, e) => s + (e.recipient_count || 0), 0),
    [emailsInRange]
  );

  // Goals hit — parse target from success_definition
  const successTarget = useMemo(() => {
    const raw: string = strategy?.success_definition || "";
    const m = raw.match(/(\d+(\.\d+)?)/);
    return m ? parseFloat(m[1]) : null;
  }, [strategy]);
  const goalsHit = useMemo(() => {
    if (!goalEntries.length) return null;
    if (successTarget === null) return null;
    const onTarget = goalEntries.filter(g => (g.discovery_calls || 0) >= successTarget).length;
    return { hit: onTarget, total: goalEntries.length };
  }, [goalEntries, successTarget]);

  // SECTION 2 — Publishing activity (weekly buckets)
  const publishingChart = useMemo(() => {
    const buckets = new Map<string, { date: Date; created: number; published: number }>();
    let cursor = startOfWeek(range.from);
    const last = startOfWeek(range.to);
    while (cursor <= last) {
      const key = cursor.toISOString().slice(0, 10);
      buckets.set(key, { date: new Date(cursor), created: 0, published: 0 });
      const next = new Date(cursor); next.setDate(next.getDate() + 7);
      cursor = next;
    }
    for (const p of socialPosts) {
      if (inRange(p.created_at)) {
        const k = startOfWeek(new Date(p.created_at)).toISOString().slice(0, 10);
        const b = buckets.get(k); if (b) b.created += 1;
      }
      if (p.status === "published" && inRange(p.published_at)) {
        const k = startOfWeek(new Date(p.published_at!)).toISOString().slice(0, 10);
        const b = buckets.get(k); if (b) b.published += 1;
      }
    }
    for (const c of contentItems) {
      if (inRange(c.created_at)) {
        const k = startOfWeek(new Date(c.created_at)).toISOString().slice(0, 10);
        const b = buckets.get(k); if (b) b.created += 1;
      }
    }
    return Array.from(buckets.values()).map(b => ({
      week: fmtShortDate(b.date),
      created: b.created,
      published: b.published,
    }));
  }, [socialPosts, contentItems, range]);

  const targetFreq = useMemo(() => {
    const raw = strategy?.posting_frequency || "";
    const m = raw.match(/(\d+(\.\d+)?)/);
    return m ? parseFloat(m[1]) : null;
  }, [strategy]);

  // SECTION 3 — Social performance
  const socialFiltered = useMemo(() => {
    if (platformFilter === "all") return publishedInRange;
    return publishedInRange.filter(p => (p.platforms || []).includes(platformFilter));
  }, [publishedInRange, platformFilter]);

  const socialMetrics = useMemo(() => {
    let impressions = 0;
    let engagement = 0;
    const rates: number[] = [];
    let best: { post: any; rate: number } | null = null;
    let hasData = false;
    for (const p of socialFiltered) {
      const a = analyticsByPost.get(p.id);
      if (!a) continue;
      hasData = true;
      impressions += a.impressions || 0;
      engagement += (a.likes || 0) + (a.comments || 0) + (a.shares || 0);
      if (a.engagement_rate) rates.push(Number(a.engagement_rate));
      const er = Number(a.engagement_rate || 0);
      if (!best || er > best.rate) best = { post: p, rate: er };
    }
    const avgRate = rates.length ? rates.reduce((s, x) => s + x, 0) / rates.length : null;
    return { impressions, engagement, avgRate, best, hasData };
  }, [socialFiltered, analyticsByPost]);

  const socialRows = useMemo(() => {
    return [...socialFiltered].sort((a, b) => {
      const ar = analyticsByPost.get(a.id)?.engagement_rate || 0;
      const br = analyticsByPost.get(b.id)?.engagement_rate || 0;
      return Number(br) - Number(ar);
    });
  }, [socialFiltered, analyticsByPost]);

  // SECTION 4 — Email
  const emailMetrics = useMemo(() => {
    const opens: number[] = [];
    const clicks: number[] = [];
    let recip = 0;
    for (const e of emailsInRange) {
      if (e.open_rate !== null && e.open_rate !== undefined) opens.push(Number(e.open_rate));
      if (e.click_rate !== null && e.click_rate !== undefined) clicks.push(Number(e.click_rate));
      recip += e.recipient_count || 0;
    }
    return {
      avgOpen: opens.length ? opens.reduce((s,x)=>s+x,0) / opens.length : null,
      avgClick: clicks.length ? clicks.reduce((s,x)=>s+x,0) / clicks.length : null,
      totalRecipients: recip,
    };
  }, [emailsInRange]);

  // SECTION 5 — Goals
  const goalChart = useMemo(() => {
    const last8 = [...goalEntries].slice(0, 8).reverse();
    return last8.map(g => ({
      week: fmtShortDate(new Date(g.week_of)),
      calls: g.discovery_calls || 0,
    }));
  }, [goalEntries]);

  const goalSummary = useMemo(() => {
    const now = new Date();
    const thisMonth = goalEntries.filter(g => {
      const d = new Date(g.week_of);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const postsThisMonth = thisMonth.reduce((s, g) => s + (g.posts_published || 0), 0);
    const opensList = thisMonth.map(g => g.email_opens || 0);
    const avgOpens = opensList.length ? Math.round(opensList.reduce((s,x)=>s+x,0) / opensList.length) : 0;
    let bestWeek: { week_of: string; calls: number } | null = null;
    for (const g of goalEntries) {
      const calls = g.discovery_calls || 0;
      if (!bestWeek || calls > bestWeek.calls) bestWeek = { week_of: g.week_of, calls };
    }
    return { postsThisMonth, avgOpens, bestWeek };
  }, [goalEntries]);

  // SECTION 6 — Pillar breakdown
  const pillars = useMemo(() => asArray(strategy?.content_pillars), [strategy]);
  const pillarChart = useMemo(() => {
    return pillars.map((p, i) => ({
      pillar: p,
      count: socialPosts.filter(sp => sp.pillar === p).length,
      fill: PILLAR_COLORS[i % PILLAR_COLORS.length],
    }));
  }, [pillars, socialPosts]);
  const pillarInsight = useMemo(() => {
    if (!pillarChart.length) return null;
    const sorted = [...pillarChart].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    const empty = sorted.find(p => p.count === 0);
    return { top, empty };
  }, [pillarChart]);

  // SECTION 7 — MOXIEMO Insights
  const insights = useMemo(() => {
    const out: { icon: string; title: string; detail?: string; action?: string; route?: string }[] = [];
    const weeksWithContent = goalEntries.filter(e => (e.posts_published || 0) > 0).length;
    const totalWeeks = goalEntries.length;
    if (totalWeeks >= 4) {
      const consistency = Math.round((weeksWithContent / totalWeeks) * 100);
      out.push({
        icon: consistency >= 75 ? "✅" : "⚠️",
        title: consistency >= 75
          ? `Strong consistency — ${consistency}% of weeks you published`
          : `Consistency needs work — only ${consistency}% of weeks had posts`,
        action: consistency < 75 ? "Schedule posts for this week" : undefined,
        route: "/app/social",
      });
    }
    const emailCount = emailsInRange.length;
    const postCount = publishedInRange.length;
    if (postCount > 0 && emailCount === 0) {
      out.push({
        icon: "💡",
        title: "You're active on social but haven't sent an email yet",
        detail: "Email has 3-5x higher conversion than social. Your audience is waiting.",
        action: "Send a newsletter",
        route: "/app/email",
      });
    }
    const unpub = pillars.filter(p => !socialPosts.some(post => post.pillar === p && post.published_at));
    if (unpub.length > 0) {
      out.push({
        icon: "🎯",
        title: `"${unpub[0]}" has no published posts yet`,
        detail: "Covering all your pillars builds a more complete brand presence.",
        action: `Create a ${unpub[0]} post`,
        route: "/app/social",
      });
    }
    return out.slice(0, 3);
  }, [goalEntries, emailsInRange, publishedInRange, pillars, socialPosts]);

  const hasEnoughForInsights = goalEntries.length >= 4;
  const weeksWithActivity = goalEntries.filter(e => (e.posts_published || 0) > 0).length;

  // CSV export
  const exportCsv = () => {
    const rows: any[] = [];
    rows.push([
      "Date","Type","Platform","Content preview","Pillar","Status",
      "Likes","Comments","Shares","Eng rate","Email opens","Email clicks",
      "Discovery calls","Posts published"
    ]);
    for (const p of socialPosts) {
      if (!inRange(p.created_at) && !inRange(p.published_at)) continue;
      const a = analyticsByPost.get(p.id);
      const cmap = p.content_by_platform || {};
      const text = Object.values(cmap).join(" ").trim().slice(0, 100);
      rows.push([
        p.published_at || p.created_at,
        "social_post",
        (p.platforms || []).join("|"),
        text, p.pillar || "", p.status,
        a?.likes ?? "", a?.comments ?? "", a?.shares ?? "", a?.engagement_rate ?? "",
        "", "", "", ""
      ]);
    }
    for (const c of contentItems) {
      if (!inRange(c.created_at)) continue;
      rows.push([
        c.created_at, "content_item", c.platform || "", (c.body || c.topic || "").slice(0, 100),
        "", c.status, "", "", "", "", "", "", "", ""
      ]);
    }
    for (const e of emailsInRange) {
      rows.push([
        e.sent_at, "email", "email", e.subject || "", "", e.status,
        "", "", "", "", e.open_rate ?? "", e.click_rate ?? "", "", ""
      ]);
    }
    for (const g of goalEntries) {
      if (!inRange(g.week_of + "T00:00:00")) continue;
      rows.push([
        g.week_of, "goal_entry", "", g.notes || "", "", "",
        "", "", "", "", g.email_opens ?? "", "", g.discovery_calls ?? "", g.posts_published ?? ""
      ]);
    }
    rows.sort((a, b) => {
      if (a === rows[0]) return -1;
      if (b === rows[0]) return 1;
      return new Date(b[0]).getTime() - new Date(a[0]).getTime();
    });
    const csv = rows.map(r => r.map(csvEscape).join(",")).join("\n");
    const today = new Date().toISOString().slice(0, 10);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MOXIE_Analytics_${rangeKey}_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics exported");
  };

  if (loading) {
    return (
      <div className="px-6 lg:px-10 py-8 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-80 mb-8" />
        <Skeleton className="h-96 mb-8" />
      </div>
    );
  }

  const delta = contentCreatedNow - contentCreatedPrev;
  const dateRangeLabels: Record<DateRangeKey, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    this_month: "This month",
    last_month: "Last month",
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl mb-2">Analytics</h1>
          <p className="text-muted-foreground">Track performance across every channel — social, email, and goals.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {dateRangeLabels[rangeKey]} <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(dateRangeLabels) as DateRangeKey[]).map(k => (
                <DropdownMenuItem key={k} onClick={() => setRangeKey(k)}>
                  {dateRangeLabels[k]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* SECTION 1 — Cross-channel summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <Card className="p-5 border-border shadow-soft">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <FileText className="h-4 w-4" /> Content Created
          </div>
          <div className="font-display text-3xl mb-1">{contentCreatedNow}</div>
          <div className="text-xs flex items-center gap-1 text-muted-foreground">
            {delta !== 0 && (delta > 0 ? <TrendingUp className="h-3 w-3 text-accent" /> : <TrendingDown className="h-3 w-3 text-destructive" />)}
            vs {contentCreatedPrev} last period
          </div>
        </Card>

        <Card className="p-5 border-border shadow-soft">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Send className="h-4 w-4" /> Posts Published
          </div>
          <div className="font-display text-3xl mb-1">{publishedInRange.length}</div>
          <div className="text-xs text-muted-foreground">
            LinkedIn: {publishedPlatformBreakdown.linkedin} · Facebook: {publishedPlatformBreakdown.facebook} · Instagram: {publishedPlatformBreakdown.instagram}
          </div>
        </Card>

        <Card className="p-5 border-border shadow-soft">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Mail className="h-4 w-4" /> Emails Sent
          </div>
          <div className="font-display text-3xl mb-1">{emailsInRange.length || "—"}</div>
          <div className="text-xs text-muted-foreground">
            {emailsInRange.length > 0
              ? `to ${totalRecipients} total recipients`
              : <button onClick={() => navigate("/app/email")} className="text-accent hover:underline">Send your first email</button>}
          </div>
        </Card>

        <Card className="p-5 border-border shadow-soft">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Target className="h-4 w-4" /> Goals Hit
          </div>
          <div className="font-display text-3xl mb-1">
            {goalsHit ? `${goalsHit.hit} of ${goalsHit.total}` : "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {goalsHit
              ? "weeks on target"
              : <button onClick={() => navigate("/app/goals")} className="text-accent hover:underline">Log your weekly goals</button>}
          </div>
        </Card>
      </div>

      {/* SECTION 2 — Publishing activity */}
      <Card className="p-6 border-border shadow-soft mb-10">
        <div className="mb-4">
          <h2 className="font-display text-2xl">Publishing activity</h2>
          <p className="text-sm text-muted-foreground">Content created and published over time</p>
        </div>
        {publishingChart.some(p => p.created || p.published) ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={publishingChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <RTooltip
                  contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(value: any, name: string) => [`${value}`, name === "created" ? "Created" : "Published"]}
                  labelFormatter={(l) => `Week of ${l}`}
                />
                <Legend formatter={(v) => v === "created" ? "Created" : "Published"} />
                <Bar dataKey="created" fill="#262833" radius={[4,4,0,0]} />
                <Line type="monotone" dataKey="published" stroke="#ff6b6b" strokeWidth={2} dot={{ r: 4 }} />
                {targetFreq !== null && (
                  <ReferenceLine y={targetFreq} stroke="#ff6b6b" strokeDasharray="4 4" label={{ value: `Target: ${targetFreq}/wk`, fill: "#ff6b6b", fontSize: 11, position: "right" }} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex flex-col items-center justify-center text-center gap-3">
            <div className="flex gap-2 opacity-30">
              {[40, 60, 35, 75, 50].map((h, i) => (
                <div key={i} className="w-8 bg-muted rounded" style={{ height: `${h}px` }} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Publish posts to see your activity chart</p>
          </div>
        )}
      </Card>

      {/* SECTION 3 — Social performance */}
      <Card className="p-6 border-border shadow-soft mb-10">
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="font-display text-2xl">Social performance</h2>
          <Tabs value={platformFilter} onValueChange={(v) => setPlatformFilter(v as PlatformFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="p-4 border-border bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Total impressions</div>
            <div className="font-display text-2xl">{socialMetrics.hasData ? socialMetrics.impressions.toLocaleString() : "—"}</div>
          </Card>
          <Card className="p-4 border-border bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Total engagement</div>
            <div className="font-display text-2xl">{socialMetrics.hasData ? socialMetrics.engagement.toLocaleString() : "—"}</div>
          </Card>
          <Card className="p-4 border-border bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Avg engagement rate</div>
            <div className="font-display text-2xl">{socialMetrics.avgRate !== null ? `${socialMetrics.avgRate.toFixed(2)}%` : "—"}</div>
          </Card>
          <Card className="p-4 border-border bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Best performing</div>
            <div className="text-sm truncate">
              {socialMetrics.best
                ? Object.values(socialMetrics.best.post.content_by_platform || {})[0]?.toString().slice(0, 40) || "—"
                : "—"}
            </div>
          </Card>
        </div>

        {!socialMetrics.hasData && socialFiltered.length > 0 && (
          <div className="mb-4 p-3 rounded-md bg-accent-soft border border-accent/20 text-sm">
            💡 Beta 1: Log post metrics manually from the Social tab to see performance data here.
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Pillar</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Likes</TableHead>
                <TableHead className="text-right">Comments</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Eng. rate</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {socialRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No published posts in this range.
                  </TableCell>
                </TableRow>
              ) : socialRows.slice(0, 20).map((p) => {
                const a = analyticsByPost.get(p.id);
                const text = Object.values(p.content_by_platform || {})[0]?.toString().slice(0, 60) || "";
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex gap-1">
                        {(p.platforms || []).map((pl: string) => <PlatformIcon key={pl} p={pl} />)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{text}</TableCell>
                    <TableCell>{p.pillar ? <Badge variant="outline">{p.pillar}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.published_at ? fmtShortDate(new Date(p.published_at)) : "—"}</TableCell>
                    <TableCell className="text-right">{a?.likes ?? "—"}</TableCell>
                    <TableCell className="text-right">{a?.comments ?? "—"}</TableCell>
                    <TableCell className="text-right">{a?.shares ?? "—"}</TableCell>
                    <TableCell className="text-right">{a?.engagement_rate ? `${Number(a.engagement_rate).toFixed(2)}%` : "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => navigate("/app/social")}>Log metrics</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* SECTION 4 — Email */}
      <Card className="p-6 border-border shadow-soft mb-10">
        <h2 className="font-display text-2xl mb-4">Email performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <Card className="p-4 border-border bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Avg open rate</div>
            <div className="font-display text-2xl mb-1">{emailMetrics.avgOpen !== null ? `${emailMetrics.avgOpen.toFixed(1)}%` : "—"}</div>
            <div className="text-xs text-muted-foreground">Industry avg: 35-40%</div>
          </Card>
          <Card className="p-4 border-border bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Avg click rate</div>
            <div className="font-display text-2xl mb-1">{emailMetrics.avgClick !== null ? `${emailMetrics.avgClick.toFixed(1)}%` : "—"}</div>
            <div className="text-xs text-muted-foreground">Industry avg: 2-5%</div>
          </Card>
          <Card className="p-4 border-border bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Total subscribers reached</div>
            <div className="font-display text-2xl">{emailMetrics.totalRecipients.toLocaleString()}</div>
          </Card>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Sent date</TableHead>
                <TableHead className="text-right">Recipients</TableHead>
                <TableHead className="text-right">Open rate</TableHead>
                <TableHead className="text-right">Click rate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailsInRange.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No emails sent yet. Send your first newsletter from the Email tab.
                  </TableCell>
                </TableRow>
              ) : emailsInRange.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="max-w-xs truncate">{e.subject || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.sent_at ? fmtShortDate(new Date(e.sent_at)) : "—"}</TableCell>
                  <TableCell className="text-right">{e.recipient_count ?? 0}</TableCell>
                  <TableCell className="text-right">{e.open_rate !== null ? `${Number(e.open_rate).toFixed(1)}%` : "—"}</TableCell>
                  <TableCell className="text-right">{e.click_rate !== null ? `${Number(e.click_rate).toFixed(1)}%` : "—"}</TableCell>
                  <TableCell><Badge variant="outline">{e.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* SECTION 5 — Goals */}
      <Card className="p-6 border-border shadow-soft mb-10">
        <div className="mb-4">
          <h2 className="font-display text-2xl">Weekly goals progress</h2>
          <p className="text-sm text-muted-foreground">Tracking against: {strategy?.success_definition || "—"}</p>
        </div>

        {goalChart.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No goal data yet. Log your weekly numbers in the Goals tab.
            <div className="mt-3"><Button size="sm" variant="outline" onClick={() => navigate("/app/goals")}>Open Goals</Button></div>
          </div>
        ) : (
          <>
            <div className="h-64 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <RTooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="calls" fill="#ff6b6b" radius={[4,4,0,0]} />
                  {successTarget !== null && (
                    <ReferenceLine y={successTarget} stroke="#262833" strokeDasharray="4 4" label={{ value: `Target: ${successTarget}`, fill: "#262833", fontSize: 11 }} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <Card className="p-4 border-border bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Posts published (this month)</div>
                <div className="font-display text-2xl">{goalSummary.postsThisMonth}</div>
              </Card>
              <Card className="p-4 border-border bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Email opens avg (this month)</div>
                <div className="font-display text-2xl">{goalSummary.avgOpens}</div>
              </Card>
              <Card className="p-4 border-border bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">Best week</div>
                <div className="font-display text-2xl">{goalSummary.bestWeek ? `${goalSummary.bestWeek.calls} calls` : "—"}</div>
                {goalSummary.bestWeek && <div className="text-xs text-muted-foreground">Week of {fmtShortDate(new Date(goalSummary.bestWeek.week_of))}</div>}
              </Card>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead className="text-right">Discovery calls</TableHead>
                    <TableHead className="text-right">Posts published</TableHead>
                    <TableHead className="text-right">Email opens</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goalEntries.slice(0, 8).map(g => (
                    <TableRow key={g.id}>
                      <TableCell>{fmtShortDate(new Date(g.week_of))}</TableCell>
                      <TableCell className="text-right">{g.discovery_calls || 0}</TableCell>
                      <TableCell className="text-right">{g.posts_published || 0}</TableCell>
                      <TableCell className="text-right">{g.email_opens || 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{g.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-right">
              <Button variant="outline" size="sm" onClick={() => navigate("/app/goals")}>Update this week</Button>
            </div>
          </>
        )}
      </Card>

      {/* SECTION 6 — Pillar breakdown */}
      <Card className="p-6 border-border shadow-soft mb-10">
        <div className="mb-4">
          <h2 className="font-display text-2xl">Content by pillar</h2>
          <p className="text-sm text-muted-foreground">Which themes are you publishing most?</p>
        </div>
        {pillarChart.length === 0 || pillarChart.every(p => p.count === 0) ? (
          <div className="py-12 text-center text-muted-foreground">
            Tag your posts with content pillars to see breakdown here.
          </div>
        ) : (
          <>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pillarChart} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="pillar" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} />
                  <RTooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: any) => [`${v} posts`, ""]} />
                  <Bar dataKey="count" radius={[0,4,4,0]}>
                    {pillarChart.map((p, i) => <Cell key={i} fill={p.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {pillarInsight && (
              <div className="mt-4 p-4 rounded-md bg-muted/40 border border-border text-sm space-y-1">
                <div>📊 Most published: <strong>{pillarInsight.top.pillar}</strong> ({pillarInsight.top.count} posts)</div>
                {pillarInsight.empty && (
                  <div className="flex items-center gap-2">
                    ⚠️ <strong>{pillarInsight.empty.pillar}</strong> has no posts this month
                    <button onClick={() => navigate("/app/social?tab=create")} className="text-accent hover:underline">+ Create a post</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      {/* SECTION 7 — MOXIEMO Insights */}
      <Card className="p-6 border-border shadow-soft mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <div>
            <h2 className="font-display text-2xl">MOXIEMO Insights</h2>
            <p className="text-sm text-muted-foreground">What your data is telling you</p>
          </div>
        </div>

        {!hasEnoughForInsights ? (
          <div className="p-6 rounded-md bg-muted/40 border border-border text-center">
            <p className="text-sm mb-3">✨ MOXIEMO insights unlock after 4 weeks of activity. Keep publishing and logging your goals — your personalized insights will appear here.</p>
            <div className="max-w-xs mx-auto">
              <div className="text-xs text-muted-foreground mb-1">{weeksWithActivity} / 4 weeks with activity</div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${Math.min(100, (weeksWithActivity / 4) * 100)}%` }} />
              </div>
            </div>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">You're crushing it — no urgent insights this period.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((ins, i) => (
              <Card key={i} className="p-4 border-border">
                <div className="text-2xl mb-2">{ins.icon}</div>
                <div className="font-medium mb-2">{ins.title}</div>
                {ins.detail && <div className="text-sm text-muted-foreground mb-3">{ins.detail}</div>}
                {ins.action && ins.route && (
                  <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground" onClick={() => navigate(ins.route!)}>
                    {ins.action} <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
