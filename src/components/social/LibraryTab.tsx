import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Upload,
  Palette,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  Linkedin,
  Facebook,
  Instagram,
  Trash2,
  Download,
  FolderOpen,
  Image as ImageIcon,
  LayoutTemplate,
  Sparkles,
  X,
  Check,
  Copy,
  Bookmark,
  Send,
  Calendar as CalendarIcon,
  Tag as TagIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Platform = "linkedin" | "facebook" | "instagram";

type SocialPost = {
  id: string;
  user_id: string;
  platforms: string[] | null;
  content_by_platform: Record<string, string> | null;
  pillar: string | null;
  topic: string | null;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
  is_template: boolean;
  is_inspiration: boolean;
  image_urls: string[] | null;
};

type StorageAsset = {
  name: string;
  fullPath: string; // userId/filename
  size: number;
  updated_at: string;
  signedUrl: string;
  mime: string;
};

type FilterTab =
  | "all"
  | "drafts"
  | "queued"
  | "scheduled"
  | "published"
  | "images"
  | "templates"
  | "inspiration";

type SortKey = "newest" | "oldest" | "platform" | "pillar" | "status";

type Props = {
  userId: string | null;
  onEditPost: (postId: string) => void;
  onUseImage: (url: string) => void;
  onUseTemplate: (body: string, personalize: boolean) => void;
  onUseInspiration: (body: string) => void;
  onCreateNew: () => void;
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "drafts", label: "Drafts" },
  { key: "queued", label: "Queued" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "images", label: "Images" },
  { key: "templates", label: "Templates" },
  { key: "inspiration", label: "Inspiration" },
];

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  platform: "Platform",
  pillar: "Pillar",
  status: "Status",
};

const MOXIE_TEMPLATES: { id: string; title: string; bestFor: string; body: string }[] = [
  {
    id: "framework",
    title: "Framework post",
    bestFor: "All founders",
    body: `Most [ideal clients] get [pain point] wrong.

Here's what they miss:

1. [First insight]
2. [Second insight]
3. [Third insight]

The shift happens when you [key realization].

Which of these resonates most with where you are right now?`,
  },
  {
    id: "transformation",
    title: "Client transformation",
    bestFor: "All expertise-based founders",
    body: `[Client type] came to me [time period] ago.

They were [pain point].

Today: [transformation result].

What changed? [One-sentence answer].

If you're still [pain point], this is your sign.`,
  },
  {
    id: "unpopular",
    title: "Unpopular opinion",
    bestFor: "All founders",
    body: `Unpopular opinion: [Contrarian take related to your positioning].

Here's why I believe this:

[2-3 sentences of reasoning]

[Specific example or proof]

Do you agree or disagree? Tell me below.`,
  },
  {
    id: "expertise-tax",
    title: "The Expertise Tax",
    bestFor: "Consultants + Fractional Execs",
    body: `You're leaving money on the table.

Not because you lack expertise.
Because no one can see it.

[X years] of [expertise area] — and your online presence
says nothing about what you actually know.

Here's what that costs you:

→ Prospects who can't tell you apart from someone
  with half your experience
→ Discovery calls where you spend 20 minutes
  proving your credibility before the real conversation starts
→ Clients who choose someone louder over someone better

Your expertise isn't the problem.
Your positioning is.

What would change if your ideal clients could see
exactly what you're capable of before they ever talk to you?`,
  },
  {
    id: "tool-chaos",
    title: "The Tool Chaos Reality",
    bestFor: "All expertise-based founders",
    body: `My marketing stack last year:

[Tool 1]. [Tool 2]. [Tool 3].
[Tool 4]. [Tool 5]. [Tool 6].

Hours spent managing them: too many.
Hours spent on actual strategy: not enough.
Clients acquired from all that effort: [honest number].

The problem wasn't the tools.
It was that I was running the tools instead of running the business.

The shift happened when I stopped asking
"what tool do I need?" and started asking
"what strategy should the tools serve?"

What does your marketing stack actually look like right now?`,
  },
  {
    id: "revenue-milestone",
    title: "The Revenue Milestone Reframe",
    bestFor: "$250K+ founders",
    body: `$[revenue milestone] felt like it would change everything.

It did — just not in the way I expected.

I thought hitting that number meant I'd finally feel like
I had it figured out.

Instead I felt:
→ More visible but less clear on my message
→ More clients but less sure who I actually wanted to serve
→ More revenue but more time on things that drained me

The messy middle is real.

Revenue proves you can sell.
It doesn't automatically give you positioning, clarity, or direction.

That work is different — and it's the work most high-earners skip.

Are you in the messy middle right now?
What does it actually feel like from the inside?`,
  },
];

