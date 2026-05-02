import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { ArrowRight, Check, Loader2, Sparkles, CalendarDays } from "lucide-react";

const ROLES = [
  "Founder", "Solopreneur", "Consultant", "Fractional Executive",
  "Agency Owner", "Business Owner", "Marketer", "Other",
];
const REFERRAL_SOURCES = [
  "LinkedIn", "Instagram", "A friend or colleague",
  "Podcast", "Google search", "An event", "Other",
];
const ZOOM_LINK = "https://scheduler.zoom.us/klmg-ltd/moxie-beta-kickoff";

export function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Founder");
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<null | "already_registered" | "generic">(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("generic");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("join-waitlist", {
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          website_url: websiteUrl.trim() || null,
          company_name: companyName.trim() || null,
          referral_source: referralSource || null,
        },
      });
      if (invokeError) {
        const msg = (invokeError as any)?.context?.error || (invokeError as any)?.message || "";
        const body = (data as any)?.error || msg;
        if (typeof body === "string" && body.includes("already_registered")) {
          setError("already_registered");
        } else {
          setError("generic");
        }
        return;
      }
      if ((data as any)?.error === "already_registered") {
        setError("already_registered");
        return;
      }
      setSuccess(true);
    } catch (_err) {
      setError("generic");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card id="waitlist" className="p-8 md:p-12 border-border rounded-3xl bg-card shadow-lift max-w-2xl mx-auto text-center scroll-mt-24">
        <div className="h-14 w-14 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-5">
          <Check className="h-7 w-7 text-accent" />
        </div>
        <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          You're on the list, {name.split(" ")[0]}!
        </h3>
        <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-md mx-auto">
          Check your email — we sent you a confirmation with a link to schedule your founding member kickoff call with Karee.
        </p>
        <p className="text-muted-foreground mb-8">Can't wait to meet you.</p>
        <Button asChild size="lg" className="bg-foreground text-background hover:bg-foreground/90 h-12 px-7 rounded-full font-semibold">
          <a href={ZOOM_LINK} target="_blank" rel="noopener noreferrer">
            <CalendarDays className="mr-2 h-4 w-4" />
            Schedule your kickoff call <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </Card>
    );
  }

  return (
    <Card id="waitlist" className="p-8 md:p-12 border-border rounded-3xl bg-card shadow-lift max-w-2xl mx-auto scroll-mt-24">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent bg-accent-soft px-4 py-2 rounded-full mb-5">
          <Sparkles className="h-3.5 w-3.5" />
          Founding members
        </div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Be a MOXIE Founding Member
        </h2>
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-lg mx-auto">
          Join the beta and get full platform access — free, forever. We're personally onboarding every founding member with a 1:1 kickoff call.
        </p>
      </div>

      <ul className="grid sm:grid-cols-2 gap-3 mb-8">
        {[
          "Full platform access — free forever",
          "Locked-in rate before prices increase",
          "Personal onboarding call with the founder",
          "Shape the product with your feedback",
        ].map((perk) => (
          <li key={perk} className="flex gap-2.5 items-start text-[15px]">
            <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <span>{perk}</span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="wl-name">First name</Label>
            <Input
              id="wl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="mt-1.5 h-11"
              placeholder="Jane"
            />
          </div>
          <div>
            <Label htmlFor="wl-email">Email</Label>
            <Input
              id="wl-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="mt-1.5 h-11"
              placeholder="you@business.com"
            />
          </div>
        </div>

        <div>
          <Label>What best describes you?</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="mt-1.5 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="wl-company">Company name <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="wl-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              maxLength={150}
              className="mt-1.5 h-11"
            />
          </div>
          <div>
            <Label htmlFor="wl-website">Website <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="wl-website"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              maxLength={250}
              className="mt-1.5 h-11"
              placeholder="https://"
            />
          </div>
        </div>

        <div>
          <Label>How did you hear about us?</Label>
          <Select value={referralSource} onValueChange={setReferralSource}>
            <SelectTrigger className="mt-1.5 h-11">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {REFERRAL_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          size="lg"
          className="w-full bg-foreground text-background hover:bg-foreground/90 h-12 rounded-full font-semibold"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...
            </>
          ) : (
            <>
              Join the founding member waitlist <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {error === "already_registered" && (
          <p className="text-sm text-center text-muted-foreground bg-muted/60 border border-border rounded-lg p-3">
            Looks like you're already on the list! Check your email for next steps, or{" "}
            <Link to="/auth" className="text-accent font-medium underline underline-offset-2">sign in</Link>{" "}
            if you already have access.
          </p>
        )}
        {error === "generic" && (
          <p className="text-sm text-center text-destructive">
            Something went wrong — please try again or email us at{" "}
            <a href="mailto:questions@buildwithmoxie.co" className="underline underline-offset-2">questions@buildwithmoxie.co</a>
          </p>
        )}

        <p className="text-sm text-center text-muted-foreground pt-2">
          Already have access?{" "}
          <Link to="/auth" className="text-foreground font-medium underline underline-offset-2">Sign in →</Link>
        </p>
      </form>
    </Card>
  );
}