import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Account = {
  id: string;
  platform: string;
  username: string | null;
  name: string | null;
  status: string;
  external_id: string | null;
  access_token_expires_at: string | null;
};

export default function PostForMeProbe() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return setIsAdmin(false);
      const { data } = await supabase.from("profiles").select("is_admin").eq("id", uid).single();
      setIsAdmin(Boolean((data as any)?.is_admin));
    })();
  }, []);

  const call = async (payload: Record<string, unknown>, label: string) => {
    setBusy(label);
    setError(null);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("postforme-probe", { body: payload });
      if (error) throw error;
      setResult(data);
      if (label.startsWith("connect") && (data as any)?.url) {
        window.open((data as any).url, "_blank", "noopener");
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };

  const FB_ACCOUNT = "spc_wQsqGsfdg68looIEPfwt";
  const IG_ACCOUNT = "spc_zk30FSe9XU8iqTcEi6vW";
  const CAPTION = "MOXIEMO integration test, please ignore";

  const extractPostId = (body: any): string | null => {
    if (!body || typeof body !== "object") return null;
    return body.id ?? body.post_id ?? body.data?.id ?? null;
  };

  const extractStatus = (body: any): string | null => {
    if (!body || typeof body !== "object") return null;
    return body.status ?? body.data?.status ?? null;
  };

  const pollStatus = async (id: string) => {
    setPolling(true);
    try {
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 2500));
        const { data, error } = await supabase.functions.invoke("postforme-probe", {
          body: { action: "get_post", id },
        });
        if (error) { setTestError(error.message); break; }
        setTestResult(data);
        const s = extractStatus((data as any)?.body);
        if (s && !["pending", "processing", "queued", "scheduled"].includes(String(s).toLowerCase())) break;
      }
    } finally {
      setPolling(false);
    }
  };

  const testPost = async (platform: "facebook" | "instagram") => {
    const label = `test-${platform}`;
    setBusy(label);
    setTestError(null);
    setTestResult(null);
    try {
      const payload: Record<string, unknown> = {
        action: "post",
        caption: CAPTION,
        social_accounts: [platform === "facebook" ? FB_ACCOUNT : IG_ACCOUNT],
      };

      if (platform === "instagram") {
        // IG requires media. Pick most recent public image asset for this admin.
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes.user?.id;
        if (!uid) throw new Error("Not signed in");
        const { data: assets, error: aErr } = await supabase
          .from("assets")
          .select("id, url, file_type, uploaded_at")
          .eq("user_id", uid)
          .order("uploaded_at", { ascending: false })
          .limit(20);
        if (aErr) throw aErr;
        const img = (assets ?? []).find(
          (a: any) =>
            (!a.file_type || String(a.file_type).startsWith("image/")) &&
            typeof a.url === "string" &&
            /^https?:\/\//i.test(a.url),
        );
        if (!img) {
          throw new Error(
            "No public image asset found in Media Library. Upload an image first.",
          );
        }
        payload.media = [{ url: (img as any).url }];
      }

      const { data, error } = await supabase.functions.invoke("postforme-probe", { body: payload });
      if (error) throw error;
      setTestResult(data);
      const id = extractPostId((data as any)?.body);
      const status = extractStatus((data as any)?.body);
      if (id && (!status || ["pending", "processing", "queued", "scheduled"].includes(String(status).toLowerCase()))) {
        void pollStatus(id);
      }
    } catch (e: any) {
      setTestError(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  };

  if (isAdmin === null) return <div className="p-6"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!isAdmin) return <div className="p-6 text-sm text-muted-foreground">Admin only.</div>;

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">Post for Me — probe</h1>
        <p className="text-sm text-muted-foreground">Read-only. Connect an account via Post for Me's hosted OAuth, then list.</p>
      </div>
      <Card className="p-4 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button disabled={!!busy} onClick={() => call({ action: "auth_url", platform: "facebook" }, "connect-facebook")}>
            {busy === "connect-facebook" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect Facebook Page"}
          </Button>
          <Button disabled={!!busy} onClick={() => call({ action: "auth_url", platform: "instagram" }, "connect-instagram")}>
            {busy === "connect-instagram" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect Instagram"}
          </Button>
          <Button variant="secondary" disabled={!!busy} onClick={() => call({ action: "list" }, "list")}>
            {busy === "list" ? <Loader2 className="h-4 w-4 animate-spin" /> : "List accounts"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Post for Me hosts the OAuth flow and handles the redirect. After you complete the popup, click "List accounts".
        </p>
      </Card>
      {error && <Card className="p-4 border-destructive/50 text-sm text-destructive">{error}</Card>}
      {result && (
        <Card className="p-4">
          <pre className="text-xs whitespace-pre-wrap overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </Card>
      )}

      <Card className="p-4 space-y-3 border-dashed">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            TEMP — remove after verification
          </div>
          <h2 className="text-base font-semibold mt-1">Send test post</h2>
          <p className="text-xs text-muted-foreground">
            Fires a single live post through Post for Me. Caption: "{CAPTION}".
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!!busy} onClick={() => testPost("facebook")}>
            {busy === "test-facebook" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Facebook post"}
          </Button>
          <Button disabled={!!busy} onClick={() => testPost("instagram")}>
            {busy === "test-instagram" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Instagram post"}
          </Button>
          {polling && (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Polling status…
            </span>
          )}
        </div>
        {testError && (
          <div className="text-sm text-destructive border border-destructive/40 rounded p-2">{testError}</div>
        )}
        {testResult && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              post id: <span className="font-mono">{extractPostId((testResult as any)?.body) ?? "—"}</span>
              {"  ·  "}status: <span className="font-mono">{extractStatus((testResult as any)?.body) ?? "—"}</span>
            </div>
            <pre className="text-xs whitespace-pre-wrap overflow-auto bg-muted p-2 rounded">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
}