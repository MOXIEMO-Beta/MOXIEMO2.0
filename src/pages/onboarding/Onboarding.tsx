import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { MoxieLogo } from "@/components/MoxieLogo";
import { Loader2, ArrowLeft, ArrowRight, Check, Sparkles, Rocket } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const TOTAL_STEPS = 8;

const ROLES = [
  { id: "founder", emoji: "🧑‍💼", label: "Founder" },
  { id: "solopreneur", emoji: "💼", label: "Solopreneur" },
  { id: "business_owner", emoji: "🏢", label: "Business Owner" },
  { id: "consultant", emoji: "🎯", label: "Consultant" },
  { id: "fractional", emoji: "⚡", label: "Fractional Executive" },
  { id: "agency_owner", emoji: "🏗", label: "Agency Owner" },
  { id: "marketer", emoji: "📊", label: "Marketer" },
  { id: "marketing_team", emoji: "👥", label: "Marketing Team" },
];

const USES = [
  { id: "strategy", emoji: "📋", label: "Build my marketing strategy" },
  { id: "social", emoji: "✍️", label: "Create social media content" },
  { id: "email", emoji: "📧", label: "Send email newsletters" },
  { id: "schedule", emoji: "📅", label: "Plan and schedule posts" },
  { id: "track", emoji: "📊", label: "Track performance" },
  { id: "align", emoji: "🎯", label: "Align my team on messaging" },
  { id: "replace", emoji: "🤖", label: "Replace multiple marketing tools" },
];

const REFERRALS = ["LinkedIn", "Instagram", "A friend or colleague", "Podcast", "Google search", "An event or conference", "Other"];

const INDUSTRIES = ["Coaching", "Consulting", "Agency", "Fractional Services", "Professional Services", "Technology", "Healthcare", "Hospitality", "Real Estate", "Legal", "Finance", "Education", "Creative Services", "E-commerce", "Other"];

const TEAM_SIZES = [
  { id: "just_me", emoji: "👤", label: "Just me" },
  { id: "2_5", emoji: "👥", label: "2–5 people" },
  { id: "6_15", emoji: "👥", label: "6–15 people" },
  { id: "16_50", emoji: "👥", label: "16–50 people" },
  { id: "50_plus", emoji: "🏢", label: "50+ people", full: true },
];

