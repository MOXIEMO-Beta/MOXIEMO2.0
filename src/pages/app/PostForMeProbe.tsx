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
    </div>
  );
}