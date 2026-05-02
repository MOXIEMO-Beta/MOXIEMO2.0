import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [strategy, setStrategy] = useState<any>(null);
  const [profile, setProfile] = useState<{ full_name: string | null; business_name: string | null; email: string | null } | null>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    const qpDate = searchParams.get("date");
    if (!qpPlatform && !qpCampaign) return;
    if (qpPlatform && PLATFORMS.some((p) => p.value === qpPlatform)) {
      setPlatform(qpPlatform);
    }
    if (qpCampaign) {
      const dateNote = qpDate ? ` running around ${qpDate}` : "";
      const note = `This content is for the ${qpCampaign} campaign${dateNote}. Generate accordingly.`;
      setTopic((prev) => (prev ? prev : note));
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
            "positioning_statement, ideal_client, pain_point, voice_attributes, anti_positioning, primary_channel, content_pillars",
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
      body: { topic: augmentedTopic, platform: opts.platform, contentType: opts.contentType, strategy },
    });
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
    return ((data as any).body ?? "") as string;
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      toast.error("Add an idea first");
      return;
    }
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
      toast.error("Couldn't generate", { description: e?.message ?? "Try again." });
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate() {
    if (!lockedMeta) return;
    setGenerating(true);
    try {
      const body = await runGeneration({ topic, platform: lockedMeta.platform, contentType: lockedMeta.contentType, pillar: activePillar });
      setGenerated(body);
      setOriginalGenerated(body);
      setRefineText("");
    } catch (e: any) {
      console.error(e);
      toast.error("Couldn't regenerate", { description: e?.message ?? "Try again." });
    } finally {
      setGenerating(false);
    }
  }

  async function handleRefine() {
    const instruction = refineText.trim();
    if (!instruction || !generated.trim() || !lockedMeta) return;
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
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const body = ((data as any).body ?? "") as string;
      if (body) setGenerated(body);
      setRefineText("");
    } catch (e: any) {
      console.error(e);
      toast.error("Couldn't refine", { description: e?.message ?? "Try again." });
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
  const charCount = useMemo(() => htmlToPlain(generated).length, [generated]);
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
        <TabsList className="mb-6">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="queue">
            Queue {queued.length > 0 && <span className="ml-2 text-xs text-muted-foreground">({queued.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts {drafts.length > 0 && <span className="ml-2 text-xs text-muted-foreground">({drafts.length})</span>}
          </TabsTrigger>
        </TabsList>

        {/* GENERATE */}
        <TabsContent value="generate" className="space-y-6">
          <Card className="p-6 border-border shadow-soft space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                What's the idea?
              </label>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                A take from an article you read, something a client said, a hot opinion, a story — bring anything. MOXIE will shape it into content that sounds like you.
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
                <Select value={platform} onValueChange={setPlatform}>
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
                    {CONTENT_TYPES.map((c) => (
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> MOXIE is writing{".".repeat(dotCount)}</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate with MOXIE</>
              )}
            </Button>
          </Card>

          {generated && lockedMeta && (
            <div ref={outputRef} className="space-y-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
              {!strategy && (
                <Card className="p-3 border-dashed border-border bg-accent-soft/20 text-xs text-muted-foreground flex items-center justify-between gap-3">
                  <span>Connect your strategy to make this sound more like you →</span>
                  <Link to="/app/discovery" className="text-accent font-medium hover:underline shrink-0">
                    Complete Discovery
                  </Link>
                </Card>
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
                ) : (
                  <div className="p-4">
                    <Textarea
                      value={generated}
                      onChange={(e) => setGenerated(e.target.value)}
                      rows={14}
                      className="resize-y min-h-[280px] text-sm leading-relaxed border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 bg-transparent"
                    />
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
                    Not quite right? Tell MOXIE what to adjust →
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
