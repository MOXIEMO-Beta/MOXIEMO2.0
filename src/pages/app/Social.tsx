import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { aiErrorMessage } from "@/lib/aiErrors";
import {
  Linkedin,
  Facebook,
  Instagram,
  Loader2,
  CheckCircle2,
  Calendar as CalendarIcon,
  Sparkles,
  Plus,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import CreateTab from "@/components/social/CreateTab";
import CalendarTab from "@/components/social/CalendarTab";
import LibraryTab from "@/components/social/LibraryTab";
import ReportsTab from "@/components/social/ReportsTab";

type SocialConnection = {
  id: string;
  platform: string;
  profile_name: string | null;
  profile_image: string | null;
  connected_at: string;
};

type SocialPost = {
  id: string;
  platforms: string[] | null;
  content_by_platform: Record<string, string> | null;
  pillar: string | null;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
};

type Strategy = {
  ideal_client: string | null;
  pain_point: string | null;
  content_pillars: unknown;
  content_themes: unknown;
  voice_attributes: unknown;
};

type PostIdea = { title: string; pillar: string; hook?: string };

const TABS = ["overview", "create", "calendar", "library", "reports"] as const;
type TabKey = (typeof TABS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  overview: "Overview",
  create: "Create",
  calendar: "Calendar",
  library: "Library",
  reports: "Reports",
};

function startOfWeek(d = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function endOfWeek(d = new Date()): Date {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 7);
  return e;
}

function asArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object") {
        const obj = x as Record<string, unknown>;
        return (obj.name as string) || (obj.title as string) || (obj.label as string) || "";
      }
      return "";
    })
    .filter(Boolean);
}

/* ---------------- Platform icon tile ---------------- */
function PlatformTile({ platform, muted }: { platform: "linkedin" | "facebook" | "instagram"; muted?: boolean }) {
  if (platform === "linkedin") {
    return (
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          muted ? "bg-muted text-muted-foreground" : "bg-[#0A66C2] text-white",
        )}
      >
        <Linkedin className="h-5 w-5" />
      </div>
    );
  }
  if (platform === "facebook") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1877F2] text-white">
        <Facebook className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white">
      <Instagram className="h-5 w-5" />
    </div>
  );
}

