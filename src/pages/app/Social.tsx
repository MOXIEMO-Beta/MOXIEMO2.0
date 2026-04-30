import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Linkedin, Facebook, Instagram, Loader2, CheckCircle2, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SocialConnection = {
  id: string;
  platform: string;
  profile_name: string | null;
  profile_image: string | null;
  connected_at: string;
};

type PublishedPost = {
  id: string;
  body: string | null;
  platform: string | null;
  published_at: string | null;
  created_at: string;
};

const platformIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
};

export default function Social() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [posts, setPosts] = useState<PublishedPost[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const linkedinConnection = useMemo(
    () => connections.find((c) => c.platform === "linkedin") ?? null,
    [connections],
  );

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [connRes, postsRes] = await Promise.all([
      supabase
        .from("social_connections")
        .select("id, platform, profile_name, profile_image, connected_at")
        .eq("user_id", user.id),
      supabase
        .from("content_items")
        .select("id, body, platform, published_at, created_at")
        .eq("user_id", user.id)
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(20),
    ]);
    if (connRes.error) console.error(connRes.error);
    if (postsRes.error) console.error(postsRes.error);
    setConnections((connRes.data as SocialConnection[]) ?? []);
    setPosts((postsRes.data as PublishedPost[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Handle ?connected=linkedin success param
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) {
      toast.success(
        `${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`,
      );
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

  const handleConnect = async (platform: string) => {
    if (!user) return;
    setConnectingPlatform(platform);
    try {
      const { data, error } = await supabase.functions.invoke("social-oauth-start", {
        body: { platform, user_id: user.id },
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
    const { error } = await supabase
      .from("social_connections")
      .delete()
      .eq("id", connection.id);
    setDisconnectingId(null);
    if (error) {
      toast.error("Failed to disconnect");
      return;
    }
    toast.success(`${connection.platform.charAt(0).toUpperCase() + connection.platform.slice(1)} disconnected`);
    setConnections((prev) => prev.filter((c) => c.id !== connection.id));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Social</h1>
        <p className="text-sm text-muted-foreground">
          Connect the platforms where you publish so MOXIE can post on your behalf and track engagement.
        </p>
      </header>

      {/* Platform cards */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* LinkedIn */}
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#0A66C2]/10 p-2 text-[#0A66C2]">
                <Linkedin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">LinkedIn</p>
                <p className="text-xs text-muted-foreground">Posts & engagement</p>
              </div>
            </div>
            {linkedinConnection && (
              <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            )}
          </div>

          {loading ? (
            <Skeleton className="h-9 w-full" />
          ) : linkedinConnection ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                {linkedinConnection.profile_image ? (
                  <img
                    src={linkedinConnection.profile_image}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disconnecting…
                  </>
                ) : (
                  "Disconnect"
                )}
              </Button>
            </div>
          ) : (
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => handleConnect("linkedin")}
              disabled={connectingPlatform === "linkedin"}
            >
              {connectingPlatform === "linkedin" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                "Connect LinkedIn"
              )}
            </Button>
          )}
        </Card>

        {/* Facebook */}
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#1877F2]/10 p-2 text-[#1877F2]">
                <Facebook className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Facebook</p>
                <p className="text-xs text-muted-foreground">Pages & posts</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              Coming Soon
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Meta business verification in progress.
          </p>
        </Card>

        {/* Instagram */}
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#E1306C]/10 p-2 text-[#E1306C]">
                <Instagram className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Instagram</p>
                <p className="text-xs text-muted-foreground">Feed & reels</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              Coming Soon
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Available once Meta verification is complete.
          </p>
        </Card>
      </section>

      {/* Recent posts */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent posts</h2>
        </div>
        <Card className="overflow-hidden">
          {loading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <div className="rounded-full bg-muted p-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No published posts yet. Generate content and publish from the Content page.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Platform</TableHead>
                  <TableHead>Post</TableHead>
                  <TableHead className="w-[160px] text-right">Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => {
                  const Icon = (post.platform && platformIcon[post.platform]) || FileText;
                  const snippet = (post.body ?? "").slice(0, 80);
                  const date = post.published_at ?? post.created_at;
                  return (
                    <TableRow key={post.id}>
                      <TableCell>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {snippet}
                        {(post.body?.length ?? 0) > 80 ? "…" : ""}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {date ? new Date(date).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </section>
    </div>
  );
}