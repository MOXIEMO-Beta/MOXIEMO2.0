import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { MoxieLogo } from "@/components/MoxieLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function LinkedInCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    const finish = (ok: boolean, detail?: string) => {
      const isPopup = !!window.opener && window.opener !== window;
      if (isPopup) {
        try {
          window.opener.postMessage(
            { type: ok ? "LINKEDIN_AUTH_SUCCESS" : "LINKEDIN_AUTH_ERROR", detail },
            window.location.origin,
          );
        } catch {
          /* ignore */
        }
        window.close();
        return;
      }
      if (ok) {
        try {
          localStorage.setItem("linkedin_auth_success", "true");
        } catch {
          /* ignore */
        }
        navigate("/app/social?connected=linkedin", { replace: true });
      }
    };

    if (oauthError || !code || !state) {
      setErrorMsg(oauthError || "Missing authorization code.");
      setStatus("error");
      finish(false, oauthError || "missing_code_or_state");
      return;
    }

    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token ?? SUPABASE_ANON_KEY;
        const res = await fetch(`${SUPABASE_URL}/functions/v1/social-oauth-callback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ code, state }),
        });
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok || !data?.ok) {
          const detail = data?.detail || data?.error || `http_${res.status}`;
          throw new Error(detail);
        }
        finish(true);
      } catch (err) {
        console.error("LinkedIn callback failed", err);
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(msg);
        setStatus("error");
        finish(false, msg);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center text-center max-w-sm">
        <MoxieLogo className="mb-8" />
        {status === "loading" ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-4" />
            <p className="text-base text-foreground font-medium">
              Connecting your LinkedIn account...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Hang tight — this only takes a moment.
            </p>
          </>
        ) : (
          <>
            <p className="text-base text-foreground font-medium mb-2">
              Connection failed. Please try again.
            </p>
            {errorMsg && (
              <p className="text-xs text-muted-foreground mb-4">{errorMsg}</p>
            )}
            <Button onClick={() => navigate("/app/social", { replace: true })}>
              Back to Settings
            </Button>
          </>
        )}
      </div>
    </div>
  );
}