/* ===================================================== */
export default function Social() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Pre-filled topic when navigating to Create tab from an idea
  const [createPrefill, setCreatePrefill] = useState<string>("");
  const [createScheduleDate, setCreateScheduleDate] = useState<string>("");
  const [createPillar, setCreatePillar] = useState<string>("");
  const [editPostId, setEditPostId] = useState<string>("");

  // LinkedIn connection state shared across tabs
  const [isLinkedInConnected, setIsLinkedInConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      const { data } = await supabase
        .from("social_connections")
        .select("id")
        .eq("user_id", user.id)
        .eq("platform", "linkedin")
        .maybeSingle();
      setIsLinkedInConnected(!!data);
    })();
  }, [user?.id]);

  // Handle ?connected=linkedin & ?error
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) {
      toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected!`);
      const next = new URLSearchParams(searchParams);
      next.delete("connected");
      setSearchParams(next, { replace: true });
    } else if (error) {
      toast.error(`Connection failed: ${error}`);
      const next = new URLSearchParams(searchParams);
      next.delete("error");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goCreateWithIdea = (title: string) => {
    setCreatePrefill(title);
    setActiveTab("create");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Social</h1>
        <p className="text-sm text-muted-foreground">
          Publish strategy-aligned content across your connected platforms.
        </p>
      </header>

      {/* Sticky tab bar */}
      <div className="sticky top-0 z-10 -mx-6 border-b border-border bg-background/85 px-6 backdrop-blur md:-mx-8 md:px-8">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = activeTab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={cn(
                  "relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {TAB_LABELS[t]}
                {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "overview" && <OverviewTab userId={user?.id ?? null} onCreateFromIdea={goCreateWithIdea} onSwitchTab={setActiveTab} />}
      {activeTab === "create" && (
        <CreateTab
          userId={user?.id ?? null}
          prefillTopic={createPrefill}
          isLinkedInConnected={isLinkedInConnected}
        />
      )}
      {activeTab === "calendar" && (
        <CalendarTab
          userId={user?.id ?? null}
          onEditPost={(id) => {
            setEditPostId(id);
            const next = new URLSearchParams(searchParams);
            next.set("editPostId", id);
            setSearchParams(next, { replace: true });
            setActiveTab("create");
          }}
          onCreateAtDate={(iso, pillar) => {
            setCreateScheduleDate(iso);
            if (pillar) setCreatePillar(pillar);
            const next = new URLSearchParams(searchParams);
            next.set("scheduleDate", iso.slice(0, 10));
            if (pillar) next.set("pillar", pillar);
            setSearchParams(next, { replace: true });
            setActiveTab("create");
          }}
          onImportFromContent={() => {
            toast.info("Content import coming soon");
          }}
        />
      )}
      {activeTab === "library" && (
        <LibraryTab
          userId={user?.id ?? null}
          onEditPost={(id) => {
            setEditPostId(id);
            const next = new URLSearchParams(searchParams);
            next.set("editPostId", id);
            setSearchParams(next, { replace: true });
            setActiveTab("create");
          }}
          onUseImage={(url) => {
            const next = new URLSearchParams(searchParams);
            next.set("imageUrl", url);
            setSearchParams(next, { replace: true });
            setActiveTab("create");
          }}
          onUseTemplate={(body, personalize) => {
            setCreatePrefill(body);
            const next = new URLSearchParams(searchParams);
            next.set("templateBody", body);
            if (personalize) next.set("personalize", "1");
            setSearchParams(next, { replace: true });
            setActiveTab("create");
          }}
          onUseInspiration={(body) => {
            const topic = `Inspired by: ${body.slice(0, 80)}`;
            setCreatePrefill(topic);
            setActiveTab("create");
          }}
          onCreateNew={() => setActiveTab("create")}
        />
      )}
      {activeTab === "reports" && (
        <ReportsTab
          userId={user?.id ?? null}
          onSwitchTab={setActiveTab}
          onRepurposePost={(topic) => {
            setCreatePrefill(topic);
          }}
          onCreateWithPillar={(pillar) => {
            setCreatePillar(pillar);
            const next = new URLSearchParams(searchParams);
            next.set("pillar", pillar);
            setSearchParams(next, { replace: true });
          }}
        />
      )}
    </div>
  );
}

/* ---------------- Coming soon placeholder ---------------- */
function ComingSoonTab({ label, prefill }: { label: string; prefill?: string }) {
  return (
    <Card className="flex flex-col items-center gap-2 border-dashed p-12 text-center">
      <div className="rounded-full bg-muted p-3">
        <Sparkles className="h-5 w-5 text-accent" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{label} — coming soon</h3>
      <p className="max-w-md text-sm text-muted-foreground">
        We're building this section next. Your data and connections are already in place.
      </p>
      {prefill && (
        <p className="mt-3 max-w-md rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Idea queued for when Create is ready: <span className="font-medium text-foreground">"{prefill}"</span>
        </p>
      )}
    </Card>
  );
}

/* =========================================================
   OVERVIEW TAB
   ========================================================= */
function OverviewTab({
  userId,
  onCreateFromIdea,
  onSwitchTab,
}: {
  userId: string | null;
  onCreateFromIdea: (title: string) => void;
  onSwitchTab: (t: TabKey) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [strategy, setStrategy] = useState<Strategy | null>(null);

  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [aiIdeas, setAiIdeas] = useState<PostIdea[] | null>(null);

  const linkedinConnection = useMemo(
    () => connections.find((c) => c.platform === "linkedin") ?? null,
    [connections],
  );

  const loadAll = async () => {
    if (!userId) return;
    setLoading(true);
    const [connRes, postsRes, stratRes] = await Promise.all([
      supabase
        .from("social_connections")
        .select("id, platform, profile_name, profile_image, connected_at")
        .eq("user_id", userId),
      supabase
        .from("social_posts")
        .select("id, platforms, content_by_platform, pillar, status, scheduled_for, published_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("strategies")
        .select("ideal_client, pain_point, content_pillars, content_themes, voice_attributes")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    if (connRes.error) console.error(connRes.error);
    if (postsRes.error) console.error(postsRes.error);
    if (stratRes.error) console.error(stratRes.error);
    setConnections((connRes.data as SocialConnection[]) ?? []);
    setPosts((postsRes.data as unknown as SocialPost[]) ?? []);
    setStrategy((stratRes.data as Strategy | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /* Connect / disconnect */
  const handleConnect = async (platform: string) => {
    if (!userId) return;
    setConnectingPlatform(platform);
    try {
      const { data, error } = await supabase.functions.invoke("social-oauth-start", {
        body: { platform, user_id: userId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No authorization URL returned");
      }
    } catch (err) {
      console.error(err);
      toast.error(`Couldn't start ${platform} connection`);
      setConnectingPlatform(null);
    }
  };
  const handleDisconnect = async (connection: SocialConnection) => {
    setDisconnectingId(connection.id);
    const { error } = await supabase.from("social_connections").delete().eq("id", connection.id);
    setDisconnectingId(null);
    if (error) {
      toast.error("Failed to disconnect");
      return;
    }
    toast.success(`${connection.platform.charAt(0).toUpperCase() + connection.platform.slice(1)} disconnected`);
    setConnections((prev) => prev.filter((c) => c.id !== connection.id));
  };

  /* Week stats */
  const weekStats = useMemo(() => {
    const start = startOfWeek();
    const end = endOfWeek();
    const inWeek = (iso: string | null) => {
      if (!iso) return false;
      const d = new Date(iso);
      return d >= start && d < end;
    };
    const scheduled = posts.filter((p) => p.status === "scheduled" && inWeek(p.scheduled_for)).length;
    const published = posts.filter((p) => p.status === "published" && inWeek(p.published_at)).length;
    const drafts = posts.filter((p) => p.status === "draft").length;
    const thisWeekPosts = posts.filter(
      (p) => inWeek(p.scheduled_for) || inWeek(p.published_at) || inWeek(p.created_at),
    );
    const aligned = thisWeekPosts.filter((p) => !!p.pillar).length;
    const alignment = thisWeekPosts.length > 0 ? Math.round((aligned / thisWeekPosts.length) * 100) : null;
    return { scheduled, published, drafts, alignment };
  }, [posts]);

  /* Idea generation — client-side fallback */
  const pillars = useMemo(() => asArray(strategy?.content_pillars), [strategy]);
  const themes = useMemo(() => asArray(strategy?.content_themes), [strategy]);

  const localIdeas: PostIdea[] = useMemo(() => {
    const source = pillars.length > 0 ? pillars : themes;
    if (source.length === 0) return [];
    const idealClient = strategy?.ideal_client?.trim() || "founders";
    const painPoint = strategy?.pain_point?.trim() || "scaling without burnout";
    const top = source.slice(0, 3);
    const templates = (pillar: string, i: number) =>
      [
        `Why most ${idealClient} struggle with ${painPoint} (and what actually works)`,
        `The truth about ${pillar} that nobody talks about`,
        `${pillar}: here's what changed everything for my clients`,
      ][i];
    return top.map((pillar, i) => ({ title: templates(pillar, i), pillar }));
  }, [pillars, themes, strategy]);

  const ideasToShow = aiIdeas ?? localIdeas;

  const { checkGenerationLimit: _checkGen, handleGenerationResponse } = usePlan();
  const handleGenerateMore = async () => {
    if (!strategy) return;
    if (!(await _checkGen())) return;
    setGeneratingIdeas(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-post-ideas", {
        body: { strategy },
      });
      if (handleGenerationResponse(data, error)) return;
      if (error) throw error;
      const ideas = (Array.isArray(data) ? data : data?.ideas ?? []) as PostIdea[];
      if (ideas.length === 0) {
        toast.error(aiErrorMessage("generic"));
        return;
      }
      setAiIdeas(ideas);
      toast.success("Fresh ideas ready");
    } catch (err) {
      console.error(err);
      toast.error(aiErrorMessage("generic", err));
    } finally {
      setGeneratingIdeas(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1 — Connected platforms */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Connected platforms</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* LinkedIn */}
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlatformTile platform="linkedin" muted={!linkedinConnection} />
                <div>
                  <p className="text-sm font-semibold text-foreground">LinkedIn</p>
                  <p className="text-xs text-muted-foreground">Posts & engagement</p>
                </div>
              </div>
              {linkedinConnection && (
                <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </Badge>
              )}
            </div>
            {loading ? (
              <Skeleton className="h-9 w-full" />
            ) : linkedinConnection ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm">
                  {linkedinConnection.profile_image ? (
                    <img src={linkedinConnection.profile_image} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {linkedinConnection.profile_name ?? "Connected account"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Connected {new Date(linkedinConnection.connected_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect(linkedinConnection)}
                  disabled={disconnectingId === linkedinConnection.id}
                >
                  {disconnectingId === linkedinConnection.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Disconnecting…
                    </>
                  ) : (
                    "Disconnect"
                  )}
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Not connected</p>
                <Button
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => handleConnect("linkedin")}
                  disabled={connectingPlatform === "linkedin"}
                >
                  {connectingPlatform === "linkedin" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting…
                    </>
                  ) : (
                    "Connect LinkedIn"
                  )}
                </Button>
              </>
            )}
          </Card>

          {/* Facebook */}
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlatformTile platform="facebook" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Facebook</p>
                  <p className="text-xs text-muted-foreground">Pages & posts</p>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending verification</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Available after Meta business verification</p>
          </Card>

          {/* Instagram */}
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlatformTile platform="instagram" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Instagram</p>
                  <p className="text-xs text-muted-foreground">Feed & reels</p>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending verification</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Available after Meta business verification</p>
          </Card>
        </div>
      </section>

      {/* SECTION 2 — This week */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">This week</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <StatCard label="Posts scheduled" value={loading ? null : weekStats.scheduled} subtext="Mon – Sun" />
          <StatCard label="Posts published" value={loading ? null : weekStats.published} subtext="Mon – Sun" />
          <StatCard label="Drafts" value={loading ? null : weekStats.drafts} subtext="Total open drafts" />
          <StatCard
            label="Strategy alignment"
            value={loading ? null : weekStats.alignment !== null ? `${weekStats.alignment}%` : "—"}
            subtext={weekStats.alignment !== null ? "on-strategy" : "No posts yet"}
          />
        </div>
      </section>

      {/* SECTION 3 — Ideas */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              Post ideas from your strategy
            </h2>
            <p className="text-xs text-muted-foreground">Based on your content pillars and quarterly themes</p>
          </div>
          {strategy && ideasToShow.length > 0 && (
            <button
              type="button"
              onClick={handleGenerateMore}
              disabled={generatingIdeas}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline disabled:opacity-60"
            >
              {generatingIdeas ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Generate more ideas
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !strategy ? (
          <Link
            to="/app/strategy"
            className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
          >
            <span>Complete your strategy to unlock post ideas</span>
            <ArrowRight className="h-4 w-4 text-accent" />
          </Link>
        ) : ideasToShow.length === 0 ? (
          <Card className="p-5 text-sm text-muted-foreground">
            Add content pillars or themes to your strategy to see ideas here.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {ideasToShow.slice(0, aiIdeas ? 6 : 3).map((idea, i) => (
              <Card key={`${idea.title}-${i}`} className="flex flex-col gap-3 p-4">
                <Badge className="w-fit bg-accent-soft text-accent hover:bg-accent-soft">{idea.pillar}</Badge>
                <p className="text-sm font-semibold leading-snug text-foreground">{idea.title}</p>
                {idea.hook && <p className="text-xs italic text-muted-foreground">"{idea.hook}"</p>}
                <p className="text-xs text-muted-foreground">Recommended: LinkedIn</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-auto justify-between px-2 text-accent hover:bg-accent-soft hover:text-accent"
                  onClick={() => onCreateFromIdea(idea.title)}
                >
                  Create this post <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 4 — Recent posts */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Recent posts</h2>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="rounded-full bg-muted p-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No posts yet — create your first strategy-aligned post</p>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => onSwitchTab("create")}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create a post
            </Button>
          </Card>
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {posts.slice(0, 5).map((p) => {
              const platforms = p.platforms ?? [];
              const firstContent =
                (p.content_by_platform && Object.values(p.content_by_platform)[0]) ?? "";
              const snippet = (firstContent || "").slice(0, 80);
              const dateLabel =
                p.status === "published" && p.published_at
                  ? `Published ${new Date(p.published_at).toLocaleDateString()}`
                  : p.status === "scheduled" && p.scheduled_for
                  ? `Scheduled ${new Date(p.scheduled_for).toLocaleDateString()}`
                  : `Created ${new Date(p.created_at).toLocaleDateString()}`;
              return (
                <div key={p.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex -space-x-1.5">
                    {platforms.length === 0 ? (
                      <div className="h-6 w-6 rounded-full bg-muted" />
                    ) : (
                      platforms.slice(0, 3).map((pl) => (
                        <div
                          key={pl}
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-background",
                            pl === "linkedin" && "bg-[#0A66C2] text-white",
                            pl === "facebook" && "bg-[#1877F2] text-white",
                            pl === "instagram" && "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white",
                            !["linkedin", "facebook", "instagram"].includes(pl) && "bg-muted text-muted-foreground",
                          )}
                        >
                          {pl === "linkedin" && <Linkedin className="h-3 w-3" />}
                          {pl === "facebook" && <Facebook className="h-3 w-3" />}
                          {pl === "instagram" && <Instagram className="h-3 w-3" />}
                        </div>
                      ))
                    )}
                  </div>
                  {p.pillar && (
                    <Badge className="bg-accent-soft text-accent hover:bg-accent-soft">{p.pillar}</Badge>
                  )}
                  <p className="flex-1 truncate text-sm text-foreground">
                    {snippet}
                    {firstContent.length > 80 ? "…" : ""}
                  </p>
                  <StatusBadge status={p.status} />
                  <span className="hidden text-xs text-muted-foreground md:inline">{dateLabel}</span>
                  <Button variant="ghost" size="sm" onClick={() => onSwitchTab("create")}>
                    Edit
                  </Button>
                </div>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}

/* ---------------- Helpers ---------------- */
function StatCard({ label, value, subtext }: { label: string; value: number | string | null; subtext: string }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-foreground">
        {value === null ? <Skeleton className="h-8 w-12" /> : value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Published</Badge>;
  }
  if (status === "scheduled") {
    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Scheduled</Badge>;
  }
  return <Badge variant="secondary" className="bg-muted text-muted-foreground">Draft</Badge>;
}