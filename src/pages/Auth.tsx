import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/authErrors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoxieLogo } from "@/components/MoxieLogo";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Mail, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signin" ? "signin" : "signup";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  useEffect(() => {
    const m = searchParams.get("mode");
    setMode(m === "signin" ? "signin" : "signup");
    setShowPassword(false);
    setPassword("");
  }, [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks = {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    number:  /[0-9]/.test(password),
  };
  const passwordStrong = Object.values(passwordChecks).every(Boolean);
  const showStrength = mode === "signup" && password.length > 0;

  useEffect(() => { if (!authLoading && user) navigate("/app"); }, [user, authLoading, navigate]);

  async function signInWithGoogle() {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: unknown) {
      toast.error(friendlyAuthError("google", err));
      setGoogleLoading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && !passwordStrong) {
      toast.error("Your password needs at least 8 characters, one uppercase letter, and one number.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setSignupEmail(email);
        setSignupSuccess(true);
        toast.success("Account created! Check your email and click the confirmation link to get started.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back! Taking you to your dashboard.");
      }
    } catch (err: unknown) {
      toast.error(friendlyAuthError(mode === "signup" ? "sign_up" : "sign_in", err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col p-12 bg-foreground text-background relative overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

        {/* Logo — top */}
        <Link to="/" className="relative z-10 shrink-0">
          <MoxieLogo variant="light" />
        </Link>

        {/* Content — vertically centered in remaining space */}
        <div className="relative z-10 max-w-md flex-1 flex flex-col justify-center">
          {mode === "signup" ? (
            <>
              <span className="inline-block mb-6 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest bg-accent text-white w-fit">
                Founding Member Access
              </span>
              <h2 className="font-display text-5xl leading-tight mb-6">
                Your AI Chief<br />Marketing Officer.
              </h2>
              <p className="italic text-base leading-relaxed text-white/70">
                "You don't need more content ideas.<br />
                You need a system that makes<br />
                marketing inevitable."
                <br />
                <span className="not-italic">— MOXIEMO</span>
              </p>
              <ul className="mt-10 space-y-2 text-[13px] text-white/70">
                <li><span className="text-accent">✓</span> Free for founding members — forever</li>
                <li><span className="text-accent">✓</span> Personal 1:1 onboarding call</li>
                <li><span className="text-accent">✓</span> Locked-in rate before prices increase</li>
              </ul>
            </>
          ) : (
            <>
              <h2 className="font-display text-5xl leading-tight mb-6">Welcome back.</h2>
              <p className="text-lg leading-relaxed text-white/80">
                Sign in to continue building<br />your marketing engine.
              </p>
              <p className="italic mt-6 text-[15px] leading-relaxed text-white/60">
                "Consistency compounds.<br />
                Every time you log in,<br />
                you're building something real."
                <br />
                <span className="not-italic">— MOXIEMO</span>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><MoxieLogo /></div>
          {signupSuccess ? (
            <div>
              <div className="h-12 w-12 rounded-full bg-accent/15 flex items-center justify-center mb-6">
                <Mail className="h-6 w-6 text-accent" />
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
              <div className="relative mt-1.5">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="h-11 pr-10" />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  ? "w-full h-11 bg-accent text-white hover:bg-accent/90 rounded-lg"
                  : "w-full h-11 bg-foreground text-background hover:bg-foreground/90 rounded-lg"
              }
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

          <p className="mt-6 text-sm text-muted-foreground text-center">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button onClick={() => { setMode("signin"); setShowPassword(false); setPassword(""); }} className="text-foreground font-bold hover:text-accent">
                  Sign in
                </button>
              </>
            ) : (
              <>
                New to MOXIEMO?{" "}
                <button
                  onClick={() => { setMode("signup"); setShowPassword(false); setPassword(""); }}
                  className="font-bold text-accent hover:text-accent/80"
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