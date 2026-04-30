import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/email/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { AlertTriangle, Upload, Loader2, Trash2, Plus, Pencil } from "lucide-react";
import GeneratePanel, { type GenerateParams } from "@/components/email/GeneratePanel";

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  subscribed_at: string;
};

type EmailSend = {
  id: string;
  subject: string | null;
  sent_at: string | null;
  recipient_count: number | null;
  open_rate: number | null;
  click_rate: number | null;
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
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [settings, setSettings] = useState<EmailSettings>({});
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", email: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const activeSubscribers = useMemo(
    () => subscribers.filter((s) => s.status === "active"),
    [subscribers],
  );

  async function loadAll() {
    if (!user) return;
    const [subsRes, sendsRes, profileRes, strategyRes] = await Promise.all([
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
        .select("email_settings")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("strategies")
        .select(
          "positioning_statement, ideal_client, pain_point, voice_attributes, anti_positioning, content_pillars, content_themes",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    setSubscribers((subsRes.data as Subscriber[]) || []);
    setSends((sendsRes.data as EmailSend[]) || []);
    const s = (profileRes.data?.email_settings as EmailSettings) || {};
    setSettings(s);
    setStrategy((strategyRes.data as Strategy) || null);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function generateWithMoxie(params: GenerateParams) {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-email", {
        body: { topic: params.topic, emailType: params.emailType },
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

  async function sendEmail() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Add a subject and body first");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { subject, body },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Sent to ${data.sent_count} subscribers`);
      setSubject("");
      setBody("");
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
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Subscriber added");
    setNewSub({ name: "", email: "" });
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

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    // detect header
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
        return { user_id: user.id, email, name: name || null, status: "active" };
      })
      .filter(Boolean) as Array<{ user_id: string; email: string; name: string | null; status: string }>;

    if (rows.length === 0) {
      toast.error("No valid emails found in CSV");
      return;
    }
    const { error } = await supabase.from("subscribers").insert(rows);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Imported ${rows.length} subscribers`);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const needsSetup = !settings.from_email;

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
              Set up your sending details to start emailing your audience.
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

          <div className="flex flex-col gap-3 pt-2">
            <p className="text-sm text-muted-foreground text-center">
              Sending to {activeSubscribers.length} subscriber
              {activeSubscribers.length === 1 ? "" : "s"}
            </p>
            <Button
              onClick={sendEmail}
              disabled={sending || activeSubscribers.length === 0 || needsSetup}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              size="lg"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                "Send to all subscribers"
              )}
            </Button>
          </div>
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
          {showAddForm && (
            <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-md border bg-muted/30">
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
              <Button onClick={addSubscriber}>Add</Button>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name || "—"}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>
                      {s.subscribed_at
                        ? new Date(s.subscribed_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === "active" ? "default" : "secondary"}>
                        {s.status === "active" ? "Active" : "Unsubscribed"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSubscriber(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
                  <TableHead>Sent</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Open rate</TableHead>
                  <TableHead>Click rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sends.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="max-w-xs truncate">{s.subject || "—"}</TableCell>
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
                ))}
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
          </div>
          <div className="space-y-2">
            <Label>From email</Label>
            <Input
              value={settings.from_email || ""}
              onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
              placeholder="hello@yourdomain.com"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label>Reply-to email</Label>
            <Input
              value={settings.reply_to || ""}
              onChange={(e) => setSettings({ ...settings, reply_to: e.target.value })}
              placeholder="you@yourdomain.com"
              type="email"
            />
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
            To improve deliverability, add a custom domain in your Resend account at
            resend.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}