const PLATFORM_BG: Record<string, string> = {
  linkedin: "#EBF4FF",
  instagram: "#F5E6FF",
  facebook: "#EEF0FF",
  multi: "#FFF0F0",
};

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function PlatformIcon({ p, className }: { p: Platform; className?: string }) {
  if (p === "linkedin") return <Linkedin className={cn("h-4 w-4 text-[#0A66C2]", className)} />;
  if (p === "facebook") return <Facebook className={cn("h-4 w-4 text-[#1877F2]", className)} />;
  return <Instagram className={cn("h-4 w-4 text-[#DD2A7B]", className)} />;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    queued: "bg-amber-100 text-amber-700",
    scheduled: "bg-blue-100 text-blue-700",
    published: "bg-emerald-100 text-emerald-700",
  };
  return map[status] ?? "bg-muted text-muted-foreground";
}

function getPostBody(p: SocialPost): string {
  const c = p.content_by_platform ?? {};
  const first = Object.values(c).find((v) => typeof v === "string" && v.trim()) as string | undefined;
  return (first ?? "").trim();
}

function getCardBg(platforms: string[] | null): string {
  if (!platforms || platforms.length === 0) return PLATFORM_BG.multi;
  if (platforms.length > 1) return PLATFORM_BG.multi;
  return PLATFORM_BG[platforms[0]] ?? PLATFORM_BG.multi;
}

