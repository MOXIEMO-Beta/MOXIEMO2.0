import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Save,
  Send,
  Pencil,
  Trash2,
  ArrowRight,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

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
  { value: "LinkedIn Post", label: "LinkedIn Post", icon: Linkedin },
  { value: "Facebook Post", label: "Facebook Post", icon: Facebook },
  { value: "Instagram Caption", label: "Instagram Caption", icon: Instagram },
];

const CONTENT_TYPES = [
  "Educational",
  "Personal Story",
  "Poll",
  "Case Study",
  "CTA",
];

function platformIcon(platform: string | null) {
  const p = PLATFORMS.find((x) => x.value === platform);
  const Icon = p?.icon ?? FileText;
  return <Icon className="h-5 w-5 text-foreground" />;
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 16);
}

export default function Content() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<any>(null);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate tab state
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState(PLATFORMS[0].value);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [stratRes, itemsRes] = await Promise.all([
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
      ]);
      if (cancelled) return;
      if (stratRes.error) console.error(stratRes.error);
      if (itemsRes.error) console.error(itemsRes.error);
      setStrategy(stratRes.data ?? null);
      setItems((itemsRes.data ?? []) as ContentItem[]);
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

  async function handleGenerate() {
    if (!topic.trim()) {
      toast.error("Add a topic first");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { topic, platform, contentType, strategy },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setGenerated((data as any).body ?? "");
    } catch (e: any) {
      console.error(e);
      toast.error("Couldn't generate", { description: e?.message ?? "Try again." });
    } finally {
      setGenerating(false);
    }
  }

  async function saveItem(status: "draft" | "queued") {
    if (!user || !generated.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("content_items")
        .insert({
          user_id: user.id,
          platform,
          content_type: contentType,
          topic,
          body: generated,
          status,
        })
        .select()
        .single();
      if (error) throw error;
      setItems((prev) => [data as ContentItem, ...prev]);
      toast.success(status === "draft" ? "Saved as draft" : "Added to queue");
      setGenerated("");
      setTopic("");
    } catch (e: any) {
      console.error(e);
      toast.error("Couldn't save", { description: e?.message ?? "Try again." });
    } finally {
      setSaving(false);
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

  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Content</h1>
        <p className="text-muted-foreground">
          Strategy-aligned posts, generated and queued — ready to publish.
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
          <Card className="p-6 border-border shadow-soft space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                What do you want to write about?
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. why most operators struggle to delegate"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Platform</label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate with MOXIE</>
              )}
            </Button>
          </Card>

          {(generated || generating) && (
            <Card className="p-6 border-border shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Draft preview
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {platformIcon(platform)} {platform} · {contentType}
                </div>
              </div>
              <Textarea
                value={generated}
                onChange={(e) => setGenerated(e.target.value)}
                rows={14}
                className="font-mono text-sm leading-relaxed"
                placeholder={generating ? "Generating…" : ""}
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => saveItem("draft")}
                  disabled={saving || !generated.trim()}
                >
                  <Save className="mr-2 h-4 w-4" /> Save as Draft
                </Button>
                <Button
                  onClick={() => saveItem("queued")}
                  disabled={saving || !generated.trim()}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  <ArrowRight className="mr-2 h-4 w-4" /> Add to Queue
                </Button>
              </div>
            </Card>
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
                      {(it.body ?? "").slice(0, 80)}{(it.body ?? "").length > 80 ? "…" : ""}
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
                      {(it.body ?? "").slice(0, 80)}{(it.body ?? "").length > 80 ? "…" : ""}
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
