import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { aiErrorMessage } from "@/lib/aiErrors";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Linkedin,
  Facebook,
  Instagram,
  Loader2,
  Sparkles,
  Send,
  Pencil,
  Trash2,
  ArrowRight,
  ArrowUp,
  FileText,
  Mail,
  Twitter,
  Newspaper,
  Copy as CopyIcon,
  Check,
  RotateCcw,
  Video,
  Mic,
  Upload,
  X,
  Wand2,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";
import RichTextEditor from "@/components/email/RichTextEditor";

type ContentItem = {
  id: string;
  user_id: string;
  platform: string | null;
  content_type: string | null;
  topic: string | null;
  body: string | null;
  status: "draft" | "queued" | "scheduled" | "published";
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const PLATFORMS = [
  { value: "LinkedIn Post", icon: Linkedin, limit: 3000 },
  { value: "Instagram Caption", icon: Instagram, limit: 2200 },
  { value: "Facebook Post", icon: Facebook, limit: 63206 },
  { value: "X / Twitter", icon: Twitter, limit: 280 },
  { value: "Newsletter Section", icon: Mail, limit: null },
  { value: "Long-Form Article", icon: Newspaper, limit: null },
  { value: "Standalone Newsletter (full)", icon: Mail, limit: null },
  { value: "Short-Form Video Script", icon: Video, limit: null },
  { value: "Long-Form Video Script", icon: Video, limit: null },
  { value: "Podcast Script", icon: Mic, limit: null },
  { value: "Meta Ads", icon: Megaphone, limit: null },
  { value: "Google Ads", icon: Megaphone, limit: null },
];

const CONTENT_TYPES = [
  "My take / Opinion",
  "Educational",
  "Client story / Case study",
  "Trending topic / News reaction",
  "Behind the scenes",
  "Personal story",
  "Promotional",
];

const SHORT_VIDEO_TYPES = [
  "Direct to Camera",
  "Talking Head with B-Roll Notes",
  "Listicle / Tips Format",
];

const LONG_VIDEO_TYPES = [
  "Educational / How-To",
  "Opinion / My Take",
  "Story-Driven",
  "Interview Style (with suggested questions)",
];

const PODCAST_TYPES = [
  "Full Episode Script",
  "Episode Outline",
  "Interview Questions / Guest Prep",
  "Episode Intro and Outro",
  "Show Notes",
];

const META_ADS_TYPES = [
  "Full Ad Set",
  "Primary Text",
  "Headline Variations",
  "Retargeting Ad",
  "Lead Gen Ad",
];

const GOOGLE_ADS_TYPES = [
  "Search Ad",
  "Responsive Display Ad",
  "YouTube Bumper Script (6 sec)",
  "YouTube Pre-Roll Script (15 sec)",
  "Ad Variations",
];

const SCRIPT_PLATFORMS = new Set(["Short-Form Video Script", "Long-Form Video Script", "Podcast Script"]);
const PODCAST_PLATFORMS = new Set(["Podcast Script"]);
const AD_PLATFORMS = new Set(["Meta Ads", "Google Ads"]);

function contentTypeOptionsFor(platform: string): string[] {
  if (platform === "Short-Form Video Script") return SHORT_VIDEO_TYPES;
  if (platform === "Long-Form Video Script") return LONG_VIDEO_TYPES;
  if (platform === "Podcast Script") return PODCAST_TYPES;
  if (platform === "Meta Ads") return META_ADS_TYPES;
  if (platform === "Google Ads") return GOOGLE_ADS_TYPES;
  return CONTENT_TYPES;
}

const RICH_PLATFORMS = new Set([
  "Newsletter Section",
  "Long-Form Article",
  "Standalone Newsletter (full)",
]);

function platformIcon(platform: string | null) {
  const p = PLATFORMS.find((x) => x.value === platform);
  const Icon = p?.icon ?? FileText;
  return <Icon className="h-5 w-5 text-foreground" />;
}

function platformLimit(platform: string | null): number | null {
  return PLATFORMS.find((p) => p.value === platform)?.limit ?? null;
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 16);
}

function htmlToPlain(s: string): string {
  if (!s) return "";
  if (!/<[a-z][\s\S]*>/i.test(s)) return s;
  const div = document.createElement("div");
  div.innerHTML = s;
  return (div.textContent || div.innerText || "").trim();
}

function firstName(full: string | null | undefined): string {
  if (!full) return "";
  return full.trim().split(/\s+/)[0] || "";
}

