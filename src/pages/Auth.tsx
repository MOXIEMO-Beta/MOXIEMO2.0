import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoxieLogo } from "@/components/MoxieLogo";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Mail } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => { if (user) navigate("/app"); }, [user, navigate]);

  async function signInWithGoogle() {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/app`,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed");
      setGoogleLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/app` },
        });
        if (error) throw error;
        setSignupEmail(email);
        setSignupSuccess(true);
        toast.success("Account created. Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-foreground text-background relative overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <Link to="/" className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-background flex items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-accent" />
            </div>
            <span className="font-display text-2xl">moxie</span>
          </div>
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-5xl leading-tight mb-6">Your AI Chief Marketing Officer.</h2>
          <p className="text-background/70 text-lg leading-relaxed">Strategy first. Execution embedded. Replace 6 tools with one platform built for the messy middle.</p>
          <div className="mt-12 grid grid-cols-3 gap-4 text-sm">
            <div><div className="font-display text-3xl text-accent">18+</div><div className="text-background/60">hrs back per week</div></div>
            <div><div className="font-display text-3xl text-accent">4-6</div><div className="text-background/60">tools replaced</div></div>
            <div><div className="font-display text-3xl text-accent">45m</div><div className="text-background/60">to full strategy</div></div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><MoxieLogo /></div>
          {signupSuccess ? (
            <div>
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mb-6">
                <Mail className="h-6 w-6 text-accent-foreground" />
              </div>
              <h1 className="font-display text-4xl mb-3">Check your email</h1>
              <p className="text-muted-foreground mb-6">
                Thanks for signing up! We sent a confirmation link to{" "}
                <span className="text-foreground font-medium">{signupEmail}</span>. Click the link in that email to verify your account and start building your strategy.
              </p>
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground mb-6">
                Didn't get it? Check your spam folder, or wait a minute and look again. The link expires in 24 hours.
              </div>
              <button
                onClick={() => { setSignupSuccess(false); setMode("signin"); setPassword(""); }}
                className="text-sm text-foreground font-medium hover:text-accent"
              >
                Back to sign in
              </button>
            </div>
          ) : (
          <>
          <h1 className="font-display text-4xl mb-2">{mode === "signup" ? "Get started" : "Welcome back"}</h1>
          <p className="text-muted-foreground mb-8">{mode === "signup" ? "Create your account in 30 seconds." : "Sign in to your workspace."}</p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Thompson" required className="mt-1.5 h-11" />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required className="mt-1.5 h-11" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1.5 h-11" />
            </div>
            {mode === "signin" && (
              <div className="flex justify-end">
                <Link to="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-accent">
                  Forgot password?
                </Link>
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 rounded-lg">
              {loading ? "Working…" : mode === "signup" ? "Create account" : "Sign in"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading}
            variant="outline"
            className="w-full h-11 rounded-lg"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {googleLoading ? "Connecting…" : "Continue with Google"}
          </Button>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-foreground font-medium hover:text-accent">
              {mode === "signup" ? "Sign in" : "Create account"}
            </button>
          </p>

          <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
            By signing up you agree to our{" "}
            <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
}