type StepData = Record<string, any>;

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  // Step states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<string>("");
  const [uses, setUses] = useState<string[]>([]);
  const [referral, setReferral] = useState<string>("");
  const [referralOther, setReferralOther] = useState("");
  const [website, setWebsite] = useState("");
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandAssets, setBrandAssets] = useState<any | null>(null);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState<string>("");
  const [teamSize, setTeamSize] = useState<string>("");
  const [betaCode, setBetaCode] = useState("");
  const [codeChecking, setCodeChecking] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeData, setCodeData] = useState<any | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  // Hydrate from existing responses & profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, { data: responses }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("onboarding_responses").select("step, response").eq("user_id", user.id).order("step", { ascending: true }),
      ]);
      if (profile?.full_name) {
        const parts = profile.full_name.split(" ");
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" "));
      }
      if (profile?.role) setRole(profile.role);
      if (profile?.intended_use && Array.isArray(profile.intended_use)) setUses(profile.intended_use as string[]);
      if (profile?.referral_source) {
        if (REFERRALS.includes(profile.referral_source)) setReferral(profile.referral_source);
        else { setReferral("Other"); setReferralOther(profile.referral_source); }
      }
      if (profile?.website_url) setWebsite(profile.website_url);
      if (profile?.brand_assets && Object.keys(profile.brand_assets as any).length) setBrandAssets(profile.brand_assets);
      if (profile?.business_name) setCompanyName(profile.business_name);
      if (profile?.industry) setIndustry(profile.industry);
      if (profile?.team_size) setTeamSize(profile.team_size);

      // Resume step
      const highest = responses?.length ? Math.max(...responses.map((r) => r.step)) : 0;
      setStep(Math.min(TOTAL_STEPS, Math.max(1, highest + 1)));
      setHydrated(true);
    })();
  }, [user]);

  if (authLoading || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const progress = Math.round(((step - 1) / TOTAL_STEPS) * 100);

  async function saveStep(stepNum: number, data: StepData, profileUpdate?: Record<string, any>) {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("onboarding_responses").upsert(
        { user_id: user.id, step: stepNum, response: data },
        { onConflict: "user_id,step" },
      );
      if (profileUpdate && Object.keys(profileUpdate).length) {
        await supabase.from("profiles").update(profileUpdate as any).eq("id", user.id);
      }
    } finally {
      setSaving(false);
    }
  }

  function back() { if (step > 1) setStep(step - 1); }

  async function nextFromStep(s: number) {
    if (s === 1) {
      await saveStep(1, { firstName, lastName }, { full_name: `${firstName.trim()} ${lastName.trim()}`.trim() });
    } else if (s === 2) {
      await saveStep(2, { role }, { role });
    } else if (s === 3) {
      await saveStep(3, { uses }, { intended_use: uses });
    } else if (s === 4) {
      const value = referral === "Other" ? (referralOther.trim() || "Other") : referral;
      await saveStep(4, { referral: value }, { referral_source: value });
    } else if (s === 5) {
      const update: any = {};
      if (website.trim()) update.website_url = normalizeUrl(website.trim());
      if (brandAssets) update.brand_assets = brandAssets;
      await saveStep(5, { website: update.website_url ?? null, brandAssets }, update);
    } else if (s === 6) {
      await saveStep(6, { companyName, industry }, { business_name: companyName.trim(), industry: industry || null });
    } else if (s === 7) {
      await saveStep(7, { teamSize }, { team_size: teamSize });
    }
    setStep(s + 1);
  }

  function normalizeUrl(u: string) {
    if (/^https?:\/\//i.test(u)) return u;
    return `https://${u}`;
  }

  async function fetchBrand() {
    const url = website.trim();
    if (!url) return;
    const normalized = normalizeUrl(url);
    setWebsite(normalized);
    setBrandLoading(true);
    setBrandError(null);
    setBrandAssets(null);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-brand-assets", { body: { url: normalized } });
      if (error) throw error;
      if (!data || (!data.siteName && !data.logo && !(data.colors?.length))) {
        setBrandError("We couldn't extract brand assets automatically. You can add them later in Settings.");
      } else {
        setBrandAssets(data);
      }
    } catch {
      setBrandError("We couldn't extract brand assets automatically. You can add them later in Settings.");
    } finally {
      setBrandLoading(false);
    }
  }

  async function applyBetaCode() {
    const code = betaCode.toUpperCase().trim();
    if (!code) return;
    setCodeChecking(true);
    setCodeError(null);
    setCodeData(null);
    try {
      const { data } = await supabase.from("beta_codes").select("*").eq("code", code).eq("active", true).maybeSingle();
      if (!data) { setCodeError("Invalid or expired code"); return; }
      if ((data.uses_count ?? 0) >= (data.max_uses ?? 0)) { setCodeError("This code has reached its maximum uses"); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setCodeError("This code has expired"); return; }
      setCodeData(data);
    } finally {
      setCodeChecking(false);
    }
  }

  async function joinFoundingMember() {
    if (!user || !codeData) return;
    setFinalizing(true);
    try {
      const code = betaCode.toUpperCase().trim();
      await supabase.from("profiles").update({
        plan: "beta_lifetime", beta_code_used: code, onboarding_completed: true,
      }).eq("id", user.id);
      await supabase.from("beta_codes").update({ uses_count: (codeData.uses_count ?? 0) + 1 }).eq("id", codeData.id);
      navigate("/app/discovery?welcome=true");
    } catch (e: any) {
      toast.error(e.message || "Couldn't finalize");
      setFinalizing(false);
    }
  }

  async function startTrial() {
    if (!user) return;
    setFinalizing(true);
    try {
      await supabase.from("profiles").update({ plan: "growth_trial", onboarding_completed: true }).eq("id", user.id);
      navigate("/app/discovery?welcome=true");
    } catch (e: any) {
      toast.error(e.message || "Couldn't finalize");
      setFinalizing(false);
    }
  }

  // Validation per step
  const canContinue =
    step === 1 ? firstName.trim().length > 0 && lastName.trim().length > 0
    : step === 2 ? !!role
    : step === 3 ? uses.length > 0
    : step === 4 ? referral === "Other" ? referralOther.trim().length > 0 : !!referral
    : step === 5 ? true
    : step === 6 ? companyName.trim().length > 0
    : step === 7 ? !!teamSize
    : false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 lg:px-10 py-5 border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <MoxieLogo />
          <span className="text-sm text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
        </div>
        <div className="max-w-3xl mx-auto mt-3">
          <Progress value={progress} className="h-1.5 [&>div]:bg-accent" />
        </div>
      </header>

      <main className="flex-1 flex flex-col px-6 lg:px-10 py-10">
        <div className="max-w-2xl w-full mx-auto flex-1">
          {step === 1 && <Step1 firstName={firstName} lastName={lastName} setFirstName={setFirstName} setLastName={setLastName} />}
          {step === 2 && <Step2 role={role} setRole={setRole} />}
          {step === 3 && <Step3 uses={uses} setUses={setUses} />}
          {step === 4 && <Step4 referral={referral} setReferral={setReferral} referralOther={referralOther} setReferralOther={setReferralOther} />}
          {step === 5 && <Step5 website={website} setWebsite={setWebsite} brandLoading={brandLoading} brandAssets={brandAssets} brandError={brandError} fetchBrand={fetchBrand} skip={() => { setBrandAssets(null); setStep(6); }} />}
          {step === 6 && <Step6 companyName={companyName} setCompanyName={setCompanyName} industry={industry} setIndustry={setIndustry} />}
          {step === 7 && <Step7 teamSize={teamSize} setTeamSize={setTeamSize} />}
          {step === 8 && (
            <Step8
              betaCode={betaCode} setBetaCode={setBetaCode}
              applyBetaCode={applyBetaCode} codeChecking={codeChecking}
              codeError={codeError} codeValid={!!codeData}
              joinFoundingMember={joinFoundingMember} startTrial={startTrial}
              finalizing={finalizing}
            />
          )}
        </div>

        <div className="max-w-2xl w-full mx-auto mt-10 flex items-center justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={back} disabled={saving || finalizing}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : <span />}
          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => nextFromStep(step)}
              disabled={!canContinue || saving || brandLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4 ml-1" /></>}
            </Button>
          ) : <span />}
        </div>
      </main>
    </div>
  );
}

