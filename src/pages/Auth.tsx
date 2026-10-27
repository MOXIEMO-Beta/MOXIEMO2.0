import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signin" ? "signin" : "signup";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  useEffect(() => {
    const m = searchParams.get("mode");
    setMode(m === "signin" ? "signin" : "signup");
  }, [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

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

  async function signInWithApple() {
    setAppleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: `${window.location.origin}/app`,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Apple sign-in failed");
        setAppleLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message ?? "Apple sign-in failed");
      setAppleLoading(false);
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
          <MoxieLogo variant="light" />
        </Link>
        <div className="relative z-10 max-w-md">
          {mode === "signup" ? (
            <>
              <span
                className="inline-block mb-6 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider"
                style={{ background: "#ff6b6b", color: "#fff", letterSpacing: "1.5px" }}
              >
                Founding Member Access
              </span>
              <h2 className="font-display text-5xl leading-tight mb-6">
                Your AI Chief<br />Marketing Officer.
              </h2>
              <p
                className="italic"
                style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, lineHeight: 1.7 }}
              >
                "You don't need more content ideas.<br />
                You need a system that makes<br />
                marketing inevitable."
                <br />
                <span className="not-italic">— MOXIEMO</span>
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-5xl leading-tight mb-6">Welcome back.</h2>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 18, lineHeight: 1.6 }}>
                Sign in to continue building<br />your marketing engine.
              </p>
              <p
                className="italic mt-6"
                style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, lineHeight: 1.7 }}
              >
                "Consistency compounds.<br />
                Every time you log in,<br />
                you're building something real."
                <br />
                <span className="not-italic">— MOXIEMO</span>
              </p>
            </>
          )}
          {mode === "signup" && (
            <ul className="mt-10 space-y-2" style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
              <li><span style={{ color: "#ff6b6b" }}>✓</span> Free for founding members — forever</li>
              <li><span style={{ color: "#ff6b6b" }}>✓</span> Personal 1:1 onboarding call</li>
              <li><span style={{ color: "#ff6b6b" }}>✓</span> Locked-in rate before prices increase</li>
            </ul>
          )}
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
          <p className="text-muted-foreground mb-8">{mode === "signup" ? "Join as a founding member. Free forever." : "Sign in to continue building."}</p>

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
            <Button
              type="submit"
              disabled={loading}
              className={
                mode === "signup"
                  ? "w-full h-11 text-white hover:opacity-90 rounded-lg"
                  : "w-full h-11 bg-foreground text-background hover:bg-foreground/90 rounded-lg"
              }
              style={mode === "signup" ? { background: "#ff6b6b" } : undefined}
            >
              {loading ? "Working…" : mode === "signup" ? "Create my account" : "Sign in"} <ArrowRight className="ml-2 h-4 w-4" />
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

          <Button
            type="button"
            onClick={signInWithApple}
            disabled={appleLoading}
            variant="outline"
            className="w-full h-11 rounded-lg mt-3"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.42 2.22-1.18 3.04-.83.9-2.18 1.6-3.3 1.5-.14-1.1.4-2.26 1.16-3.05.83-.86 2.27-1.5 3.32-1.49zM20.5 17.27c-.55 1.27-.81 1.84-1.52 2.96-.99 1.56-2.39 3.5-4.13 3.52-1.55.02-1.95-1.01-4.05-1-2.1.01-2.54 1.02-4.09 1-1.74-.02-3.07-1.78-4.06-3.34C-.05 16.95-.34 11.85 1.5 9.13c1.31-1.94 3.38-3.07 5.32-3.07 1.97 0 3.21 1.08 4.84 1.08 1.58 0 2.54-1.08 4.82-1.08 1.73 0 3.55.94 4.86 2.57-4.27 2.34-3.58 8.45.16 8.64z"/></svg>
            {appleLoading ? "Connecting…" : "Continue with Apple"}
          </Button>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-foreground font-bold hover:text-accent">
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to MOXIEMO?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="font-bold hover:opacity-80"
                  style={{ color: "#ff6b6b" }}
                >
                  Get started free →
                </button>
              </>
            )}
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