export default function Content() {
  const { user } = useAuth();
  const { checkGenerationLimit, incrementUsage, handleGenerationResponse } = usePlan();
  const [searchParams, setSearchParams] = useSearchParams();
  const [strategy, setStrategy] = useState<any>(null);
  const [profile, setProfile] = useState<{ full_name: string | null; business_name: string | null; email: string | null } | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignContext, setCampaignContext] = useState<any | null>(null);
  const [slotContext, setSlotContext] = useState<{ scheduled_date: string | null; pillar: string | null } | null>(null);

  // Generate state
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState(PLATFORMS[0].value);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState("");
  const [originalGenerated, setOriginalGenerated] = useState("");
  const [lockedMeta, setLockedMeta] = useState<{ platform: string; contentType: string } | null>(null);
  const [refineText, setRefineText] = useState("");
  const [refining, setRefining] = useState(false);

  const [copyState, setCopyState] = useState(false);
  const [savedState, setSavedState] = useState(false);
  const [queuedState, setQueuedState] = useState(false);
  const [savingAction, setSavingAction] = useState(false);
  const [dotCount, setDotCount] = useState(1);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);

  // Pre-fill from URL params (e.g. when navigating from a campaign slot)
  useEffect(() => {
    const qpPlatform = searchParams.get("platform");
    const qpCampaign = searchParams.get("campaign");
    const qpCampaignId = searchParams.get("campaignId");
    const qpDate = searchParams.get("date");
    if (!qpPlatform && !qpCampaign && !qpCampaignId) return;
    if (qpPlatform && PLATFORMS.some((p) => p.value === qpPlatform)) {
      setPlatform(qpPlatform);
    }
    if (qpCampaign) {
      const dateNote = qpDate ? ` running around ${qpDate}` : "";
      const note = `This content is for the ${qpCampaign} campaign${dateNote}. Generate accordingly.`;
      setTopic((prev) => (prev ? prev : note));
    }
    setSlotContext({ scheduled_date: qpDate, pillar: null });
    if (qpCampaignId) {
      (async () => {
        const { data } = await supabase
          .from("campaigns")
          .select("id, name, goals, theme, start_date, end_date, channels, content_plan")
          .eq("id", qpCampaignId)
          .maybeSingle();
        if (data) setCampaignContext(data);
      })();
    }
    // Clear params so they don't re-apply on refresh
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!generating) return;
    const i = setInterval(() => setDotCount((c) => (c % 3) + 1), 400);
    return () => clearInterval(i);
  }, [generating]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [stratRes, itemsRes, profileRes] = await Promise.all([
        supabase
          .from("strategies")
          .select(
            "positioning_statement, ideal_client, pain_point, transformation, voice_attributes, anti_positioning, methodology, primary_channel, content_pillars",
          )
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("content_items")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("full_name, business_name, email")
          .eq("id", user.id)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (stratRes.error) console.error(stratRes.error);
      if (itemsRes.error) console.error(itemsRes.error);
      if (profileRes.error) console.error(profileRes.error);
      setStrategy(stratRes.data ?? null);
      setItems((itemsRes.data ?? []) as ContentItem[]);
      setProfile((profileRes.data as any) ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const queued = useMemo(
    () => items.filter((i) => i.status === "queued" || i.status === "scheduled"),
    [items],
  );
  const drafts = useMemo(() => items.filter((i) => i.status === "draft"), [items]);

  const pillars: string[] = useMemo(() => {
    const raw = strategy?.content_pillars;
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw
        .map((p: any) => (typeof p === "string" ? p : p?.name ?? p?.title ?? ""))
        .filter(Boolean)
        .slice(0, 5);
    }
    return [];
  }, [strategy]);

  const fname = firstName(profile?.full_name);
  const greeting = fname
    ? `What would you like to write today, ${fname}?`
    : "What would you like to write today?";

  async function runGeneration(opts: { topic: string; platform: string; contentType: string; pillar: string | null }) {
    const augmentedTopic = opts.pillar
      ? `${opts.topic}\n\n[Angle this through my content pillar: ${opts.pillar}]`
      : opts.topic;
    const { data, error } = await supabase.functions.invoke("generate-content", {
      body: {
        topic: augmentedTopic,
        platform: opts.platform,
        contentType: opts.contentType,
        strategy,
        campaign: campaignContext,
        slot: { scheduled_date: slotContext?.scheduled_date ?? null, pillar: opts.pillar },
      },
    });
    if (handleGenerationResponse(data, error)) {
      throw new Error("limit_reached");
    }
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
    return ((data as any).body ?? "") as string;
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      toast.error("Add an idea first");
      return;
    }
    const missingStrategy =
      !strategy?.positioning_statement ||
      !(Array.isArray(strategy?.voice_attributes) ? strategy.voice_attributes.length : strategy?.voice_attributes);
    if (missingStrategy) {
      toast.error("Complete your Brand Strategy first", {
        description: "MOXIE needs your positioning and voice to generate content that sounds like you.",
      });
      return;
    }
    if (!(await checkGenerationLimit())) return;
    setGenerating(true);
    try {
      const body = await runGeneration({ topic, platform, contentType, pillar: activePillar });
      setGenerated(body);
      setOriginalGenerated(body);
      setLockedMeta({ platform, contentType });
      setRefineText("");
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (e: any) {
      console.error(e);
      if (e?.message !== "limit_reached") {
        toast.error(aiErrorMessage("content", e));
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate() {
    if (!lockedMeta) return;
    if (!(await checkGenerationLimit())) return;
    setGenerating(true);
    try {
      const body = await runGeneration({ topic, platform: lockedMeta.platform, contentType: lockedMeta.contentType, pillar: activePillar });
      setGenerated(body);
      setOriginalGenerated(body);
      setRefineText("");
    } catch (e: any) {
      console.error(e);
      if (e?.message !== "limit_reached") {
        toast.error(aiErrorMessage("content", e));
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleRefine() {
    const instruction = refineText.trim();
    if (!instruction || !generated.trim() || !lockedMeta) return;
    if (!(await checkGenerationLimit())) return;
    setRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          mode: "refine",
          existing: generated,
          instruction,
          platform: lockedMeta.platform,
          contentType: lockedMeta.contentType,
          strategy,
        },
      });
      if (handleGenerationResponse(data, error)) return;
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const body = ((data as any).body ?? "") as string;
      if (body) setGenerated(body);
      setRefineText("");
    } catch (e: any) {
      console.error(e);
      toast.error(aiErrorMessage("content", e));
    } finally {
      setRefining(false);
    }
  }

  async function saveItem(status: "draft" | "queued") {
    if (!user || !generated.trim() || !lockedMeta) return;
    setSavingAction(true);
    try {
      const { data, error } = await supabase
        .from("content_items")
        .insert({
          user_id: user.id,
          platform: lockedMeta.platform,
          content_type: lockedMeta.contentType,
          topic,
          body: generated,
          status,
        })
        .select()
        .single();
      if (error) throw error;
      setItems((prev) => [data as ContentItem, ...prev]);
      if (status === "draft") {
        setSavedState(true);
        setTimeout(() => setSavedState(false), 2000);
      } else {
        setQueuedState(true);
        setTimeout(() => setQueuedState(false), 2000);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Couldn't save", { description: e?.message ?? "Try again." });
    } finally {
      setSavingAction(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(htmlToPlain(generated));
      setCopyState(true);
      setTimeout(() => setCopyState(false), 2000);
    } catch (e) {
      toast.error("Couldn't copy");
    }
  }

  async function patchItem(id: string, patch: Partial<ContentItem>) {
    const prev = items;
    setItems((cur) => cur.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    const { error } = await supabase.from("content_items").update(patch).eq("id", id);
    if (error) {
      console.error(error);
      setItems(prev);
      toast.error("Couldn't update", { description: error.message });
    }
  }

  async function deleteItem(id: string) {
    const prev = items;
    setItems((cur) => cur.filter((it) => it.id !== id));
    const { error } = await supabase.from("content_items").delete().eq("id", id);
    if (error) {
      console.error(error);
      setItems(prev);
      toast.error("Couldn't delete", { description: error.message });
    } else {
      toast.success("Deleted");
    }
    setDeleteId(null);
  }

  const isRich = lockedMeta && RICH_PLATFORMS.has(lockedMeta.platform);
  const isScript = !!lockedMeta && SCRIPT_PLATFORMS.has(lockedMeta.platform);
  const isPodcast = !!lockedMeta && PODCAST_PLATFORMS.has(lockedMeta.platform);
  const isAd = !!lockedMeta && AD_PLATFORMS.has(lockedMeta.platform);
  const charCount = useMemo(() => htmlToPlain(generated).length, [generated]);
  const wordCount = useMemo(() => {
    const t = htmlToPlain(generated).trim();
    return t ? t.split(/\s+/).length : 0;
  }, [generated]);
  const speakingMinutes = Math.max(1, Math.round(wordCount / 140));
  const limit = lockedMeta ? platformLimit(lockedMeta.platform) : null;
  const nearLimit = limit !== null && charCount >= limit * 0.85;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-3 leading-[1.1]">
          {greeting}
        </h1>
        <p className="text-base text-muted-foreground">
          Your strategy is loaded. Just bring the idea.
        </p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="bg-foreground h-auto w-fit mb-6 flex flex-wrap justify-start gap-1 rounded-[12px] p-[6px]">
          <TabsTrigger
            value="generate"
            className="rounded-[8px] px-4 py-2 font-medium text-white/55 bg-transparent transition-colors duration-150 ease-in-out hover:text-white/85 data-[state=active]:bg-white data-[state=active]:text-[#1a1a1a] data-[state=active]:font-semibold data-[state=active]:shadow-none"
          >
            Generate
          </TabsTrigger>
          <TabsTrigger
            value="queue"
            className="rounded-[8px] px-4 py-2 font-medium text-white/55 bg-transparent transition-colors duration-150 ease-in-out hover:text-white/85 data-[state=active]:bg-white data-[state=active]:text-[#1a1a1a] data-[state=active]:font-semibold data-[state=active]:shadow-none"
          >
            Queue {queued.length > 0 && <span className="ml-2 text-xs text-muted-foreground">({queued.length})</span>}
          </TabsTrigger>
          <TabsTrigger
            value="drafts"
            className="rounded-[8px] px-4 py-2 font-medium text-white/55 bg-transparent transition-colors duration-150 ease-in-out hover:text-white/85 data-[state=active]:bg-white data-[state=active]:text-[#1a1a1a] data-[state=active]:font-semibold data-[state=active]:shadow-none"
          >
            Drafts {drafts.length > 0 && <span className="ml-2 text-xs text-muted-foreground">({drafts.length})</span>}
          </TabsTrigger>
          <TabsTrigger
            value="repurpose"
            className="rounded-[8px] px-4 py-2 font-medium text-white/55 bg-transparent transition-colors duration-150 ease-in-out hover:text-white/85 data-[state=active]:bg-white data-[state=active]:text-[#1a1a1a] data-[state=active]:font-semibold data-[state=active]:shadow-none"
          >
            Repurpose
          </TabsTrigger>
        </TabsList>

        {/* GENERATE */}
        <TabsContent value="generate" className="space-y-6">
          {!loading && (!strategy?.positioning_statement || !(Array.isArray(strategy?.voice_attributes) ? strategy.voice_attributes.length : strategy?.voice_attributes)) && (
            <Card className="p-4 border-dashed border-accent/40 bg-accent-soft/30 text-sm flex items-center justify-between gap-3">
              <span className="text-foreground">
                Complete your Brand Strategy first so MOXIE can generate content that actually sounds like you.
              </span>
              <Link to="/app/discovery" className="text-accent font-medium hover:underline shrink-0 inline-flex items-center gap-1">
                Go to Discovery <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          )}
          <Card className="p-6 border-border shadow-soft space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                What's the idea?
              </label>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                A take from an article you read, something a client said, a hot opinion, a story — bring anything. MOXIEMO will shape it into content that sounds like you.
              </p>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. I just read that 80% of small businesses overpay in taxes because their expenses aren't categorized in real time — I want to write about this from my POV..."
                rows={4}
                className="resize-y min-h-[100px]"
              />
            </div>

            {pillars.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Anchor to a content pillar →</div>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
                  {pillars.map((p) => {
                    const active = activePillar === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setActivePillar(active ? null : p)}
                        className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                          active
                            ? "border-accent text-accent bg-accent-soft/40"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Platform</label>
                <Select
                  value={platform}
                  onValueChange={(v) => {
                    setPlatform(v);
                    const opts = contentTypeOptionsFor(v);
                    if (!opts.includes(contentType)) setContentType(opts[0]);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Content type</label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contentTypeOptionsFor(platform).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 rounded-lg"
            >
              {generating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> MOXIEMO is writing{".".repeat(dotCount)}</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate with MOXIEMO</>
              )}
            </Button>
          </Card>

          {generated && lockedMeta && (
            <div ref={outputRef} className="space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
              {(campaignContext?.name || activePillar) && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  <Sparkles className="h-3 w-3 text-accent" />
                  <span className="font-medium text-foreground">Generated for:</span>
                  {campaignContext?.name && <span>{campaignContext.name}</span>}
                  <span>·</span>
                  <span>{lockedMeta.platform}</span>
                  {activePillar && (<><span>·</span><span>{activePillar}</span></>)}
                </div>
              )}

              <Card className="border-border shadow-soft overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full bg-background border border-border">
                      {platformIcon(lockedMeta.platform)}
                      <span className="truncate">{lockedMeta.platform}</span>
                    </span>
                    <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-background border border-border whitespace-nowrap">
                      {lockedMeta.contentType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs tabular-nums ${nearLimit ? "text-accent font-medium" : "text-muted-foreground"}`}>
                      {charCount.toLocaleString()}{limit ? ` / ${limit.toLocaleString()}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={generating}
                      className="text-xs text-accent font-medium hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* Content area */}
                {isRich ? (
                  <div className="bg-white">
                    <RichTextEditor
                      content={generated}
                      onChange={setGenerated}
                    />
                  </div>
                ) : isAd ? (
                  <div className="p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-accent font-medium mb-3">
                      Ad Copy
                    </div>
                    <AdCopyEditor value={generated} onChange={setGenerated} />
                  </div>
                ) : (
                  <div className="p-4">
                    {isScript && (
                      <div className="text-[11px] uppercase tracking-[0.18em] text-accent font-medium mb-2">
                        {isPodcast ? "Podcast Script" : "Video Script"}
                      </div>
                    )}
                    <Textarea
                      value={generated}
                      onChange={(e) => setGenerated(e.target.value)}
                      rows={14}
                      className={`resize-y min-h-[280px] text-sm leading-relaxed border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 bg-transparent ${
                        isScript ? "font-mono whitespace-pre-wrap" : ""
                      }`}
                    />
                    {isScript && (
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        ~{wordCount.toLocaleString()} words · approx. {speakingMinutes} {speakingMinutes === 1 ? "minute" : "minutes"} at speaking pace
                      </div>
                    )}
                    {limit !== null && charCount >= limit && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <div className="flex-1 h-px bg-border" />
                        <span>{lockedMeta.platform.split(" ")[0]} limit · {limit.toLocaleString()}</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}
                  </div>
                )}

                {/* Action row */}
                <div className="flex flex-col sm:flex-row gap-2 px-4 py-3 border-t border-border">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCopy}
                    disabled={!generated.trim()}
                  >
                    {copyState ? <><Check className="mr-2 h-4 w-4" /> Copied!</> : <><CopyIcon className="mr-2 h-4 w-4" /> Copy</>}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => saveItem("draft")}
                    disabled={savingAction || !generated.trim()}
                  >
                    {savedState ? <><Check className="mr-2 h-4 w-4" /> Saved to Drafts</> : "Save to Drafts"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => saveItem("queued")}
                    disabled={savingAction || !generated.trim()}
                  >
                    {queuedState ? <><Check className="mr-2 h-4 w-4" /> Added to Queue</> : "Add to Queue"}
                  </Button>
                </div>

                {/* Refine row */}
                <div className="px-4 py-3 border-t border-border bg-muted/20">
                  <div className="text-[11px] text-muted-foreground mb-1.5">
                    Not quite right? Tell MOXIEMO what to adjust →
                  </div>
                  <div className="relative">
                    <Input
                      value={refineText}
                      onChange={(e) => setRefineText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleRefine();
                        }
                      }}
                      disabled={refining}
                      placeholder="e.g. make it shorter, add a question at the end, make the hook punchier..."
                      className="h-9 pr-10 text-sm bg-background border-border"
                    />
                    <button
                      type="button"
                      onClick={handleRefine}
                      disabled={refining || !refineText.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md text-accent hover:bg-accent-soft/40 disabled:opacity-40"
                      aria-label="Send refinement"
                    >
                      {refining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* QUEUE */}
        <TabsContent value="queue" className="space-y-3">
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : queued.length === 0 ? (
            <EmptyState message="No posts in your queue yet. Generate one to get started." />
          ) : (
            queued.map((it) => (
              <Card key={it.id} className="p-5 border-border shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {platformIcon(it.platform)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-muted">{it.platform ?? "—"}</span>
                      {it.content_type && <><span>•</span><span>{it.content_type}</span></>}
                    </div>
                    <div className="text-sm text-foreground line-clamp-2 mb-3">
                      {htmlToPlain(it.body ?? "").slice(0, 80)}{(htmlToPlain(it.body ?? "")).length > 80 ? "…" : ""}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Input
                        type="datetime-local"
                        value={toLocalInputValue(it.scheduled_for)}
                        onChange={(e) =>
                          patchItem(it.id, {
                            scheduled_for: e.target.value ? new Date(e.target.value).toISOString() : null,
                            status: e.target.value ? "scheduled" : "queued",
                          })
                        }
                        className="h-9 w-56"
                      />
                      <StatusBadge status={it.status} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          patchItem(it.id, {
                            status: "published",
                            published_at: new Date().toISOString(),
                          });
                          toast.success("Marked as published", {
                            description: "Direct publishing isn't connected yet.",
                          });
                        }}
                      >
                        <Send className="mr-2 h-3.5 w-3.5" /> Publish now
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* DRAFTS */}
        <TabsContent value="drafts" className="space-y-3">
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : drafts.length === 0 ? (
            <EmptyState message="No drafts yet. Saved drafts will appear here." />
          ) : (
            drafts.map((it) => (
              <Card key={it.id} className="p-5 border-border shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {platformIcon(it.platform)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-muted">{it.platform ?? "—"}</span>
                      {it.content_type && <><span>•</span><span>{it.content_type}</span></>}
                    </div>
                    <div className="text-sm text-foreground line-clamp-2 mb-3">
                      {htmlToPlain(it.body ?? "").slice(0, 80)}{(htmlToPlain(it.body ?? "")).length > 80 ? "…" : ""}
                    </div>
                    <DraftEditor item={it} onPatch={patchItem} />
                    <div className="flex items-center gap-2 flex-wrap mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => patchItem(it.id, { status: "queued" })}
                      >
                        <ArrowRight className="mr-2 h-3.5 w-3.5" /> Move to Queue
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(it.id)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* REPURPOSE */}
        <TabsContent value="repurpose" className="space-y-6">
          <RepurposeTab
            userId={user?.id ?? null}
            strategy={strategy}
            onSavedToDrafts={(item) => setItems((prev) => [item, ...prev])}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteItem(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: ContentItem["status"] }) {
  const map: Record<ContentItem["status"], { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-muted text-foreground" },
    queued: { label: "Queued", cls: "bg-muted text-foreground" },
    scheduled: { label: "Scheduled", cls: "bg-accent-soft text-accent" },
    published: { label: "Published", cls: "bg-accent text-accent-foreground" },
  };
  const v = map[status];
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${v.cls}`}>{v.label}</span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="p-10 border-dashed border-border bg-background text-center text-sm text-muted-foreground">
      {message}
    </Card>
  );
}

type AdBlock =
  | { kind: "field"; label: string; limit: number | null; value: string }
  | { kind: "header"; text: string }
  | { kind: "text"; text: string };

const AD_FIELD_RE = /^([A-Z][A-Z0-9 \/\-]*?)(?:\s*\(([^)]+)\))?:\s*(.*)$/;

function parseAdCopy(src: string): AdBlock[] {
  const lines = (src ?? "").split(/\r?\n/);
  const blocks: AdBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();
    if (!line.trim()) {
      i++;
      continue;
    }
    const m = line.match(AD_FIELD_RE);
    if (m) {
      const label = m[1].trim();
      const paren = m[2]?.trim() ?? "";
      const inline = (m[3] ?? "").trim();
      const limitMatch = paren.match(/(\d+)\s*(chars?|words?)/i);
      const limit = limitMatch ? parseInt(limitMatch[1], 10) : null;
      // Header detection: no value on this line AND no parenthetical limit
      if (!inline && !limit) {
        blocks.push({ kind: "header", text: label });
        i++;
        continue;
      }
      // Collect continuation lines until blank line or next label
      const parts: string[] = inline ? [inline] : [];
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        if (!next.trim()) break;
        if (AD_FIELD_RE.test(next.trim())) break;
        parts.push(next.trim());
        j++;
      }
      blocks.push({ kind: "field", label, limit, value: parts.join(" ") });
      i = j;
      continue;
    }
    blocks.push({ kind: "text", text: line });
    i++;
  }
  return blocks;
}

function serializeAdCopy(blocks: AdBlock[]): string {
  const out: string[] = [];
  blocks.forEach((b, idx) => {
    const prev = blocks[idx - 1];
    if (idx > 0 && (b.kind !== "text" || prev?.kind !== "text")) out.push("");
    if (b.kind === "field") {
      const lim = b.limit ? ` (${b.limit} chars max)` : "";
      out.push(`${b.label}${lim}: ${b.value}`);
    } else if (b.kind === "header") {
      out.push(`${b.text}:`);
    } else {
      out.push(b.text);
    }
  });
  return out.join("\n");
}

function AdCopyEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const blocks = useMemo(() => parseAdCopy(value), [value]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const hasFields = blocks.some((b) => b.kind === "field");

  if (!hasFields) {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        className="resize-y min-h-[280px] text-sm leading-relaxed border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 bg-transparent font-mono whitespace-pre-wrap"
      />
    );
  }

  function updateField(idx: number, newVal: string) {
    const next = blocks.map((b, i) =>
      i === idx && b.kind === "field" ? { ...b, value: newVal } : b,
    );
    onChange(serializeAdCopy(next));
  }

  async function copyField(idx: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  }

  return (
    <div className="space-y-4">
      {blocks.map((b, idx) => {
        if (b.kind === "header") {
          return (
            <div
              key={idx}
              className="pt-2 text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              {b.text}
            </div>
          );
        }
        if (b.kind === "text") {
          return (
            <p key={idx} className="text-xs text-muted-foreground">
              {b.text}
            </p>
          );
        }
        const len = b.value.length;
        const over = b.limit != null && len > b.limit;
        return (
          <div key={idx} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                {b.label}
              </label>
              <button
                type="button"
                onClick={() => copyField(idx, b.value)}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                aria-label={`Copy ${b.label}`}
              >
                {copiedIdx === idx ? (
                  <>
                    <Check className="h-3 w-3" /> Copied
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-3 w-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <Textarea
              value={b.value}
              onChange={(e) => updateField(idx, e.target.value)}
              rows={b.limit && b.limit > 60 ? 3 : 1}
              className="resize-y text-sm leading-relaxed min-h-[36px] py-2"
            />
            {b.limit != null && (
              <div
                className={`text-[11px] tabular-nums ${
                  over ? "text-accent font-medium" : "text-muted-foreground"
                }`}
              >
                {len} / {b.limit} characters{over ? " — over limit" : ""}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DraftEditor({
  item,
  onPatch,
}: {
  item: ContentItem;
  onPatch: (id: string, patch: Partial<ContentItem>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(item.body ?? "");
  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
      </Button>
    );
  }
  return (
    <div className="space-y-2">
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => {
            onPatch(item.id, { body });
            setOpen(false);
          }}
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setBody(item.body ?? "");
            setOpen(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

const REPURPOSE_PIECES = [
  "LinkedIn Post (from a key insight)",
  "LinkedIn Post (from a quotable moment)",
  "Instagram Caption",
  "Short-Form Video Script (from a key story)",
  "Email Section",
  "Newsletter Introduction",
  "Show Notes",
  "Twitter / X Thread",
] as const;

const DEFAULT_REPURPOSE_SELECTION = new Set<string>([
  "LinkedIn Post (from a key insight)",
  "Email Section",
]);

const REPURPOSE_TO_PLATFORM: Record<string, string> = {
  "LinkedIn Post (from a key insight)": "LinkedIn Post",
  "LinkedIn Post (from a quotable moment)": "LinkedIn Post",
  "Instagram Caption": "Instagram Caption",
  "Short-Form Video Script (from a key story)": "Short-Form Video Script",
  "Email Section": "Newsletter Section",
  "Newsletter Introduction": "Newsletter Section",
  "Show Notes": "Podcast Script",
  "Twitter / X Thread": "X / Twitter",
};

const REPURPOSE_MAX_BYTES = 10 * 1024 * 1024;

async function extractTranscriptText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || file.type === "text/plain") {
    return await file.text();
  }
  if (name.endsWith(".docx") || file.type.includes("word")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const buf = await file.arrayBuffer();
    const res = await (mammoth as any).extractRawText({ arrayBuffer: buf });
    return res.value || "";
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfjs: any = await import("pdfjs-dist");
    try {
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    } catch {
      /* ignore */
    }
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    let out = "";
    const limit = Math.min(doc.numPages, 80);
    for (let i = 1; i <= limit; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map((it: any) => it.str).join(" ") + "\n\n";
      if (out.length > 120000) break;
    }
    return out;
  }
  throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
}

function RepurposeTab({
  userId,
  strategy,
  onSavedToDrafts,
}: {
  userId: string | null;
  strategy: any;
  onSavedToDrafts: (item: ContentItem) => void;
}) {
  const { checkGenerationLimit, handleGenerationResponse } = usePlan();
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_REPURPOSE_SELECTION));
  const [generating, setGenerating] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [results, setResults] = useState<{ type: string; body: string }[]>([]);
  const [copyIdx, setCopyIdx] = useState<number | null>(null);
  const [savedIdx, setSavedIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allSelected = selected.size === REPURPOSE_PIECES.length;

  function toggleSelect(label: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(REPURPOSE_PIECES));
  }

  async function pickFile(f: File | null) {
    if (!f) return;
    if (f.size > REPURPOSE_MAX_BYTES) {
      toast.error("File too large — max 10MB.");
      return;
    }
    setFile(f);
    setExtracting(true);
    try {
      const text = await extractTranscriptText(f);
      if (!text || text.trim().length < 100) {
        throw new Error("Couldn't read enough text from that file.");
      }
      setTranscript(text);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Couldn't read that file.");
      setFile(null);
      setTranscript("");
    } finally {
      setExtracting(false);
    }
  }

  async function handleGenerate() {
    if (!transcript.trim()) {
      toast.error("Upload a transcript first.");
      return;
    }
    if (selected.size === 0) {
      toast.error("Select at least one piece to generate.");
      return;
    }
    const missingStrategy =
      !strategy?.positioning_statement ||
      !(Array.isArray(strategy?.voice_attributes) ? strategy.voice_attributes.length : strategy?.voice_attributes);
    if (missingStrategy) {
      toast.error("Complete your Brand Strategy first", {
        description: "MOXIE needs your positioning and voice to repurpose content that sounds like you.",
      });
      return;
    }
    if (!(await checkGenerationLimit())) return;
    setGenerating(true);
    setResults([]);
    setStage("Reading your transcript and finding the best moments...");
    try {
      // brief delay so users see the first stage message
      setTimeout(() => setStage(`Generating ${selected.size} piece${selected.size === 1 ? "" : "s"} of content...`), 1200);
      const { data, error } = await supabase.functions.invoke("repurpose-content", {
        body: {
          transcript,
          sourceName: file?.name ?? "transcript",
          pieces: Array.from(selected),
          strategy,
        },
      });
      if (handleGenerationResponse(data, error)) return;
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const pieces = ((data as any).pieces ?? []) as { type: string; body: string }[];
      if (!pieces.length) throw new Error("No content returned.");
      setResults(pieces);
    } catch (e: any) {
      console.error(e);
      toast.error(aiErrorMessage("content", e));
    } finally {
      setGenerating(false);
      setStage("");
    }
  }

  async function handleCopy(idx: number, body: string) {
    try {
      await navigator.clipboard.writeText(body);
      setCopyIdx(idx);
      setTimeout(() => setCopyIdx((c) => (c === idx ? null : c)), 2000);
    } catch {
      toast.error("Couldn't copy");
    }
  }

  async function handleSaveToDrafts(idx: number, piece: { type: string; body: string }) {
    if (!userId) return;
    const platform = REPURPOSE_TO_PLATFORM[piece.type] ?? "LinkedIn Post";
    const { data, error } = await supabase
      .from("content_items")
      .insert({
        user_id: userId,
        platform,
        content_type: piece.type,
        topic: `Repurposed from ${file?.name ?? "transcript"}`,
        body: piece.body,
        status: "draft",
      })
      .select()
      .single();
    if (error) {
      toast.error("Couldn't save", { description: error.message });
      return;
    }
    onSavedToDrafts(data as ContentItem);
    setSavedIdx(idx);
    setTimeout(() => setSavedIdx((c) => (c === idx ? null : c)), 2000);
  }

  function handleEditBody(idx: number, body: string) {
    setResults((prev) => prev.map((p, i) => (i === idx ? { ...p, body } : p)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl md:text-3xl tracking-tight mb-2 leading-tight">
          Turn one piece of content into many.
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Upload a podcast transcript, webinar recording, or long-form article. MOXIEMO extracts the best moments and turns them into content across every platform.
        </p>
      </div>

      {/* Step 1 — Upload */}
      <Card className="p-6 border-border shadow-soft space-y-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-accent mb-1">Step 1</div>
          <label className="text-sm font-medium text-foreground block">Upload your transcript</label>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files?.[0] ?? null);
          }}
          onClick={() => !file && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          className={`cursor-pointer rounded-xl px-6 py-8 text-center transition-colors ${
            dragOver ? "border-accent bg-accent-soft/30" : "border-border bg-muted/20 hover:bg-muted/40"
          } border-2 border-dashed`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              {extracting ? (
                <Loader2 className="h-5 w-5 text-accent animate-spin" />
              ) : (
                <FileText className="h-5 w-5 text-accent" />
              )}
              <span className="text-sm font-medium text-foreground">{file.name}</span>
              {!extracting && transcript && (
                <span className="text-xs text-muted-foreground">
                  · {transcript.length.toLocaleString()} chars
                </span>
              )}
              {!extracting && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setTranscript(""); }}
                  className="ml-1 rounded-full p-1 hover:bg-black/5"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-7 w-7 text-accent" />
              <p className="mt-3 text-sm font-medium text-foreground">
                Drop your transcript here
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              >
                Browse files
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                PDF, TXT, or DOCX — max 10MB
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Step 2 — Select */}
      <Card className="p-6 border-border shadow-soft space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-accent mb-1">Step 2</div>
            <label className="text-sm font-medium text-foreground block">Select what to generate</label>
          </div>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-accent font-medium hover:underline shrink-0"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {REPURPOSE_PIECES.map((label) => {
            const checked = selected.has(label);
            return (
              <label
                key={label}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                  checked
                    ? "border-accent bg-accent-soft/30 text-foreground"
                    : "border-border bg-background text-foreground hover:border-foreground/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSelect(label)}
                  className="h-4 w-4 accent-accent shrink-0"
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Step 3 — Generate */}
      <div className="space-y-3">
        <Button
          onClick={handleGenerate}
          disabled={generating || extracting || !transcript || selected.size === 0}
          className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 rounded-lg w-full sm:w-auto"
        >
          {generating ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Repurposing...</>
          ) : (
            <><Wand2 className="mr-2 h-4 w-4" /> Repurpose with MOXIEMO</>
          )}
        </Button>
        {generating && stage && (
          <div className="text-sm text-muted-foreground italic">{stage}</div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-accent" />
            <span className="font-medium text-foreground">{results.length}</span> piece{results.length === 1 ? "" : "s"} generated from {file?.name ?? "your transcript"}
          </div>
          {results.map((piece, idx) => (
            <Card key={idx} className="border-border shadow-soft overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
                <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-background border border-border">
                  {piece.type}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {piece.body.length.toLocaleString()} chars
                </span>
              </div>
              <div className="p-4">
                {editingIdx === idx ? (
                  <Textarea
                    value={piece.body}
                    onChange={(e) => handleEditBody(idx, e.target.value)}
                    rows={10}
                    className="resize-y min-h-[200px] text-sm leading-relaxed"
                  />
                ) : (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {piece.body}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 px-4 py-3 border-t border-border">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleCopy(idx, piece.body)}
                >
                  {copyIdx === idx ? <><Check className="mr-2 h-4 w-4" /> Copied!</> : <><CopyIcon className="mr-2 h-4 w-4" /> Copy</>}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleSaveToDrafts(idx, piece)}
                >
                  {savedIdx === idx ? <><Check className="mr-2 h-4 w-4" /> Saved to Drafts</> : "Save to Drafts"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                >
                  <Pencil className="mr-2 h-4 w-4" /> {editingIdx === idx ? "Done" : "Edit"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
