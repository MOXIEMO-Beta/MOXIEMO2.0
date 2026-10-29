import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MoxieAvatar } from "@/components/MoxieAvatar";

const GOALS = [
  { value: "more_leads", label: "More qualified leads" },
  { value: "raise_prices", label: "Raise prices or move upmarket" },
  { value: "launch_reposition", label: "Launch or reposition" },
  { value: "authority", label: "Build authority and visibility" },
  { value: "not_sure", label: "Not sure yet" },
];

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export default function BrandAudit() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // step 1
  const [url, setUrl] = useState("");
  const [scrapingInitial, setScrapingInitial] = useState(false);
  const [error, setError] = useState("");

  // step 2
  const [brandName, setBrandName] = useState("");
  const [whatYouDo, setWhatYouDo] = useState("");
  const [whoYouServe, setWhoYouServe] = useState("");

  // step 3
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [manualCompetitor, setManualCompetitor] = useState("");

  // step 4
  const [goal, setGoal] = useState("");

  // step 5
  const [differentiator, setDifferentiator] = useState("");

  // step 6
  const [location, setLocation] = useState("");
  const [reach, setReach] = useState("");

  // capture
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // background warm-up
  const deepPromiseRef = useRef<Promise<any> | null>(null);
  const deepPayloadRef = useRef<any>(null);

  function assembledInputs() {
    return {
      brand_name: brandName,
      what_you_do: whatYouDo,
      who_you_serve: whoYouServe,
      location,
      goal,
      differentiator,
      reach,
      competitors,
    };
  }

  async function startWarmUp() {
    if (deepPromiseRef.current) return;
    deepPromiseRef.current = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("scrape-deep", {
          body: { url, inputs: assembledInputs() },
        });
        if (error) throw new Error(error.message);
        deepPayloadRef.current = data;
        return data;
      } catch (e) {
        deepPromiseRef.current = null; // allow retry at capture
        throw e;
      }
    })();
  }

  async function submitStep1() {
    setError("");
    if (!url.trim()) { setError("Add your website URL to continue."); return; }
    setScrapingInitial(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-initial", { body: { url } });
      if (error) { setError(error.message); return; }
      setBrandName(data?.brand_name ?? "");
      setWhatYouDo(data?.what_you_do ?? "");
      setWhoYouServe(data?.who_you_serve ?? "");
      setStep(2);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setScrapingInitial(false);
    }
  }

  async function submitStep2() {
    setError("");
    setStep(3);
    // immediately ask for suggestions
    setSuggestLoading(true);
    try {
      const { data } = await supabase.functions.invoke("suggest-competitors", {
        body: { url, brand_name: brandName, what_you_do: whatYouDo, who_you_serve: whoYouServe, location },
      });
      const arr: string[] = (data?.suggested ?? []).slice(0, 8);
      setSuggested(arr);
    } finally {
      setSuggestLoading(false);
    }
  }

  function toggleCompetitor(c: string) {
    setCompetitors((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      if (prev.length >= 5) return prev;
      return [...prev, c];
    });
  }

  function addManualCompetitor() {
    const c = manualCompetitor.trim().toLowerCase();
    if (!c || competitors.includes(c) || competitors.length >= 5) return;
    setCompetitors([...competitors, c]);
    setManualCompetitor("");
  }

  function submitStep4(g: string) {
    setGoal(g);
    // kick off warm-up in the background once we have enough info
    startWarmUp().catch(() => {});
    setStep(5);
  }

  async function submitCapture(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("First name, last name, and email are required.");
      return;
    }
    setSubmitting(true);
    setStep(8); // generating screen
    try {
      // ensure warm-up started
      if (!deepPromiseRef.current) startWarmUp();
      let payload = deepPayloadRef.current;
      if (!payload) {
        payload = await deepPromiseRef.current;
      }
      const { data, error } = await supabase.functions.invoke("finalize-audit", {
        body: {
          url,
          payload,
          lead: { first_name: firstName, last_name: lastName, email },
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.audit_id) throw new Error("No audit id returned.");
      navigate(`/brand-audit/r/${data.audit_id}`);
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setStep(7); // back to capture
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F1] flex flex-col" style={{ fontFamily: "Inter, sans-serif" }}>
      <SiteHeader />

      {step === 1 ? (
        <section className="flex-1 px-4 py-16 md:py-24">
          <style>{`
            .ba-moxie-layout { display: flex; align-items: center; gap: 48px; max-width: 1120px; margin: 0 auto; }
            .ba-moxie-content { flex: 1; min-width: 0; }
            .ba-moxie-figure { flex: none; opacity: 0; transform: translateY(12px); animation: ba-moxie-in 600ms ease-out forwards; }
            @keyframes ba-moxie-in { to { opacity: 1; transform: translateY(0); } }
            .ba-moxie-float { position: relative; display: flex; flex-direction: column; align-items: center; animation: ba-moxie-float 4.5s ease-in-out 700ms infinite; }
            @keyframes ba-moxie-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
            .ba-moxie-bubble { position: absolute; right: 58%; bottom: 64%; }
            @media (prefers-reduced-motion: reduce) {
              .ba-moxie-figure { animation: none; opacity: 1; transform: none; }
              .ba-moxie-float { animation: none; }
            }
            @media (max-width: 767px) {
              .ba-moxie-layout { flex-direction: column; gap: 36px; }
              .ba-moxie-figure { order: -1; align-self: center; }
              .ba-moxie-float img { width: 180px !important; }
              .ba-moxie-bubble { position: static; margin-top: 16px; }
            }
          `}</style>
          <div className="ba-moxie-layout">
          <div className="ba-moxie-content max-w-3xl text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#FF6B5C] mb-5">
              Your free growth assessment
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#15171C] leading-[1.05] mb-5">
              Find out where your next growth opportunity might be hiding.
            </h1>
            <p className="text-lg md:text-xl text-[#4a4d57] leading-relaxed max-w-2xl mx-auto mb-10">
              Enter your website for a quick, honest read on your positioning, your message and your visibility. See what is working, what is holding you back and what to fix first.
            </p>
            <p className="text-sm md:text-base text-[#7a7e8c] leading-relaxed max-w-xl mx-auto -mt-6 mb-10">
              Your website is one piece of evidence. The full MOXIEMO discovery goes further, with your goals, audience, offer and proof.
            </p>

            {error && (
              <div className="mb-4 text-sm text-[#FF6B5C] bg-[#FFE9E6] border border-[#FFCFC8] rounded-md px-3 py-2 max-w-xl mx-auto">
                {error}
              </div>
            )}

            <form
              onSubmit={(e) => { e.preventDefault(); submitStep1(); }}
              className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2 bg-white border-2 border-[#15171C]/10 rounded-full p-2 shadow-sm focus-within:border-[#FF6B5C] transition-colors"
            >
              <Input
                id="url"
                placeholder="https://yourbrand.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={scrapingInitial}
                className="flex-1 border-0 bg-transparent h-11 text-base focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
              />
              <Button
                type="submit"
                disabled={scrapingInitial || !url.trim()}
                className="bg-[#FF6B5C] hover:bg-[#FF6B5C]/90 text-white rounded-full px-6 h-11 font-semibold"
              >
                {scrapingInitial ? "Reading your site..." : "Find my growth opportunities"}
              </Button>
            </form>
            <p className="text-sm text-[#7a7e8c] mt-4">
              Free. No credit card. No login.
            </p>
          </div>
          <div className="ba-moxie-figure">
            <div className="ba-moxie-float">
              <MoxieAvatar pose="magnify" size={260} />
              <div
                className="ba-moxie-bubble"
                style={{
                  background: "#F4EFE5", color: "#13130F", fontSize: 15, lineHeight: 1.45,
                  padding: "12px 16px", maxWidth: 260, textAlign: "left",
                  borderRadius: 16, borderBottomRightRadius: 4,
                  boxShadow: "0 12px 30px -12px rgba(19,19,15,0.35)",
                }}
              >
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#8a877a", marginBottom: 6 }}>MOXIE</div>
                Share your website and I will show you where your next growth opportunity might be hiding. It is free.
              </div>
            </div>
          </div>
          </div>
        </section>
      ) : (
        <section className="flex-1 px-4 py-12 md:py-16">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#15171C] mb-2">
              Your free growth assessment
            </h1>
            <p className="text-[#7a7e8c] mb-8">
              Six quick steps. We read your site first, so you are mostly confirming.
            </p>

            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a7e8c] mb-4">
              {step <= 6 ? `Step ${step} of 6` : step === 7 ? "Where to send it" : "Building your report"}
            </div>

            {error && (
              <div className="mb-4 text-sm text-[#FF6B5C] bg-[#FFE9E6] border border-[#FFCFC8] rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <div className="bg-white border-2 rounded-2xl p-6 md:p-8 shadow-sm">
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-[#15171C]">Here is what we found. Edit anything that is off.</p>
              <div className="space-y-2">
                <Label>Brand name</Label>
                <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Your brand name" />
              </div>
              <div className="space-y-2">
                <Label>What you do</Label>
                <Input value={whatYouDo} onChange={(e) => setWhatYouDo(e.target.value)} placeholder="In one line" />
              </div>
              <div className="space-y-2">
                <Label>Who you serve</Label>
                <Input value={whoYouServe} onChange={(e) => setWhoYouServe(e.target.value)} placeholder="Your audience" />
              </div>
              <div className="space-y-2">
                <Label>Location (optional)</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. United States" />
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={submitStep2} className="bg-[#FF6B5C] hover:bg-[#FF6B5C]/90 text-white rounded-full px-6 h-11 font-semibold">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-[#15171C] mb-1">Who do you stack up against?</p>
                <p className="text-xs text-[#7a7e8c]">Pick up to five. Tap to add or remove.</p>
              </div>
              {suggestLoading ? (
                <p className="text-sm text-[#7a7e8c]">Finding similar businesses...</p>
              ) : suggested.length === 0 ? (
                <p className="text-sm text-[#7a7e8c]">No suggestions yet. Add a few manually below.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {suggested.map((c) => {
                    const active = competitors.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCompetitor(c)}
                        className={`text-sm rounded-full px-3 py-1.5 border ${
                          active
                            ? "bg-[#FF6B5C] text-white border-[#FF6B5C]"
                            : "bg-white text-[#15171C] border-[#e4e5ea] hover:border-[#FF6B5C]"
                        }`}
                      >
                        {active ? "✓ " : "+ "}{c}
                      </button>
                    );
                  })}
                </div>
              )}

              {competitors.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#7a7e8c] mb-2">
                    Selected ({competitors.length}/5)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {competitors.map((c) => (
                      <span key={c} className="text-sm rounded-full px-3 py-1.5 bg-[#15171C] text-white inline-flex items-center gap-2">
                        {c}
                        <button onClick={() => toggleCompetitor(c)} className="opacity-70 hover:opacity-100">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={manualCompetitor}
                  onChange={(e) => setManualCompetitor(e.target.value)}
                  placeholder="competitor.com"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addManualCompetitor(); } }}
                />
                <Button variant="outline" onClick={addManualCompetitor} disabled={competitors.length >= 5}>
                  Add
                </Button>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={() => setStep(4)} className="bg-[#FF6B5C] hover:bg-[#FF6B5C]/90 text-white rounded-full px-6 h-11 font-semibold">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-[#15171C]">What is your main focus right now?</p>
              <div className="space-y-2">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => submitStep4(g.value)}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3 transition ${
                      goal === g.value
                        ? "border-[#FF6B5C] bg-[#FFE9E6]"
                        : "border-[#e4e5ea] hover:border-[#FF6B5C]"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              <div className="flex justify-start pt-2">
                <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What makes you different? <span className="text-[#7a7e8c] font-normal">(optional)</span></Label>
                <Input
                  value={differentiator}
                  onChange={(e) => setDifferentiator(e.target.value)}
                  placeholder="One line, in your own words"
                />
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(4)}>Back</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(6)}>Skip</Button>
                  <Button onClick={() => setStep(6)} className="bg-[#FF6B5C] hover:bg-[#FF6B5C]/90 text-white rounded-full px-6 h-11 font-semibold">
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <p className="text-sm text-[#15171C]">A couple of optional details to sharpen the read.</p>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. United States" />
              </div>
              <div className="space-y-2">
                <Label>Reach</Label>
                <Input value={reach} onChange={(e) => setReach(e.target.value)} placeholder="e.g. local, national, global" />
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(5)}>Back</Button>
                <Button
                  onClick={() => setStep(7)}
                  className="bg-[#FF6B5C] hover:bg-[#FF6B5C]/90 text-white rounded-full px-6 h-11 font-semibold"
                >
                  Generate my free growth assessment report
                </Button>
              </div>
            </div>
          )}

          {step === 7 && (
            <form onSubmit={submitCapture} className="space-y-4">
              <p className="text-sm text-[#15171C]">
                Where should we send your report? Enter your details and we will build it now.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="ghost" type="button" onClick={() => setStep(6)}>Back</Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#FF6B5C] hover:bg-[#FF6B5C]/90 text-white rounded-full px-6 h-11 font-semibold"
                >
                  {submitting ? "Building..." : "Build my report"}
                </Button>
              </div>
            </form>
          )}

          {step === 8 && (
            <div className="text-center py-10 space-y-3">
              <div className="inline-block w-10 h-10 border-4 border-[#FF6B5C] border-t-transparent rounded-full animate-spin mb-2" />
              <h2 className="text-xl font-bold text-[#15171C]">Building your free growth assessment</h2>
              <p className="text-[#7a7e8c] text-sm">
                Vera is reading your signals and writing the report. This usually takes 30 to 60 seconds.
              </p>
            </div>
          )}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}