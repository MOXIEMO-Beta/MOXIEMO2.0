import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DropZone } from "@/hooks/useFileDrop";
import { useAuth } from "@/hooks/useAuth";
import { aiErrorMessage } from "@/lib/aiErrors";
import { usePlan } from "@/hooks/usePlan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/email/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertTriangle,
  Upload,
  Loader2,
  Trash2,
  Plus,
  Pencil,
  Tag,
  MoreHorizontal,
  Download,
  Send,
  X,
  Info,
  Reply,
  Shield,
  ChevronDown,
  ChevronUp,
  Check,
  CalendarDays,
  ClipboardList,
  Zap,
  Mail,
  CheckCircle2,
} from "lucide-react";
import GeneratePanel, { type GenerateParams } from "@/components/email/GeneratePanel";
import SegmentsManager, { type Segment, PRESET_COLORS } from "@/components/email/SegmentsManager";

const CTA_COLOR_PRESETS: Array<{ name: string; hex: string }> = [
  { name: "Coral", hex: "#ff6b6b" },
  { name: "Dark", hex: "#101116" },
  { name: "White", hex: "#ffffff" },
  { name: "Navy", hex: "#1a3a5c" },
  { name: "Forest", hex: "#2d6a4f" },
  { name: "Purple", hex: "#6b4fbb" },
  { name: "Gold", hex: "#c9a84c" },
  { name: "Slate", hex: "#4a5568" },
];

function ColorPickerRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          {CTA_COLOR_PRESETS.map((c) => {
            const selected = value.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                type="button"
                title={`${c.name} ${c.hex}`}
                onClick={() => onChange(c.hex)}
                className={`h-6 w-6 rounded-full border transition ${
                  selected ? "ring-2 ring-offset-2 ring-foreground" : ""
                }`}
                style={{
                  background: c.hex,
                  borderColor: c.hex.toLowerCase() === "#ffffff" ? "#d1d5db" : "transparent",
                }}
              />
            );
          })}
        </div>
        <Input
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v.startsWith("#") ? v : `#${v}`);
          }}
          maxLength={7}
          className="h-8 w-28 font-mono text-xs uppercase"
        />
      </div>
    </div>
  );
}

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  subscribed_at: string;
  tags: string[];
};

type EmailSend = {
  id: string;
  subject: string | null;
  sent_at: string | null;
  recipient_count: number | null;
  open_rate: number | null;
  click_rate: number | null;
  segment: string | null;
  status: string | null;
  scheduled_for: string | null;
  body: string | null;
  recipient_ids: unknown;
};

type EmailSettings = {
  from_name?: string;
  from_email?: string;
  reply_to?: string;
};

type Strategy = {
  positioning_statement?: string | null;
  ideal_client?: string | null;
  pain_point?: string | null;
  voice_attributes?: unknown;
  anti_positioning?: string | null;
  content_pillars?: unknown;
  content_themes?: unknown;
  primary_channel?: string | null;
  success_definition?: string | null;
};

type SendMode = "now" | "schedule" | "queue";

