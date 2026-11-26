import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/authErrors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoxieLogo } from "@/components/MoxieLogo";
import { PageLoader } from "@/components/ui/PageLoader";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "set_password" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    upper:  /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passwordStrong = Object.values(passwordChecks).every(Boolean);
  const showStrength = password.length > 0;

  useEffect(() => {
    (async () => {
      try {
        // Parse type from URL hash (Supabase appends e.g. #access_token=...&type=invite)
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        const params = new URLSearchParams(hash);
        const type = params.get("type");

        // Give Supabase a tick to process the hash and establish the session
        await new Promise((r) => setTimeout(r, 50));
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          // No session and no usable token — send them home.
          navigate("/", { replace: true });
          return;
        }

        // Ensure profile exists with founding_member plan.
        await supabase
          .from("profiles")
          .upsert(
            {
              id: session.user.id,
              email: session.user.email,
              plan: "founding_member",
            },
            { onConflict: "id" }
          );

        // Google/Apple OAuth users never need a password — skip this screen for them.
        const provider = session.user.app_metadata?.provider;
        const isOAuthUser = provider === "google" || provider === "apple";
        if (isOAuthUser) {
          navigate("/app", { replace: true });
          return;
        }

        // Check whether this user has already completed password setup.
        const { data: profile } = await supabase
          .from("profiles")
          .select("password_set")
          .eq("id", session.user.id)
          .maybeSingle();

        const passwordSet = Boolean((profile as { password_set?: boolean } | null)?.password_set);

        // Show password screen only for invite/recovery/signup flows, not for returning users.
        if (type === "invite" || type === "recovery" || type === "signup" || (!passwordSet && type)) {
          setStatus("set_password");
          return;
        }

        // ProtectedRoute will check onboarding_completed and redirect to /onboarding if needed.
        navigate("/app", { replace: true });
      } catch (e: unknown) {
        setErrorMsg(friendlyAuthError("set_password", e));
        setStatus("error");
      }
    })();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordStrong) { toast.error("Password must be at least 8 characters with an uppercase letter and a number."); return; }
    if (password !== confirm) { toast.error("Those passwords don't match. Try typing them again."); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Mark the profile as having completed password setup so a second visit
      // (e.g. re-using the invite link) skips this screen.
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from("profiles")
          .update({ password_set: true })
          .eq("id", session.user.id);
      }
      toast.success("Your account is ready. Taking you in now.");
      navigate("/app", { replace: true });
    } catch (err: unknown) {
      toast.error(friendlyAuthError("set_password", err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8"><MoxieLogo /></div>

        {status === "loading" && (
          <PageLoader variant="inline" label="Verifying your invitation…" />
        )}

        {status === "error" && (
          <div>
            <h1 className="font-display text-3xl mb-3">Link issue</h1>
            <p className="text-muted-foreground mb-6">{errorMsg}</p>
            <Button onClick={() => navigate("/auth")} className="w-full h-11">
              Go to sign in
            </Button>
          </div>
        )}

        {status === "set_password" && (
          <>
            <h1 className="font-display text-4xl mb-2">Create your password</h1>
            <p className="text-muted-foreground mb-8">One last step before you get started.</p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {showStrength && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[passwordChecks.length, passwordChecks.upper, passwordChecks.number].map((ok, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${ok ? "bg-accent" : "bg-border"}`}
                        />
                      ))}
                    </div>
                    <ul className="text-xs space-y-0.5 text-muted-foreground">
                      <li className={passwordChecks.length ? "text-accent" : ""}>
                        {passwordChecks.length ? "✓" : "·"} At least 8 characters
                      </li>
                      <li className={passwordChecks.upper ? "text-accent" : ""}>
                        {passwordChecks.upper ? "✓" : "·"} One uppercase letter
                      </li>
                      <li className={passwordChecks.number ? "text-accent" : ""}>
                        {passwordChecks.number ? "✓" : "·"} One number
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={submitting || !passwordStrong}
                className="w-full h-11 bg-accent text-white hover:bg-accent/90 rounded-lg disabled:opacity-50"
              >
                {submitting ? "Activating…" : "Activate my account"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}