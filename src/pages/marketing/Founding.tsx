import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Sparkles, Zap, Infinity as InfinityIcon } from "lucide-react";

const CAPACITY = 50;

export default function Founding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [count, setCount] = useState<number | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      toast.message("You already have a MOXIE account.");
      navigate("/app");
    }
  }, [user, navigate]);

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("plan", "founding_member");
      setCount(count ?? 0);
    })();
  }, []);

  const spotsFull = count !== null && count >= CAPACITY;
  const remaining = count === null ? null : Math.max(0, CAPACITY - count);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, first_name: firstName, last_name: lastName },
          emailRedirectTo: `${window.location.origin}/app/discovery`,
        },
      });
      if (signUpError) throw signUpError;

      const userId = data.user?.id;
      if (userId) {
        await supabase
          .from("profiles")
          .upsert(
            { id: userId, email, full_name: fullName, plan: "founding_member" },
            { onConflict: "id" }
          );
      }

      toast.success("You're in. Welcome, Founding Member.");
      navigate("/app/discovery");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!waitlistEmail) return;
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({ email: waitlistEmail, name: waitlistEmail, referral_source: "founding_full" });
      if (error) throw error;
      setWaitlistSubmitted(true);
      toast.success("You're on the list. We'll be in touch.");
    } catch (err: any) {
      toast.error(err.message ?? "Could not join waitlist.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="pt-16 md:pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div
            className="inline-block text-xs font-bold uppercase tracking-[0.22em] mb-6 px-4 py-2 rounded-full text-white"
            style={{ backgroundColor: "#ff6b6b" }}
          >
            Founding Members — Limited Spots
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-[-0.035em] leading-[1.05] mb-6 text-foreground">
            Lock in free access before the doors close.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Founding members get full platform access free — forever. We're personally onboarding every founding member with a 1:1 kickoff call. This offer closes when beta ends.
          </p>

          {/* Benefit callouts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-3xl mx-auto">
            {[
              { icon: Sparkles, title: "25 generations/month", sub: "Reset every 1st" },
              { icon: Zap, title: "LinkedIn publishing", sub: "More platforms coming" },
              { icon: InfinityIcon, title: "Free — forever", sub: "No card required. Ever." },
            ].map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-border bg-card p-6 text-left"
              >
                <div className="h-9 w-9 rounded-full bg-accent-soft flex items-center justify-center mb-3">
                  <b.icon className="h-4 w-4 text-accent" />
                </div>
                <p className="font-semibold text-foreground">{b.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div className="max-w-md mx-auto px-6 mt-14">
          {remaining !== null && !spotsFull && (
            <div className="text-center mb-4">
              <span
                className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: "#ff6b6b" }}
              >
                {remaining} of {CAPACITY} spots remaining
              </span>
            </div>
          )}

          <div
            className="rounded-2xl bg-card border border-border p-8 md:p-10"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}
          >
            {spotsFull ? (
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight mb-3">
                  Founding Member spots are full.
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Join the waitlist to be first in line for Foundation access.
                </p>
                {waitlistSubmitted ? (
                  <p className="text-sm text-accent font-semibold">You're on the list ✓</p>
                ) : (
                  <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="email"
                      required
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="h-11"
                    />
                    <Button
                      type="submit"
                      className="h-11 px-5 rounded-lg text-white hover:opacity-90"
                      style={{ backgroundColor: "#ff6b6b" }}
                    >
                      Join waitlist
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">
                  Create your Founding Member account
                </h2>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="mt-1.5 h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="mt-1.5 h-11"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-1.5 h-11"
                    />
                  </div>
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
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="mt-1.5 h-11"
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-full font-semibold text-white hover:opacity-90"
                    style={{ backgroundColor: "#ff6b6b" }}
                  >
                    {loading ? "Creating account…" : "Join as a Founding Member"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center leading-relaxed pt-2">
                    By signing up you agree to our{" "}
                    <Link to="/terms" className="underline hover:text-foreground">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="underline hover:text-foreground">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/auth?mode=signin" className="text-foreground font-semibold hover:text-accent">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}