export default function Email() {
  const { user } = useAuth();
  const { checkGenerationLimit, handleGenerationResponse } = usePlan();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showGenPanel, setShowGenPanel] = useState(true);
  // CTA block (appended to body at send time)
  const [ctaEnabled, setCtaEnabled] = useState(false);
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaBgColor, setCtaBgColor] = useState<string>("#ff6b6b");
  const [ctaTextColor, setCtaTextColor] = useState<string>("#ffffff");
  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [settings, setSettings] = useState<EmailSettings>({});
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", email: "", tags: [] as string[] });
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [csvPending, setCsvPending] = useState<null | {
    rows: Array<{ user_id: string; email: string; name: string | null; status: string; tags: string[] }>;
    selectedTags: string[];
  }>(null);
  const [showSendPanel, setShowSendPanel] = useState(false);
  const [sendStep, setSendStep] = useState<1 | 2>(1);
  const [audienceMode, setAudienceMode] = useState<"all" | "segment" | "selected">("all");
  const [sendSegmentIds, setSendSegmentIds] = useState<string[]>([]);
  const [tableFilter, setTableFilter] = useState<string | null>(null);
  const [inlineListForm, setInlineListForm] = useState<null | "add" | "csv">(null);
  const [inlineListName, setInlineListName] = useState("");
  const [inlineListColor, setInlineListColor] = useState(PRESET_COLORS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(true);

  // New: scheduling + confirmation + post-send state
  const [sendMode, setSendMode] = useState<SendMode>("now");
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("09:00");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastSent, setLastSent] = useState<null | { subject: string; count: number; sentAt: string }>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleTz, setScheduleTz] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  const activeSubscribers = useMemo(
    () => subscribers.filter((s) => s.status === "active"),
    [subscribers],
  );

  const segmentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const seg of segments) counts[seg.id] = 0;
    for (const sub of activeSubscribers) {
      for (const tagId of sub.tags || []) {
        if (counts[tagId] !== undefined) counts[tagId] += 1;
      }
    }
    return counts;
  }, [segments, activeSubscribers]);

  const segmentMap = useMemo(() => {
    const m: Record<string, Segment> = {};
    for (const s of segments) m[s.id] = s;
    return m;
  }, [segments]);

  const userTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  // Suggested CTA label from strategy
  const suggestedCtaLabel = useMemo(() => {
    const channel = strategy?.primary_channel || "";
    const success = strategy?.success_definition || "";
    void channel; void success;
    return "Book a discovery call";
  }, [strategy]);

  function buildCtaHtml(): string {
    if (!ctaEnabled || !ctaLabel.trim() || !ctaUrl.trim()) return "";
    const bg = ctaBgColor;
    const fg = ctaTextColor;
    return `<p style="text-align:center;margin:24px 0;"><a href="${ctaUrl.trim()}" style="display:inline-block;background:${bg};color:${fg};padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">${ctaLabel.trim()}</a></p>`;
  }

  function bodyWithCta(): string {
    const cta = buildCtaHtml();
    if (!cta) return body;
    // Insert before final signature paragraph (—Name) if present, else append
    const sigMatch = body.match(/<p>—[^<]*<\/p>\s*$/);
    if (sigMatch) {
      return body.replace(sigMatch[0], cta + sigMatch[0]);
    }
    return body + cta;
  }

  // Tomorrow as min for date picker
  const minScheduleDate = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().slice(0, 10);
  }, []);

  async function loadAll() {
    if (!user) return;
    const [subsRes, sendsRes, profileRes, strategyRes, segRes] = await Promise.all([
      supabase
        .from("subscribers")
        .select("*")
        .eq("user_id", user.id)
        .order("subscribed_at", { ascending: false }),
      supabase
        .from("email_sends")
        .select("*")
        .eq("user_id", user.id)
        .order("sent_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("email_settings, full_name")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("strategies")
        .select(
          "positioning_statement, ideal_client, pain_point, voice_attributes, anti_positioning, content_pillars, content_themes, primary_channel, success_definition",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("subscriber_segments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
    ]);

    const subs = ((subsRes.data || []) as Array<Record<string, unknown>>).map((s) => ({
      ...s,
      tags: Array.isArray(s.tags) ? (s.tags as string[]) : [],
    })) as unknown as Subscriber[];
    setSubscribers(subs);
    setSends((sendsRes.data as EmailSend[]) || []);
    const settingsValue = (profileRes.data?.email_settings as EmailSettings) || {};
    setSettings(settingsValue);
    setStrategy((strategyRes.data as Strategy) || null);
    setFullName((profileRes.data?.full_name as string) || "");

    const segs = (segRes.data as Segment[]) || [];
    setSegments(segs);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (sends.length > 0) setHowItWorksOpen(false);
  }, [sends.length]);

  async function generateWithMoxie(params: GenerateParams) {
    if (!(await checkGenerationLimit())) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-email", {
        body: {
          topic: params.topic,
          emailType: params.emailType,
          strategy,
          senderName: fullName || "Your Name",
        },
      });
      if (handleGenerationResponse(data, error)) return;
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Defensive parse: if the function returned a raw string (possibly
      // wrapped in markdown fences), normalize into { subject, body, preview_text }.
      let payload: { subject?: string; body?: string; preview_text?: string } = {};
      if (typeof data === "string") {
        const cleaned = (data as string)
          .replace(/^```(?:json|html)?\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        try {
          payload = JSON.parse(cleaned);
        } catch {
          const s = cleaned.indexOf("{");
          const e = cleaned.lastIndexOf("}");
          if (s !== -1 && e > s) {
            try { payload = JSON.parse(cleaned.substring(s, e + 1)); } catch { payload = { body: cleaned }; }
          } else {
            payload = { body: cleaned };
          }
        }
      } else if (data && typeof data === "object") {
        payload = data as typeof payload;
      }

      // If body is still wrapped in fences, strip them
      if (typeof payload.body === "string") {
        payload.body = payload.body
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
      }

      // Sometimes the model dumps the entire JSON object into `body`
      // (e.g. body = '{"subject":"...","body":"<p>...</p>"}'). Detect
      // that case and unwrap so the editor renders real HTML, not JSON.
      if (typeof payload.body === "string" && payload.body.startsWith("{")) {
        try {
          const inner = JSON.parse(payload.body);
          if (inner && typeof inner === "object" && typeof inner.body === "string") {
            if (!payload.subject && typeof inner.subject === "string") payload.subject = inner.subject;
            if (!payload.preview_text && typeof inner.preview_text === "string") payload.preview_text = inner.preview_text;
            payload.body = inner.body;
          }
        } catch {
          /* leave as-is */
        }
      }

      if (payload.subject) setSubject(payload.subject);
      if (payload.body) setBody(payload.body);
      if (payload.preview_text) setPreviewText(payload.preview_text);
      setShowGenPanel(false);
      toast.success("Draft ready — personalize the brackets before sending");
    } catch (err: unknown) {
      toast.error(aiErrorMessage("content", err));
    } finally {
      setGenerating(false);
    }
  }

  function openSendPanel() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and body first");
      return;
    }
    setSendStep(1);
    setAudienceMode(selectedIds.size > 0 ? "selected" : "all");
    setSendMode("now");
    setShowSendPanel(true);
    setLastSent(null);
  }

  const sendRecipientIds = useMemo(() => {
    if (audienceMode === "selected") return Array.from(selectedIds);
    if (audienceMode === "segment" && sendSegmentIds.length > 0) {
      return activeSubscribers
        .filter((s) => s.tags.some((t) => sendSegmentIds.includes(t)))
        .map((s) => s.id);
    }
    return activeSubscribers.map((s) => s.id);
  }, [audienceMode, selectedIds, sendSegmentIds, activeSubscribers]);

  const sendAudienceLabel = useMemo(() => {
    if (audienceMode === "selected") return `${selectedIds.size} selected contacts`;
    if (audienceMode === "segment" && sendSegmentIds.length > 0) {
      return sendSegmentIds.map((id) => segmentMap[id]?.name).filter(Boolean).join(", ");
    }
    return "All active subscribers";
  }, [audienceMode, selectedIds.size, sendSegmentIds, segmentMap]);

  function resetCompose() {
    setSubject("");
    setBody("");
    setPreviewText("");
    setShowSendPanel(false);
    setLastSent(null);
    setSelectedIds(new Set());
    setSendMode("now");
    setShowGenPanel(true);
    setCtaEnabled(false);
    setCtaLabel("");
    setCtaUrl("");
    setCtaBgColor("#ff6b6b");
    setCtaTextColor("#ffffff");
  }

  async function doSendNow() {
    setSending(true);
    try {
      const finalBody = bodyWithCta();
      const payload: Record<string, unknown> = { subject, body: finalBody };
      if (audienceMode === "selected") {
        payload.subscriber_ids = Array.from(selectedIds);
      } else if (audienceMode === "segment" && sendSegmentIds.length > 0) {
        payload.subscriber_ids = sendRecipientIds;
        payload.segment = sendSegmentIds.join(",");
      }
      const { data, error } = await supabase.functions.invoke("send-email", { body: payload });
      if (error) {
        let description = error.message;
        try {
          const ctx = (error as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            const errorData = await ctx.json();
            description = errorData?.error ?? errorData?.message ?? description;
          }
        } catch (_) { /* ignore */ }
        toast.error("Failed to send", {
          description: description ?? "Check your sending details and try again.",
        });
        return;
      }
      if (data?.error) throw new Error(data.error);
      const count = data?.sent_count ?? sendRecipientIds.length;
      toast.success(`Sent to ${count} subscribers`);
      setLastSent({
        subject,
        count,
        sentAt: new Date().toLocaleString(),
      });
      loadAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send";
      toast.error("Failed to send", {
        description: message ?? "Check your sending details and try again.",
      });
    } finally {
      setSending(false);
      setConfirmOpen(false);
    }
  }

  async function saveScheduled() {
    if (!user) return;
    if (!scheduleDate || !scheduleTime) {
      toast.error("Pick a date and time");
      return;
    }
    const dt = new Date(`${scheduleDate}T${scheduleTime}:00`);
    if (isNaN(dt.getTime()) || dt.getTime() <= Date.now()) {
      toast.error("Schedule time must be in the future");
      return;
    }
    setSending(true);
    const segmentValue =
      audienceMode === "segment" && sendSegmentIds.length > 0
        ? sendSegmentIds.join(",")
        : "all";
    const { error } = await supabase.from("email_sends").insert({
      user_id: user.id,
      subject,
      body: bodyWithCta(),
      status: "scheduled",
      scheduled_for: dt.toISOString(),
      segment: segmentValue,
      recipient_ids: sendRecipientIds,
      recipient_count: sendRecipientIds.length,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Email scheduled");
    resetCompose();
    loadAll();
  }

  async function saveQueued() {
    if (!user) return;
    setSending(true);
    const segmentValue =
      audienceMode === "segment" && sendSegmentIds.length > 0
        ? sendSegmentIds.join(",")
        : "all";
    const { error } = await supabase.from("email_sends").insert({
      user_id: user.id,
      subject,
      body: bodyWithCta(),
      status: "queued",
      segment: segmentValue,
      recipient_ids: sendRecipientIds,
      recipient_count: sendRecipientIds.length,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved to queue");
    resetCompose();
    loadAll();
  }

  // Save current compose state as a draft (queued, no scheduled time)
  async function saveDraft() {
    if (!user) return;
    if (!subject.trim() && !body.trim()) {
      toast.error("Nothing to save yet");
      return;
    }
    setSending(true);
    const segmentValue =
      audienceMode === "segment" && sendSegmentIds.length > 0
        ? sendSegmentIds.join(",")
        : "all";
    const { error } = await supabase.from("email_sends").insert({
      user_id: user.id,
      subject: subject || "(untitled draft)",
      body: bodyWithCta(),
      status: "draft",
      segment: segmentValue,
      recipient_ids: sendRecipientIds,
      recipient_count: sendRecipientIds.length,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraftSavedAt(Date.now());
    setTimeout(() => setDraftSavedAt(null), 2000);
    loadAll();
  }

  // Send a previously queued/scheduled email straight away
  async function sendFromLog(item: EmailSend) {
    if (!item.subject || !item.body) {
      toast.error("This email is missing subject or body");
      return;
    }
    const ids = Array.isArray(item.recipient_ids) ? (item.recipient_ids as string[]) : [];
    const payload: Record<string, unknown> = {
      subject: item.subject,
      body: item.body,
    };
    if (ids.length > 0) payload.subscriber_ids = ids;
    if (item.segment && item.segment !== "all") payload.segment = item.segment;
    const { data, error } = await supabase.functions.invoke("send-email", { body: payload });
    if (error) {
      toast.error("Failed to send", { description: error.message });
      return;
    }
    if (data?.error) {
      toast.error("Failed to send", { description: data.error });
      return;
    }
    // Remove the original queued/scheduled record (the edge function inserted a new "sent" row)
    await supabase.from("email_sends").delete().eq("id", item.id);
    toast.success(`Sent to ${data?.sent_count ?? ids.length} subscribers`);
    loadAll();
  }

  async function deleteSendRow(id: string) {
    const { error } = await supabase.from("email_sends").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    loadAll();
  }

  async function rescheduleSend(item: EmailSend) {
    const dateStr = window.prompt("New date (YYYY-MM-DD)", item.scheduled_for?.slice(0, 10) || minScheduleDate);
    if (!dateStr) return;
    const timeStr = window.prompt("New time (HH:MM, 24h)", item.scheduled_for?.slice(11, 16) || "09:00");
    if (!timeStr) return;
    const dt = new Date(`${dateStr}T${timeStr}:00`);
    if (isNaN(dt.getTime()) || dt.getTime() <= Date.now()) {
      toast.error("Schedule time must be in the future");
      return;
    }
    const { error } = await supabase
      .from("email_sends")
      .update({ scheduled_for: dt.toISOString(), status: "scheduled" })
      .eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Rescheduled");
    loadAll();
  }

  async function addSubscriber() {
    if (!user || !newSub.email.trim()) return;
    const { error } = await supabase.from("subscribers").insert({
      user_id: user.id,
      email: newSub.email.trim(),
      name: newSub.name.trim() || null,
      status: "active",
      tags: newSub.tags,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Subscriber added");
    setNewSub({ name: "", email: "", tags: [] });
    setShowAddForm(false);
    loadAll();
  }

  async function createInlineList(target: "add" | "csv") {
    if (!user || !inlineListName.trim()) return;
    const { data, error } = await supabase
      .from("subscriber_segments")
      .insert({
        user_id: user.id,
        name: inlineListName.trim(),
        color: inlineListColor,
      })
      .select("*")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    const created = data as Segment;
    setSegments((prev) => [...prev, created]);
    if (target === "add") {
      setNewSub((prev) => ({ ...prev, tags: [...prev.tags, created.id] }));
    } else {
      setCsvPending((prev) =>
        prev ? { ...prev, selectedTags: [...prev.selectedTags, created.id] } : prev,
      );
    }
    setInlineListName("");
    setInlineListColor(PRESET_COLORS[0]);
    setInlineListForm(null);
    toast.success("List created");
  }

  async function removeSubscriber(id: string) {
    const { error } = await supabase
      .from("subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    loadAll();
  }

  async function toggleSubscriberTag(subId: string, segId: string) {
    const sub = subscribers.find((s) => s.id === subId);
    if (!sub) return;
    const next = sub.tags.includes(segId)
      ? sub.tags.filter((t) => t !== segId)
      : [...sub.tags, segId];
    const { error } = await supabase
      .from("subscribers")
      .update({ tags: next })
      .eq("id", subId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubscribers((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, tags: next } : s)),
    );
  }

  async function bulkApplyTag(segId: string) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const updates = subscribers
      .filter((s) => ids.includes(s.id))
      .map((s) => {
        const tags = s.tags.includes(segId) ? s.tags : [...s.tags, segId];
        return supabase.from("subscribers").update({ tags }).eq("id", s.id);
      });
    await Promise.all(updates);
    toast.success(`Tagged ${ids.length} subscribers`);
    loadAll();
  }

  async function bulkRemove() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Remove ${ids.length} subscribers? They will be marked as unsubscribed.`)) return;
    const { error } = await supabase
      .from("subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .in("id", ids);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Removed ${ids.length} subscribers`);
    setSelectedIds(new Set());
    loadAll();
  }

  function bulkExport() {
    const ids = Array.from(selectedIds);
    const rows = subscribers.filter((s) => ids.includes(s.id));
    const header = "name,email,status,tags\n";
    const csv =
      header +
      rows
        .map((r) => {
          const tagNames = r.tags.map((t) => segmentMap[t]?.name || "").filter(Boolean).join("|");
          return [r.name || "", r.email, r.status, tagNames]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(",");
        })
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function processCsvFile(file: File | undefined) {
    if (!file || !user) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      toast.error("Please upload a .csv file");
      return;
    }
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const header = lines[0]?.toLowerCase() || "";
    const hasHeader = header.includes("email");
    const dataLines = hasHeader ? lines.slice(1) : lines;
    let emailIdx = 0;
    let nameIdx = 1;
    if (hasHeader) {
      const cols = header.split(",").map((c) => c.trim());
      emailIdx = cols.findIndex((c) => c.includes("email"));
      nameIdx = cols.findIndex((c) => c.includes("name"));
    }
    const rows = dataLines
      .map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const email = cols[emailIdx >= 0 ? emailIdx : 0];
        const name = nameIdx >= 0 ? cols[nameIdx] : null;
        if (!email || !email.includes("@")) return null;
        return { user_id: user.id, email, name: name || null, status: "active", tags: [] as string[] };
      })
      .filter(Boolean) as Array<{ user_id: string; email: string; name: string | null; status: string; tags: string[] }>;

    if (rows.length === 0) {
      toast.error("No valid emails found in CSV");
      return;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setCsvPending({ rows, selectedTags: [] });
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    await processCsvFile(e.target.files?.[0]);
  }

  async function confirmCsvImport() {
    if (!csvPending) return;
    const rows = csvPending.rows.map((r) => ({ ...r, tags: csvPending.selectedTags }));
    const { error } = await supabase.from("subscribers").insert(rows);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Imported ${rows.length} subscribers`);
    setCsvPending(null);
    loadAll();
  }

  async function saveSettings() {
    if (!user) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from("profiles")
      .update({ email_settings: settings })
      .eq("id", user.id);
    setSavingSettings(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sending details saved");
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    if (checked) setSelectedIds(new Set(subscribers.map((s) => s.id)));
    else setSelectedIds(new Set());
  }

  const needsSetup = !settings.reply_to;

  // Progress / step completion
  const stepDetails = !!(settings.from_name && settings.reply_to);
  const stepSubs = activeSubscribers.length > 0;
  const stepCompose = subject.trim().length > 0 && body.trim().length > 0;
  const stepSendReady = stepDetails && stepSubs && stepCompose;

  const pillars: string[] = Array.isArray(strategy?.content_pillars)
    ? (strategy!.content_pillars as unknown[]).map((p) =>
        typeof p === "string" ? p : (p as { label?: string; name?: string; title?: string })?.label || (p as { name?: string }).name || (p as { title?: string }).title || "",
      ).filter(Boolean)
    : [];
  const themes: Array<Record<string, string> | string> = Array.isArray(strategy?.content_themes)
    ? (strategy!.content_themes as Array<Record<string, string> | string>)
    : [];

  function StepChip({
    n,
    label,
    done,
    extra,
  }: {
    n: number;
    label: string;
    done: boolean;
    extra?: string;
  }) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
            done
              ? "bg-orange-600 text-white"
              : "bg-muted text-muted-foreground border"
          }`}
        >
          {done ? <Check className="h-3.5 w-3.5" /> : n}
        </div>
        <span className={`text-sm ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          {label}
          {extra ? <span className="text-muted-foreground font-normal"> {extra}</span> : null}
        </span>
      </div>
    );
  }

  function countdownLabel(iso: string) {
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return "Sending soon";
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `Sends in ${mins} min`;
    const hours = Math.round(mins / 60);
    if (hours < 48) return `Sends in ${hours} ${hours === 1 ? "hour" : "hours"}`;
    const days = Math.round(hours / 24);
    return `Sends in ${days} days`;
  }

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email</h1>
        <p className="text-muted-foreground mt-1">
          Write, generate, and send newsletters to your audience.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <StepChip n={1} label="Sending details" done={stepDetails} />
          <span className="text-muted-foreground">→</span>
          <StepChip
            n={2}
            label="Subscribers"
            done={stepSubs}
            extra={`(${activeSubscribers.length})`}
          />
          <span className="text-muted-foreground">→</span>
          <StepChip n={3} label="Compose" done={stepCompose} />
          <span className="text-muted-foreground">→</span>
          <StepChip n={4} label="Send" done={stepSendReady && !!lastSent} />
        </div>
      </div>

      {needsSetup && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
            <p className="text-sm text-orange-900">
              Add your reply-to email so subscriber replies reach your inbox.
            </p>
          </div>
          <Button
            onClick={() =>
              settingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Configure
          </Button>
        </div>
      )}

      {/* 1. How MOXIEMO sends your emails */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => setHowItWorksOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">How MOXIEMO sends your emails</CardTitle>
            </div>
            {howItWorksOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>
        {howItWorksOpen && (
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Send className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Your emails send through MOXIEMO's secure sending infrastructure. Your name appears as the sender — your subscribers won't see "MOXIEMO" anywhere.
              </p>
            </div>
            <div className="flex gap-3">
              <Reply className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Replies go straight to you. Set your reply-to email in Sending Details below and all subscriber replies land in your inbox.
              </p>
            </div>
            <div className="flex gap-3">
              <Shield className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                We handle deliverability. SPF, DKIM, and DMARC are configured on our end so your emails reach inboxes, not spam folders.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 2. Sending Details */}
      <Card id="settings" ref={settingsRef}>
        <CardHeader>
          <CardTitle>Sending details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>From name</Label>
            <Input
              value={settings.from_name || ""}
              onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
              placeholder="Your name or brand"
            />
            <p className="text-xs text-muted-foreground">
              This is what subscribers see as the sender name.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Where should subscriber replies go?</Label>
              {settings.reply_to && (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  <Check className="h-3 w-3" /> Saved
                </span>
              )}
            </div>
            <Input
              value={settings.reply_to || ""}
              onChange={(e) => setSettings({ ...settings, reply_to: e.target.value })}
              placeholder="you@yourdomain.com"
              type="email"
            />
            <p className="text-xs text-muted-foreground">
              This is your most important setting — make sure it's correct.
            </p>
          </div>
          <Button onClick={saveSettings} disabled={savingSettings}>
            {savingSettings ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
          <p className="text-xs text-muted-foreground border-t pt-3">
            In Beta 1, all emails send from <span className="font-mono">hello@mail.buildwithmoxiemo.com</span> on your behalf. Your name appears as the sender. Replies go directly to your reply-to address. Custom sending domains are coming in a future update.
          </p>
        </CardContent>
      </Card>

      {/* 3. Subscribers */}
      <DropZone
        onFile={(f) => void processCsvFile(f)}
        accept=".csv,text/csv"
        className="rounded-lg"
        style={{ border: "1.5px dashed transparent", transition: "background 120ms ease, border-color 120ms ease" }}
        activeStyle={{ border: "1.5px dashed hsl(var(--accent))", background: "hsl(var(--accent) / 0.06)" }}
      >
      <Card id="subscribers-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subscribers ({subscribers.length})</CardTitle>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" /> Import CSV
              </Button>
              <Button size="sm" onClick={() => setShowAddForm((v) => !v)}>
                <Plus className="h-4 w-4" /> Add subscriber
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <SegmentsManager
              segments={segments}
              counts={segmentCounts}
              userId={user.id}
              onChange={loadAll}
              activeFilter={tableFilter}
              onFilterChange={setTableFilter}
            />
          )}

          {csvPending && (
            <div className="rounded-md border bg-muted/30 p-4 space-y-3">
              <h4 className="font-semibold text-sm">Which list should these contacts go into?</h4>
              <p className="text-xs text-muted-foreground">
                {csvPending.rows.length} contacts ready to import. You can also skip and assign later.
              </p>
              <div className="flex flex-wrap gap-2">
                {segments.map((seg) => {
                  const active = csvPending.selectedTags.includes(seg.id);
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() =>
                        setCsvPending((prev) =>
                          prev
                            ? {
                                ...prev,
                                selectedTags: active
                                  ? prev.selectedTags.filter((t) => t !== seg.id)
                                  : [...prev.selectedTags, seg.id],
                              }
                            : prev,
                        )
                      }
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                        active ? "border-foreground bg-foreground text-background" : "bg-background"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
                      {seg.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setInlineListForm("csv")}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed px-3 py-1.5 text-xs text-orange-600 hover:bg-orange-50"
                >
                  <Plus className="h-3 w-3" /> Create a new list for this import
                </button>
              </div>
              {inlineListForm === "csv" && (
                <div className="rounded-md border bg-background p-3 space-y-2">
                  <Input
                    placeholder="List name"
                    value={inlineListName}
                    onChange={(e) => setInlineListName(e.target.value)}
                  />
                  <div className="flex gap-2 items-center">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setInlineListColor(c)}
                        className={`h-5 w-5 rounded-full border-2 transition ${
                          inlineListColor === c ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                    <Button size="sm" onClick={() => createInlineList("csv")}>Create</Button>
                    <Button size="sm" variant="ghost" onClick={() => setInlineListForm(null)}>Cancel</Button>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={confirmCsvImport}>Import {csvPending.rows.length} contacts</Button>
                <Button size="sm" variant="ghost" onClick={() => setCsvPending(null)}>Cancel</Button>
              </div>
            </div>
          )}

          {showAddForm && (
            <div className="p-3 rounded-md border bg-muted/30 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Name (optional)"
                  value={newSub.name}
                  onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                />
                <Input
                  placeholder="email@example.com"
                  value={newSub.email}
                  type="email"
                  onChange={(e) => setNewSub({ ...newSub, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Add to a list (optional)</Label>
                {segments.length > 0 && (
                  <div className="space-y-1.5">
                    {segments.map((seg) => {
                      const active = newSub.tags.includes(seg.id);
                      return (
                        <label key={seg.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={active}
                            onCheckedChange={() =>
                              setNewSub((prev) => ({
                                ...prev,
                                tags: active
                                  ? prev.tags.filter((t) => t !== seg.id)
                                  : [...prev.tags, seg.id],
                              }))
                            }
                          />
                          <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
                          {seg.name}
                        </label>
                      );
                    })}
                  </div>
                )}
                {inlineListForm === "add" ? (
                  <div className="rounded-md border bg-background p-3 space-y-2 mt-2">
                    <Input
                      placeholder="List name"
                      value={inlineListName}
                      onChange={(e) => setInlineListName(e.target.value)}
                    />
                    <div className="flex gap-2 items-center">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setInlineListColor(c)}
                          className={`h-5 w-5 rounded-full border-2 transition ${
                            inlineListColor === c ? "border-foreground scale-110" : "border-transparent"
                          }`}
                          style={{ background: c }}
                        />
                      ))}
                      <Button size="sm" onClick={() => createInlineList("add")}>Create</Button>
                      <Button size="sm" variant="ghost" onClick={() => setInlineListForm(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setInlineListForm("add")}
                    className="text-xs text-orange-600 hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <Plus className="h-3 w-3" /> Create new list
                  </button>
                )}
              </div>
              <Button onClick={addSubscriber}>Add</Button>
            </div>
          )}

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 rounded-md border bg-accent-soft px-3 py-2">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Tag className="h-3.5 w-3.5" /> Tag selected
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Apply segment</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {segments.map((seg) => (
                    <DropdownMenuItem key={seg.id} onClick={() => bulkApplyTag(seg.id)}>
                      <span className="h-2 w-2 rounded-full mr-2" style={{ background: seg.color }} />
                      {seg.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="outline" onClick={bulkExport}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              <Button size="sm" variant="outline" onClick={bulkRemove}>
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="ml-auto">
                Clear
              </Button>
            </div>
          )}

          {(() => {
            const filtered = tableFilter
              ? subscribers.filter((s) => s.tags.includes(tableFilter))
              : subscribers;
            return subscribers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No subscribers yet. Add one or import a CSV to get started.
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No subscribers in this list yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size > 0 && selectedIds.size === filtered.length}
                        onCheckedChange={(c) => toggleSelectAll(Boolean(c))}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(s.id)}
                          onCheckedChange={(c) => toggleSelected(s.id, Boolean(c))}
                        />
                      </TableCell>
                      <TableCell>{s.name || "—"}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {s.tags.map((tagId) => {
                            const seg = segmentMap[tagId];
                            if (!seg) return null;
                            return (
                              <button
                                key={tagId}
                                type="button"
                                onClick={() => setTableFilter(tagId === tableFilter ? null : tagId)}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium hover:opacity-80 transition"
                                style={{
                                  background: `${seg.color}22`,
                                  color: seg.color,
                                }}
                                title={`Filter by ${seg.name}`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: seg.color }} />
                                {seg.name}
                              </button>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === "active" ? "default" : "secondary"}>
                          {s.status === "active" ? "Active" : "Unsubscribed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Tags</DropdownMenuLabel>
                            {segments.map((seg) => (
                              <DropdownMenuCheckboxItem
                                key={seg.id}
                                checked={s.tags.includes(seg.id)}
                                onCheckedChange={() => toggleSubscriberTag(s.id, seg.id)}
                              >
                                <span className="h-2 w-2 rounded-full mr-2" style={{ background: seg.color }} />
                                {seg.name}
                              </DropdownMenuCheckboxItem>
                            ))}
                            {s.status === "active" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => removeSubscriber(s.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
          })()}
        </CardContent>
      </Card>
      </DropZone>

      {/* 4. Compose */}
      <Card>
        <CardHeader>
          <CardTitle>Compose</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showGenPanel && (
            <GeneratePanel
              pillars={pillars}
              themes={themes}
              generating={generating}
              onGenerate={generateWithMoxie}
            />
          )}

          <div className="space-y-2">
            <Label>Subject line</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your newsletter subject"
            />
            {previewText && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Preview text: {previewText}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = window.prompt("Edit preview text", previewText);
                    if (next !== null) setPreviewText(next);
                  }}
                  className="inline-flex items-center hover:text-foreground"
                  title="Edit preview text"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}
            {!showGenPanel && (
              <button
                type="button"
                onClick={() => setShowGenPanel(true)}
                className="text-xs text-orange-600 hover:underline"
              >
                Regenerate with MOXIEMO
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Body</Label>
            <RichTextEditor
              content={body}
              onChange={setBody}
              placeholder="Write your newsletter..."
            />
          </div>

          {/* CTA Block */}
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Call to action
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <Checkbox
                  checked={ctaEnabled}
                  onCheckedChange={(v) => setCtaEnabled(Boolean(v))}
                />
                <span>Include a button</span>
              </label>
            </div>
            {ctaEnabled && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Button label</Label>
                  <Input
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder={`e.g. ${suggestedCtaLabel}, Download the guide, Learn more`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Button URL</Label>
                  <Input
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://"
                  />
                </div>
                <ColorPickerRow
                  label="Button color"
                  value={ctaBgColor}
                  onChange={setCtaBgColor}
                />
                <ColorPickerRow
                  label="Button text color"
                  value={ctaTextColor}
                  onChange={setCtaTextColor}
                />
                <div className="rounded-md border bg-white p-4 text-center">
                  <a
                    href={ctaUrl || "#"}
                    onClick={(e) => e.preventDefault()}
                    style={{
                      display: "inline-block",
                      background: ctaBgColor,
                      color: ctaTextColor,
                      padding: "12px 24px",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    {ctaLabel.trim() || suggestedCtaLabel}
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 5. Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Preview</CardTitle>
            <div className="inline-flex rounded-md border bg-muted p-0.5">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`px-3 py-1 text-xs rounded ${
                  previewMode === "desktop" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                Desktop
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`px-3 py-1 text-xs rounded ${
                  previewMode === "mobile" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                Mobile
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div
              className={`bg-white border rounded-md p-6 mx-auto ${
                previewMode === "mobile" ? "max-w-[375px]" : "w-full"
              }`}
            >
              <h3 className="font-semibold text-lg mb-3 text-gray-900">
                {subject || "Subject preview"}
              </h3>
              <div
                className="text-sm text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: bodyWithCta() || "<p>Body preview...</p>",
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. Send / Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Send or schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastSent ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-3">
              <div className="flex justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-900">Email sent!</h3>
              <div className="text-sm text-green-900 space-y-1">
                <p>Delivered to <span className="font-semibold">{lastSent.count}</span> subscribers</p>
                <p>Subject: <span className="font-medium">{lastSent.subject}</span></p>
                <p>Sent: {lastSent.sentAt}</p>
              </div>
              <Button onClick={resetCompose} className="bg-orange-600 hover:bg-orange-700 text-white">
                Write another email
              </Button>
            </div>
          ) : !showSendPanel ? (
            <div className="space-y-3">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={saveDraft}
                  disabled={sending || (!subject.trim() && !body.trim())}
                  className="sm:order-1 order-3"
                >
                  Save as Draft
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!subject.trim() || !body.trim()) {
                      toast.error("Add a subject and body first");
                      return;
                    }
                    setScheduleOpen(true);
                  }}
                  disabled={activeSubscribers.length === 0 || needsSetup}
                  className="sm:order-2 order-2"
                >
                  <CalendarDays className="h-4 w-4" /> Schedule
                </Button>
                <Button
                  onClick={openSendPanel}
                  disabled={activeSubscribers.length === 0 || needsSetup}
                  className="bg-orange-600 hover:bg-orange-700 text-white sm:order-3 order-1"
                >
                  <Send className="h-4 w-4" /> Send now
                </Button>
              </div>
              {draftSavedAt && (
                <p className="text-xs text-green-700 text-right">Saved to drafts</p>
              )}
            </div>
          ) : (
            <div className="relative rounded-lg border bg-muted/30 p-4 space-y-4">
              {sending && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/90 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                  <p className="font-semibold">Sending your email...</p>
                  <p className="text-sm text-muted-foreground">
                    Delivering to {sendRecipientIds.length} subscribers
                  </p>
                  <p className="text-xs text-muted-foreground">Please don't close this window</p>
                </div>
              )}

              {sendStep === 1 ? (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Step 1 — Choose your audience</h4>
                    <button onClick={() => setShowSendPanel(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">Who are you sending this to?</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 rounded-md border bg-background p-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={audienceMode === "all"}
                        onChange={() => setAudienceMode("all")}
                      />
                      <span className="text-sm font-medium">All active subscribers</span>
                      <span className="text-xs text-muted-foreground ml-auto">{activeSubscribers.length} total</span>
                    </label>

                    <div className="rounded-md border bg-background p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Or choose specific lists:</p>
                      {segments.length === 0 ? (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>No lists yet — add subscribers to lists to send to specific groups.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowSendPanel(false);
                              document.getElementById("subscribers-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className="text-orange-600 hover:underline"
                          >
                            Manage lists →
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {segments.map((seg) => {
                            const checked = sendSegmentIds.includes(seg.id);
                            return (
                              <label
                                key={seg.id}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs cursor-pointer transition ${
                                  checked ? "border-foreground bg-foreground text-background" : "bg-background"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={checked}
                                  onChange={() => {
                                    setAudienceMode("segment");
                                    setSendSegmentIds((prev) =>
                                      checked ? prev.filter((id) => id !== seg.id) : [...prev, seg.id],
                                    );
                                  }}
                                />
                                <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
                                {seg.name} ({segmentCounts[seg.id] ?? 0})
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <label className={`flex items-center gap-3 rounded-md border bg-background p-3 ${selectedIds.size === 0 ? "opacity-50" : "cursor-pointer"}`}>
                      <input
                        type="radio"
                        checked={audienceMode === "selected"}
                        onChange={() => setAudienceMode("selected")}
                        disabled={selectedIds.size === 0}
                      />
                      <span className="text-sm font-medium">Selected contacts only</span>
                      <span className="text-xs text-muted-foreground ml-auto">{selectedIds.size} selected</span>
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => setShowSendPanel(false)}>Cancel</Button>
                    <Button
                      onClick={() => setSendStep(2)}
                      disabled={
                        (audienceMode === "segment" && sendSegmentIds.length === 0) ||
                        (audienceMode === "selected" && selectedIds.size === 0) ||
                        sendRecipientIds.length === 0
                      }
                    >
                      Continue
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Ready to send?</h4>
                    <button onClick={() => setShowSendPanel(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="rounded-md bg-background border p-4 text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Sending to:</span><span className="font-medium">{sendAudienceLabel} — {sendRecipientIds.length} recipients</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Subject:</span><span className="font-medium truncate max-w-[60%] text-right">{subject}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">From:</span><span className="font-medium">{settings.from_name || "MOXIEMO"} &lt;hello@mail.buildwithmoxiemo.com&gt;</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Replies to:</span><span className="font-medium">{settings.reply_to || "—"}</span></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      onClick={() => { setSendMode("now"); setConfirmOpen(true); }}
                      disabled={sendRecipientIds.length === 0}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Zap className="h-4 w-4" /> Send now
                    </Button>
                    <Button
                      variant={sendMode === "schedule" ? "default" : "outline"}
                      onClick={() => setSendMode(sendMode === "schedule" ? "now" : "schedule")}
                      disabled={sendRecipientIds.length === 0}
                    >
                      <CalendarDays className="h-4 w-4" /> Schedule
                    </Button>
                    <Button
                      variant="outline"
                      onClick={saveQueued}
                      disabled={sendRecipientIds.length === 0 || sending}
                    >
                      <ClipboardList className="h-4 w-4" /> Save to queue
                    </Button>
                  </div>

                  {sendMode === "schedule" && (
                    <div className="rounded-md border bg-background p-4 space-y-3">
                      <h5 className="text-sm font-semibold">Pick a date and time</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Date</Label>
                          <Input
                            type="date"
                            value={scheduleDate}
                            min={minScheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Time</Label>
                          <select
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {Array.from({ length: 48 }).map((_, i) => {
                              const h = String(Math.floor(i / 2)).padStart(2, "0");
                              const m = i % 2 === 0 ? "00" : "30";
                              const v = `${h}:${m}`;
                              return (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Timezone: {userTimezone}</p>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setSendMode("now")}>Cancel</Button>
                        <Button onClick={saveScheduled} disabled={sending || !scheduleDate}>
                          Confirm schedule
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-start">
                    <Button variant="ghost" onClick={() => setSendStep(1)}>Back</Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. Sent emails log */}
      <Card>
        <CardHeader>
          <CardTitle>Sent emails</CardTitle>
        </CardHeader>
        <CardContent>
          {sends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No emails sent yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Sent to</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sends.map((s) => {
                  const ids = s.segment && s.segment !== "all" ? s.segment.split(",") : [];
                  const segName =
                    !s.segment || s.segment === "all"
                      ? "All subscribers"
                      : ids.map((id) => segmentMap[id]?.name).filter(Boolean).join(", ") || "List";
                  const segColor = ids.length === 1 ? segmentMap[ids[0]]?.color : null;
                  const status = s.status || "sent";
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="max-w-xs truncate">{s.subject || "—"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 text-xs">
                          {segColor && (
                            <span className="h-2 w-2 rounded-full" style={{ background: segColor }} />
                          )}
                          {segName}
                        </span>
                      </TableCell>
                      <TableCell>
                        {status === "sent" && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Sent</Badge>
                        )}
                        {status === "scheduled" && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Scheduled</Badge>
                        )}
                        {status === "queued" && (
                          <Badge variant="secondary">Queued</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {status === "scheduled" && s.scheduled_for ? (
                          <div className="flex flex-col">
                            <span>{new Date(s.scheduled_for).toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">{countdownLabel(s.scheduled_for)}</span>
                          </div>
                        ) : status === "queued" ? (
                          <span className="text-muted-foreground">—</span>
                        ) : s.sent_at ? (
                          new Date(s.sent_at).toLocaleDateString()
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{s.recipient_count ?? 0}</TableCell>
                      <TableCell className="text-right">
                        {status === "queued" && (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="outline" onClick={() => sendFromLog(s)}>
                              <Send className="h-3 w-3" /> Send now
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteSendRow(s.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {status === "scheduled" && (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="outline" onClick={() => sendFromLog(s)}>
                              <Send className="h-3 w-3" /> Send now
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => rescheduleSend(s)}>
                              Reschedule
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteSendRow(s.id)}>
                              Cancel
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Send confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-600" /> Ready to send?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will send immediately to <span className="font-semibold text-foreground">{sendRecipientIds.length}</span> subscribers. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); doSendNow(); }}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={sending}
            >
              {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : "Yes, send it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule modal */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-orange-600" /> Schedule send
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={scheduleDate}
                  min={minScheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <select
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {Array.from({ length: 48 }).map((_, i) => {
                    const h = String(Math.floor(i / 2)).padStart(2, "0");
                    const m = i % 2 === 0 ? "00" : "30";
                    const v = `${h}:${m}`;
                    return (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Timezone</Label>
              <Input
                value={scheduleTz}
                onChange={(e) => setScheduleTz(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setScheduleOpen(false)}
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline mr-auto"
            >
              Cancel
            </button>
            <Button
              onClick={async () => {
                await saveScheduled();
                setScheduleOpen(false);
              }}
              disabled={sending || !scheduleDate}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Schedule send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