export default function LibraryTab({
  userId,
  onEditPost,
  onUseImage,
  onUseTemplate,
  onUseInspiration,
  onCreateNew,
}: Props) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [assets, setAssets] = useState<StorageAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAll = async () => {
    if (!userId) return;
    setLoading(true);
    const [postsRes, assetsRes] = await Promise.all([
      supabase
        .from("social_posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.storage.from("social-assets").list(userId, {
        limit: 200,
        sortBy: { column: "created_at", order: "desc" },
      }),
    ]);
    if (postsRes.error) console.error(postsRes.error);
    setPosts((postsRes.data as unknown as SocialPost[]) ?? []);

    if (assetsRes.error) {
      console.error(assetsRes.error);
      setAssets([]);
    } else {
      const files = (assetsRes.data ?? []).filter((f) => f.name && !f.name.startsWith("."));
      const signed = await Promise.all(
        files.map(async (f) => {
          const fullPath = `${userId}/${f.name}`;
          const { data } = await supabase.storage.from("social-assets").createSignedUrl(fullPath, 3600);
          return {
            name: f.name,
            fullPath,
            size: (f.metadata as { size?: number })?.size ?? 0,
            updated_at: (f as { updated_at?: string }).updated_at ?? f.created_at ?? new Date().toISOString(),
            signedUrl: data?.signedUrl ?? "",
            mime: (f.metadata as { mimetype?: string })?.mimetype ?? "image/png",
          } as StorageAsset;
        }),
      );
      setAssets(signed);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /* ---------- File upload ---------- */
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large", { description: "Max size is 50MB" });
      return;
    }
    setUploading(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("social-assets").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
    });
    setUploading(false);
    if (e.target) e.target.value = "";
    if (error) {
      toast.error("Upload failed", { description: error.message });
      return;
    }
    toast.success("Uploaded");
    void loadAll();
  };

  const handleDeleteAsset = async (a: StorageAsset) => {
    if (!confirm(`Delete ${a.name}?`)) return;
    const { error } = await supabase.storage.from("social-assets").remove([a.fullPath]);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    setAssets((prev) => prev.filter((x) => x.fullPath !== a.fullPath));
    toast.success("Deleted");
  };

  /* ---------- Post actions ---------- */
  const updatePost = async (id: string, patch: Partial<SocialPost>) => {
    const { error } = await supabase.from("social_posts").update(patch).eq("id", id);
    if (error) {
      toast.error("Update failed");
      return;
    }
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const duplicatePost = async (p: SocialPost) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        user_id: userId,
        platforms: p.platforms ?? [],
        content_by_platform: p.content_by_platform ?? {},
        pillar: p.pillar,
        topic: p.topic,
        status: "draft",
        image_urls: p.image_urls ?? [],
      })
      .select("*")
      .single();
    if (error) {
      toast.error("Duplicate failed");
      return;
    }
    setPosts((prev) => [data as unknown as SocialPost, ...prev]);
    toast.success("Duplicated");
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("social_posts").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    toast.success("Deleted");
  };

  /* ---------- Bulk actions ---------- */
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const bulkUpdate = async (patch: Partial<SocialPost>) => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("social_posts").update(patch).in("id", ids);
    if (error) {
      toast.error("Bulk update failed");
      return;
    }
    setPosts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, ...patch } : p)));
    toast.success(`${ids.length} updated`);
    setSelected(new Set());
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (!confirm(`Delete ${ids.length} posts?`)) return;
    const { error } = await supabase.from("social_posts").delete().in("id", ids);
    if (error) {
      toast.error("Bulk delete failed");
      return;
    }
    setPosts((prev) => prev.filter((p) => !ids.includes(p.id)));
    setSelected(new Set());
    toast.success(`${ids.length} deleted`);
  };

  /* ---------- Filtering / sorting ---------- */
  const filteredPosts = useMemo(() => {
    let list = [...posts];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const body = getPostBody(p).toLowerCase();
        const pillar = (p.pillar ?? "").toLowerCase();
        const topic = (p.topic ?? "").toLowerCase();
        return body.includes(q) || pillar.includes(q) || topic.includes(q);
      });
    }
    switch (filter) {
      case "drafts":
        list = list.filter((p) => p.status === "draft" && !p.is_template && !p.is_inspiration);
        break;
      case "queued":
        list = list.filter((p) => p.status === "queued");
        break;
      case "scheduled":
        list = list.filter((p) => p.status === "scheduled");
        break;
      case "published":
        list = list.filter((p) => p.status === "published");
        break;
      case "templates":
        list = list.filter((p) => p.is_template);
        break;
      case "inspiration":
        list = list.filter((p) => p.is_inspiration);
        break;
      case "all":
        list = list.filter((p) => !p.is_template && !p.is_inspiration);
        break;
      default:
        break;
    }
    switch (sort) {
      case "newest":
        list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
        break;
      case "oldest":
        list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
        break;
      case "platform":
        list.sort((a, b) => (a.platforms?.[0] ?? "").localeCompare(b.platforms?.[0] ?? ""));
        break;
      case "pillar":
        list.sort((a, b) => (a.pillar ?? "").localeCompare(b.pillar ?? ""));
        break;
      case "status":
        list.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }
    return list;
  }, [posts, search, filter, sort]);

  const showImages = filter === "images";
  const showTemplatesSection = filter === "templates";
  const showInspirationSection = filter === "inspiration";

  /* ---------- Empty state helpers ---------- */
  const allEmpty = !loading && posts.length === 0 && assets.length === 0 && filter === "all" && !search;
  const imagesEmpty = !loading && showImages && assets.length === 0;
  const templatesEmpty = !loading && showTemplatesSection && filteredPosts.length === 0;

  return (
    <div className="space-y-5">
      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* TOP BAR */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts, topics, pillars..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleUploadClick} disabled={uploading}>
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading…" : "Upload image"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Canva import coming soon")}
          >
            <Palette className="mr-2 h-4 w-4" />
            Import from Canva
          </Button>
          <div className="ml-1 flex overflow-hidden rounded-md border border-border">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "p-2",
                view === "grid" ? "bg-accent text-accent-foreground" : "bg-background text-muted-foreground hover:bg-muted",
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "p-2",
                view === "list" ? "bg-accent text-accent-foreground" : "bg-background text-muted-foreground hover:bg-muted",
              )}
              aria-label="List view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FILTER PILLS + SORT */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {FILTER_TABS.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              Sort by: {SORT_LABELS[sort]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <DropdownMenuItem key={k} onClick={() => setSort(k)}>
                {SORT_LABELS[k]}
                {sort === k && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* MAIN CONTENT */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : allEmpty ? (
        <EmptyState
          icon={<FolderOpen className="h-10 w-10 text-accent" />}
          title="Your library is empty"
          subtitle="Posts you create, save, and upload will live here."
          actions={
            <>
              <Button onClick={onCreateNew} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Create your first post
              </Button>
              <Button variant="outline" onClick={handleUploadClick}>
                <Upload className="mr-2 h-4 w-4" /> Upload an image
              </Button>
            </>
          }
        />
      ) : showImages ? (
        imagesEmpty ? (
          <EmptyState
            icon={<ImageIcon className="h-10 w-10 text-accent" />}
            title="No images uploaded yet"
            subtitle="Upload images and graphics to attach to your posts."
            actions={
              <Button onClick={handleUploadClick} className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Upload className="mr-2 h-4 w-4" /> Upload image
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((a) => (
              <AssetCard key={a.fullPath} asset={a} onUse={onUseImage} onDelete={handleDeleteAsset} />
            ))}
          </div>
        )
      ) : showTemplatesSection ? (
        <TemplatesSection
          userTemplates={filteredPosts}
          empty={templatesEmpty}
          onUseUserTemplate={(p) => onUseTemplate(getPostBody(p), false)}
          onUseMoxieTemplate={(body) => onUseTemplate(body, true)}
        />
      ) : showInspirationSection ? (
        <InspirationSection posts={filteredPosts} onUse={(body) => onUseInspiration(body)} />
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              selected={selected.has(p.id)}
              onToggleSelect={() => toggleSelect(p.id)}
              onEdit={() => onEditPost(p.id)}
              onDuplicate={() => duplicatePost(p)}
              onDelete={() => deletePost(p.id)}
              onSaveTemplate={() => updatePost(p.id, { is_template: true })}
              onSaveInspiration={() => updatePost(p.id, { is_inspiration: true })}
              onMoveToQueue={() => updatePost(p.id, { status: "queued" })}
            />
          ))}
          {filteredPosts.length === 0 && (
            <p className="col-span-full p-12 text-center text-sm text-muted-foreground">
              No posts match.
            </p>
          )}
        </div>
      ) : (
        <PostsListView
          posts={filteredPosts}
          selected={selected}
          onToggleSelect={toggleSelect}
          onEdit={onEditPost}
          onDuplicate={duplicatePost}
          onDelete={deletePost}
        />
      )}

      {/* BULK ACTION BAR */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full border border-border bg-background px-4 py-2 shadow-xl">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">{selected.size} posts selected</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <TagIcon className="mr-1 h-3 w-3" /> Tag
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => bulkUpdate({ is_template: true })}>
                  Save as template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkUpdate({ is_inspiration: true })}>
                  Save as inspiration
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ status: "queued" })}>
              Move to queue
            </Button>
            <Button size="sm" variant="outline" onClick={bulkDelete} className="text-destructive">
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </Button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded p-1 hover:bg-muted"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =================================================== */
/* Sub-components                                      */
/* =================================================== */

