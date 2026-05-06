import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  Pin,
  Pencil,
  Dices,
  Mail,
  Check,
  ChevronDown,
  Linkedin,
  Facebook,
  Instagram,
  Image as ImageIcon,
  Palette,
  X,
  Calendar as CalendarIcon,
  Send,
  Save,
  ListPlus,
  Hash,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Heart,
  Share2,
  Wand2,
  ArrowRight,
  History,
  Bot,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Strategy = {
  positioning_statement?: string | null;
  ideal_client?: string | null;
  pain_point?: string | null;
  voice_attributes?: unknown;
  anti_positioning?: string | null;
  content_pillars?: unknown;
};

type Profile = {
  full_name: string | null;
  business_name: string | null;
};

type RecentEmail = { id: string; subject: string | null; sent_at: string | null };

type Platform = "linkedin" | "facebook" | "instagram";
const ALL_PLATFORMS: Platform[] = ["linkedin", "facebook", "instagram"];
const PLATFORM_LIMIT: Record<Platform, number> = {
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
};
const PLATFORM_LABEL: Record<Platform, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
};

const FORMATS = ["Text post", "List / Tips", "Poll", "Question", "Story idea"];
const TONES = [
  { value: "default", label: "Use my strategy voice (recommended)" },
  { value: "casual", label: "More casual" },
  { value: "direct", label: "More direct" },
  { value: "educational", label: "More educational" },
  { value: "storytelling", label: "More storytelling" },
];

type FocusMode = "pillar" | "custom" | "surprise" | "email" | null;

function asArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object") {
        const o = x as Record<string, unknown>;
        return (o.name as string) || (o.title as string) || (o.label as string) || "";
      }
      return "";
    })
    .filter(Boolean);
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function initials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CreateTab({
  userId,
  prefillTopic,
  isLinkedInConnected,
}: {
  userId: string | null;
  prefillTopic?: string;
  isLinkedInConnected: boolean;
}) {
  /* ---------------- state ---------------- */
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);

  // Step 1 - focus
  const [focusMode, setFocusMode] = useState<FocusMode>(null);
  const [selectedPillar, setSelectedPillar] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [surprisePick, setSurprisePick] = useState<string>("");
  const [emailPick, setEmailPick] = useState<string>(""); // email id

  // Step 2 - platforms
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  // Step 3 - format
  const [postFormat, setPostFormat] = useState<string>("");

  // Step 4 - tone
  const [toneOpen, setToneOpen] = useState(false);
  const [tone, setTone] = useState<string>("default");

  // Generation
  const [generating, setGenerating] = useState(false);

  // Composer content per platform
  const [content, setContent] = useState<Record<Platform, string>>({
    linkedin: "",
    facebook: "",
    instagram: "",
  });
  const [hashtags, setHashtags] = useState<Record<Platform, string[]>>({
    linkedin: [],
    facebook: [],
    instagram: [],
  });
  const [hashtagsLoading, setHashtagsLoading] = useState<Platform | null>(null);
  const [activeComposerTab, setActiveComposerTab] = useState<Platform>("linkedin");

  // AI editing — selection toolbar, instruction input, version history
  const textareaRefs = useRef<Record<Platform, HTMLTextAreaElement | null>>({
    linkedin: null,
    facebook: null,
    instagram: null,
  });
  const [selToolbar, setSelToolbar] = useState<{
    platform: Platform;
    top: number;
    left: number;
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [aiEditing, setAiEditing] = useState<string | null>(null); // action key while loading
  const [instructionInput, setInstructionInput] = useState<Record<Platform, string>>({
    linkedin: "",
    facebook: "",
    instagram: "",
  });
  const [postHistory, setPostHistory] = useState<Record<Platform, string[]>>({
    linkedin: [],
    facebook: [],
    instagram: [],
  });

  // ---------- Discoverability cues ----------
  const [showTipBanner, setShowTipBanner] = useState(false);
  const [tipDismissed, setTipDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("moxie_tip_seen") === "true";
  });
  const [hasEdited, setHasEdited] = useState<Record<Platform, boolean>>({
    linkedin: false,
    facebook: false,
    instagram: false,
  });
  const [focusHint, setFocusHint] = useState<Record<Platform, boolean>>({
    linkedin: false,
    facebook: false,
    instagram: false,
  });
  const [textareaFlash, setTextareaFlash] = useState<Record<Platform, boolean>>({
    linkedin: false,
    facebook: false,
    instagram: false,
  });
  const [historyPulse, setHistoryPulse] = useState<Record<Platform, boolean>>({
    linkedin: false,
    facebook: false,
    instagram: false,
  });
  const [suggestionsOpenFor, setSuggestionsOpenFor] = useState<Platform | null>(null);
  const instructionRowRefs = useRef<Record<Platform, HTMLDivElement | null>>({
    linkedin: null,
    facebook: null,
    instagram: null,
  });
  const instructionInputRefs = useRef<Record<Platform, HTMLInputElement | null>>({
    linkedin: null,
    facebook: null,
    instagram: null,
  });

  const ASK_MOXIE_SUGGESTIONS = [
    "Make the hook more direct",
    "Add a client success example",
    "Change the ending question to focus on revenue",
    "Make this sound less formal",
    "Shorten the second paragraph",
    "Add a statistic or data point",
    "Make the opening line more provocative",
    "Add a specific call to action",
  ];

  // Dismiss suggestions on outside click or Escape
  useEffect(() => {
    if (!suggestionsOpenFor) return;
    function handleClick(e: MouseEvent) {
      const row = instructionRowRefs.current[suggestionsOpenFor!];
      if (row && !row.contains(e.target as Node)) {
        setSuggestionsOpenFor(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSuggestionsOpenFor(null);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [suggestionsOpenFor]);

  // Auto-dismiss tip banner after 8s
  useEffect(() => {
    if (!showTipBanner) return;
    const id = setTimeout(() => {
      setShowTipBanner(false);
      setTipDismissed(true);
      sessionStorage.setItem("moxie_tip_seen", "true");
    }, 8000);
    return () => clearTimeout(id);
  }, [showTipBanner]);

  function dismissTipBanner() {
    setShowTipBanner(false);
    setTipDismissed(true);
    sessionStorage.setItem("moxie_tip_seen", "true");
    triggerFirstSentenceHighlight();
  }

  function triggerFirstSentenceHighlight() {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("moxie_first_highlight_seen") === "true") return;
    sessionStorage.setItem("moxie_first_highlight_seen", "true");
    setTimeout(() => {
      const p = activeComposerTab;
      setTextareaFlash((prev) => ({ ...prev, [p]: true }));
      setTimeout(() => {
        setTextareaFlash((prev) => ({ ...prev, [p]: false }));
      }, 2000);
    }, 3000);
  }

  function pushHistory(p: Platform, prevValue: string) {
    if (prevValue === undefined || prevValue === null) return;
    setPostHistory((prev) => {
      const list = prev[p] ?? [];
      // skip if identical to most recent
      if (list[list.length - 1] === prevValue) return prev;
      const next = [...list, prevValue];
      while (next.length > 5) next.shift();
      return { ...prev, [p]: next };
    });
  }

  function restoreVersion(p: Platform, index: number) {
    const list = postHistory[p] ?? [];
    const v = list[index];
    if (v === undefined) return;
    pushHistory(p, content[p]);
    setContent((prev) => ({ ...prev, [p]: v }));
    toast.success("Version restored");
  }

  function handleTextareaSelection(p: Platform) {
    const el = textareaRefs.current[p];
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const sel = el.value.slice(start, end).trim();
    if (!sel) {
      setSelToolbar(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    // approximate position: top of textarea + small offset, centered horizontally on cursor
    const top = rect.top + window.scrollY - 44;
    const left = rect.left + window.scrollX + Math.min(rect.width - 280, Math.max(0, rect.width / 2 - 140));
    setSelToolbar({ platform: p, top, left, start, end, text: el.value.slice(start, end) });
  }

  // dismiss toolbar on outside click / escape
  useEffect(() => {
    if (!selToolbar) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelToolbar(null);
    }
    function onDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-ai-toolbar]")) return;
      if (target.tagName === "TEXTAREA") return;
      setSelToolbar(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [selToolbar]);

  function showUndoToast(p: Platform, previousValue: string) {
    toast.success("✓ Applied — review the changes before publishing", {
      action: {
        label: "Undo",
        onClick: () => {
          setContent((prev) => ({ ...prev, [p]: previousValue }));
        },
      },
    });
  }

  async function applyAiEdit(opts: {
    platform: Platform;
    action: "improve" | "shorter" | "longer" | "punchier" | "rewrite" | "instruction";
    selectedText: string;
    fullPost: string;
    instruction?: string;
    replaceRange?: { start: number; end: number } | null;
  }) {
    const { platform, action, selectedText, fullPost, instruction, replaceRange } = opts;
    setAiEditing(action);
    try {
      const { data, error } = await supabase.functions.invoke("edit-social-post", {
        body: {
          action,
          selectedText,
          fullPost,
          platform,
          strategy: strategy ?? {},
          instruction,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const newText: string = String(data?.text ?? "").trim();
      if (!newText) throw new Error("Empty response");

      const previous = content[platform];
      pushHistory(platform, previous);

      if (replaceRange) {
        const next =
          fullPost.slice(0, replaceRange.start) + newText + fullPost.slice(replaceRange.end);
        setContent((prev) => ({ ...prev, [platform]: next }));
        toast.success("✓ Updated", {
          action: { label: "Undo", onClick: () => setContent((prev) => ({ ...prev, [platform]: previous })) },
        });
      } else {
        setContent((prev) => ({ ...prev, [platform]: newText }));
        showUndoToast(platform, previous);
      }
      setSelToolbar(null);
      // History pulse — signals new saved version
      setHistoryPulse((prev) => ({ ...prev, [platform]: true }));
      if (action === "instruction") {
        setInstructionInput((prev) => ({ ...prev, [platform]: "" }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Edit failed", { description: (err as Error).message });
    } finally {
      setAiEditing(null);
    }
  }

  // Media
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvaInputRef = useRef<HTMLInputElement | null>(null);
  const [canvaOpen, setCanvaOpen] = useState(false);
  const [canvaLink, setCanvaLink] = useState("");

  // Schedule
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("09:00");

  // Save / publish state
  const [saving, setSaving] = useState<string | null>(null);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  /* ---------------- load ---------------- */
  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const [stratRes, profRes, emailRes] = await Promise.all([
        supabase
          .from("strategies")
          .select("positioning_statement, ideal_client, pain_point, voice_attributes, anti_positioning, content_pillars")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.from("profiles").select("full_name, business_name").eq("id", userId).maybeSingle(),
        supabase
          .from("email_sends")
          .select("id, subject, sent_at")
          .eq("user_id", userId)
          .eq("status", "sent")
          .order("sent_at", { ascending: false })
          .limit(5),
      ]);
      setStrategy((stratRes.data as Strategy | null) ?? null);
      setProfile((profRes.data as Profile | null) ?? null);
      setRecentEmails((emailRes.data as RecentEmail[]) ?? []);
    })();
  }, [userId]);

  /* prefill from URL / overview idea */
  useEffect(() => {
    if (prefillTopic) {
      setFocusMode("custom");
      setCustomTopic(prefillTopic);
    }
  }, [prefillTopic]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idea = params.get("idea");
    if (idea && !prefillTopic) {
      setFocusMode("custom");
      setCustomTopic(idea);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* default platform: LinkedIn if connected */
  useEffect(() => {
    if (platforms.length === 0 && isLinkedInConnected) {
      setPlatforms(["linkedin"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLinkedInConnected]);

  /* Keep composer tab valid */
  useEffect(() => {
    if (platforms.length > 0 && !platforms.includes(activeComposerTab)) {
      setActiveComposerTab(platforms[0]);
    }
  }, [platforms, activeComposerTab]);

  /* ---------------- derived ---------------- */
  const pillars = useMemo(() => asArray(strategy?.content_pillars), [strategy]);

  const focusTopic = useMemo(() => {
    if (focusMode === "pillar") return selectedPillar;
    if (focusMode === "custom") return customTopic.trim();
    if (focusMode === "surprise") return surprisePick;
    if (focusMode === "email") {
      const e = recentEmails.find((x) => x.id === emailPick);
      return e?.subject ?? "";
    }
    return "";
  }, [focusMode, selectedPillar, customTopic, surprisePick, emailPick, recentEmails]);

  const hasFocus = !!focusTopic;
  const hasPlatforms = platforms.length > 0;
  const canGenerate = hasFocus && hasPlatforms && !!postFormat;

  /* ---------------- handlers ---------------- */
  function selectFocus(mode: Exclude<FocusMode, null>) {
    setFocusMode(mode);
    if (mode !== "pillar") setSelectedPillar("");
    if (mode !== "custom") setCustomTopic("");
    if (mode !== "email") setEmailPick("");
    if (mode === "surprise") {
      setSurprisePick(pickRandom(pillars) ?? "");
    } else {
      setSurprisePick("");
    }
  }

  function togglePlatform(p: Platform) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-post", {
        body: {
          topic: focusTopic,
          platforms,
          postFormat,
          toneOverride: tone === "default" ? null : tone,
          strategy: strategy ?? {},
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const posts = (data?.posts ?? {}) as Record<string, string>;
      // push previous versions to history before overwriting
      for (const p of platforms) {
        if (content[p]) pushHistory(p, content[p]);
      }
      setContent((prev) => ({
        linkedin: platforms.includes("linkedin") ? posts.linkedin || prev.linkedin : prev.linkedin,
        facebook: platforms.includes("facebook") ? posts.facebook || prev.facebook : prev.facebook,
        instagram: platforms.includes("instagram") ? posts.instagram || prev.instagram : prev.instagram,
      }));
      toast.success("Posts generated — review and personalize before publishing");
      // Reset per-post focus hints so they can show once again for the new post
      setFocusHint({ linkedin: false, facebook: false, instagram: false });
      setHasEdited((prev) => {
        const next = { ...prev };
        for (const p of platforms) next[p] = false;
        return next;
      });
      // Show the one-time tip banner if user hasn't dismissed it this session
      if (!tipDismissed && sessionStorage.getItem("moxie_tip_seen") !== "true") {
        setShowTipBanner(true);
      } else {
        triggerFirstSentenceHighlight();
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't generate posts", { description: (err as Error).message });
    } finally {
      setGenerating(false);
    }
  }

  async function handleAddHashtags(p: Platform) {
    const text = content[p];
    if (!text.trim()) {
      toast.error("Write or generate the post first");
      return;
    }
    setHashtagsLoading(p);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { mode: "hashtags", text },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const tags = String(data?.hashtags ?? "")
        .split(/\s+/)
        .map((t) => t.replace(/^#?/, "#"))
        .filter((t) => t.length > 1)
        .slice(0, 6);
      setHashtags((prev) => ({ ...prev, [p]: tags }));
    } catch (err) {
      toast.error("Couldn't generate hashtags", { description: (err as Error).message });
    } finally {
      setHashtagsLoading(null);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large", { description: "Max 10MB" });
      return;
    }
    if (!/^image\/(jpe?g|png|gif)$/.test(file.type)) {
      toast.error("Unsupported file", { description: "Use JPG, PNG, or GIF" });
      return;
    }
    const url = await fileToDataUrl(file);
    setMediaUrls((prev) => [...prev, url]);
  }

  function handleCanvaSave() {
    if (canvaLink.trim()) {
      setMediaUrls((prev) => [...prev, canvaLink.trim()]);
      setCanvaLink("");
      setCanvaOpen(false);
      toast.success("Canva link added");
    } else {
      toast.error("Paste a link or upload an image");
    }
  }

  function buildSavePayload(status: "draft" | "queued" | "scheduled", scheduledFor: string | null) {
    const contentByPlatform: Record<string, string> = {};
    for (const p of platforms) {
      const tagsLine = hashtags[p].length ? "\n\n" + hashtags[p].join(" ") : "";
      contentByPlatform[p] = (content[p] || "") + tagsLine;
    }
    return {
      user_id: userId!,
      platforms: platforms as string[],
      content_by_platform: contentByPlatform,
      pillar:
        focusMode === "pillar"
          ? selectedPillar
          : focusMode === "surprise"
          ? surprisePick
          : null,
      status,
      scheduled_for: scheduledFor,
      media_urls: mediaUrls,
    };
  }

  async function savePost(status: "draft" | "queued" | "scheduled", scheduledFor: string | null) {
    if (!userId) return null;
    if (platforms.length === 0) {
      toast.error("Select at least one platform");
      return null;
    }
    const hasAnyContent = platforms.some((p) => content[p].trim().length > 0);
    if (!hasAnyContent) {
      toast.error("Write some content before saving");
      return null;
    }
    setSaving(status);
    const payload = buildSavePayload(status, scheduledFor);
    const { data, error } = await supabase
      .from("social_posts")
      .insert(payload)
      .select("id")
      .single();
    setSaving(null);
    if (error) {
      toast.error("Couldn't save post", { description: error.message });
      return null;
    }
    return data?.id as string;
  }

  async function handleSaveDraft() {
    const id = await savePost("draft", null);
    if (id) toast.success("Draft saved");
  }
  async function handleAddToQueue() {
    const id = await savePost("queued", null);
    if (id) toast.success("Added to queue");
  }
  async function handleConfirmSchedule() {
    if (!scheduleDate) {
      toast.error("Pick a date");
      return;
    }
    const iso = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
    if (new Date(iso).getTime() < Date.now() + 60 * 60 * 1000) {
      toast.error("Schedule must be at least 1 hour from now");
      return;
    }
    const id = await savePost("scheduled", iso);
    if (id) {
      toast.success("Scheduled");
      setShowSchedule(false);
    }
  }

  async function handlePublishNow() {
    setPublishing(true);
    setPublishConfirm(false);
    try {
      // Save first as draft, then publish via edge function
      const id = await savePost("draft", null);
      if (!id) throw new Error("Couldn't save post");
      const liContent =
        content.linkedin + (hashtags.linkedin.length ? "\n\n" + hashtags.linkedin.join(" ") : "");
      const { data, error } = await supabase.functions.invoke("publish-social-post", {
        body: { user_id: userId, post_id: id, platform: "linkedin", content: liContent },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Published to LinkedIn");
      setPublishedUrl("https://www.linkedin.com/feed/");
    } catch (err) {
      console.error(err);
      toast.error("Publish failed", { description: (err as Error).message });
    } finally {
      setPublishing(false);
    }
  }

  /* ---------------- render helpers ---------------- */
  const cardBase = "text-left rounded-lg border-2 p-3 transition-all w-full";
  const cardSelected = "border-accent bg-accent-soft";
  const cardUnselected = "border-border bg-background hover:border-accent/50";

  const stepLabel = !hasFocus
    ? "Step 1 — Focus"
    : !hasPlatforms
    ? "Step 2 — Platforms"
    : !postFormat
    ? "Step 3 — Format"
    : "Ready to generate";

  /* ===================== render ===================== */
  if (publishedUrl) {
    return (
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold">Published to LinkedIn</h3>
        <p className="text-sm text-muted-foreground">Your post is live.</p>
        <div className="flex gap-2">
          <a
            href={publishedUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-accent underline"
          >
            View on LinkedIn →
          </a>
          <Button variant="outline" size="sm" onClick={() => { setPublishedUrl(null); setContent({linkedin:"",facebook:"",instagram:""}); setHashtags({linkedin:[],facebook:[],instagram:[]}); setMediaUrls([]); }}>
            Create another
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)_340px]">
        {/* =================== LEFT: focus + format =================== */}
        <Card className="border-accent/20 bg-accent-soft/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-accent" />
                Build with MOXIEMO
              </CardTitle>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{stepLabel}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Step 1 - focus */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Step 1 — Choose your focus</h3>
                <p className="text-xs text-muted-foreground">Pick one starting point</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => selectFocus("pillar")}
                  className={cn(cardBase, focusMode === "pillar" ? cardSelected : cardUnselected)}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Pin className="h-4 w-4 text-accent" /> 📌 Content Pillar
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Stay on-strategy automatically</p>
                </button>

                {focusMode === "pillar" && (
                  <div className="animate-fade-in rounded-md border bg-background p-3">
                    {pillars.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        <Link to="/app/strategy" className="text-accent underline">
                          Complete your strategy →
                        </Link>
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {pillars.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setSelectedPillar(p)}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs transition",
                              selectedPillar === p
                                ? "border-accent bg-accent text-accent-foreground"
                                : "bg-background hover:border-accent/50",
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => selectFocus("custom")}
                  className={cn(cardBase, focusMode === "custom" ? cardSelected : cardUnselected)}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Pencil className="h-4 w-4 text-accent" /> ✏️ Custom Topic
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Write your own angle or idea</p>
                </button>

                {focusMode === "custom" && (
                  <Textarea
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="e.g. The moment I realized consistency beats perfection..."
                    rows={3}
                    className="animate-fade-in"
                  />
                )}

                <button
                  type="button"
                  onClick={() => selectFocus("surprise")}
                  className={cn(cardBase, focusMode === "surprise" ? cardSelected : cardUnselected)}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Dices className="h-4 w-4 text-accent" /> 🎲 Surprise Me
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">MOXIEMO picks from your strategy</p>
                  {focusMode === "surprise" && surprisePick && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Check className="h-3.5 w-3.5 text-accent" />
                      <span>
                        MOXIEMO picked: <span className="font-medium">{surprisePick}</span>
                      </span>
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSurprisePick(pickRandom(pillars) ?? "");
                        }}
                        className="ml-auto cursor-pointer text-accent underline"
                      >
                        pick again
                      </span>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => selectFocus("email")}
                  className={cn(cardBase, focusMode === "email" ? cardSelected : cardUnselected)}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4 text-accent" /> ✉️ Repurpose Email
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Turn a newsletter into a post</p>
                </button>

                {focusMode === "email" && (
                  <div className="animate-fade-in">
                    {recentEmails.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No sent emails yet.</p>
                    ) : (
                      <Select value={emailPick} onValueChange={setEmailPick}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a recent email" />
                        </SelectTrigger>
                        <SelectContent>
                          {recentEmails.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.subject || "(no subject)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2 - platforms */}
            {hasFocus && (
              <div className="animate-fade-in space-y-2">
                <h3 className="text-sm font-semibold">Which platforms?</h3>
                <div className="flex flex-wrap gap-2">
                  {ALL_PLATFORMS.map((p) => {
                    const selected = platforms.includes(p);
                    const disabled = p !== "linkedin" ? false : !isLinkedInConnected;
                    const Icon = p === "linkedin" ? Linkedin : p === "facebook" ? Facebook : Instagram;
                    const btn = (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition",
                          selected
                            ? "border-accent bg-accent text-accent-foreground"
                            : "bg-background hover:border-accent/50",
                          disabled && "opacity-60",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {PLATFORM_LABEL[p]}
                      </button>
                    );
                    if (p === "linkedin") return btn;
                    return (
                      <Tooltip key={p}>
                        <TooltipTrigger asChild>{btn}</TooltipTrigger>
                        <TooltipContent>Available after Meta verification</TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
                {!isLinkedInConnected && (
                  <p className="text-xs text-muted-foreground">
                    Connect LinkedIn from the Overview tab to publish.
                  </p>
                )}
              </div>
            )}

            {/* Step 3 - format */}
            {hasFocus && hasPlatforms && (
              <div className="animate-fade-in space-y-2">
                <h3 className="text-sm font-semibold">Post format</h3>
                <div className="flex flex-wrap gap-1.5">
                  {FORMATS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPostFormat(f)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition",
                        postFormat === f
                          ? "border-foreground bg-foreground text-background"
                          : "bg-background hover:border-foreground/40",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4 - tone */}
            {hasFocus && hasPlatforms && postFormat && (
              <div className="animate-fade-in">
                <button
                  type="button"
                  onClick={() => setToneOpen((v) => !v)}
                  className="flex w-full items-center justify-between text-sm font-semibold"
                >
                  <span>Tone</span>
                  <ChevronDown className={cn("h-4 w-4 transition", toneOpen && "rotate-180")} />
                </button>
                {toneOpen && (
                  <div className="mt-2 space-y-1.5">
                    {TONES.map((t) => (
                      <label key={t.value} className="flex items-center gap-2 text-xs">
                        <input
                          type="radio"
                          name="tone"
                          value={t.value}
                          checked={tone === t.value}
                          onChange={() => setTone(t.value)}
                        />
                        {t.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Generate button */}
            <div className="space-y-2 pt-1">
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate || generating}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate with MOXIEMO
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                MOXIEMO uses your strategy, voice, and positioning
              </p>
            </div>
          </CardContent>
        </Card>

        {/* =================== CENTER: composer =================== */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Compose</h2>
              {platforms.length === 0 && (
                <span className="text-xs text-muted-foreground">Pick a platform to start</span>
              )}
            </div>

            {platforms.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Choose your focus, platforms, and format on the left to start composing.
              </div>
            ) : (
              <>
              {showTipBanner && (
                <div
                  role="status"
                  className="relative flex items-start gap-3 rounded-md p-3 pr-10 animate-fade-in"
                  style={{
                    background: "#fff5f5",
                    borderLeft: "4px solid #ff6b6b",
                    color: "#262833",
                    animation: "fade-in 300ms ease-in",
                  }}
                >
                  <span aria-hidden className="text-lg leading-none">💡</span>
                  <div className="flex-1 text-xs leading-relaxed">
                    <div className="font-semibold mb-0.5">Pro tip: MOXIEMO can edit any part of your post</div>
                    <div>Select any text to improve, shorten, or rewrite it. Or type a command below to change anything instantly.</div>
                  </div>
                  <button
                    type="button"
                    onClick={dismissTipBanner}
                    className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-white/60"
                    style={{ color: "#262833" }}
                  >
                    Got it <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <Tabs
                value={activeComposerTab}
                onValueChange={(v) => setActiveComposerTab(v as Platform)}
              >
                <TabsList>
                  {platforms.map((p) => (
                    <TabsTrigger key={p} value={p}>
                      {PLATFORM_LABEL[p]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {platforms.map((p) => {
                  const limit = PLATFORM_LIMIT[p];
                  const text = content[p];
                  const len = text.length;
                  const ratio = len / limit;
                  const counterColor =
                    ratio > 1
                      ? "text-red-600"
                      : ratio > 0.95
                      ? "text-amber-600"
                      : ratio > 0.8
                      ? "text-amber-500"
                      : "text-emerald-600";
                  return (
                    <TabsContent key={p} value={p} className="space-y-3">
                      {/* History link */}
                      <div className="flex items-center justify-end">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              onClick={() =>
                                setHistoryPulse((prev) => ({ ...prev, [p]: false }))
                              }
                              disabled={(postHistory[p]?.length ?? 0) === 0}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
                            >
                              <History className="h-3 w-3" /> History
                              {postHistory[p]?.length > 0 && (
                                <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px]">
                                  {postHistory[p].length}
                                </span>
                              )}
                              {historyPulse[p] && (
                                <span
                                  aria-hidden
                                  className="ml-1 inline-block h-1.5 w-1.5 rounded-full"
                                  style={{
                                    backgroundColor: "#ff6b6b",
                                    animation: "moxie-pulse 800ms ease-in-out 3",
                                  }}
                                />
                              )}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-80 p-2">
                            <p className="px-2 pb-1 text-xs font-semibold">Previous versions</p>
                            <div className="max-h-72 space-y-1 overflow-y-auto">
                              {(postHistory[p] ?? []).length === 0 ? (
                                <p className="px-2 py-3 text-xs text-muted-foreground">
                                  No previous versions yet.
                                </p>
                              ) : (
                                postHistory[p].map((v, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => restoreVersion(p, i)}
                                    className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent/40"
                                  >
                                    <span className="font-medium">
                                      Version {i + 1}
                                      {i === 0 ? " (original)" : ""}
                                    </span>
                                    <span className="block truncate text-muted-foreground">
                                      {v.slice(0, 80) || "(empty)"}
                                    </span>
                                  </button>
                                ))
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="relative">
                        <Textarea
                          ref={(el) => {
                            textareaRefs.current[p] = el;
                          }}
                          value={text}
                          onChange={(e) => {
                            setContent((prev) => ({ ...prev, [p]: e.target.value }));
                            if (!hasEdited[p]) {
                              setHasEdited((prev) => ({ ...prev, [p]: true }));
                              if (text && !focusHint[p]) {
                                setFocusHint((prev) => ({ ...prev, [p]: true }));
                                setTimeout(() => {
                                  setFocusHint((prev) => ({ ...prev, [p]: false }));
                                }, 2000);
                              }
                            }
                          }}
                          onMouseUp={() => handleTextareaSelection(p)}
                          onTouchEnd={() => handleTextareaSelection(p)}
                          onKeyUp={(e) => {
                            if (e.shiftKey || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
                              handleTextareaSelection(p);
                            }
                          }}
                          placeholder={`Write your ${PLATFORM_LABEL[p]} post…`}
                          rows={10}
                          className={cn(
                            "resize-y transition-colors duration-500",
                            textareaFlash[p] && "bg-[#fff0f0]",
                          )}
                        />
                        <div className={cn("absolute bottom-2 right-3 text-xs font-medium", counterColor)}>
                          {len} / {limit}
                        </div>
                        {focusHint[p] && (
                          <div
                            className="pointer-events-none absolute right-2 top-2 rounded-md border bg-white px-2.5 py-1.5 shadow-sm animate-fade-in"
                            style={{
                              borderColor: "#ff6b6b",
                              fontSize: "12px",
                              color: "#262833",
                            }}
                          >
                            <div className="font-medium">✨ Try selecting text</div>
                            <div className="text-[11px] text-muted-foreground">to edit with MOXIEMO</div>
                          </div>
                        )}
                      </div>

                      {/* Persistent helper hint (after tip banner dismissed) */}
                      {tipDismissed && (
                        <div
                          style={{ fontSize: "11px", color: "#9b9faf" }}
                          className="-mt-1"
                        >
                          💡 Select any text to edit it with MOXIEMO · Or click the command box below for suggestions →
                        </div>
                      )}

                      {/* AI instruction row */}
                      <div
                        ref={(el) => (instructionRowRefs.current[p] = el)}
                        className="relative"
                      >
                        {suggestionsOpenFor === p && (
                          <div
                            className="absolute left-0 right-0 bottom-full mb-2 z-30 overflow-y-auto"
                            style={{
                              background: "#ffffff",
                              border: "1px solid #ede8e0",
                              borderRadius: "10px",
                              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                              maxHeight: "200px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#9b9faf",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                padding: "10px 12px 6px",
                              }}
                            >
                              Try one of these:
                            </div>
                            {ASK_MOXIE_SUGGESTIONS.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onMouseDown={(e) => {
                                  // prevent input blur before click handler runs
                                  e.preventDefault();
                                }}
                                onClick={() => {
                                  setInstructionInput((prev) => ({ ...prev, [p]: s }));
                                  setSuggestionsOpenFor(null);
                                  const el = instructionInputRefs.current[p];
                                  if (el) {
                                    requestAnimationFrame(() => {
                                      el.focus();
                                      const len = s.length;
                                      try {
                                        el.setSelectionRange(len, len);
                                      } catch {}
                                    });
                                  }
                                }}
                                className="block w-full text-left transition-colors border-l-2 border-transparent hover:border-l-[#ff6b6b] hover:bg-[#fff5f5]"
                                style={{
                                  fontSize: "12px",
                                  color: "#262833",
                                  padding: "8px 12px",
                                }}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
                        <Bot className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <Input
                          ref={(el) => (instructionInputRefs.current[p] = el)}
                          value={instructionInput[p]}
                          onChange={(e) =>
                            setInstructionInput((prev) => ({ ...prev, [p]: e.target.value }))
                          }
                          onFocus={() => setSuggestionsOpenFor(p)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && instructionInput[p].trim() && text.trim() && aiEditing === null) {
                              e.preventDefault();
                              setSuggestionsOpenFor(null);
                              void applyAiEdit({
                                platform: p,
                                action: "instruction",
                                selectedText: text,
                                fullPost: text,
                                instruction: instructionInput[p].trim(),
                              });
                            }
                          }}
                          placeholder="Ask MOXIEMO to change something..."
                          className="h-8 border-0 bg-transparent text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          disabled={!instructionInput[p].trim() || !text.trim() || aiEditing !== null}
                          onClick={() => {
                            setSuggestionsOpenFor(null);
                            applyAiEdit({
                              platform: p,
                              action: "instruction",
                              selectedText: text,
                              fullPost: text,
                              instruction: instructionInput[p].trim(),
                            });
                          }}
                        >
                          {aiEditing === "instruction" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5" />
                          )}
                          Apply
                        </Button>
                        </div>
                      </div>

                      {/* Hashtag row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddHashtags(p)}
                          disabled={hashtagsLoading === p}
                        >
                          {hashtagsLoading === p ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Hash className="h-3.5 w-3.5" />
                          )}
                          Add hashtags
                        </Button>
                        {hashtags[p].length > 0 && (
                          <>
                            {hashtags[p].map((tag, i) => (
                              <Badge key={`${tag}-${i}`} variant="secondary" className="gap-1">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setHashtags((prev) => ({
                                      ...prev,
                                      [p]: prev[p].filter((_, idx) => idx !== i),
                                    }))
                                  }
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            <button
                              type="button"
                              onClick={() => setHashtags((prev) => ({ ...prev, [p]: [] }))}
                              className="text-xs text-muted-foreground underline"
                            >
                              Clear all
                            </button>
                          </>
                        )}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
              </>
            )}

            {/* Media row */}
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                hidden
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="h-3.5 w-3.5" /> Add image
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCanvaOpen(true)}>
                <Palette className="h-3.5 w-3.5" /> Import from Canva
              </Button>
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative h-16 w-16 overflow-hidden rounded border">
                  {url.startsWith("data:") || url.match(/\.(jpe?g|png|gif|webp)$/i) ? (
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] text-muted-foreground">
                      Link
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setMediaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={!!saving}>
                {saving === "draft" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save draft
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddToQueue} disabled={!!saving}>
                {saving === "queued" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListPlus className="h-3.5 w-3.5" />}
                Add to queue
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSchedule((v) => !v)}>
                <CalendarIcon className="h-3.5 w-3.5" /> Schedule
              </Button>
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => setPublishConfirm(true)}
                disabled={!platforms.includes("linkedin") || !isLinkedInConnected || publishing || !content.linkedin.trim()}
              >
                {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Publish now
              </Button>
            </div>

            {showSchedule && (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Date</label>
                    <Input
                      type="date"
                      value={scheduleDate}
                      min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10)}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-44"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Time</label>
                    <Input
                      type="time"
                      step={1800}
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <Button size="sm" onClick={handleConfirmSchedule} disabled={!!saving}>
                    {saving === "scheduled" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Confirm schedule
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* =================== RIGHT: preview =================== */}
        <Card className="p-4">
          <h2 className="mb-3 text-base font-semibold">Preview</h2>
          {platforms.length === 0 ? (
            <p className="text-sm text-muted-foreground">Select a platform to preview.</p>
          ) : (
            <Tabs
              value={activeComposerTab}
              onValueChange={(v) => setActiveComposerTab(v as Platform)}
            >
              <TabsList>
                {platforms.map((p) => (
                  <TabsTrigger key={p} value={p}>
                    {PLATFORM_LABEL[p]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {platforms.map((p) => (
                <TabsContent key={p} value={p}>
                  <PlatformPreview
                    platform={p}
                    content={content[p] + (hashtags[p].length ? "\n\n" + hashtags[p].join(" ") : "")}
                    image={mediaUrls[0] ?? null}
                    profile={profile}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </Card>
      </div>

      {/* Canva modal */}
      <Dialog open={canvaOpen} onOpenChange={setCanvaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import from Canva</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Paste your Canva share link</label>
              <Input
                value={canvaLink}
                onChange={(e) => setCanvaLink(e.target.value)}
                placeholder="https://canva.com/design/..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Or upload an image directly</label>
              <input
                ref={canvaInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                hidden
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = "";
                  setCanvaOpen(false);
                }}
              />
              <Button variant="outline" size="sm" onClick={() => canvaInputRef.current?.click()}>
                Choose file
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Full Canva integration coming soon</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCanvaOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCanvaSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish confirm */}
      <AlertDialog open={publishConfirm} onOpenChange={setPublishConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish to LinkedIn now?</AlertDialogTitle>
            <AlertDialogDescription>
              Publishing to LinkedIn now — this cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublishNow}>Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating AI selection toolbar */}
      {selToolbar && (
        <div
          data-ai-toolbar
          style={{
            position: "absolute",
            top: selToolbar.top,
            left: selToolbar.left,
            zIndex: 60,
          }}
          className="flex items-center gap-1 rounded-md border bg-popover p-1 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {([
            { key: "improve", label: "Improve", icon: <Wand2 className="h-3 w-3" /> },
            { key: "shorter", label: "Shorter" },
            { key: "longer", label: "Longer" },
            { key: "punchier", label: "Punchier" },
            { key: "rewrite", label: "Rewrite" },
          ] as const).map((b) => (
            <Button
              key={b.key}
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              disabled={aiEditing !== null}
              onClick={() => {
                const fullPost = content[selToolbar.platform];
                void applyAiEdit({
                  platform: selToolbar.platform,
                  action: b.key,
                  selectedText: selToolbar.text,
                  fullPost,
                  replaceRange: { start: selToolbar.start, end: selToolbar.end },
                });
              }}
            >
              {aiEditing === b.key ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                ("icon" in b ? b.icon : null)
              )}
              {b.label}
            </Button>
          ))}
          <button
            type="button"
            onClick={() => setSelToolbar(null)}
            className="ml-1 rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </TooltipProvider>
  );
}

/* ===================== Previews ===================== */
function PlatformPreview({
  platform,
  content,
  image,
  profile,
}: {
  platform: Platform;
  content: string;
  image: string | null;
  profile: Profile | null;
}) {
  const name = profile?.full_name || "Your name";
  const business = profile?.business_name || "";
  const inits = initials(name);

  if (platform === "linkedin") {
    return (
      <div className="overflow-hidden rounded-md border bg-background text-sm">
        <div className="flex items-center gap-2 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A66C2] text-xs font-semibold text-white">
            {inits}
          </div>
          <div>
            <p className="font-semibold leading-tight">{name}</p>
            {business && <p className="text-xs text-muted-foreground">{business}</p>}
            <p className="text-[11px] text-muted-foreground">Just now · 🌐</p>
          </div>
        </div>
        <div className="whitespace-pre-wrap px-3 pb-3 text-sm leading-relaxed">
          {content || <span className="text-muted-foreground">Your post will appear here…</span>}
        </div>
        {image && (
          <img src={image} alt="" className="max-h-72 w-full border-t object-cover" />
        )}
        <div className="flex items-center gap-4 border-t px-3 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> Like</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Comment</span>
          <span className="flex items-center gap-1"><Repeat2 className="h-3.5 w-3.5" /> Repost</span>
        </div>
      </div>
    );
  }

  if (platform === "instagram") {
    return (
      <div className="overflow-hidden rounded-md border bg-background text-sm">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-[10px] font-semibold text-white">
            {inits}
          </div>
          <p className="text-xs font-semibold">{name.toLowerCase().replace(/\s+/g, "")}</p>
        </div>
        <div className="aspect-square w-full bg-muted">
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Square image preview
            </div>
          )}
        </div>
        <div className="flex gap-3 px-3 py-2 text-base">
          <Heart className="h-5 w-5" />
          <MessageSquare className="h-5 w-5" />
          <Share2 className="h-5 w-5" />
        </div>
        <div className="px-3 pb-3 text-xs leading-relaxed">
          <span className="font-semibold">{name.toLowerCase().replace(/\s+/g, "")}</span>{" "}
          <span className="whitespace-pre-wrap">
            {content || <span className="text-muted-foreground">Caption preview…</span>}
          </span>
        </div>
      </div>
    );
  }

  // Facebook
  return (
    <div className="overflow-hidden rounded-md border bg-background text-sm">
      <div className="flex items-center gap-2 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-xs font-semibold text-white">
          {inits}
        </div>
        <div>
          <p className="font-semibold leading-tight">{name}</p>
          <p className="text-[11px] text-muted-foreground">Just now · 🌐</p>
        </div>
      </div>
      <div className="whitespace-pre-wrap px-3 pb-3 text-sm leading-relaxed">
        {content || <span className="text-muted-foreground">Your post will appear here…</span>}
      </div>
      {image && <img src={image} alt="" className="max-h-72 w-full border-t object-cover" />}
      <div className="flex items-center gap-4 border-t px-3 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> Like</span>
        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Comment</span>
        <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> Share</span>
      </div>
    </div>
  );
}