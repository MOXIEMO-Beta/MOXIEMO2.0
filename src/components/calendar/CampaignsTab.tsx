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
import { ArrowLeft, ArrowRight, Plus, Target, Sparkles, Loader2, Pause, CheckCircle2, MoreHorizontal, CalendarDays, Linkedin, Mail, Instagram, Facebook, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { aiErrorMessage } from "@/lib/aiErrors";
import { usePlan } from "@/hooks/usePlan";
import { asArray, fmtShort, ymd, generateCampaignSlots, campaignSlotProgress, campaignSlotCounts, generateExecutionItems } from "./helpers";

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

const COLOR_PALETTE = [
  { name: "Coral", value: "#F97066" },
  { name: "Navy", value: "#1A2744" },
  { name: "Teal", value: "#0D9488" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Violet", value: "#7C3AED" },
  { name: "Sky", value: "#0EA5E9" },
  { name: "Rose", value: "#E11D48" },
  { name: "Sage", value: "#4D7C0F" },
];

type GoalType = "awareness" | "leadgen" | "thought" | "engagement";

const GOAL_KEYWORDS: Record<GoalType, string[]> = {
  leadgen: ["lead", "sale", "revenue", "client", "booking", "call", "conversion", "discovery"],
  thought: ["authority", "expertise", "thought leader", "credibility", "position", "known"],
  engagement: ["engagement", "community", "connection", "conversation", "relationship"],
  awareness: ["awareness", "visibility", "reach", "grow", "audience", "follower", "brand"],
};

const GOAL_LABEL: Record<GoalType, string> = {
  awareness: "awareness",
  leadgen: "lead generation",
  thought: "thought leadership",
  engagement: "engagement",
};

const CADENCE: Record<GoalType, Record<string, number>> = {
  awareness:   { linkedin: 4, email: 1, instagram: 5, facebook: 3 },
  leadgen:     { linkedin: 5, email: 2, instagram: 3, facebook: 2 },
  thought:     { linkedin: 5, email: 1, instagram: 3, facebook: 2 },
  engagement:  { linkedin: 3, email: 1, instagram: 5, facebook: 4 },
};

const RATIONALE: Record<string, Record<GoalType, string>> = {
  linkedin: {
    awareness: "LinkedIn rewards consistency. Daily posting builds compound visibility over the campaign window.",
    leadgen: "Higher frequency on LinkedIn drives more touchpoints with decision-makers in your ICP.",
    thought: "Daily presence on LinkedIn is the single highest-leverage action for positioning.",
    engagement: "3x per week gives your audience time to engage before the next post lands.",
  },
  email: {
    awareness: "One email per week keeps you present without overwhelming your list.",
    leadgen: "2x per week during a campaign creates urgency and nurtures intent.",
    thought: "A weekly email builds the habit of your audience reading you.",
    engagement: "Consistent weekly sends outperform sporadic high-volume sends every time.",
  },
  instagram: {
    awareness: "5x per week maximizes Reels and feed reach during the campaign window.",
    leadgen: "3x per week with strong CTAs keeps the channel focused on conversion.",
    thought: "Mix carousel posts with short-form video to establish expertise on the platform.",
    engagement: "Daily posting signals to the algorithm that your account is active and rewards reach.",
  },
  facebook: {
    awareness: "3x per week is the recommended baseline for organic Facebook reach.",
    leadgen: "Focus on value-led posts that drive clicks rather than high raw frequency.",
    thought: "2x per week with long-form content performs better than frequent short posts.",
    engagement: "4x per week keeps your community active and the algorithm rewarding your posts.",
  },
};

function classifyGoal(text: string): GoalType {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return "awareness";
  for (const type of ["leadgen", "thought", "engagement", "awareness"] as GoalType[]) {
    if (GOAL_KEYWORDS[type].some((k) => t.includes(k))) return type;
  }
  return "awareness";
}

const DEFAULT_CMO_TEXT = "Based on your goal, consistency matters more than volume. Start with your strongest channel and build cadence before expanding.";

const CAMPAIGN_TYPE_CARDS: Array<{
  key: string;
  icon: string;
  label: string;
  description: string;
  typeValue: string;
  keywords: string[];
}> = [
  {
    key: "leadgen",
    icon: "🎯",
    label: "Lead Generation",
    description: "Fill your pipeline with qualified prospects ready to buy.",
    typeValue: "launch",
    keywords: ["revenue", "lead", "client", "sale", "pipeline", "booking", "discovery"],
  },
  {
    key: "audience",
    icon: "📣",
    label: "Audience Awareness",
    description: "Reach new people who need what you do but do not know you yet.",
    typeValue: "visibility",
    keywords: ["awareness", "reach", "audience", "follower", "grow", "visibility"],
  },
  {
    key: "bizdev",
    icon: "💼",
    label: "Business Development",
    description: "Open doors to partnerships, referrals, and strategic relationships.",
    typeValue: "custom",
    keywords: ["partnership", "referral", "relationship", "network", "bizdev"],
  },
  {
    key: "brand",
    icon: "🏷",
    label: "Brand Awareness",
    description: "Make your name the one people think of first in your category.",
    typeValue: "visibility",
    keywords: ["awareness", "reach", "audience", "brand", "recognition"],
  },
  {
    key: "sales",
    icon: "💰",
    label: "Sales Campaign",
    description: "Drive direct revenue from your existing audience and warm leads.",
    typeValue: "launch",
    keywords: ["revenue", "lead", "client", "sale", "promo", "offer"],
  },
];

const REVENUE_KEYWORDS = ["revenue", "lead", "client", "sale", "pipeline", "booking"];
const AWARENESS_KEYWORDS = ["awareness", "reach", "audience", "follower", "visibility"];

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
  const color = c.color || "#F97066";
  const summaryParts: string[] = [];
  if (counts.linkedin) summaryParts.push(`${counts.linkedin} linkedin`);
  if (counts.email) summaryParts.push(`${counts.email} email`);
  if (counts.instagram) summaryParts.push(`${counts.instagram} instagram`);
  if (counts.facebook) summaryParts.push(`${counts.facebook} facebook`);
  const summary = summaryParts.length > 0 ? summaryParts.join(" · ") : "0 posts scheduled";

  return (
    <Card
      className="p-5 shadow-soft border-border border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-display text-lg flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          {c.name}
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
  const [color, setColor] = useState<string>("#F97066");
  const [currentWeekIdx, setCurrentWeekIdx] = useState(0);
  const [goalSuggestions, setGoalSuggestions] = useState<string[]>([]);
  const [prechecked, setPrechecked] = useState<Set<string>>(new Set());
  const [cmoText, setCmoText] = useState<string>("");
  const [cmoLoading, setCmoLoading] = useState(false);
  const [userTopGoal, setUserTopGoal] = useState<string>("");
  const [cadenceApplied, setCadenceApplied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setName(seed?.name ?? "");
    setType(seed?.campaign_type ?? seed?.type ?? "quarterly");
    setTheme(seed?.theme ?? "");
    setStartDate(seed?.start_date ?? "");
    setEndDate(seed?.end_date ?? "");
    setGoals("");
    setColor(seed?.color ?? "#F97066");
    // Pre-check channels from strategy (primary + active)
    const stratChannels = new Set<string>();
    const allChannels = ["linkedin", "email", "instagram", "facebook"];
    const pc = (strategy?.primary_channel || "").toString().toLowerCase();
    allChannels.forEach((ch) => { if (pc.includes(ch)) stratChannels.add(ch); });
    const efChannels = (strategy?.enhanced_foundation as any)?.channels;
    if (Array.isArray(efChannels)) {
      efChannels.forEach((c: any) => {
        const name = (typeof c === "string" ? c : c?.name ?? c?.channel ?? "").toString().toLowerCase();
        allChannels.forEach((ch) => { if (name.includes(ch)) stratChannels.add(ch); });
      });
    }
    if (seed?.channels) seed.channels.forEach((ch: string) => stratChannels.add(ch));
    const next: Record<string, boolean> = { linkedin: false, email: false, instagram: false, facebook: false };
    if (stratChannels.size > 0) {
      stratChannels.forEach((ch) => { next[ch] = true; });
    } else {
      next.linkedin = true; next.email = true;
    }
    setChannels(next);
    setPrechecked(stratChannels);
    setPlan([]);
    setCurrentWeekIdx(0);

    // Fetch goal suggestions silently
    (async () => {
      try {
        const suggestions: string[] = [];
        if (strategy?.business_goal) suggestions.push(String(strategy.business_goal));
        if (strategy?.success_definition) suggestions.push(String(strategy.success_definition));
        let topGoal = strategy?.business_goal ? String(strategy.business_goal) : "";
        if (user?.id) {
          const { data } = await supabase
            .from("goal_entries")
            .select("notes")
            .eq("user_id", user.id)
            .not("notes", "is", null)
            .order("week_of", { ascending: false })
            .limit(5);
          (data ?? []).forEach((r: any) => {
            const n = (r.notes ?? "").toString().trim();
            if (n) suggestions.push(n);
          });
          if (!topGoal && data && data[0]?.notes) topGoal = String(data[0].notes);
        }
        setUserTopGoal(topGoal);
        const unique = Array.from(new Set(suggestions.map((s) => s.trim()).filter(Boolean))).slice(0, 3);
        setGoalSuggestions(unique);
      } catch {
        setGoalSuggestions([]);
      }
    })();
    setCmoText("");
    setCadenceApplied(false);
  }, [open, seed, strategy, user]);

  const themes = asArray<any>(strategy?.content_themes).map((t: any) => typeof t === "string" ? t : (t?.theme ?? t?.title ?? t?.name)).filter(Boolean);
  const pillarSuggestions: string[] = useMemo(() => {
    const raw = asArray<any>(strategy?.content_pillars);
    return raw
      .map((p: any) => (typeof p === "string" ? p : (p?.name ?? p?.title ?? p?.pillar ?? "")))
      .map((s: string) => s?.toString().trim())
      .filter(Boolean)
      .slice(0, 5);
  }, [strategy]);
  const suggestedName = useMemo(() => {
    if (!theme || !goals) return "";
    const d = new Date();
    const mo = d.toLocaleString("en-US", { month: "long" });
    return `${theme} Campaign — ${mo} ${d.getFullYear()}`;
  }, [theme, goals]);
  const weeks = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (7 * 86400000)));
  }, [startDate, endDate]);

  const selectedChannels = Object.keys(channels).filter(k => channels[k]);
  const { checkGenerationLimit, handleGenerationResponse } = usePlan();

  const goalType: GoalType = useMemo(() => classifyGoal(goals), [goals]);

  // Goal text for campaign-type card matching (Step 1)
  const goalMatchText = useMemo(() => {
    return [
      userTopGoal,
      strategy?.business_goal,
      strategy?.success_definition,
      strategy?.positioning_statement,
    ].filter(Boolean).join(" ").toLowerCase();
  }, [userTopGoal, strategy]);

  const highlightedCardKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!goalMatchText) return keys;
    if (REVENUE_KEYWORDS.some((k) => goalMatchText.includes(k))) {
      keys.add("leadgen"); keys.add("sales");
    }
    if (AWARENESS_KEYWORDS.some((k) => goalMatchText.includes(k))) {
      keys.add("audience"); keys.add("brand");
    }
    return keys;
  }, [goalMatchText]);

  function pickCampaignTypeCard(card: typeof CAMPAIGN_TYPE_CARDS[number]) {
    const d = new Date();
    const mo = d.toLocaleString("en-US", { month: "long" });
    setName(`${card.label} Campaign — ${mo} ${d.getFullYear()}`);
    setType(card.typeValue);
  }

  // When Step 3 first renders, prefill cadence and request CMO recommendation.
  useEffect(() => {
    if (step !== 3) return;
    if (!cadenceApplied) {
      const c = CADENCE[goalType];
      setTargets((prev) => ({ ...prev, ...c }));
      setCadenceApplied(true);
    }
    if (cmoText || cmoLoading) return;
    setCmoLoading(true);
    const ac = new AbortController();
    const timer = setTimeout(() => {
      ac.abort();
      setCmoText((t) => t || DEFAULT_CMO_TEXT);
      setCmoLoading(false);
    }, 3000);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("cmo-cadence-recommendation", {
          body: { campaignGoal: goals, campaignTheme: theme, userGoal: userTopGoal },
        });
        clearTimeout(timer);
        if (error || !data?.recommendation) {
          setCmoText((t) => t || DEFAULT_CMO_TEXT);
        } else {
          setCmoText(String(data.recommendation));
        }
      } catch {
        setCmoText((t) => t || DEFAULT_CMO_TEXT);
      } finally {
        setCmoLoading(false);
      }
    })();
    return () => { clearTimeout(timer); ac.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function generatePlan() {
    if (!(await checkGenerationLimit())) return;
    setPlanLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-campaign-plan", {
        body: {
          campaign: { name, theme, goals, channels: selectedChannels, start_date: startDate, end_date: endDate },
          strategy,
        },
      });
      if (handleGenerationResponse(data, error)) return;
      if (error) throw error;
      setPlan((data as any)?.weeks ?? []);
    } catch (e: any) {
      toast.error(aiErrorMessage("generic", e));
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
      const { data: created, error } = await supabase.from("campaigns").insert({
        user_id: user.id,
        name, theme, goals,
        campaign_type: type,
        start_date: startDate || null,
        end_date: endDate || null,
        channels: selectedChannels,
        status: "active",
        color,
        content_plan: { weeks: plan, targets, slots },
      }).select("id").single();
      if (error) throw error;

      // Generate and insert per-day execution items
      const execItems = generateExecutionItems({
        start_date: startDate || null,
        end_date: endDate || null,
        channels: selectedChannels,
        targets,
        plan,
      });
      if (created?.id && execItems.length > 0) {
        const rows = execItems.map((it) => ({
          user_id: user.id,
          campaign_id: created.id,
          ...it,
        }));
        const { error: execErr } = await supabase.from("campaign_execution_items").insert(rows);
        if (execErr) console.warn("Failed to insert execution items", execErr);
      }

      toast.success("Campaign created", {
        description: `${execItems.length} items scheduled across your calendar.`,
      });
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
                <div
                  className={`text-[11px] uppercase tracking-wider mb-2 font-semibold ${
                    highlightedCardKeys.size > 0 ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {highlightedCardKeys.size > 0 ? "Recommended for your goals" : "Choose a campaign type"}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CAMPAIGN_TYPE_CARDS.map((card) => {
                    const highlighted = highlightedCardKeys.has(card.key);
                    return (
                      <button
                        key={card.key}
                        type="button"
                        onClick={() => pickCampaignTypeCard(card)}
                        className={`text-left rounded-lg border p-3 transition-colors hover:bg-muted/40 ${
                          highlighted ? "border-accent" : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg leading-none">{card.icon}</span>
                          <span className="font-semibold text-sm">{card.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground leading-snug">
                          {card.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Campaign name</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={suggestedName || 'e.g. "Q2 Leadership Framework"'}
                />
              </div>
              <div>
                <Label>Campaign type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Campaign color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      title={c.name}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${color === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c.value }}
                      aria-label={c.name}
                    />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">Used on the campaign card and calendar indicators.</div>
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
                {pillarSuggestions.length > 0 && (
                  <div className="mt-1 mb-2">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">From your strategy</div>
                    <div className="flex flex-wrap gap-1.5">
                      {pillarSuggestions.map((p) => {
                        const active = theme === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setTheme(p)}
                            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                              active
                                ? "bg-accent text-accent-foreground border-accent"
                                : "bg-background text-accent border-accent hover:bg-accent/10"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
                {goalSuggestions.length > 0 && (
                  <div className="mt-1 mb-2">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">From your goals</div>
                    <div className="space-y-1.5">
                      {goalSuggestions.map((g, i) => {
                        const active = goals === g;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setGoals(g)}
                            className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                              active
                                ? "border-accent bg-accent-soft"
                                : "border-border bg-muted/40 hover:bg-muted/60"
                            }`}
                            style={{ borderRadius: 8 }}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
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
              <div className="rounded-lg border border-accent/30 bg-accent-soft p-3">
                <div className="text-[11px] uppercase tracking-wider text-accent font-semibold mb-1">
                  Your CMO recommends
                </div>
                <div className="text-sm text-foreground/90 min-h-[1.25rem]">
                  {cmoLoading && !cmoText ? (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
                    </span>
                  ) : (
                    cmoText || DEFAULT_CMO_TEXT
                  )}
                </div>
              </div>
              <Label>Which channels will this campaign use?</Label>
              {(["linkedin", "email", "instagram", "facebook"] as const).map(ch => (
                <div key={ch} className="border border-border rounded-md p-3">
                  <div className="flex items-center justify-between">
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
                  {channels[ch] && (
                    <div className="mt-2 text-[12px] italic text-muted-foreground">
                      {RATIONALE[ch][goalType]}
                    </div>
                  )}
                </div>
              ))}
              {prechecked.size > 0 && (
                <div className="text-xs text-muted-foreground">Pre-selected based on your strategy. Adjust as needed.</div>
              )}
              {weeks > 0 && (
                <div className="bg-accent-soft border border-accent/30 rounded-lg p-3 text-xs">
                  Based on your {GOAL_LABEL[goalType]} goal — over {weeks} weeks this campaign needs:{" "}
                  {selectedChannels.map(ch => `${weeks * (targets[ch] || 0)} ${ch === "linkedin" ? "LinkedIn" : ch}`).join(" · ")}
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
              {planLoading && (
                <PlanLoadingState />
              )}
              {plan.length > 0 && !planLoading && (
                <>
                  <div className="flex items-center justify-between animate-fade-in">
                    <button
                      type="button"
                      onClick={() => setCurrentWeekIdx((i) => Math.max(0, i - 1))}
                      disabled={currentWeekIdx === 0}
                      className="inline-flex items-center gap-1 text-sm text-foreground disabled:text-muted-foreground/50 disabled:cursor-not-allowed hover:text-accent transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <div className="text-sm font-medium">
                      Week {currentWeekIdx + 1} of {plan.length}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentWeekIdx((i) => Math.min(plan.length - 1, i + 1))}
                      disabled={currentWeekIdx >= plan.length - 1}
                      className="inline-flex items-center gap-1 text-sm text-foreground disabled:text-muted-foreground/50 disabled:cursor-not-allowed hover:text-accent transition-colors"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <WeekCard week={plan[currentWeekIdx]} />
                </>
              )}
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

const CHANNEL_META: Record<string, { label: string; Icon: any }> = {
  linkedin: { label: "LinkedIn", Icon: Linkedin },
  email: { label: "Email", Icon: Mail },
  instagram: { label: "Instagram", Icon: Instagram },
  facebook: { label: "Facebook", Icon: Facebook },
};

function formatWeekRange(weekOf?: string): string {
  if (!weekOf) return "";
  const start = new Date(weekOf);
  if (isNaN(start.getTime())) return "";
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${fmtShort(start)} to ${fmtShort(end)}`;
}

const PLAN_LOADING_MESSAGES = [
  "Building your week-by-week content plan...",
  "Mapping your strategy to every channel...",
  "Writing briefs rooted in your positioning...",
  "Connecting your goals to your content calendar...",
  "Almost there — this one is worth the wait.",
];

function PlanLoadingState() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % PLAN_LOADING_MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <div
        className="flex items-center justify-center mt-6"
        style={{ minHeight: 56, maxWidth: 340 }}
      >
        <p
          className="italic text-center transition-opacity duration-400"
          style={{
            fontSize: 16,
            color: "#888",
            opacity: visible ? 1 : 0,
            margin: 0,
          }}
        >
          {PLAN_LOADING_MESSAGES[idx]}
        </p>
      </div>
      <p className="text-center text-muted-foreground" style={{ fontSize: 12, marginTop: 16 }}>
        This usually takes 30-60 seconds. Grab a coffee. ☕
      </p>
    </div>
  );
}

function WeekCard({ week }: { week: any }) {
  if (!week) return null;
  const range = formatWeekRange(week.weekOf);
  const channels = (["linkedin", "email", "instagram", "facebook"] as const).filter((ch) => !!week[ch]);
  return (
    <div className="border border-border rounded-[12px] w-full overflow-hidden bg-background">
      <div className="p-4">
        <div className="text-xs text-muted-foreground mb-2">
          Week {week.weekNumber}{range ? ` — ${range}` : ""}
        </div>
        {week.theme && (
          <div className="border-l-[3px] border-accent pl-3 py-0.5">
            <div className="text-base font-bold leading-snug">Theme: {week.theme}</div>
          </div>
        )}
      </div>
      {channels.length > 0 && (
        <div className="border-t border-border">
          {channels.map((ch, i) => (
            <ChannelRow
              key={ch}
              channel={ch}
              text={String(week[ch] ?? "")}
              tinted={i % 2 === 1}
              divider={i < channels.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChannelRow({ channel, text, tinted, divider }: { channel: string; text: string; tinted: boolean; divider: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CHANNEL_META[channel] ?? { label: channel, Icon: Sparkles };
  const Icon = meta.Icon;
  // Heuristic: assume truncation if >~140 chars (since line-clamp-2)
  const canExpand = text.length > 140;
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 ${tinted ? "bg-[#faf9f7]" : "bg-background"} ${divider ? "border-b border-border" : ""}`}
    >
      <div className="flex items-center gap-1.5 min-w-[110px] pt-0.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-bold">{meta.label}</span>
      </div>
      <div className="flex-1 text-sm text-foreground/90">
        <div className={expanded ? "" : "line-clamp-2"}>{text}</div>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs text-accent hover:underline"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
    </div>
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
