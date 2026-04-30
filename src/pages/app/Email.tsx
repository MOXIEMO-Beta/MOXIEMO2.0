import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";
import GeneratePanel, { type GenerateParams } from "@/components/email/GeneratePanel";
import SegmentsManager, { type Segment, PRESET_COLORS } from "@/components/email/SegmentsManager";

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
};

export default function Email() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showGenPanel, setShowGenPanel] = useState(true);
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
          "positioning_statement, ideal_client, pain_point, voice_attributes, anti_positioning, content_pillars, content_themes",
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

  // Collapse "how it works" by default if user has already sent emails
  useEffect(() => {
    if (sends.length > 0) setHowItWorksOpen(false);
  }, [sends.length]);

  async function generateWithMoxie(params: GenerateParams) {
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
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.subject) setSubject(data.subject);
      if (data?.body) setBody(data.body);
      if (data?.preview_text) setPreviewText(data.preview_text);
      setShowGenPanel(false);
      toast.success("Draft ready — personalize the brackets before sending");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate";
      toast.error(message);
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
    setShowSendPanel(true);
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

  async function confirmSend() {
    setSending(true);
    try {
      const payload: Record<string, unknown> = { subject, body };
      if (audienceMode === "selected") {
        payload.subscriber_ids = Array.from(selectedIds);
      } else if (audienceMode === "segment" && sendSegmentIds.length > 0) {
        payload.subscriber_ids = sendRecipientIds;
        payload.segment = sendSegmentIds.join(",");
      }
      const { data, error } = await supabase.functions.invoke("send-email", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Sent to ${data.sent_count} subscribers`);
      setSubject("");
      setBody("");
      setPreviewText("");
      setShowSendPanel(false);
      setSelectedIds(new Set());
      loadAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send";
      toast.error(message);
    } finally {
      setSending(false);
    }
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

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
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

  const pillars: string[] = Array.isArray(strategy?.content_pillars)
    ? (strategy!.content_pillars as unknown[]).map((p) =>
        typeof p === "string" ? p : (p as { label?: string; name?: string; title?: string })?.label || (p as { name?: string }).name || (p as { title?: string }).title || "",
      ).filter(Boolean)
    : [];
  const themes: Array<Record<string, string> | string> = Array.isArray(strategy?.content_themes)
    ? (strategy!.content_themes as Array<Record<string, string> | string>)
    : [];

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email</h1>
        <p className="text-muted-foreground mt-1">
          Write, generate, and send newsletters to your audience.
        </p>
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

      {/* How email sending works */}
      <Card>
        <CardHeader className="pb-3">
          <button
            onClick={() => setHowItWorksOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">How MOXIE sends your emails</CardTitle>
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
                Your emails send through MOXIE's secure sending infrastructure. Your name appears as the sender — your subscribers won't see "MOXIE" anywhere.
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
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Want to send from your own domain (e.g. karee@yourdomain.com)?{" "}
                <button
                  onClick={() =>
                    settingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="underline hover:text-foreground"
                >
                  Add your domain in Sending Details
                </button>{" "}
                for full brand control.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Compose */}
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
                Regenerate with MOXIE
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Preview</Label>
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
                    __html: body || "<p>Body preview...</p>",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Send panel */}
          {!showSendPanel ? (
            <div className="pt-2">
              <Button
                onClick={openSendPanel}
                disabled={activeSubscribers.length === 0 || needsSetup}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                size="lg"
              >
                <Send className="h-4 w-4" /> Send email
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
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
                    <h4 className="font-semibold">Step 2 — Confirm and send</h4>
                    <button onClick={() => setShowSendPanel(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="rounded-md bg-background border p-4 text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Sending to:</span><span className="font-medium">{sendAudienceLabel}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Recipients:</span><span className="font-medium">{sendRecipientIds.length} contacts</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Subject:</span><span className="font-medium truncate max-w-[60%] text-right">{subject}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">From:</span><span className="font-medium">{settings.from_name || "MOXIE"} &lt;hello@mail.usemoxie.com&gt;</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Replies to:</span><span className="font-medium">{settings.reply_to || "—"}</span></div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => setSendStep(1)}>Back</Button>
                    <Button
                      onClick={confirmSend}
                      disabled={sending || sendRecipientIds.length === 0}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {sending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                      ) : (
                        "Send now"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscribers */}
      <Card>
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
              totalActive={activeSubscribers.length}
              userId={user.id}
              onChange={loadAll}
            />
          )}

          {csvPending && (
            <div className="rounded-md border bg-muted/30 p-4 space-y-3">
              <h4 className="font-semibold text-sm">Tag this import</h4>
              <p className="text-xs text-muted-foreground">
                Which segment should these {csvPending.rows.length} contacts go into? (optional)
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
              </div>
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
              {segments.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Tags (optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {segments.map((seg) => {
                      const active = newSub.tags.includes(seg.id);
                      return (
                        <button
                          key={seg.id}
                          type="button"
                          onClick={() =>
                            setNewSub((prev) => ({
                              ...prev,
                              tags: active
                                ? prev.tags.filter((t) => t !== seg.id)
                                : [...prev.tags, seg.id],
                            }))
                          }
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                            active ? "border-foreground bg-foreground text-background" : "bg-background"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ background: seg.color }} />
                          {seg.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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

          {subscribers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No subscribers yet. Add one or import a CSV to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.size > 0 && selectedIds.size === subscribers.length}
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
                {subscribers.map((s) => (
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
                            <span
                              key={tagId}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{
                                background: `${seg.color}22`,
                                color: seg.color,
                              }}
                            >
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: seg.color }} />
                              {seg.name}
                            </span>
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
          )}
        </CardContent>
      </Card>

      {/* Sent emails */}
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
                  <TableHead>Sent</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Open rate</TableHead>
                  <TableHead>Click rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sends.map((s) => {
                  const segName =
                    !s.segment || s.segment === "all"
                      ? "All subscribers"
                      : segmentMap[s.segment]?.name || "Segment";
                  const segColor =
                    s.segment && s.segment !== "all" ? segmentMap[s.segment]?.color : null;
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
                        {s.sent_at ? new Date(s.sent_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>{s.recipient_count ?? 0}</TableCell>
                      <TableCell>
                        {s.open_rate != null ? `${Math.round(s.open_rate * 100)}%` : "—"}
                      </TableCell>
                      <TableCell>
                        {s.click_rate != null ? `${Math.round(s.click_rate * 100)}%` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
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
          <p className="text-xs text-muted-foreground">
            Beta 1: emails send from MOXIE's verified domain. Custom domain support coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
