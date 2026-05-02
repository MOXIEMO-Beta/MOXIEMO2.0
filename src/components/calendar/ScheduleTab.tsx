import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Sparkles, ArrowRight, AlertTriangle, Target } from "lucide-react";
import { startOfWeek, addDays, sameDay, fmtShort, ymd, PLATFORM_LABELS, activeCampaignForDate } from "./helpers";
import { cn } from "@/lib/utils";

type ChannelKey = "linkedin" | "email" | "instagram" | "facebook" | "content";

export default function ScheduleTab({ ctx }: { ctx: any }) {
  const { socialPosts, contentItems, emailSends, socialConnections, subscribers, campaigns, scheduleAnchor, setTab, navigate } = ctx;
  const [view, setView] = useState<"week" | "month">("week");
  const [anchor, setAnchor] = useState<Date>(scheduleAnchor ?? new Date());
  useEffect(() => { if (scheduleAnchor) setAnchor(scheduleAnchor); }, [scheduleAnchor]);

  const [openItem, setOpenItem] = useState<any>(null);
  const [quickCreate, setQuickCreate] = useState<{ date: Date; channel: ChannelKey } | null>(null);

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

  function chipClass(item: any) {
    if (item._kind === "slot") return "bg-accent/10 text-accent border-accent/40 border-dashed";
    if (item.status === "published" || item.status === "sent") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (item.status === "scheduled") return "bg-accent-soft text-accent border-accent/30";
    return "bg-muted text-muted-foreground border-border border-dashed";
  }

  // Sidebar metrics — this week
  const weekEnd = addDays(weekStart, 7);
  const inWeek = (iso: string | null | undefined) => iso && new Date(iso) >= weekStart && new Date(iso) < weekEnd;
  const weekScheduled = socialPosts.filter((p: any) => inWeek(p.scheduled_for ?? p.published_at)).length;
  const weekLI = socialPosts.filter((p: any) => (p.platforms ?? []).includes("linkedin") && inWeek(p.scheduled_for ?? p.published_at)).length;
  const weekIG = socialPosts.filter((p: any) => (p.platforms ?? []).includes("instagram") && inWeek(p.scheduled_for ?? p.published_at)).length;
  const weekEmail = emailSends.filter((e: any) => inWeek(e.scheduled_for ?? e.sent_at)).length;

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
              {/* Campaign banners */}
              {visibleCampaigns.length > 0 && (
                <div className="mb-2 space-y-1">
                  {visibleCampaigns.map((c: any) => {
                    const { startCol, span } = spanForCampaign(c);
                    return (
                      <div
                        key={c.id}
                        className="grid"
                        style={{ gridTemplateColumns: "100px repeat(7, minmax(0, 1fr))", gap: 2 }}
                      >
                        <div />
                        <button
                          type="button"
                          onClick={() => navigate("/app/calendar?tab=campaigns")}
                          style={{ gridColumnStart: startCol + 2, gridColumnEnd: `span ${span}` }}
                          className="h-6 px-2 rounded-md bg-accent text-accent-foreground text-[11px] font-medium flex items-center gap-1.5 truncate hover:bg-accent/90 transition-colors text-left"
                          title={`${c.name} · ${fmtShort(new Date(c.start_date))} – ${fmtShort(new Date(c.end_date))}`}
                        >
                          <Target className="w-3 h-3 shrink-0" />
                          <span className="truncate">{c.name}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid" style={{ gridTemplateColumns: "100px repeat(7, minmax(0, 1fr))", gap: 2 }}>
                <div />
                {weekDays.map(d => (
                  <div key={d.toISOString()} className="text-[11px] text-muted-foreground font-medium px-2 py-1">
                    <div>{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                    <div className="text-foreground">{d.getDate()}</div>
                  </div>
                ))}
                {channels.map(ch => (
                  <FragmentRow
                    key={ch}
                    label={PLATFORM_LABELS[ch]}
                    days={weekDays}
                    cellItems={(d) => itemsForCell(ch, d)}
                    chipClass={chipClass}
                    onItem={setOpenItem}
                    onAdd={(d) => setQuickCreate({ date: d, channel: ch })}
                    campaignForDate={(d) => activeCampaignForDate(campaigns ?? [], d)}
                  />
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-3 shadow-soft border-border">
            <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                <div key={d} className="bg-muted px-2 py-1.5 text-[11px] font-medium text-muted-foreground">{d}</div>
              ))}
              {Array.from({ length: monthCells }, (_, i) => addDays(monthFirstWeek, i)).map((d, i) => {
                const inMonth = d.getMonth() === anchor.getMonth();
                const items = inMonth ? dayItems(d) : [];
                const dotColors = (ch: string) => ch === "linkedin" ? "bg-blue-500" : ch === "instagram" ? "bg-purple-500" : ch === "facebook" ? "bg-blue-700" : ch === "email" ? "bg-accent" : "bg-muted-foreground";
                return (
                  <button
                    key={i}
                    className={cn("bg-card min-h-[72px] p-1.5 text-left", inMonth ? "" : "opacity-40 cursor-default")}
                    onClick={() => inMonth && items.length > 0 && setOpenItem({ _kind: "day", date: d, items })}
                  >
                    <div className="text-[10px] text-muted-foreground mb-1">{d.getDate()}</div>
                    <div className="flex flex-wrap gap-1">
                      {items.slice(0, 8).map((it, idx) => {
                        const ch = it._kind === "email" ? "email" : it._kind === "content" ? "content" : (it.platforms?.[0] ?? "linkedin");
                        return <span key={idx} className={`w-1.5 h-1.5 rounded-full ${dotColors(ch)}`} />;
                      })}
                    </div>
                  </button>
                );
              })}
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

          <div className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Channel balance</div>
          <BalRow label="LinkedIn" val={weekLI} max={cadenceTarget} color="bg-blue-500" />
          <BalRow label="Email" val={weekEmail} max={2} color="bg-accent" />
          <BalRow label="Instagram" val={weekIG} max={3} color="bg-purple-500" />

          <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">MOXIE suggests</div>
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
              <Sparkles className="w-4 h-4" /> Generate with MOXIE
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
                  className="w-full h-full opacity-60 group-hover:opacity-100 text-[10px] text-accent flex flex-col items-center justify-center px-1 truncate"
                  title={`Fill gap — ${camp.name}`}
                >
                  <span className="truncate w-full text-center">Fill gap</span>
                  <span className="truncate w-full text-center text-[9px] opacity-80">{camp.name}</span>
                </button>
              ) : (
                <button onClick={() => onAdd(d)} className="w-full h-full opacity-0 group-hover:opacity-100 text-[11px] text-accent flex items-center justify-center">
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
