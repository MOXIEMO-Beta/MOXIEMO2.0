import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoxieLogo } from "@/components/MoxieLogo";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate("/app"); }, [user, navigate]);

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
        toast.success("Welcome to MOXIE. Let's build your strategy.");
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
            <Button type="submit" disabled={loading} className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 rounded-lg">
              {loading ? "Working…" : mode === "signup" ? "Create account" : "Sign in"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-foreground font-medium hover:text-accent">
              {mode === "signup" ? "Sign in" : "Create account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}