/* ----- Step components ----- */

function Step1({ firstName, lastName, setFirstName, setLastName }: any) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome to MOXIE. 👋</h1>
      <p className="text-muted-foreground mt-2">Let's get your account set up. This takes about 2 minutes.</p>
      <h2 className="text-lg font-medium mt-10 mb-4">What's your name?</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fn">First name</Label>
          <Input id="fn" autoFocus value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="ln">Last name</Label>
          <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1.5" />
        </div>
      </div>
    </div>
  );
}

function Step2({ role, setRole }: any) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">What best describes you?</h1>
      <div className="grid sm:grid-cols-2 gap-3 mt-8">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition text-left",
              role === r.id ? "border-accent bg-accent/5" : "border-border hover:border-foreground/20"
            )}
          >
            <span className="text-2xl">{r.emoji}</span>
            <span className="font-medium">{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step3({ uses, setUses }: any) {
  const toggle = (id: string) => setUses(uses.includes(id) ? uses.filter((u: string) => u !== id) : [...uses, id]);
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">How do you plan to use MOXIE?</h1>
      <p className="text-muted-foreground mt-2">Select all that apply.</p>
      <div className="space-y-2.5 mt-8">
        {USES.map((u) => {
          const selected = uses.includes(u.id);
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u.id)}
              className={cn(
                "w-full flex items-center justify-between gap-3 px-4 py-4 rounded-xl border-2 transition text-left",
                selected ? "border-accent bg-accent/5 border-l-[6px]" : "border-border hover:border-foreground/20"
              )}
            >
              <span className="flex items-center gap-3">
                <span className="text-xl">{u.emoji}</span>
                <span className="font-medium">{u.label}</span>
              </span>
              <span className={cn("h-5 w-5 rounded border-2 flex items-center justify-center", selected ? "bg-accent border-accent text-accent-foreground" : "border-border")}>
                {selected && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step4({ referral, setReferral, referralOther, setReferralOther }: any) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">How did you hear about MOXIE?</h1>
      <div className="space-y-2 mt-8">
        {REFERRALS.map((r) => (
          <label key={r} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition", referral === r ? "border-accent bg-accent/5" : "border-border hover:border-foreground/20")}>
            <input type="radio" name="referral" checked={referral === r} onChange={() => setReferral(r)} className="h-4 w-4 accent-[hsl(var(--accent))]" />
            <span>{r}</span>
          </label>
        ))}
        {referral === "Other" && (
          <Input placeholder="Tell us where..." value={referralOther} onChange={(e) => setReferralOther(e.target.value)} className="mt-2" autoFocus />
        )}
      </div>
    </div>
  );
}

function Step5({ website, setWebsite, brandLoading, brandAssets, brandError, fetchBrand, skip }: any) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Share your website <span className="text-muted-foreground text-xl">(optional)</span></h1>
      <p className="text-muted-foreground mt-2">MOXIE will try to pull your logo and brand colors automatically.</p>
      <div className="mt-8 flex gap-2">
        <Input placeholder="https://yourwebsite.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <Button onClick={fetchBrand} disabled={!website.trim() || brandLoading} variant="outline">
          {brandLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
        </Button>
      </div>
      {brandLoading && (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Fetching your brand assets...
        </div>
      )}
      {brandError && <p className="mt-6 text-sm text-muted-foreground">{brandError}</p>}
      {brandAssets && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <p className="font-medium flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> We found these brand elements</p>
          {brandAssets.logo && (
            <div className="mt-4 flex items-center gap-3">
              <img src={brandAssets.logo} alt="Logo" className="h-12 w-12 rounded object-contain border border-border bg-background" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
            </div>
          )}
          {brandAssets.colors?.length > 0 && (
            <div className="mt-3 flex gap-2">
              {brandAssets.colors.slice(0, 5).map((c: string) => (
                <div key={c} className="h-8 w-8 rounded border border-border" style={{ background: c }} title={c} />
              ))}
            </div>
          )}
          {brandAssets.siteName && <p className="mt-3 text-sm">Company name: <span className="font-medium">{brandAssets.siteName}</span></p>}
        </div>
      )}
      <button type="button" onClick={skip} className="mt-6 text-sm text-muted-foreground hover:text-foreground underline">
        Skip for now →
      </button>
    </div>
  );
}