function EmptyState({
  icon,
  title,
  subtitle,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 p-12 text-center">
      <div className="rounded-full bg-muted p-4">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{subtitle}</p>
      {actions && <div className="mt-3 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </Card>
  );
}

function PostCard({
  post,
  selected,
  onToggleSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onSaveTemplate,
  onSaveInspiration,
  onMoveToQueue,
}: {
  post: SocialPost;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSaveTemplate: () => void;
  onSaveInspiration: () => void;
  onMoveToQueue: () => void;
}) {
  const body = getPostBody(post);
  const platforms = (post.platforms ?? []) as Platform[];
  const img = post.image_urls?.[0];
  const dateLabel = post.published_at
    ? `Published ${formatDate(post.published_at)}`
    : post.scheduled_for
    ? `Scheduled ${formatDate(post.scheduled_for)}`
    : `Created ${formatDate(post.created_at)}`;

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden transition-all hover:shadow-md hover:[transform:scale(1.02)]",
        selected && "ring-2 ring-accent",
      )}
    >
      {/* Checkbox (visible on hover or when selected) */}
      <div
        className={cn(
          "absolute left-2 top-2 z-10 rounded bg-background/90 p-1 shadow-sm transition-opacity",
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
      </div>

      {/* Visual */}
      <div
        className="flex h-32 items-center justify-center"
        style={!img ? { backgroundColor: getCardBg(post.platforms) } : undefined}
      >
        {img ? (
          <img src={img} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex gap-2">
            {platforms.length === 0 ? (
              <Sparkles className="h-7 w-7 text-muted-foreground/60" />
            ) : (
              platforms.map((p) => <PlatformIcon key={p} p={p} className="h-6 w-6" />)
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {platforms.map((p) => (
            <PlatformIcon key={p} p={p} />
          ))}
          <Badge className={cn("ml-auto text-[10px] capitalize", statusBadge(post.status))}>{post.status}</Badge>
        </div>
        {post.pillar && (
          <Badge className="w-fit bg-[#FFF0F0] text-[#E85D5D] hover:bg-[#FFE8E8]">{post.pillar}</Badge>
        )}
        <p className="line-clamp-3 text-sm text-foreground">{body.slice(0, 120) || "(empty)"}</p>
        <p className="mt-auto text-xs text-muted-foreground">{dateLabel}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-border p-2">
        <Button size="sm" variant="ghost" className="flex-1" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" className="flex-1" onClick={onDuplicate}>
          <Copy className="mr-1 h-3 w-3" /> Duplicate
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Sparkles className="mr-2 h-3 w-3" /> Edit post
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-3 w-3" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSaveTemplate}>
              <LayoutTemplate className="mr-2 h-3 w-3" /> Save as template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSaveInspiration}>
              <Bookmark className="mr-2 h-3 w-3" /> Save as inspiration
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMoveToQueue}>
              <Send className="mr-2 h-3 w-3" /> Move to queue
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-3 w-3" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

function AssetCard({
  asset,
  onUse,
  onDelete,
}: {
  asset: StorageAsset;
  onUse: (url: string) => void;
  onDelete: (a: StorageAsset) => void;
}) {
  const isVideo = asset.mime.startsWith("video/");
  return (
    <Card className="group flex flex-col overflow-hidden transition-all hover:shadow-md">
      <div className="flex h-48 items-center justify-center bg-muted">
        {isVideo ? (
          <video src={asset.signedUrl} className="h-full w-full object-cover" />
        ) : (
          <img src={asset.signedUrl} alt={asset.name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="truncate text-sm font-medium text-foreground" title={asset.name}>
          {asset.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(asset.size)} · {formatDate(asset.updated_at)}
        </p>
      </div>
      <div className="flex items-center gap-1 border-t border-border p-2">
        <Button size="sm" variant="ghost" className="flex-1" onClick={() => onUse(asset.signedUrl)}>
          Use in post
        </Button>
        <Button size="sm" variant="ghost" asChild>
          <a href={asset.signedUrl} download={asset.name} target="_blank" rel="noreferrer">
            <Download className="h-4 w-4" />
          </a>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(asset)} className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function TemplatesSection({
  userTemplates,
  empty,
  onUseUserTemplate,
  onUseMoxieTemplate,
}: {
  userTemplates: SocialPost[];
  empty: boolean;
  onUseUserTemplate: (p: SocialPost) => void;
  onUseMoxieTemplate: (body: string) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your templates
        </h3>
        {empty ? (
          <EmptyState
            icon={<LayoutTemplate className="h-10 w-10 text-accent" />}
            title="No templates saved yet"
            subtitle="Save any post as a template to reuse its structure."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userTemplates.map((p) => (
              <Card
                key={p.id}
                className="relative flex flex-col overflow-hidden border-t-4 border-t-amber-400 transition-all hover:shadow-md"
              >
                <Badge className="absolute right-3 top-3 bg-amber-100 text-amber-700">Template</Badge>
                <div className="flex flex-1 flex-col gap-2 p-4 pt-5">
                  {p.pillar && (
                    <Badge className="w-fit bg-[#FFF0F0] text-[#E85D5D] hover:bg-[#FFE8E8]">{p.pillar}</Badge>
                  )}
                  <p className="line-clamp-6 whitespace-pre-line text-sm text-foreground">
                    {getPostBody(p) || "(empty)"}
                  </p>
                </div>
                <div className="border-t border-border p-2">
                  <Button
                    size="sm"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => onUseUserTemplate(p)}
                  >
                    Use this template
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          MOXIEMO starter templates
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MOXIE_TEMPLATES.map((t) => (
            <Card
              key={t.id}
              className="relative flex flex-col overflow-hidden border-t-4 border-t-[#FF6B6B] transition-all hover:shadow-md"
            >
              <Badge className="absolute right-3 top-3 bg-[#FFF0F0] text-[#E85D5D]">MOXIEMO</Badge>
              <div className="flex flex-1 flex-col gap-2 p-4 pt-5">
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                <span className="inline-flex w-fit items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Best for: {t.bestFor}
                </span>
                <p className="line-clamp-6 whitespace-pre-line text-xs text-muted-foreground">{t.body}</p>
              </div>
              <div className="border-t border-border p-2">
                <Button
                  size="sm"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => onUseMoxieTemplate(t.body)}
                >
                  <Sparkles className="mr-1 h-3 w-3" /> Use + personalize
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function InspirationSection({
  posts,
  onUse,
}: {
  posts: SocialPost[];
  onUse: (body: string) => void;
}) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<Bookmark className="h-10 w-10 text-accent" />}
        title="No inspiration saved yet"
        subtitle="Save posts that resonate — MOXIEMO will use them to understand your content style over time."
      />
    );
  }
  return (
    <div className="space-y-4">
      <Card className="bg-[#FFF8F0] p-3 text-sm text-foreground">
        💡 Tip: Save posts that resonate — MOXIEMO will use them to understand your content style over time.
      </Card>
      <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
        {posts.map((p) => (
          <Card key={p.id} className="mb-4 inline-block w-full break-inside-avoid p-4">
            {p.pillar && (
              <Badge className="mb-2 bg-[#FFF0F0] text-[#E85D5D] hover:bg-[#FFE8E8]">{p.pillar}</Badge>
            )}
            <p className="whitespace-pre-line text-sm text-foreground">{getPostBody(p)}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => onUse(getPostBody(p))}
            >
              <Sparkles className="mr-1 h-3 w-3" /> Turn into post
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PostsListView({
  posts,
  selected,
  onToggleSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  posts: SocialPost[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (p: SocialPost) => void;
  onDelete: (id: string) => void;
}) {
  if (posts.length === 0) {
    return <p className="p-12 text-center text-sm text-muted-foreground">No posts match.</p>;
  }
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="w-10 p-3"></th>
            <th className="w-12 p-3 text-left">Preview</th>
            <th className="p-3 text-left">Platforms</th>
            <th className="p-3 text-left">Pillar</th>
            <th className="p-3 text-left">Copy</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Date</th>
            <th className="w-24 p-3"></th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => {
            const body = getPostBody(p);
            const img = p.image_urls?.[0];
            const platforms = (p.platforms ?? []) as Platform[];
            const date = p.published_at ?? p.scheduled_for ?? p.created_at;
            return (
              <tr
                key={p.id}
                className="border-t border-border hover:bg-muted/40"
                onClick={() => onEdit(p.id)}
                style={{ cursor: "pointer" }}
              >
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selected.has(p.id)} onCheckedChange={() => onToggleSelect(p.id)} />
                </td>
                <td className="p-3">
                  {img ? (
                    <img src={img} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div
                      className="h-10 w-10 rounded"
                      style={{ backgroundColor: getCardBg(p.platforms) }}
                    />
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {platforms.map((pl) => (
                      <PlatformIcon key={pl} p={pl} />
                    ))}
                  </div>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{p.pillar ?? "—"}</td>
                <td className="max-w-xs truncate p-3 text-foreground">{body.slice(0, 80) || "(empty)"}</td>
                <td className="p-3">
                  <Badge className={cn("text-[10px] capitalize", statusBadge(p.status))}>{p.status}</Badge>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{formatDate(date)}</td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(p.id)}>
                      <Sparkles className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDuplicate(p)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(p.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
