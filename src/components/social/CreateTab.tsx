import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { aiErrorMessage } from "@/lib/aiErrors";
import { usePlan } from "@/hooks/usePlan";
import { canPublishOn } from "@/lib/planConfig";
import { PublishLockBadge } from "@/components/PublishLockBadge";
import {
  Loader2,
  X,
  ImageIcon,
  Palette,
  FolderOpen,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import LibraryAssetsDrawer from "./LibraryAssetsDrawer";
import { cn } from "@/lib/utils";
import { DropZone } from "@/hooks/useFileDrop";

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
const PLATFORM_LABEL: Record<Platform, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
};

type FocusMode = "pillar" | "custom" | "surprise" | "email" | null;

const CORAL = "#FF6B5C";
const CORAL_DARK = "#D94032";
const INK = "#15171C";
const BORDER = "#E8E7E5";
const PAPER = "#F7F5F1";
const MUTED = "#9B9793";

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

const FOCUS_CARDS: { mode: Exclude<FocusMode, null>; emoji: string; label: string; sub: string }[] = [
  { mode: "pillar", emoji: "🚀", label: "Content Pillar", sub: "Stay on-strategy automatically" },
  { mode: "custom", emoji: "✏️", label: "Custom Topic", sub: "Write your own angle or idea" },
  { mode: "surprise", emoji: "🎲", label: "Surprise Me", sub: "MOXIEMO picks from your strategy" },
  { mode: "email", emoji: "✉️", label: "Repurpose Email", sub: "Turn a newsletter into a post" },
];

