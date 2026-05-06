import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Plus, Target, Sparkles, Loader2, Pause, CheckCircle2, MoreHorizontal, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { asArray, fmtShort, ymd, generateCampaignSlots, campaignSlotProgress, campaignSlotCounts } from "./helpers";

const TYPES = [
  { value: "quarterly", label: "Quarterly theme" },
  { value: "launch", label: "Product/offer launch" },
  { value: "event", label: "Event promotion" },
  { value: "visibility", label: "Visibility push" },
  { value: "custom", label: "Custom" },
];

const TEMPLATES = [
  { id: "q-theme", name: "Q2 Theme Campaign", weeks: 12, channels: ["linkedin", "email"], type: "quarterly" },
  { id: "launch", name: "Product Launch", weeks: 6, channels: ["linkedin", "email", "instagram"], type: "launch" },
  { id: "vis", name: "Visibility Push", weeks: 4, channels: ["linkedin", "email"], type: "visibility" },
];

const STATUS_BADGE: Record<string, string> = {
  planned: "bg-muted text-muted-foreground",
  active: "bg-accent-soft text-accent",
  completed: "bg-emerald-50 text-emerald-700",
  paused: "bg-amber-50 text-amber-700",
};

export default function CampaignsTab({ ctx }: { ctx: any }) {
  const { campaigns, strategy, refresh, user, campaignSeed, setCampaignSeed, setTab } = ctx;
  const [openNew, setOpenNew] = useState(false);
  const [openDetail, setOpenDetail] = useState<any>(null);

  // Open new flow if seeded from Plan tab
  useEffect(() => { if (campaignSeed) { setOpenNew(true); } }, [campaignSeed]);

  return (
    <div>
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl">Campaigns</h2>
          <p className="text-sm text-muted-foreground">Organize your marketing by initiative.</p>
        </div>
        <Button onClick={() => { setCampaignSeed(null); setOpenNew(true); }}>
          <Plus className="w-4 h-4" /> New campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card className="p-10 border-dashed border-border text-center max-w-2xl mx-auto">
          <Target className="w-12 h-12 text-accent mx-auto mb-3" />
          <h3 className="font-display text-xl mb-1">No campaigns yet</h3>
          <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
            Campaigns help you organize your marketing around specific goals and themes — launches, quarterly focuses, or any initiative.
          </p>
          <Button onClick={() => setOpenNew(true)}><Plus className="w-4 h-4" /> Create your first campaign</Button>
          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Or start from a template</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {TEMPLATES.map(t => (
                <Button key={t.id} variant="outline" size="sm" onClick={() => { setCampaignSeed({ ...t, name: t.name }); setOpenNew(true); }}>
                  {t.name}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {campaigns.map((c: any) => <CampaignCard key={c.id} c={c} ctx={ctx} onOpen={() => setOpenDetail(c)} />)}
        </div>
      )}

      <NewCampaignFlow
        open={openNew}
        onClose={() => { setOpenNew(false); setCampaignSeed(null); }}
        seed={campaignSeed}
        strategy={strategy}
        user={user}
        onCreated={() => { void refresh(); setOpenNew(false); setCampaignSeed(null); }}
      />

      <Sheet open={!!openDetail} onOpenChange={(o) => !o && setOpenDetail(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {openDetail && <CampaignDetail c={openDetail} ctx={ctx} onChanged={() => { void refresh(); setOpenDetail(null); }} setTab={setTab} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CampaignCard({ c, ctx, onOpen }: any) {
  const counts = campaignSlotCounts(c);
  const { pct, filled, total } = campaignSlotProgress(c);
  const channels = c.channels ?? [];
  const summaryParts: string[] = [];
  if (counts.linkedin) summaryParts.push(`${counts.linkedin} linkedin`);
  if (counts.email) summaryParts.push(`${counts.email} email`);
  if (counts.instagram) summaryParts.push(`${counts.instagram} instagram`);
  if (counts.facebook) summaryParts.push(`${counts.facebook} facebook`);
  const summary = summaryParts.length > 0 ? summaryParts.join(" · ") : "0 posts scheduled";

  return (
    <Card className="p-5 shadow-soft border-border">
      <div className="flex items-start justify-between mb-2">
        <div className="font-display text-lg flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" /> {c.name}
        </div>
        <Badge className={STATUS_BADGE[c.status] ?? "bg-muted"}>{c.status}</Badge>
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        {c.start_date ? fmtShort(new Date(c.start_date)) : "—"} – {c.end_date ? fmtShort(new Date(c.end_date)) : "—"}
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        {pct}% of slots filled {total > 0 && <span>· {filled}/{total}</span>}
      </div>
      <div className="flex gap-1 flex-wrap mb-3">
        {channels.map((ch: string) => <Badge key={ch} variant="outline" className="text-[10px]">{ch}</Badge>)}
      </div>
      <div className="text-xs text-muted-foreground mb-4">{summary}</div>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={onOpen}>Open campaign <ArrowRight className="w-3 h-3" /></Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (c.start_date) ctx.setScheduleAnchor(new Date(c.start_date));
            ctx.setTab("schedule");
          }}
        >
          <CalendarDays className="w-3 h-3" /> View in Planner <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
}

function NewCampaignFlow({ open, onClose, seed, strategy, user, onCreated }: any) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [type, setType] = useState("quarterly");
  const [theme, setTheme] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [goals, setGoals] = useState("");
  const [channels, setChannels] = useState<Record<string, boolean>>({ linkedin: true, email: true, instagram: false, facebook: false });
  const [targets, setTargets] = useState<Record<string, number>>({ linkedin: 5, email: 1, instagram: 0, facebook: 0 });
  const [plan, setPlan] = useState<any[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setName(seed?.name ?? "");
    setType(seed?.campaign_type ?? seed?.type ?? "quarterly");
    setTheme(seed?.theme ?? "");
    setStartDate(seed?.start_date ?? "");
    setEndDate(seed?.end_date ?? "");
    setGoals("");
    if (seed?.channels) {
      const c: Record<string, boolean> = { linkedin: false, email: false, instagram: false, facebook: false };
      seed.channels.forEach((ch: string) => { c[ch] = true; });
      setChannels(c);
    }
    setPlan([]);
  }, [open, seed]);

  const themes = asArray<any>(strategy?.content_themes).map((t: any) => typeof t === "string" ? t : (t?.theme ?? t?.title ?? t?.name)).filter(Boolean);
  const weeks = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (7 * 86400000)));
  }, [startDate, endDate]);

  const selectedChannels = Object.keys(channels).filter(k => channels[k]);

  async function generatePlan() {
    setPlanLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-campaign-plan", {
        body: {
          campaign: { name, theme, goals, channels: selectedChannels, start_date: startDate, end_date: endDate },
          strategy,
        },
      });
      if (error) throw error;
      setPlan((data as any)?.weeks ?? []);
    } catch (e: any) {
      toast.error("Could not generate plan", { description: e.message });
    } finally {
      setPlanLoading(false);
    }
  }

  async function save() {
    if (!user) return;
    setCreating(true);
    try {
      const slots = generateCampaignSlots({
        start_date: startDate || null,
        end_date: endDate || null,
        channels: selectedChannels,
        targets,
      });
      const { error } = await supabase.from("campaigns").insert({
        user_id: user.id,
        name, theme, goals,
        campaign_type: type,
        start_date: startDate || null,
        end_date: endDate || null,
        channels: selectedChannels,
        status: "active",
        content_plan: { weeks: plan, targets, slots },
      });
      if (error) throw error;
      toast.success("Campaign created", { description: `${slots.length} content slots added to your planner.` });
      onCreated();
    } catch (e: any) {
      toast.error("Could not save campaign", { description: e.message });
    } finally {
      setCreating(false);
    }
  }

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New campaign · Step {step} of 5</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <Label>Campaign name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder='e.g. "Q2 Leadership Framework"' />
              </div>
              <div>
                <Label>Campaign type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex justify-end pt-3">
                <Button onClick={() => setStep(2)} disabled={!name}>Next <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <Label>Theme / focus</Label>
                {themes.length > 0 && (
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger><SelectValue placeholder="Pick from your strategy themes" /></SelectTrigger>
                    <SelectContent>{themes.map((t: string) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                )}
                <Input className="mt-2" value={theme} onChange={e => setTheme(e.target.value)} placeholder="Or write a custom theme" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start date</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label>End date</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              {weeks > 0 && <div className="text-xs text-muted-foreground">Duration: {weeks} weeks</div>}
              <div>
                <Label>Campaign goal</Label>
                <Textarea rows={3} value={goals} onChange={e => setGoals(e.target.value)} placeholder='e.g. "Book 10 discovery calls from LinkedIn"' />
              </div>
              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => setStep(3)} disabled={!startDate || !endDate}>Next <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Label>Which channels will this campaign use?</Label>
              {(["linkedin", "email", "instagram", "facebook"] as const).map(ch => (
                <div key={ch} className="flex items-center justify-between border border-border rounded-md p-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={channels[ch]} onCheckedChange={(v) => setChannels({ ...channels, [ch]: !!v })} />
                    <span className="capitalize">{ch}</span>
                  </label>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    Target:
                    <Input type="number" min={0} className="w-16 h-8" value={targets[ch]} onChange={e => setTargets({ ...targets, [ch]: Number(e.target.value) || 0 })} />
                    /week
                  </div>
                </div>
              ))}
              {weeks > 0 && (
                <div className="bg-accent-soft border border-accent/30 rounded-lg p-3 text-xs">
                  Over {weeks} weeks this campaign needs:{" "}
                  {selectedChannels.map(ch => `${weeks * (targets[ch] || 0)} ${ch}`).join(" · ")}
                </div>
              )}
              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => setStep(4)} disabled={selectedChannels.length === 0}>Next <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="flex items-center justify-between">
                <Label>Content scaffold</Label>
                <Button variant="outline" size="sm" onClick={generatePlan} disabled={planLoading}>
                  {planLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {plan.length > 0 ? "Regenerate" : "Generate plan"}
                </Button>
              </div>
              {plan.length === 0 && !planLoading && (
                <div className="text-sm text-muted-foreground border border-dashed border-border rounded-md p-6 text-center">
                  Click "Generate plan" to have MOXIEMO draft a week-by-week topic plan.
                </div>
              )}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {plan.map((w: any, idx: number) => (
                  <div key={idx} className="border border-border rounded-md p-3">
                    <div className="text-xs text-muted-foreground mb-1">Week {w.weekNumber}{w.weekOf ? ` — ${fmtShort(new Date(w.weekOf))}` : ""}</div>
                    {w.theme && <div className="font-medium text-sm mb-2">Theme: {w.theme}</div>}
                    {w.linkedin && <div className="text-xs mb-1"><b>LinkedIn:</b> {w.linkedin}</div>}
                    {w.email && <div className="text-xs mb-1"><b>Email:</b> {w.email}</div>}
                    {w.instagram && <div className="text-xs mb-1"><b>Instagram:</b> {w.instagram}</div>}
                    {w.facebook && <div className="text-xs mb-1"><b>Facebook:</b> {w.facebook}</div>}
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={() => setStep(5)}>Next <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <Card className="p-4 border-border">
                <div className="font-display text-lg mb-3">Campaign ready to launch</div>
                <div className="text-sm space-y-1">
                  <div><b>Name:</b> {name}</div>
                  <div><b>Duration:</b> {startDate} – {endDate} ({weeks} weeks)</div>
                  <div><b>Channels:</b> {selectedChannels.join(", ")}</div>
                  <div><b>Content needed:</b> {selectedChannels.map(ch => `${weeks * (targets[ch] || 0)} ${ch}`).join(" · ")}</div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground space-y-1">
                  <div>✓ Campaign saved to your calendar</div>
                  <div>✓ Week-by-week plan saved</div>
                  <div>✓ Topics appear as ideas in Create tab</div>
                  <div>✗ Content NOT auto-generated yet</div>
                </div>
              </Card>
              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(4)}><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={save} disabled={creating || !name}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save campaign
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CampaignDetail({ c, ctx, onChanged, setTab }: any) {
  const linkedPosts = ctx.socialPosts.filter((p: any) => p.campaign_id === c.id);
  const linkedEmails = ctx.emailSends.filter((e: any) => e.campaign_id === c.id);
  const plan = (c.content_plan?.weeks ?? []) as any[];
  const targets = c.content_plan?.targets ?? {};
  const channels = c.channels ?? [];

  async function setStatus(status: string) {
    const { error } = await supabase.from("campaigns").update({ status }).eq("id", c.id);
    if (error) toast.error(error.message);
    else { toast.success(`Marked as ${status}`); onChanged(); }
  }

  return (
    <div>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">{c.name}</SheetTitle>
      </SheetHeader>
      <div className="text-xs text-muted-foreground mb-3">
        {c.start_date ? fmtShort(new Date(c.start_date)) : "—"} – {c.end_date ? fmtShort(new Date(c.end_date)) : "—"} · {c.status}
      </div>

      <div className="flex gap-2 mb-4">
        {c.status !== "active" && <Button size="sm" onClick={() => setStatus("active")}>Activate</Button>}
        {c.status === "active" && <Button size="sm" variant="outline" onClick={() => setStatus("paused")}><Pause className="w-3 h-3" /> Pause</Button>}
        <Button size="sm" variant="outline" onClick={() => setStatus("completed")}><CheckCircle2 className="w-3 h-3" /> Complete</Button>
      </div>

      <div className="space-y-3 mb-5">
        {channels.map((ch: string) => {
          const target = (targets[ch] || 0) * (plan.length || 0);
          let done = 0;
          if (ch === "email") done = linkedEmails.filter((e: any) => e.status === "sent").length;
          else done = linkedPosts.filter((p: any) => (p.platforms ?? []).includes(ch) && p.status === "published").length;
          const pct = target > 0 ? Math.round((done / target) * 100) : 0;
          return (
            <div key={ch} className="text-xs">
              <div className="flex justify-between mb-1"><span className="capitalize">{ch}</span><span>{done}/{target}</span></div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>

      <div className="font-medium text-sm mb-2">Week-by-week plan</div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {plan.length === 0 && <div className="text-xs text-muted-foreground">No plan saved.</div>}
        {plan.map((w: any, idx: number) => (
          <div key={idx} className="border border-border rounded p-2 text-xs">
            <div className="font-medium mb-1">Week {w.weekNumber} {w.theme ? `· ${w.theme}` : ""}</div>
            {w.linkedin && <div><b>LinkedIn:</b> {w.linkedin}</div>}
            {w.email && <div><b>Email:</b> {w.email}</div>}
            {w.instagram && <div><b>Instagram:</b> {w.instagram}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