function Step6({ companyName, setCompanyName, industry, setIndustry }: any) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Tell us about your business</h1>
      <div className="mt-8 space-y-5">
        <div>
          <Label>Company or brand name</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1.5" autoFocus />
        </div>
        <div>
          <Label>What industry are you in?</Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select an industry" /></SelectTrigger>
            <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function Step7({ teamSize, setTeamSize }: any) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">How large is your team?</h1>
      <div className="grid sm:grid-cols-2 gap-3 mt-8">
        {TEAM_SIZES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTeamSize(t.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition text-left",
              t.full ? "sm:col-span-2" : "",
              teamSize === t.id ? "border-accent bg-accent/5" : "border-border hover:border-foreground/20"
            )}
          >
            <span className="text-2xl">{t.emoji}</span>
            <span className="font-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step8({ betaCode, setBetaCode, applyBetaCode, codeChecking, codeError, codeValid, joinFoundingMember, startTrial, finalizing }: any) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">You're almost in.</h1>
      <p className="text-muted-foreground mt-2">Choose how you'd like to access MOXIE.</p>
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        {/* Beta */}
        <div className={cn(
          "rounded-2xl border-2 p-6 flex flex-col transition",
          codeValid ? "border-accent bg-accent/5" : "border-border"
        )}>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
            <Sparkles className="h-4 w-4" /> Beta Founding Member
          </div>
          <div className="mt-3 text-2xl font-semibold">Free — forever</div>
          <ul className="mt-4 space-y-2 text-sm flex-1">
            <li className="flex gap-2"><Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" /> Full platform access</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" /> Founding member status</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" /> Shape the product</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" /> Locked in free forever</li>
          </ul>
          {codeValid ? (
            <>
              <p className="mt-4 text-sm text-accent flex items-center gap-2"><Check className="h-4 w-4" /> Code accepted — founding access unlocked!</p>
              <Button onClick={joinFoundingMember} disabled={finalizing} className="mt-3 bg-accent text-accent-foreground hover:bg-accent/90">
                {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Join as Founding Member <ArrowRight className="h-4 w-4 ml-1" /></>}
              </Button>
            </>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">Requires beta code (enter below)</p>
          )}
        </div>

        {/* Growth */}
        <div className={cn("rounded-2xl border-2 p-6 flex flex-col transition", codeValid ? "border-border opacity-60" : "border-border")}>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground/70">
            <Rocket className="h-4 w-4" /> Growth
          </div>
          <div className="mt-3 text-2xl font-semibold">$79<span className="text-base font-normal text-muted-foreground">/month</span></div>
          <p className="text-xs text-muted-foreground">Cancel anytime</p>
          <ul className="mt-4 space-y-2 text-sm flex-1">
            <li className="flex gap-2"><Check className="h-4 w-4 text-foreground/60 flex-shrink-0 mt-0.5" /> Full platform access</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-foreground/60 flex-shrink-0 mt-0.5" /> Priority support</li>
            <li className="flex gap-2"><Check className="h-4 w-4 text-foreground/60 flex-shrink-0 mt-0.5" /> Early Beta 2 access</li>
          </ul>
          <Button onClick={startTrial} disabled={finalizing} variant="outline" className="mt-4">
            {finalizing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start free trial"}
          </Button>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border p-5">
        <p className="text-sm font-medium">Have a beta code?</p>
        <div className="mt-3 flex gap-2">
          <Input value={betaCode} onChange={(e) => { setBetaCode(e.target.value); }} placeholder="MOXIE2026" className="uppercase" />
          <Button onClick={applyBetaCode} disabled={!betaCode.trim() || codeChecking} variant="outline">
            {codeChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Apply code <ArrowRight className="h-4 w-4 ml-1" /></>}
          </Button>
        </div>
        {codeError && <p className="mt-2 text-sm text-destructive">{codeError}</p>}
      </div>
    </div>
  );
}