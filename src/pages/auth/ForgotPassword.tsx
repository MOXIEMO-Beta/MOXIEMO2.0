import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoxieLogo } from "@/components/MoxieLogo";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        const msg = error.message?.toLowerCase() ?? "";
        if (msg.includes("not found") || msg.includes("no user")) {
          setError("No account found with that email address.");
        } else {
          setError("Something went wrong — please try again.");
        }
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8"><MoxieLogo /></div>
        {sent ? (
          <div>
            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center mb-6">
              <Mail className="h-6 w-6 text-accent-foreground" />
            </div>
            <h1 className="font-display text-4xl mb-3">Check your email</h1>
            <p className="text-muted-foreground mb-6">
              We sent a reset link to <span className="text-foreground font-medium">{email}</span>. Click the link in the email to set a new password.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Didn't get it?{" "}
              <button
                onClick={() => { setSent(false); }}
                className="text-foreground font-medium hover:text-accent"
              >
                Resend email
              </button>
            </p>
            <Link to="/auth" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-4xl mb-2">Reset your password</h1>
            <p className="text-muted-foreground mb-8">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="mt-1.5 h-11"
                />
                {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg"
              >
                {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>) : "Send reset link"}
              </Button>
            </form>
            <Link to="/auth" className="mt-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}