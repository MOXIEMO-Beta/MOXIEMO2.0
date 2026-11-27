import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ChevronLeft, ChevronRight, Plus, Target } from "lucide-react";
import { quarterRange, currentQuarter, nextQuarters, isBetween, asArray, fmtShort, addDays, startOfWeek, ymd, activeCampaignForDate, campaignSlotProgress, campaignSlotCounts } from "./helpers";

export default function PlanTab({ ctx }: { ctx: any }) {
  const { strategy, socialPosts, contentItems, emailSends, campaigns, loading, setTab, setScheduleAnchor, setCampaignSeed } = ctx;
  const themes = asArray<string | { theme?: string; title?: string; name?: string }>(strategy?.content_themes);
  const quarters = useMemo(() => nextQuarters(3), []);
  const cq = currentQuarter();

  const today = new Date();
  const [viewMonth, setViewMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));

  if (loading) {
    return <div className="space-y-6">
      <Skeleton className="h-44 w-full" />
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>;
  }

  // Quarterly roadmap
  const quarterCards = quarters.map((Q, i) => {
    const { start, end } = quarterRange(Q.year, Q.q);
    const isCurrent = Q.year === cq.year && Q.q === cq.q;
    const now = new Date();

    // Find a campaign whose date range overlaps this quarter
    const quarterCampaign = (campaigns ?? []).find((c: any) => {
      if (!c.start_date || !c.end_date) return false;
      const s = new Date(c.start_date);
      const e = new Date(c.end_date);
      return s <= end && e >= start;
    });

    let themeText: string;
    let postsCount: number;
    let emailsCount: number;
    let pct: number;

    if (quarterCampaign) {
      themeText = quarterCampaign.name;
      const counts = campaignSlotCounts(quarterCampaign);
      postsCount = (counts.linkedin ?? 0) + (counts.instagram ?? 0) + (counts.facebook ?? 0);
      emailsCount = counts.email ?? 0;
      pct = campaignSlotProgress(quarterCampaign).pct;
    } else {
      const themeRaw = themes[i] as any;
      themeText = typeof themeRaw === "string" ? themeRaw : (themeRaw?.theme ?? themeRaw?.title ?? themeRaw?.name ?? `Quarter ${Q.q} focus`);
      postsCount = socialPosts.filter((p: any) => isBetween(p.scheduled_at ?? p.published_at, start, end)).length;
      emailsCount = emailSends.filter((e: any) => isBetween(e.scheduled_at ?? e.sent_at, start, end)).length;
      const total = end.getTime() - start.getTime();
      const elapsed = Math.max(0, Math.min(total, now.getTime() - start.getTime()));
      pct = isCurrent ? Math.round((elapsed / total) * 100) : (now > end ? 100 : 0);
    }

    return (
      <Card key={`${Q.year}-${Q.q}`} className="min-w-[280px] w-[280px] p-5 shadow-soft border-border">
        <div className="text-xs text-muted-foreground font-medium mb-1">Q{Q.q} {Q.year}</div>
        <div className="font-display text-lg leading-tight mb-3 line-clamp-2">{themeText}</div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
          <div className={isCurrent ? "h-full bg-accent" : "h-full bg-muted-foreground/30"} style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          {isCurrent ? "Active" : now > end ? "Completed" : "Upcoming"} · {postsCount} posts · {emailsCount} emails
        </div>
        <button
          className="text-sm text-accent font-medium inline-flex items-center gap-1 hover:underline"
          onClick={() => { setScheduleAnchor(start); setTab("schedule"); }}
        >
          View quarter <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </Card>
    );
  });

  // Coverage heatmap — current month
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const firstWeekStart = startOfWeek(monthStart);
  const cellsCount = Math.ceil((((monthEnd.getTime() - firstWeekStart.getTime()) / 86400000) + 1) / 7) * 7;
  const days: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < cellsCount; i++) {
    const d = addDays(firstWeekStart, i);
    days.push({ date: d, inMonth: d.getMonth() === viewMonth.getMonth() && d.getFullYear() === viewMonth.getFullYear() });
  }

  function dayDots(d: Date) {
    const dots: { color: string; key: string; label: string }[] = [];
    socialPosts.forEach((p: any) => {
      const iso = p.scheduled_at ?? p.published_at;
      if (!iso) return;
      if (new Date(iso).toDateString() !== d.toDateString()) return;
      (p.platforms ?? []).forEach((pl: string) => {
        if (pl === "linkedin") dots.push({ color: "bg-[#FF6B5C]", key: `li-${p.id}`, label: "LinkedIn" });
        else if (pl === "instagram") dots.push({ color: "bg-[#FF6B5C]", key: `ig-${p.id}`, label: "Instagram" });
        else if (pl === "facebook") dots.push({ color: "bg-[#FF6B5C]", key: `fb-${p.id}`, label: "Facebook" });
      });
    });
    emailSends.forEach((e: any) => {
      const iso = e.scheduled_at ?? e.sent_at;
      if (!iso) return;
      if (new Date(iso).toDateString() === d.toDateString()) dots.push({ color: "bg-[#FF6B5C]", key: `em-${e.id}`, label: "Email" });
    });
    contentItems.forEach((c: any) => {
      if (c.status !== "draft") return;
      if (new Date(c.created_at).toDateString() === d.toDateString()) dots.push({ color: "bg-muted-foreground", key: `dr-${c.id}`, label: "Draft" });
    });
    return dots;
  }

  // Channel balance bar
  const counts = { linkedin: 0, instagram: 0, facebook: 0, email: 0 };
  socialPosts.forEach((p: any) => {
    if (!isBetween(p.scheduled_at ?? p.published_at, monthStart, monthEnd)) return;
    (p.platforms ?? []).forEach((pl: string) => { if ((counts as any)[pl] !== undefined) (counts as any)[pl]++; });
  });
  counts.email = emailSends.filter((e: any) => isBetween(e.scheduled_at ?? e.sent_at, monthStart, monthEnd)).length;
  const total = Math.max(1, counts.linkedin + counts.instagram + counts.facebook + counts.email);
  const bal = [
    { label: "LinkedIn", val: counts.linkedin, color: "bg-[#FF6B5C]" },
    { label: "Email", val: counts.email, color: "bg-[#FF6B5C]" },
    { label: "Instagram", val: counts.instagram, color: "bg-[#FF6B5C]" },
    { label: "Facebook", val: counts.facebook, color: "bg-[#FF6B5C]" },
  ];

  const activeCampaigns = campaigns.filter((c: any) => c.status === "active");

  return (
    <div className="space-y-6">
      {/* Section 1: quarterly roadmap */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Quarterly roadmap</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ width: "100%" }}>
          {quarterCards}
        </div>
        <div className="mt-3">
          <Button
            variant="outline"
            onClick={() => {
              const next = nextQuarters(2)[1];
              const { start, end } = quarterRange(next.year, next.q);
              setCampaignSeed({
                name: `Q${next.q} ${next.year} Theme`,
                campaign_type: "quarterly",
                start_date: ymd(start),
                end_date: ymd(end),
              });
              setTab("campaigns");
            }}
          >
            <Plus className="w-4 h-4" /> Plan next quarter
          </Button>
        </div>
      </section>

      {/* Section 2: coverage heatmap */}
      <section>
        <div className="flex items-center justify-center gap-3 mb-3">
          <button
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
            className="w-6 h-6 inline-flex items-center justify-center text-foreground hover:text-[#FF6B5C] transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display text-xl text-center">
            Coverage at a glance — {viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <button
            onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            className="w-6 h-6 inline-flex items-center justify-center text-foreground hover:text-[#FF6B5C] transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <Card className="p-4 shadow-soft border-border">
          <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden mb-4" style={{ backgroundColor: "#E5E7EB" }}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
              <div key={d} className="bg-muted px-2 py-1.5 text-[11px] font-medium text-muted-foreground">{d}</div>
            ))}
            {days.map(({ date, inMonth }, idx) => {
              const dots = inMonth ? dayDots(date) : [];
              const isWeekday = true;
              const empty = dots.length === 0;
              const t = date.getTime();
              const dayCampaigns = inMonth
                ? (campaigns ?? []).filter((c: any) => {
                    if (!c.start_date || !c.end_date) return false;
                    if (c.status === "completed" || c.status === "paused") return false;
                    return t >= new Date(c.start_date).getTime() && t <= new Date(c.end_date).getTime();
                  })
                : [];
              const camp = empty && isWeekday ? dayCampaigns[0] : null;
              const isToday = date.toDateString() === today.toDateString();
              return (
                <div
                  key={idx}
                  className={`relative group min-h-[72px] p-2 align-top bg-card ${inMonth ? "" : "opacity-40"}`}
                >
                  <div className="mb-1">
                    {isToday ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FF6B5C] text-white text-[11px] font-semibold">
                        {date.getDate()}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{date.getDate()}</span>
                    )}
                  </div>
                  {dayCampaigns.length > 0 && (
                    <div className="flex flex-col gap-1 mb-1">
                      {dayCampaigns.slice(0, 2).map((c: any) => (
                        <span
                          key={c.id}
                          className="text-[10px] font-medium leading-tight px-1.5 py-0.5 rounded text-white truncate"
                          style={{
                            backgroundColor: c.color || "#F97066",
                            opacity: dots.length > 0 ? 1 : 0.5,
                          }}
                          title={c.name}
                        >
                          {c.name}
                        </span>
                      ))}
                      {dayCampaigns.length > 2 && (
                        <span className="text-[9px] text-muted-foreground">+{dayCampaigns.length - 2}</span>
                      )}
                    </div>
                  )}
                  {dots.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {dots.slice(0, 3).map(d => (
                        <span
                          key={d.key}
                          className={`text-[12px] font-semibold leading-tight px-2 py-1 rounded-md text-white truncate ${d.color}`}
                          title={d.label}
                        >
                          {d.label}
                        </span>
                      ))}
                      {dots.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">+{dots.length - 3}</span>
                      )}
                    </div>
                  )}
                  {empty && inMonth && isWeekday && (
                    <button
                      onClick={() => {
                        if (camp) {
                          const platform = (camp.channels?.[0] === "linkedin" ? "LinkedIn Post"
                            : camp.channels?.[0] === "email" ? "Newsletter Section"
                            : camp.channels?.[0] === "instagram" ? "Instagram Caption"
                            : camp.channels?.[0] === "facebook" ? "Facebook Post"
                            : "LinkedIn Post");
                          const params = new URLSearchParams({
                            platform,
                            campaign: camp.name,
                            campaignId: camp.id,
                            date: ymd(date),
                          });
                          window.location.href = `/app/content?${params.toString()}`;
                        } else {
                          setScheduleAnchor(date);
                          setTab("schedule");
                        }
                      }}
                      className="block w-full text-left text-[11px] font-normal py-0.5 bg-transparent border-0 hover:opacity-100 transition-opacity"
                      style={{ color: "rgba(255, 107, 107, 0.6)" }}
                      title={camp ? `Add content — ${camp.name}` : "Add content"}
                    >
                      + Add content
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Channel balance bar */}
          <div className="space-y-1.5">
            {bal.map(b => {
              const pct = Math.round((b.val / total) * 100);
              return (
                <div key={b.label} className="flex items-center gap-3 text-xs">
                  <div className="w-20 text-muted-foreground">{b.label}</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden" style={{ maxWidth: "100%" }}>
                    <div className={`h-full ${b.color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-10 text-right text-muted-foreground">{pct}%</div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Section 3: active campaigns */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Active campaigns</h2>
          <button className="text-sm text-accent font-medium inline-flex items-center gap-1 hover:underline" onClick={() => setTab("campaigns")}>
            View all campaigns <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {activeCampaigns.length === 0 ? (
          <Card className="p-6 border-dashed border-border text-center">
            <Target className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              {campaigns.length === 0 ? "Create your first campaign to see it here" : "No active campaigns yet"}
            </p>
            <Button onClick={() => setTab("campaigns")}>
              <Plus className="w-4 h-4" /> Create campaign
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeCampaigns.map((c: any) => {
              const linked = [
                ...socialPosts.filter((p: any) => p.campaign_id === c.id && p.status === "published"),
                ...emailSends.filter((e: any) => e.campaign_id === c.id && e.status === "sent"),
              ].length;
              const totalLinked = [
                ...socialPosts.filter((p: any) => p.campaign_id === c.id),
                ...emailSends.filter((e: any) => e.campaign_id === c.id),
              ].length;
              const pct = totalLinked > 0 ? Math.round((linked / totalLinked) * 100) : 0;
              return (
                <Card key={c.id} className="p-4 shadow-soft border-border flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.start_date ? fmtShort(new Date(c.start_date)) : "—"} – {c.end_date ? fmtShort(new Date(c.end_date)) : "—"}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(c.channels ?? []).slice(0, 4).map((ch: string) => (
                      <Badge key={ch} variant="outline" className="text-[10px]">{ch}</Badge>
                    ))}
                  </div>
                  <div className="w-28 hidden sm:block">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 text-right">{pct}%</div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
