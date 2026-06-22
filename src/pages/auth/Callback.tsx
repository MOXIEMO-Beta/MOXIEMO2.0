import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoxieLogo } from "@/components/MoxieLogo";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "set_password" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

        // Check whether this user has already completed password setup.
        const { data: profile } = await supabase
          .from("profiles")
          .select("password_set")
          .eq("id", session.user.id)
          .maybeSingle();

        const passwordSet = Boolean((profile as any)?.password_set);

        // If they still need to set a password (either fresh invite/recovery,
        // or they returned later with a valid session but never finished), show
        // the password creation screen.
        if (!passwordSet || type === "invite" || type === "recovery" || type === "signup") {
          setStatus("set_password");
          return;
        }

        // Already set up — send them into the app.
        navigate("/app/discovery", { replace: true });
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Something went wrong.");
        setStatus("error");
      }
    })();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (password !== confirm) { toast.error("Passwords don't match."); return; }
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
      toast.success("Account activated.");
      navigate("/app/discovery", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not set password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8"><MoxieLogo /></div>

        {status === "loading" && (
          <p className="text-muted-foreground">Verifying your invitation…</p>
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
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1.5 h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 text-white hover:opacity-90 rounded-lg"
                style={{ background: "#ff6b6b" }}
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