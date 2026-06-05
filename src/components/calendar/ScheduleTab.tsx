import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Sparkles, ArrowRight, AlertTriangle, Target, Linkedin, Instagram, Facebook, Mail, FileText, Check, X } from "lucide-react";
import { startOfWeek, addDays, sameDay, fmtShort, ymd, PLATFORM_LABELS, activeCampaignForDate } from "./helpers";
import { cn } from "@/lib/utils";

const DEFAULT_CAMPAIGN_COLOR = "#F97066";

const CHANNEL_ABBR: Record<string, string> = {
  linkedin: "LI",
  email: "EM",
  instagram: "IG",
  facebook: "FB",
  content: "C",
};

const EXEC_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  not_started: { label: "Not started", cls: "bg-muted text-muted-foreground border-border" },
  draft: { label: "Draft", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  published: { label: "Published", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function PlatformIcon({ channel, className }: { channel: string; className?: string }) {
  const cls = cn("w-4 h-4", className);
  if (channel === "linkedin") return <Linkedin className={cls} />;
  if (channel === "instagram") return <Instagram className={cls} />;
  if (channel === "facebook") return <Facebook className={cls} />;
  if (channel === "email") return <Mail className={cls} />;
  return <FileText className={cls} />;
}

function itemChannel(it: any): string {
  if (it._kind === "email") return "email";
  if (it._kind === "content") return "content";
  if (it._kind === "slot") return it.platform ?? "linkedin";
  return it.platforms?.[0] ?? "linkedin";
}

function itemStatus(it: any): "draft" | "scheduled" | "published" | "needs" {
  if (it._kind === "slot") return "needs";
  if (it.status === "published" || it.status === "sent") return "published";
  if (it.status === "scheduled") return "scheduled";
  return "draft";
}

function statusBadge(s: ReturnType<typeof itemStatus>) {
  if (s === "published") return { label: "Published", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (s === "scheduled") return { label: "Scheduled", cls: "bg-blue-50 text-blue-700 border-blue-200" };
  if (s === "needs") return { label: "Needs content", cls: "bg-accent-soft text-accent border-accent/30" };
  return { label: "Draft", cls: "bg-muted text-muted-foreground border-border" };
}

type ChannelKey = "linkedin" | "email" | "instagram" | "facebook" | "content";

export default function ScheduleTab({ ctx }: { ctx: any }) {
  const { socialPosts, contentItems, emailSends, socialConnections, subscribers, campaigns, executionItems, scheduleAnchor, setTab, navigate } = ctx;
  const [view, setView] = useState<"week" | "month">("month");
  const [anchor, setAnchor] = useState<Date>(scheduleAnchor ?? new Date());
  useEffect(() => { if (scheduleAnchor) setAnchor(scheduleAnchor); }, [scheduleAnchor]);

  const [openItem, setOpenItem] = useState<any>(null);
  const [quickCreate, setQuickCreate] = useState<{ date: Date; channel: ChannelKey } | null>(null);
  const [dayDrawer, setDayDrawer] = useState<{ date: Date; items: any[] } | null>(null);

  const execItemsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    (executionItems ?? []).forEach((it: any) => {
      const arr = map.get(it.date) ?? [];
      arr.push(it);
      map.set(it.date, arr);
    });
    return map;
  }, [executionItems]);

  function campaignById(id: string) {
    return (campaigns ?? []).find((c: any) => c.id === id);
  }

  function execItemsForDay(d: Date) {
    return execItemsByDate.get(ymd(d)) ?? [];
  }

  function openDayDrawer(d: Date) {
    const items = execItemsForDay(d);
    if (items.length === 0) return;
    setDayDrawer({ date: d, items });
  }

  function campaignColorForItem(it: any): string {
    if (it._campaign?.color) return it._campaign.color;
    const cid = it.campaign_id;
    if (cid) {
      const c = (campaigns ?? []).find((x: any) => x.id === cid);
      if (c?.color) return c.color;
    }
    return DEFAULT_CAMPAIGN_COLOR;
  }

  // Determine which channel rows to show
  const channels = useMemo<ChannelKey[]>(() => {
    const list: ChannelKey[] = [];
    const hasLI = socialConnections.some((c: any) => c.platform === "linkedin") ||
      socialPosts.some((p: any) => (p.platforms ?? []).includes("linkedin"));
    if (hasLI) list.push("linkedin");
    const hasEmail = subscribers.length > 0 || emailSends.length > 0;
    if (hasEmail) list.push("email");
    list.push("instagram");
    list.push("facebook");
    if (contentItems.length > 0) list.push("content");
    return list;
  }, [socialConnections, socialPosts, subscribers, emailSends, contentItems]);

  const weekStart = startOfWeek(anchor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function itemsForCell(channel: ChannelKey, day: Date): any[] {
    // Campaign placeholder slots first (so they appear when nothing is scheduled yet)
    const slotItems: any[] = [];
    (campaigns ?? []).forEach((c: any) => {
      const slots: any[] = c?.content_plan?.slots ?? [];
      slots.forEach((s: any) => {
        if (s.platform !== channel) return;
        if (s.date !== ymd(day)) return;
        if (s.status === "filled") return;
        slotItems.push({
          ...s,
          _kind: "slot",
          _campaign: c,
          _text: `${s.contentType} · ${c.name}`,
          status: "needs_content",
        });
      });
    });

    if (channel === "email") {
      const real = emailSends.filter((e: any) => {
        const iso = e.scheduled_for ?? e.sent_at;
        return iso && sameDay(new Date(iso), day);
      }).map((e: any) => ({ ...e, _kind: "email", _text: e.subject ?? e.body?.slice(0, 60) ?? "Email" }));
      return [...real, ...slotItems];
    }
    if (channel === "content") {
      return contentItems.filter((c: any) => {
        const iso = c.scheduled_for ?? c.published_at ?? c.created_at;
        return iso && sameDay(new Date(iso), day);
      }).map((c: any) => ({ ...c, _kind: "content", _text: c.topic ?? c.body?.slice(0, 60) ?? "Content draft" }));
    }
    const real = socialPosts.filter((p: any) => {
      if (!(p.platforms ?? []).includes(channel)) return false;
      const iso = p.scheduled_for ?? p.published_at;
      return iso && sameDay(new Date(iso), day);
    }).map((p: any) => ({ ...p, _kind: "social", _text: (p.content_by_platform?.[channel] ?? p.topic ?? "Post").slice(0, 60) }));
    return [...real, ...slotItems];
  }

  // Sidebar metrics — this week
  const weekEnd = addDays(weekStart, 7);
  const inWeek = (iso: string | null | undefined) => iso && new Date(iso) >= weekStart && new Date(iso) < weekEnd;
  const weekScheduled = socialPosts.filter((p: any) => inWeek(p.scheduled_for ?? p.published_at)).length;
  const weekLI = socialPosts.filter((p: any) => (p.platforms ?? []).includes("linkedin") && inWeek(p.scheduled_for ?? p.published_at)).length;
  const weekIG = socialPosts.filter((p: any) => (p.platforms ?? []).includes("instagram") && inWeek(p.scheduled_for ?? p.published_at)).length;
  const weekEmail = emailSends.filter((e: any) => inWeek(e.scheduled_for ?? e.sent_at)).length;

  // "X of Y slots filled this week" — count campaign slots in week
  const weekSlotsAll = (campaigns ?? []).flatMap((c: any) => (c?.content_plan?.slots ?? []).map((s: any) => ({ ...s, _c: c })))
    .filter((s: any) => {
      const d = s.date ? new Date(s.date) : null;
      return d && d >= weekStart && d < weekEnd;
    });
  const weekSlotsFilled = weekSlotsAll.filter((s: any) => s.status === "filled").length;

  // Month view cells
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const monthFirstWeek = startOfWeek(monthStart);
  const monthCells = Math.ceil(((monthEnd.getTime() - monthFirstWeek.getTime()) / 86400000 + 1) / 7) * 7;

  function dayItems(d: Date): any[] {
    return channels.flatMap(ch => itemsForCell(ch, d));
  }

  const cadenceTarget = 5; // default; could use strategy.posting_frequency

  // Determine which campaigns intersect the visible week, for the top banner
  const weekEndForBanner = addDays(weekStart, 6);
  const visibleCampaigns = (campaigns ?? []).filter((c: any) => {
    if (!c.start_date || !c.end_date) return false;
    const s = new Date(c.start_date);
    const e = new Date(c.end_date);
    return s <= weekEndForBanner && e >= weekStart;
  });

  function spanForCampaign(c: any) {
    const s = new Date(c.start_date);
    const e = new Date(c.end_date);
    const startCol = Math.max(0, Math.floor((Math.max(s.getTime(), weekStart.getTime()) - weekStart.getTime()) / 86400000));
    const endCol = Math.min(6, Math.floor((Math.min(e.getTime(), weekEndForBanner.getTime()) - weekStart.getTime()) / 86400000));
    return { startCol, span: endCol - startCol + 1 };
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,260px] gap-6">
      <div>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setAnchor(view === "week" ? addDays(anchor, -7) : new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-sm font-medium px-2 min-w-[160px] text-center">
              {view === "week"
                ? `Week of ${fmtShort(weekStart)}`
                : anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
            <Button variant="outline" size="sm" onClick={() => setAnchor(view === "week" ? addDays(anchor, 7) : new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex border border-border rounded-md overflow-hidden">
              <button className={cn("px-3 py-1.5 text-xs", view === "month" ? "bg-foreground text-background" : "bg-background")} onClick={() => setView("month")}>Month</button>
              <button className={cn("px-3 py-1.5 text-xs", view === "week" ? "bg-foreground text-background" : "bg-background")} onClick={() => setView("week")}>Week</button>
            </div>
            <Button onClick={() => navigate("/app/social?tab=create")}>
              <Plus className="w-4 h-4" /> Add content
            </Button>
          </div>
        </div>

        {view === "week" ? (
          <Card className="p-3 shadow-soft border-border overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Campaign name markers — only render on the campaign's first day in the visible week */}
              {visibleCampaigns.length > 0 && (
                <div className="mb-2 space-y-1">
                  {visibleCampaigns.map((c: any) => {
                    const cStart = new Date(c.start_date);
                    // Only show the marker if the campaign starts within the visible week
                    if (cStart < weekStart || cStart > addDays(weekStart, 6)) return null;
                    const startCol = Math.floor((cStart.getTime() - weekStart.getTime()) / 86400000);
                    const color = c.color || DEFAULT_CAMPAIGN_COLOR;
                    return (
                      <div
                        key={c.id}
                        className="grid"
                        style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 2 }}
                      >
                        <button
                          type="button"
                          onClick={() => navigate("/app/calendar?tab=campaigns")}
                          style={{
                            gridColumnStart: startCol + 1,
                            gridColumnEnd: `span 1`,
                            backgroundColor: color,
                            borderLeft: `3px solid ${color}`,
                          }}
                          className="h-6 px-2 rounded-md text-white text-[11px] font-medium flex items-center gap-1.5 truncate hover:opacity-90 transition-opacity text-left"
                          title={`${c.name} · starts ${fmtShort(cStart)}`}
                        >
                          <Target className="w-3 h-3 shrink-0" />
                          <span className="truncate">{c.name}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 2 }}>
                {weekDays.map(d => {
                  const isToday = sameDay(d, new Date());
                  return (
                    <div key={`hdr-${d.toISOString()}`} className="text-[11px] text-muted-foreground font-medium px-2 py-1">
                      <div>{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                      <div className={cn("text-foreground", isToday && "font-bold")}>{d.getDate()}</div>
                    </div>
                  );
                })}
                {weekDays.map(d => {
                  const items = dayItems(d);
                  const isToday = sameDay(d, new Date());
                  const execItems = execItemsForDay(d);
                  return (
                    <div
                      key={`col-${d.toISOString()}`}
                      className={cn(
                        "group relative min-h-[260px] p-1.5 rounded border border-transparent",
                        isToday && "bg-accent-soft/40"
                      )}
                    >
                      {/* Campaign execution pills */}
                      {execItems.length > 0 && (
                        <div className="space-y-1 mb-1.5">
                          {execItems.map((ex: any) => {
                            const camp = campaignById(ex.campaign_id);
                            const color = camp?.color || DEFAULT_CAMPAIGN_COLOR;
                            return (
                              <button
                                key={ex.id}
                                onClick={() => openDayDrawer(d)}
                                className="w-full h-6 flex items-center gap-1.5 px-1.5 rounded-md border border-border bg-card text-[10px] font-medium hover:bg-muted/40 transition-colors"
                                title={`${camp?.name ?? "Campaign"} · ${ex.channel}`}
                              >
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                <PlatformIcon channel={ex.channel} className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span>{CHANNEL_ABBR[ex.channel] ?? ex.channel.slice(0, 2).toUpperCase()}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        {items.map((it, idx) => {
                          const ch = itemChannel(it);
                          const status = itemStatus(it);
                          const badge = statusBadge(status);
                          const color = campaignColorForItem(it);
                          return (
                            <button
                              key={idx}
                              onClick={() => setOpenItem(it)}
                              className="w-full text-left bg-card rounded-md border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                              <div className="h-1" style={{ backgroundColor: color }} />
                              <div className="p-2">
                                <div className="flex items-start justify-between gap-1.5 mb-1">
                                  <div className="text-[11px] font-medium leading-snug line-clamp-2 flex-1">
                                    {(it._text || "Untitled").slice(0, 60)}
                                  </div>
                                  <PlatformIcon channel={ch} className="w-4 h-4 text-muted-foreground shrink-0" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={cn("inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border", badge.cls)}>
                                    {status === "published" && <Check className="w-2.5 h-2.5" />}
                                    {badge.label}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {/* Hover-only add affordance */}
                      <button
                        onClick={() => setQuickCreate({ date: d, channel: "linkedin" })}
                        className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 w-full text-[10px] text-muted-foreground hover:text-accent flex items-center justify-center gap-1 py-1.5 rounded border border-dashed border-border"
                        title="Add content"
                      >
                        <Plus className="w-3 h-3" /> Add content
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-3 shadow-soft border-border">
            <div className="grid grid-cols-7 gap-px rounded-md overflow-hidden" style={{ backgroundColor: "#E5E7EB" }}>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                <div key={d} className="bg-muted px-2 py-1.5 text-[11px] font-medium text-muted-foreground">{d}</div>
              ))}
              {(() => {
                const cells = Array.from({ length: monthCells }, (_, i) => addDays(monthFirstWeek, i));
                const today = new Date();
                const out: JSX.Element[] = [];
                for (let row = 0; row < cells.length / 7; row++) {
                  const rowDays = cells.slice(row * 7, row * 7 + 7);
                  const rowStart = rowDays[0];
                  const rowEnd = rowDays[6];
                  // Find campaigns overlapping this row
                  const rowCampaigns = (campaigns ?? []).filter((c: any) => {
                    if (!c.start_date || !c.end_date) return false;
                    const s = new Date(c.start_date);
                    const e = new Date(c.end_date);
                    return s <= rowEnd && e >= rowStart;
                  });
                  // Week separators are provided by the grid's 1px gap (#E5E7EB) — no colored strips.
                  rowDays.forEach((d, i) => {
                    const inMonth = d.getMonth() === anchor.getMonth();
                    const items = inMonth ? dayItems(d) : [];
                    const isToday = sameDay(d, today);
                    out.push(
                      <div
                        key={`cell-${row}-${i}`}
                        className={cn(
                          "group bg-card min-h-[140px] p-1.5 text-left relative flex flex-col",
                          inMonth ? "" : "opacity-40",
                          isToday && "bg-accent-soft/40"
                        )}
                      >
                        <div className="mb-1">
                          <span className={cn("text-[10px]", isToday ? "font-bold text-foreground" : "text-muted-foreground")}>
                            {d.getDate()}
                          </span>
                        </div>
                        <div className="space-y-0.5 flex-1">
                          {inMonth && execItemsForDay(d).length > 0 && (
                            <div className="space-y-0.5 mb-0.5">
                              {execItemsForDay(d).slice(0, 3).map((ex: any) => {
                                const camp = campaignById(ex.campaign_id);
                                const color = camp?.color || DEFAULT_CAMPAIGN_COLOR;
                                return (
                                  <button
                                    key={ex.id}
                                    onClick={(e) => { e.stopPropagation(); openDayDrawer(d); }}
                                    className="w-full flex items-center gap-1 px-1 py-1 rounded border border-border bg-card text-[9px] font-medium leading-snug hover:bg-muted/40"
                                    title={`${camp?.name ?? "Campaign"} · ${ex.channel}`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                    <span>{CHANNEL_ABBR[ex.channel] ?? ex.channel.slice(0, 2).toUpperCase()}</span>
                                  </button>
                                );
                              })}
                              {execItemsForDay(d).length > 3 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); openDayDrawer(d); }}
                                  className="text-[9px] text-muted-foreground hover:underline mt-2"
                                >
                                  +{execItemsForDay(d).length - 3} more
                                </button>
                              )}
                            </div>
                          )}
                          {items.slice(0, 2).map((it, idx) => {
                            const ch = itemChannel(it);
                            const color = campaignColorForItem(it);
                            const status = itemStatus(it);
                            return (
                              <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setOpenItem(it); }}
                                className="w-full flex items-center gap-1 bg-card pl-1.5 pr-1 py-1 rounded border border-border text-left leading-snug hover:bg-muted/40"
                                style={{ borderLeft: `3px solid ${color}` }}
                                title={`${it._text} · ${statusBadge(status).label}`}
                              >
                                <PlatformIcon channel={ch} className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="text-[9px] truncate">{(it._text || "").slice(0, 20)}</span>
                              </button>
                            );
                          })}
                          {items.length > 2 && (
                            <button
                              onClick={() => { setAnchor(d); setView("week"); }}
                              className="text-[9px] font-medium hover:underline mt-2 self-start"
                              style={{ color: "#6B7280" }}
                            >
                              +{items.length - 2} more
                            </button>
                          )}
                          {inMonth && items.length === 0 && (
                            <button
                              onClick={() => setQuickCreate({ date: d, channel: "linkedin" })}
                              className="opacity-0 group-hover:opacity-100 transition-opacity w-full flex items-center justify-center text-muted-foreground hover:text-accent py-1"
                              title="Add content"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                }
                return out;
              })()}
            </div>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      {view === "week" && (
        <Card className="p-4 shadow-soft border-border h-fit">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">This week</div>
          <div className="text-sm mb-1">Cadence target: <span className="font-medium">{cadenceTarget} posts/week</span></div>
          <div className="text-sm flex items-center gap-1">
            Scheduled: <span className="font-medium">{weekScheduled} posts</span>
            {weekScheduled < cadenceTarget && <span className="text-amber-600 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> behind</span>}
          </div>
          {weekSlotsAll.length > 0 && (
            <div className="text-sm mt-1 text-muted-foreground">
              <span className="font-medium text-foreground">{weekSlotsFilled}</span> of <span className="font-medium text-foreground">{weekSlotsAll.length}</span> slots filled this week
            </div>
          )}

          <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">MOXIEMO suggests</div>
          <div className="bg-accent-soft border border-accent/30 rounded-lg p-3 text-xs">
            <div className="flex items-center gap-1 font-medium mb-1.5"><Sparkles className="w-3.5 h-3.5 text-accent" /> Tip</div>
            {weekLI < cadenceTarget ? (
              <>
                <p className="mb-2">You're {cadenceTarget - weekLI} LinkedIn posts behind target.</p>
                <Button size="sm" variant="outline" className="w-full" onClick={() => navigate("/app/social?tab=create")}>
                  Generate posts <ArrowRight className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <p>You're on cadence this week. Consider scheduling next week.</p>
            )}
          </div>
        </Card>
      )}

      {/* Item detail sheet */}
      <Sheet open={!!openItem} onOpenChange={(o) => !o && setOpenItem(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {openItem && openItem._kind === "day" ? (
            <>
              <SheetHeader><SheetTitle>{(openItem.date as Date).toDateString()}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-2">
                {(openItem.items as any[]).map((it, idx) => (
                  <Card key={idx} className="p-3 border-border">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{it._kind}</div>
                    <div className="text-sm">{it._text}</div>
                  </Card>
                ))}
              </div>
            </>
          ) : openItem && openItem._kind === "slot" ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" /> {openItem.contentType}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <Badge className="bg-accent-soft text-accent">Needs content</Badge>
                <div className="text-muted-foreground">
                  Part of <b className="text-foreground">{openItem._campaign?.name}</b><br />
                  {openItem._campaign?.start_date && openItem._campaign?.end_date && (
                    <span className="text-xs">
                      {fmtShort(new Date(openItem._campaign.start_date))} – {fmtShort(new Date(openItem._campaign.end_date))}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Scheduled for: {openItem.date}</div>
                <Button
                  className="w-full"
                  onClick={() => {
                    const params = new URLSearchParams({
                      platform: openItem.contentType,
                      campaign: openItem._campaign?.name ?? "",
                      campaignId: openItem._campaign?.id ?? "",
                      slotId: openItem.id ?? "",
                      date: openItem.date ?? "",
                    });
                    navigate(`/app/content?${params.toString()}`);
                  }}
                >
                  <Sparkles className="w-4 h-4" /> Generate content for this slot
                </Button>
              </div>
            </>
          ) : openItem ? (
            <>
              <SheetHeader>
                <SheetTitle>{openItem._text || "Item"}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{openItem._kind}</Badge>
                  <Badge variant="outline">{openItem.status}</Badge>
                  {(openItem.platforms ?? []).map((p: string) => <Badge key={p} variant="outline">{p}</Badge>)}
                </div>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {openItem._kind === "social"
                    ? Object.values(openItem.content_by_platform ?? {})[0] as string
                    : openItem.body || openItem.subject}
                </div>
                <Button onClick={() => {
                  if (openItem._kind === "email") navigate("/app/email");
                  else if (openItem._kind === "content") navigate("/app/content");
                  else navigate("/app/social");
                }} className="w-full">Open in editor <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Quick create dialog */}
      <Dialog open={!!quickCreate} onOpenChange={(o) => !o && setQuickCreate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to {quickCreate?.date.toDateString()} · {quickCreate ? PLATFORM_LABELS[quickCreate.channel] : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => { setQuickCreate(null); navigate("/app/social?tab=create"); }}>
              <Sparkles className="w-4 h-4" /> Generate with MOXIEMO
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => { setQuickCreate(null); navigate(quickCreate?.channel === "email" ? "/app/email" : quickCreate?.channel === "content" ? "/app/content" : "/app/social?tab=create"); }}>
              <Plus className="w-4 h-4" /> Create manually
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => { setQuickCreate(null); navigate("/app/social?tab=library"); }}>
              <ArrowRight className="w-4 h-4" /> Move existing draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign day drawer */}
      <Sheet open={!!dayDrawer} onOpenChange={(o) => !o && setDayDrawer(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
          {dayDrawer && (
            <DayDrawerContent
              date={dayDrawer.date}
              items={dayDrawer.items}
              campaigns={campaigns ?? []}
              onClose={() => setDayDrawer(null)}
              onCreate={(channel, brief) => {
                const params = new URLSearchParams();
                if (channel) params.set("platform", channel);
                if (brief) params.set("prompt", brief);
                setDayDrawer(null);
                navigate(`/app/content?${params.toString()}`);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DayDrawerContent({
  date, items, campaigns, onClose, onCreate,
}: {
  date: Date;
  items: any[];
  campaigns: any[];
  onClose: () => void;
  onCreate: (channel: string, brief: string) => void;
}) {
  // Group by campaign
  const groups = new Map<string, { campaign: any; items: any[] }>();
  items.forEach((it) => {
    const c = campaigns.find((x: any) => x.id === it.campaign_id);
    const key = it.campaign_id;
    if (!groups.has(key)) groups.set(key, { campaign: c, items: [] });
    groups.get(key)!.items.push(it);
  });

  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between p-5 border-b border-border">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Campaign day</div>
          <div className="font-display text-lg">{dateLabel}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {Array.from(groups.values()).map(({ campaign, items: group }) => {
          const color = campaign?.color || DEFAULT_CAMPAIGN_COLOR;
          return (
            <div
              key={campaign?.id ?? "unknown"}
              className="border-l-[3px] pl-3"
              style={{ borderLeftColor: color }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <div className="font-display text-base">{campaign?.name ?? "Campaign"}</div>
              </div>
              <div className="space-y-3">
                {group.map((it: any) => {
                  const badge = EXEC_STATUS_BADGE[it.status] ?? EXEC_STATUS_BADGE.not_started;
                  return (
                    <div key={it.id} className="rounded-lg border border-border p-3 bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <PlatformIcon channel={it.channel} className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">{it.channel}</span>
                        </div>
                        <span className={cn("inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border", badge.cls)}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Week {it.week_number}{it.week_theme ? ` — ${it.week_theme}` : ""}
                      </div>
                      {it.content_brief && (
                        <div className="text-sm text-foreground/90 whitespace-pre-wrap mb-3">
                          {it.content_brief}
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={() => onCreate(it.channel, it.content_brief ?? "")}
                      >
                        <Sparkles className="w-3 h-3" /> Create content
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FragmentRow({ label, days, cellItems, chipClass, onItem, onAdd, campaignForDate }: any) {
  return (
    <>
      <div className="text-xs font-medium px-2 py-2 text-muted-foreground border-t border-border">{label}</div>
      {days.map((d: Date) => {
        const items = cellItems(d);
        const camp = campaignForDate ? campaignForDate(d) : null;
        return (
          <div key={d.toISOString()} className="border-t border-border min-h-[64px] p-1 group">
            {items.length === 0 ? (
              camp ? (
                <button
                  onClick={() => onAdd(d)}
                  className="w-full h-full text-[10px] text-accent flex flex-col items-center justify-center px-1 truncate rounded bg-accent-soft border border-accent/30 hover:bg-accent/20 transition-colors"
                  title={`Fill gap — ${camp.name}`}
                >
                  <span className="truncate w-full text-center font-medium">Fill gap</span>
                  <span className="truncate w-full text-center text-[9px] opacity-80">{camp.name}</span>
                </button>
              ) : (
                <button
                  onClick={() => onAdd(d)}
                  className="w-full h-full text-[10px] text-muted-foreground hover:text-accent hover:bg-accent-soft flex items-center justify-center rounded border border-dashed border-border transition-colors"
                  title="Add content"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )
            ) : (
              <div className="space-y-1">
                {items.slice(0, 3).map((it: any) => (
                  <button
                    key={it.id}
                    onClick={() => onItem(it)}
                    className={cn("w-full text-left rounded px-1.5 py-1 text-[10px] border truncate", chipClass(it))}
                  >
                    {(it._text || "").slice(0, 28)}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function BalRow({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((val / Math.max(1, max)) * 100));
  return (
    <div className="flex items-center gap-2 text-xs mb-1.5">
      <div className="w-20 text-muted-foreground">{label}</div>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden" style={{ maxWidth: "100%" }}>
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-14 text-right text-muted-foreground">{val} {label === "Email" ? "email" : "posts"}</div>
    </div>
  );
}