export default function CreateTab({
  userId,
  prefillTopic,
  isLinkedInConnected,
  prefillPillar,
  prefillPlatform,
  pillarContext,
  onAfterSave,
}: {
  userId: string | null;
  prefillTopic?: string;
  isLinkedInConnected: boolean;
  prefillPillar?: string;
  prefillPlatform?: Platform;
  pillarContext?: { name: string; monthLabel: string } | null;
  onAfterSave?: () => void;
}) {
  const { plan, checkGenerationLimit, handleGenerationResponse } = usePlan();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);

  // Step 1 - focus
  const [focusMode, setFocusMode] = useState<FocusMode>(null);
  const [selectedPillar, setSelectedPillar] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [surprisePick, setSurprisePick] = useState<string>("");
  const [emailPick, setEmailPick] = useState<string>("");

  // Step 2 - platforms (single platform in new UI)
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  // Generation
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState<Record<Platform, string>>({
    linkedin: "",
    facebook: "",
    instagram: "",
  });
  const [activePlatform, setActivePlatform] = useState<Platform>("linkedin");

  // Media
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvaInputRef = useRef<HTMLInputElement | null>(null);
  const [canvaOpen, setCanvaOpen] = useState(false);
  const [canvaLink, setCanvaLink] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);

  // Schedule / save / publish
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("09:00");
  const [saving, setSaving] = useState<string | null>(null);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [pillarBannerDismissed, setPillarBannerDismissed] = useState(false);

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

  useEffect(() => {
    if (prefillPillar) {
      setFocusMode("pillar");
      setSelectedPillar(prefillPillar);
      setPillarBannerDismissed(false);
    }
  }, [prefillPillar]);

  useEffect(() => {
    if (prefillPlatform) setPlatforms([prefillPlatform]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillPlatform]);

  useEffect(() => {
    if (platforms.length === 0 && isLinkedInConnected) {
      setPlatforms(["linkedin"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLinkedInConnected]);

  useEffect(() => {
    if (platforms.length > 0 && !platforms.includes(activePlatform)) {
      setActivePlatform(platforms[0]);
    }
  }, [platforms, activePlatform]);

  /* ---------------- derived ---------------- */
  const pillars = useMemo(() => asArray(strategy?.content_pillars), [strategy]);

  const connectedPlatforms: Platform[] = useMemo(() => {
    const list: Platform[] = [];
    if (isLinkedInConnected) list.push("linkedin");
    return list;
  }, [isLinkedInConnected]);

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
  const canGenerate = hasFocus && hasPlatforms;
  const hasGenerated = platforms.some((p) => content[p].trim().length > 0);

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
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    if (!(await checkGenerationLimit())) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-post", {
        body: {
          topic: focusTopic,
          platforms,
          postFormat: "Text post",
          toneOverride: null,
          strategy: strategy ?? {},
        },
      });
      if (handleGenerationResponse(data, error)) return;
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const posts = (data?.posts ?? {}) as Record<string, string>;
      setContent((prev) => ({
        linkedin: platforms.includes("linkedin") ? posts.linkedin || prev.linkedin : prev.linkedin,
        facebook: platforms.includes("facebook") ? posts.facebook || prev.facebook : prev.facebook,
        instagram: platforms.includes("instagram") ? posts.instagram || prev.instagram : prev.instagram,
      }));
      toast.success("Posts generated — review and personalize before publishing");
    } catch (err) {
      console.error(err);
      toast.error(aiErrorMessage("content", err));
    } finally {
      setGenerating(false);
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
    if (userId) {
      void (async () => {
        try {
          const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
          const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("social-assets")
            .upload(path, file, { contentType: file.type, upsert: false });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from("social-assets").getPublicUrl(path);
          await supabase.from("assets").insert({
            user_id: userId,
            url: pub.publicUrl,
            filename: file.name,
            file_type: file.type,
            file_size_kb: Math.round(file.size / 1024),
            uploaded_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error("Failed to save asset to library", err);
        }
      })();
    }
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
    for (const p of platforms) contentByPlatform[p] = content[p] || "";
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
    if (id) {
      toast.success("Draft saved");
      onAfterSave?.();
    }
  }
  async function handleAddToQueue() {
    const id = await savePost("queued", null);
    if (id) {
      toast.success("Added to queue");
      onAfterSave?.();
    }
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
      onAfterSave?.();
    }
  }

  async function handlePublishNow() {
    setPublishing(true);
    setPublishConfirm(false);
    try {
      const id = await savePost("draft", null);
      if (!id) throw new Error("Couldn't save post");
      const { data, error } = await supabase.functions.invoke("publish-social-post", {
        body: { user_id: userId, post_id: id, platform: "linkedin", content: content.linkedin },
      });
      if (error) throw error;
      if ((data as any)?.error === "multiple_destinations_available") {
        throw new Error("You have multiple LinkedIn destinations connected. Publish from the Social Queue to pick one.");
      }
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

  /* ===================== render ===================== */
  if (publishedUrl) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-white p-12 text-center" style={{ borderColor: BORDER }}>
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
            className="text-sm font-medium underline"
            style={{ color: CORAL_DARK }}
          >
            View on LinkedIn →
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPublishedUrl(null);
              setContent({ linkedin: "", facebook: "", instagram: "" });
              setMediaUrls([]);
            }}
          >
            Create another
          </Button>
        </div>
      </div>
    );
  }

  const activeContent = content[activePlatform] || "";
  const firstParagraph = activeContent.split(/\n\n+/)[0] || "";

  return (
    <div className="space-y-4">
      {pillarContext && !pillarBannerDismissed && (
        <div
          className="flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm"
          style={{ borderColor: "rgba(255,107,92,0.3)", background: "rgba(255,107,92,0.06)", color: INK }}
        >
          <p>
            Creating for pillar: <span className="font-semibold">{pillarContext.name}</span>
            {" — "}this will count toward your {pillarContext.monthLabel} coverage.
          </p>
          <button
            type="button"
            aria-label="Dismiss"
            className="rounded p-1 hover:bg-white"
            onClick={() => setPillarBannerDismissed(true)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div
        className="rounded-xl border bg-white p-5"
        style={{ borderColor: BORDER }}
      >
        <div className="grid gap-6 lg:grid-cols-[292px_minmax(0,1fr)_280px]">
          {/* =================== LEFT PANEL =================== */}
          <div className="space-y-4">
            <div
              style={{
                color: CORAL,
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              ✦ Build with MOXIEMO
            </div>

            {/* Step 1 */}
            <div className="space-y-3">
              <StepLabel n={1} color={INK} label="Choose focus" />
              <div className="flex flex-col gap-[7px]">
                {FOCUS_CARDS.map((card) => {
                  const selected = focusMode === card.mode;
                  return (
                    <div key={card.mode}>
                      <button
                        type="button"
                        onClick={() => selectFocus(card.mode)}
                        className="block w-full text-left transition-all"
                        style={{
                          padding: "11px 13px",
                          borderRadius: "9px",
                          border: `1.5px solid ${selected ? CORAL : BORDER}`,
                          background: selected ? "rgba(255,107,92,0.06)" : "#fff",
                        }}
                      >
                        <div
                          className="flex items-center gap-2"
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: selected ? CORAL_DARK : INK,
                          }}
                        >
                          <span aria-hidden>{card.emoji}</span>
                          {card.label}
                        </div>
                        <p
                          style={{
                            fontSize: "11px",
                            color: MUTED,
                            marginTop: "2px",
                          }}
                        >
                          {card.sub}
                        </p>
                      </button>

                      {selected && card.mode === "pillar" && (
                        <div
                          className="mt-2 space-y-2"
                          style={{
                            marginLeft: "14px",
                            borderLeft: `2px solid ${CORAL}`,
                            background: PAPER,
                            padding: "10px 12px",
                            borderRadius: "0 6px 6px 0",
                          }}
                        >
                          {pillars.length === 0 ? (
                            <p style={{ fontSize: "11px", color: MUTED }}>
                              <Link to="/app/strategy" className="underline" style={{ color: CORAL_DARK }}>
                                Complete your strategy →
                              </Link>
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {pillars.map((p) => {
                                const sel = selectedPillar === p;
                                return (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => setSelectedPillar(p)}
                                    style={{
                                      borderRadius: "20px",
                                      border: `1px solid ${sel ? CORAL : "#D8D6D2"}`,
                                      background: sel ? "rgba(255,107,92,0.08)" : "#fff",
                                      color: sel ? CORAL_DARK : "#4A4944",
                                      fontWeight: sel ? 600 : 500,
                                      padding: "4px 10px",
                                      fontSize: "11px",
                                    }}
                                  >
                                    {p}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {selected && card.mode === "custom" && (
                        <div className="mt-2">
                          <Textarea
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            placeholder="e.g. The moment I realized consistency beats perfection..."
                            rows={3}
                            className="text-xs"
                            style={{ borderColor: BORDER, borderRadius: "9px" }}
                          />
                        </div>
                      )}

                      {selected && card.mode === "surprise" && surprisePick && (
                        <div
                          className="mt-2 flex items-center gap-2"
                          style={{ fontSize: "11px", color: INK, padding: "6px 10px" }}
                        >
                          <Check className="h-3 w-3" style={{ color: CORAL }} />
                          <span>
                            Picked: <span className="font-medium">{surprisePick}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSurprisePick(pickRandom(pillars) ?? "");
                            }}
                            className="ml-auto underline"
                            style={{ color: CORAL_DARK }}
                          >
                            pick again
                          </button>
                        </div>
                      )}

                      {selected && card.mode === "email" && (
                        <div className="mt-2">
                          {recentEmails.length === 0 ? (
                            <p style={{ fontSize: "11px", color: MUTED }}>No sent emails yet.</p>
                          ) : (
                            <Select value={emailPick} onValueChange={setEmailPick}>
                              <SelectTrigger className="h-9 text-xs">
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
                  );
                })}
              </div>
            </div>

            <div style={{ height: "1px", background: "#F0EFED" }} />

            {/* Step 2 */}
            <div className="space-y-3">
              <StepLabel n={2} color={INK} label="Choose platform" />
              {connectedPlatforms.length === 0 ? (
                <p style={{ fontSize: "11px", color: MUTED }}>
                  Connect a platform from the Overview tab to publish.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {connectedPlatforms.map((p) => {
                    const sel = platforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        style={{
                          borderRadius: "20px",
                          border: `1.5px solid ${sel ? INK : "#E0DED9"}`,
                          background: sel ? INK : "#fff",
                          color: sel ? "#fff" : "#4A4944",
                          fontWeight: 500,
                          padding: "5px 12px",
                          fontSize: "12px",
                        }}
                      >
                        {PLATFORM_LABEL[p]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ height: "1px", background: "#F0EFED" }} />

            {/* Step 3 */}
            <div className="space-y-2">
              <StepLabel n={3} color={CORAL} label="Generate" />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate || generating}
                className="w-full transition-opacity"
                style={{
                  background: CORAL,
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "9px",
                  padding: "12px 0",
                  opacity: !canGenerate || generating ? 0.55 : 1,
                  cursor: !canGenerate || generating ? "not-allowed" : "pointer",
                }}
              >
                {generating ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                  </span>
                ) : (
                  <>✦ {hasGenerated ? "Re-generate" : "Generate"} with MOXIEMO</>
                )}
              </button>
              <p className="text-center" style={{ fontSize: "11px", color: "#B8B4AF" }}>
                Uses your strategy, voice & positioning
              </p>
            </div>
          </div>

          {/* =================== CENTER PANEL =================== */}
          <div className="flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: INK }}>Compose</h2>
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: hasGenerated ? "#4CAF7D" : "#D8D6D2" }}
                />
                <span style={{ fontSize: "11px", color: MUTED }}>
                  {hasGenerated ? "Draft ready" : "Pick a platform to start"}
                </span>
              </div>
            </div>

            {platforms.length > 1 && (
              <div className="mb-2 flex gap-1">
                {platforms.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActivePlatform(p)}
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: activePlatform === p ? INK : "transparent",
                      color: activePlatform === p ? "#fff" : MUTED,
                    }}
                  >
                    {PLATFORM_LABEL[p]}
                  </button>
                ))}
              </div>
            )}

            <Textarea
              value={activeContent}
              onChange={(e) =>
                setContent((prev) => ({ ...prev, [activePlatform]: e.target.value }))
              }
              placeholder={
                hasGenerated
                  ? `Write your ${PLATFORM_LABEL[activePlatform]} post…`
                  : "Choose your focus & platform on the left, then click Generate to create your post."
              }
              className="flex-1 resize-none"
              style={{
                minHeight: "320px",
                borderRadius: "9px",
                border: `1.5px solid ${hasGenerated ? "#D8D6D2" : BORDER}`,
                background: hasGenerated ? "#fff" : "#FAFAF8",
                padding: "18px",
                fontSize: "14px",
                lineHeight: "1.6",
                color: INK,
                fontStyle: hasGenerated ? "normal" : activeContent ? "normal" : "italic",
              }}
            />

            {/* Media row */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
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
              <Button variant="outline" size="sm" onClick={() => setLibraryOpen(true)}>
                <FolderOpen className="h-3.5 w-3.5" /> From library
              </Button>
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative h-14 w-14 overflow-hidden rounded border" style={{ borderColor: BORDER }}>
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

            {/* Step 4 */}
            <div
              className="mt-4 pt-4"
              style={{ borderTop: `1px solid #F2F1EF` }}
            >
              <div className="mb-3">
                <StepLabel n={4} color={CORAL} label="Publish or save" />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <SecondaryBtn onClick={handleSaveDraft} disabled={!!saving} loading={saving === "draft"}>
                  Save draft
                </SecondaryBtn>
                <SecondaryBtn onClick={handleAddToQueue} disabled={!!saving} loading={saving === "queued"}>
                  Add to queue
                </SecondaryBtn>
                <SecondaryBtn onClick={() => setShowSchedule((v) => !v)}>Schedule</SecondaryBtn>
                <button
                  type="button"
                  onClick={() => setPublishConfirm(true)}
                  disabled={!platforms.includes("linkedin") || !isLinkedInConnected || publishing || !content.linkedin.trim()}
                  style={{
                    background: CORAL,
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "13px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    opacity:
                      !platforms.includes("linkedin") || !isLinkedInConnected || publishing || !content.linkedin.trim()
                        ? 0.5
                        : 1,
                  }}
                >
                  {publishing ? (
                    <Loader2 className="inline h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>✦ Publish now</>
                  )}
                </button>
                {platforms.includes("facebook") && !canPublishOn(plan, "facebook") && (
                  <PublishLockBadge platform="facebook" />
                )}
                {platforms.includes("instagram") && !canPublishOn(plan, "instagram") && (
                  <PublishLockBadge platform="instagram" />
                )}
              </div>

              {showSchedule && (
                <div
                  className="mt-3 space-y-2 rounded-md p-3"
                  style={{ background: PAPER, border: `1px solid ${BORDER}` }}
                >
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
          </div>

          {/* =================== RIGHT PANEL =================== */}
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: INK }}>Preview</h2>
            <p style={{ fontSize: "11px", color: MUTED, marginBottom: "12px" }}>
              {platforms.length > 0 ? PLATFORM_LABEL[activePlatform] : "No platform selected"}
            </p>

            <div
              className="overflow-hidden"
              style={{ border: `1px solid ${BORDER}`, borderRadius: "11px", background: "#fff" }}
            >
              <div className="flex items-center gap-2 p-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ background: INK }}
                >
                  {initials(profile?.full_name)}
                </div>
                <div className="flex-1 space-y-1">
                  <div
                    className="rounded"
                    style={{ height: "8px", width: "60%", background: "#EFEDEA" }}
                  />
                  <div
                    className="rounded"
                    style={{ height: "6px", width: "40%", background: "#F4F2EF" }}
                  />
                </div>
                <span style={{ color: MUTED, fontSize: "14px" }}>···</span>
              </div>

              <div style={{ padding: "0 12px 12px" }}>
                {activeContent ? (
                  <p style={{ fontSize: "11px", lineHeight: "1.5", color: INK, whiteSpace: "pre-wrap" }}>
                    {firstParagraph}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <div style={{ height: "6px", width: "92%", background: "#F4F2EF", borderRadius: "3px" }} />
                    <div style={{ height: "6px", width: "85%", background: "#F4F2EF", borderRadius: "3px" }} />
                    <div style={{ height: "6px", width: "70%", background: "#F4F2EF", borderRadius: "3px" }} />
                  </div>
                )}
              </div>

              <div
                className="mx-3 mb-3 flex items-center justify-center"
                style={{
                  aspectRatio: "1",
                  background: PAPER,
                  borderRadius: "6px",
                  flexDirection: "column",
                  display: "flex",
                  gap: "4px",
                }}
              >
                {mediaUrls[0] ? (
                  <img src={mediaUrls[0]} alt="" className="h-full w-full rounded object-cover" />
                ) : (
                  <>
                    <span style={{ fontSize: "32px", opacity: 0.18 }}>🖼</span>
                    <span style={{ fontFamily: "monospace", fontSize: "10px", color: MUTED }}>
                      image placeholder
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between border-t px-3 py-2" style={{ borderColor: "#F2F1EF" }}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{ width: "20px", height: "20px", background: "#F4F2EF", borderRadius: "4px" }}
                  />
                ))}
              </div>
            </div>

            <p className="text-center" style={{ fontSize: "11px", color: "#B8B4AF", marginTop: "10px" }}>
              Updates live as you compose
            </p>
          </div>
        </div>
      </div>

      <LibraryAssetsDrawer
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        userId={userId}
        onSelect={(url) => setMediaUrls((prev) => [...prev, url])}
      />

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
    </div>
  );
}

function StepLabel({ n, color, label }: { n: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center justify-center"
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "999px",
          background: color,
          color: "#fff",
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        {n}
      </span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: INK }}>{label}</span>
    </div>
  );
}

function SecondaryBtn({
  children,
  onClick,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: `1px solid ${BORDER}`,
        background: "#fff",
        color: "#4A4944",
        fontWeight: 500,
        fontSize: "13px",
        padding: "8px 14px",
        borderRadius: "8px",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {loading ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}
