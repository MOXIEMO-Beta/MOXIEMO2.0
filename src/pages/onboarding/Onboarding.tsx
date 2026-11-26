import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { friendlyAuthError } from "@/lib/authErrors";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MoxieLogo } from "@/components/MoxieLogo";
import { Loader2, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 6;

type GoalKey = "first_100" | "launch_offer";
type BusinessType = "E" | "G" | "R";
type GateAnswer = "yes" | "not_yet";

interface GateState {
  q1: GateAnswer | null;
  q2: GateAnswer | null;
  q3: GateAnswer | null;
}

const GATE_QUESTIONS: Record<GoalKey, Array<{ question: string; helper: string }>> = {
  first_100: [
    {
      question: "Do you have a clear description of who you help?",
      helper: "Could you write one sentence right now describing exactly who your best customer is?",
    },
    {
      question: "Do you have something to offer them today?",
      helper: "A product, service, or program someone could buy from you this week.",
    },
    {
      question: "Do you have a way to reach potential customers?",
      helper: "An audience, a network, a platform, or a channel where your buyers already gather.",
    },
  ],
  launch_offer: [
    {
      question: "Can you deliver this offer right now?",
      helper:
        "If someone paid you today, could you fulfill it this week without building something new first?",
    },
    {
      question: "Has someone already paid for it, or told you they would?",
      helper:
        "Real demand, not polite interest. A past sale, a waitlist, or a direct expression of intent.",
    },
    {
      question: "Is it priced?",
      helper: "One clear price or price range. It depends is not a price yet.",
    },
  ],
};

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0); // 0 = resuming, 1–6 = active steps
  const [saving, setSaving] = useState(false);

  // Step 1
  const [goal, setGoal] = useState<GoalKey | null>(null);

  // Step 2
  const [timeframeDays, setTimeframeDays] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState<string>("");
  const [pickingDate, setPickingDate] = useState(false);

  // Step 3
  const [gateAnswers, setGateAnswers] = useState<GateState>({ q1: null, q2: null, q3: null });
  const [resolvedQuestions, setResolvedQuestions] = useState<Record<number, boolean>>({});

  // Step 4
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);

  // Step 5
  const [firstMoveText, setFirstMoveText] = useState<string | null>(null);
  const [firstMoveLoading, setFirstMoveLoading] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);

  // Step 6
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function resume() {
      const { data, error } = await (supabase.from("profiles") as ReturnType<typeof supabase.from>)
        .select(
          "onboarding_goal,onboarding_timeframe_days,onboarding_timeframe_custom_date,onboarding_business_type,onboarding_gate_passed,onboarding_gate_answers,onboarding_first_move",
        )
        .eq("id", user!.id)
        .maybeSingle();

      if (error || !data) { setStep(1); return; }

      const d = data as Record<string, unknown>;
      const hasGoal         = !!d.onboarding_goal;
      const hasTimeframe    = !!(d.onboarding_timeframe_days);
      const gatePassed      = !!(d.onboarding_gate_passed);
      const hasBusinessType = !!d.onboarding_business_type;
      const hasFirstMove    = !!d.onboarding_first_move;

      if (hasGoal)         setGoal(d.onboarding_goal as GoalKey);
      if (hasTimeframe)    setTimeframeDays(d.onboarding_timeframe_days as number);
      if (d.onboarding_timeframe_custom_date)
                           setCustomDate(d.onboarding_timeframe_custom_date as string);
      if (hasBusinessType) setBusinessType(d.onboarding_business_type as BusinessType);
      if (hasFirstMove)    setFirstMoveText(d.onboarding_first_move as string);

      // Restore gate answers and coaching state from gate_answers table
      if (hasGoal && d.onboarding_gate_answers) {
        const saved = d.onboarding_gate_answers as Record<string, string>;
        if (saved.q1_answer || saved.q2_answer || saved.q3_answer) {
          setGateAnswers({
            q1: (saved.q1_answer as GateAnswer) ?? null,
            q2: (saved.q2_answer as GateAnswer) ?? null,
            q3: (saved.q3_answer as GateAnswer) ?? null,
          });
          // If gate was passed, all three were resolved — mark all as resolved
          if (gatePassed) {
            setResolvedQuestions({ 0: true, 1: true, 2: true });
          }
        }
      }

      // Resume to the furthest step the user reached
      // Restore generation count from DB so the 3-call limit survives refresh.
      if (hasGoal) {
        const { count } = await (supabase.from("first_moves") as ReturnType<typeof supabase.from>)
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id);
        if (typeof count === "number") setGenerationCount(count);
      }

      if (hasFirstMove)         setStep(5);
      else if (hasBusinessType) setStep(5); // go to 5 so first move generates
      else if (gatePassed)      setStep(4);
      else if (hasTimeframe)    setStep(3);
      else if (hasGoal)         setStep(2);
      else                      setStep(1);
    }

    void resume();
  }, [user]);

  async function generateFirstMove() {
    if (!user || !goal || !businessType) return;
    if (generationCount >= 3) return;
    setFirstMoveLoading(true);
    const timeout = setTimeout(() => {
      setFirstMoveLoading(false);
      toast.error("MOXIE is taking longer than usual. Use 'Skip for now' to continue — your first move will be ready on the next screen.");
    }, 60_000);
    try {
      const { data, error } = await supabase.functions.invoke("generate-first-move", {
        body: { goal_key: goal, business_type: businessType },
      });
      clearTimeout(timeout);
      if (data?.error === "generation_limit_reached") {
        toast.error("You have reached the generation limit for your first move.");
        setGenerationCount(3);
        return;
      }
      if (error || !data?.text) throw error ?? new Error("No text returned");
      setFirstMoveText(data.text as string);
      setGenerationCount((c) => c + 1);
      const profileWriteErr = (await (supabase.from("profiles") as ReturnType<typeof supabase.from>)
        .update({ onboarding_first_move: data.text } as Record<string, unknown>)
        .eq("id", user.id)).error;
      if (profileWriteErr) console.error("[generateFirstMove] profile cache write failed", profileWriteErr);
    } catch {
      clearTimeout(timeout);
      toast.error(friendlyAuthError("generate_first_move"));
    } finally {
      setFirstMoveLoading(false);
    }
  }

  // Auto-generate when entering step 5 — must be before any early return
  useEffect(() => {
    if (step !== 5) return;
    if (firstMoveText || firstMoveLoading) return;
    if (!user || !goal || !businessType) return;
    void generateFirstMove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, businessType]);

  if (authLoading || step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  function back() {
    if (step > 1) setStep(step - 1);
  }

  function computeDaysFromDate(isoDate: string): number {
    const target = new Date(isoDate);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  async function goToStep2() {
    if (!goal || saving) return;
    setSaving(true);
    try {
      const { error } = await (supabase.from("profiles") as ReturnType<typeof supabase.from>).update({ onboarding_goal: goal } as Record<string, unknown>).eq("id", user!.id);
      if (error) console.warn("[onboarding] save goal failed (migrations not run?)", error);
      setStep(2);
    } finally {
      setSaving(false);
    }
  }

  async function goToStep3() {
    if (!timeframeDays || saving) return;
    setSaving(true);
    try {
      const update: Record<string, unknown> = { onboarding_timeframe_days: timeframeDays };
      if (customDate) update.onboarding_timeframe_custom_date = customDate;
      const { error } = await (supabase.from("profiles") as ReturnType<typeof supabase.from>).update(update).eq("id", user!.id);
      if (error) console.warn("[onboarding] save timeframe failed (migrations not run?)", error);
      setStep(3);
    } finally {
      setSaving(false);
    }
  }

  async function goToStep4() {
    if (!user || !goal || saving) return;
    const q1 = gateAnswers.q1;
    const q2 = gateAnswers.q2;
    const q3 = gateAnswers.q3;
    if (q1 !== "yes" || q2 !== "yes" || q3 !== "yes") return;

    setSaving(true);
    try {
      // Single RPC — gate_answers + profiles written atomically in one transaction.
      const { error } = await supabase.rpc("complete_gate" as any, {
        p_goal_key:       goal,
        p_q1:             q1,
        p_q2:             q2,
        p_q3:             q3,
        p_coaching_shown: Object.keys(resolvedQuestions).length > 0,
      });
      if (error) console.warn("[onboarding] complete_gate rpc failed (migrations not run?)", error);
      setStep(4);
    } finally {
      setSaving(false);
    }
  }

  async function goToStep5() {
    if (!businessType || saving) return;
    setSaving(true);
    try {
      const { error } = await (supabase.from("profiles") as ReturnType<typeof supabase.from>).update({ onboarding_business_type: businessType } as Record<string, unknown>).eq("id", user!.id);
      if (error) console.warn("[onboarding] save business type failed (migrations not run?)", error);
      // Clear existing first move so the useEffect on step 5 regenerates with the new business type.
      // Do NOT reset generationCount here — the server enforces 3 calls; resetting the client counter
      // to 0 would let the user see extra regen attempts that the server then 429s.
      setFirstMoveText(null);
      setStep(5);
    } finally {
      setSaving(false);
    }
  }

  async function finalize() {
    if (!user || !goal || !timeframeDays || !businessType) return;
    setFinalizing(true);
    try {
      const update: Record<string, unknown> = {
        onboarding_goal: goal,
        onboarding_timeframe_days: timeframeDays,
        onboarding_business_type: businessType,
        onboarding_gate_passed: true,
        onboarding_completed: true,
      };
      if (customDate) update.onboarding_timeframe_custom_date = customDate;
      if (firstMoveText) update.onboarding_first_move = firstMoveText;

      const { error } = await (supabase.from("profiles") as ReturnType<typeof supabase.from>)
        .upsert(
          { id: user.id, email: user.email, ...update },
          { onConflict: "id" }
        );

      if (error) console.warn("[onboarding] finalize upsert failed", error);

      window.location.assign("/app/discovery?welcome=true");
    } catch (e: unknown) {
      toast.error(friendlyAuthError("complete_onboarding", e));
      setFinalizing(false);
    }
  }

  const allGateYes =
    gateAnswers.q1 === "yes" && gateAnswers.q2 === "yes" && gateAnswers.q3 === "yes";

  const canContinue =
    step === 1 ? !!goal
    : step === 2 ? !!timeframeDays
    : step === 3 ? allGateYes
    : step === 4 ? !!businessType
    : step === 5 ? !firstMoveLoading && (firstMoveText?.trim().length ?? 0) > 0
    : false;

  function handleContinue() {
    if (step === 1) goToStep2();
    else if (step === 2) goToStep3();
    else if (step === 3) goToStep4();
    else if (step === 4) goToStep5();
    else if (step === 5) setStep(6);
  }

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
          {step === 1 && <StepGoal goal={goal} setGoal={setGoal} />}
          {step === 2 && (
            <StepTimeframe
              timeframeDays={timeframeDays}
              setTimeframeDays={setTimeframeDays}
              customDate={customDate}
              setCustomDate={setCustomDate}
              pickingDate={pickingDate}
              setPickingDate={setPickingDate}
              computeDaysFromDate={computeDaysFromDate}
            />
          )}
          {step === 3 && goal && (
            <StepGate
              goalKey={goal}
              gateAnswers={gateAnswers}
              setGateAnswers={setGateAnswers}
              resolvedQuestions={resolvedQuestions}
              setResolvedQuestions={setResolvedQuestions}
            />
          )}
          {step === 4 && (
            <StepBusinessType businessType={businessType} setBusinessType={setBusinessType} />
          )}
          {step === 5 && (
            <StepFirstMove
              text={firstMoveText}
              loading={firstMoveLoading}
              generationCount={generationCount}
              onRegenerate={generateFirstMove}
              onSkip={() => setStep(6)}
            />
          )}
          {step === 6 && (
            <StepComplete
              goal={goal}
              timeframeDays={timeframeDays}
              businessType={businessType}
              finalizing={finalizing}
              onFinalize={finalize}
            />
          )}
        </div>

        <div className="max-w-2xl w-full mx-auto mt-10 flex items-center justify-between">
          {step > 1 && step < 6 ? (
            <Button variant="ghost" onClick={back} disabled={saving || finalizing || firstMoveLoading}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : (
            <span />
          )}
          {step < 6 ? (
            <Button
              onClick={handleContinue}
              disabled={!canContinue || saving || firstMoveLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving || firstMoveLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  {firstMoveLoading ? "Generating…" : "Saving…"}
                </>
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          ) : (
            <span />
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── Step 1: Goal picker ─────────────────────────────────────────────────── */

function StepGoal({
  goal,
  setGoal,
}: {
  goal: GoalKey | null;
  setGoal: (g: GoalKey) => void;
}) {
  const goals: Array<{ key: GoalKey; title: string; subtitle: string }> = [
    {
      key: "first_100",
      title: "Get my first 100 customers",
      subtitle: "Build the foundation that turns strangers into buyers.",
    },
    {
      key: "launch_offer",
      title: "Launch a specific offer",
      subtitle: "Build a go-to-market plan for one offer you are ready to sell.",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">What is your primary goal?</h1>
      <p className="text-muted-foreground mt-2">Pick one. You can build your next goal after you hit this one.</p>
      <div className="flex flex-col gap-4 mt-8">
        {goals.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setGoal(g.key)}
            className={cn(
              "w-full text-left rounded-2xl border-2 px-6 py-6 transition",
              goal === g.key
                ? "border-accent bg-accent/5"
                : "border-border hover:border-foreground/20",
            )}
          >
            <div className="text-lg font-semibold">{g.title}</div>
            <div className="text-sm text-muted-foreground mt-1">{g.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 2: Timeframe picker ────────────────────────────────────────────── */

const PRESET_DAYS = [90, 120, 180, 365] as const;

function StepTimeframe({
  timeframeDays,
  setTimeframeDays,
  customDate,
  setCustomDate,
  pickingDate,
  setPickingDate,
  computeDaysFromDate,
}: {
  timeframeDays: number | null;
  setTimeframeDays: (d: number) => void;
  customDate: string;
  setCustomDate: (d: string) => void;
  pickingDate: boolean;
  setPickingDate: (v: boolean) => void;
  computeDaysFromDate: (iso: string) => number;
}) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];

  function handleCustomDate(value: string) {
    setCustomDate(value);
    if (value && value > today) {
      setTimeframeDays(computeDaysFromDate(value));
    } else {
      setTimeframeDays(null);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">When do you want to hit that goal?</h1>
      <p className="text-muted-foreground mt-2">Pick a window that feels achievable but not comfortable.</p>
      <div className="flex flex-wrap gap-3 mt-8">
        {PRESET_DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setTimeframeDays(d);
              setPickingDate(false);
              setCustomDate("");
            }}
            className={cn(
              "px-6 py-3 rounded-full border-2 font-medium transition text-sm",
              !pickingDate && timeframeDays === d
                ? "border-accent bg-accent/5 text-accent"
                : "border-border hover:border-foreground/20",
            )}
          >
            {d} days
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setPickingDate(true);
            setTimeframeDays(null);
            setCustomDate("");
          }}
          className={cn(
            "px-6 py-3 rounded-full border-2 font-medium transition text-sm",
            pickingDate
              ? "border-accent bg-accent/5 text-accent"
              : "border-border hover:border-foreground/20",
          )}
        >
          Pick a date
        </button>
      </div>

      {pickingDate && (
        <div className="mt-5">
          <input
            type="date"
            min={tomorrow}
            value={customDate}
            onChange={(e) => handleCustomDate(e.target.value)}
            className="border border-border rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {customDate && customDate < tomorrow && (
            <p className="mt-2 text-sm text-destructive">Please pick a date in the future.</p>
          )}
          {customDate && customDate > today && (
            <p className="mt-2 text-sm text-muted-foreground">
              That is {computeDaysFromDate(customDate)} days from today.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Step 3: Readiness gate ──────────────────────────────────────────────── */

type GateAnswerKey = "q1" | "q2" | "q3";

type GateCoachingRow = {
  goal_key: string;
  question_number: number;
  heading: string;
  body: string;
  action_line: string;
  return_line: string;
};

function StepGate({
  goalKey,
  gateAnswers,
  setGateAnswers,
  resolvedQuestions,
  setResolvedQuestions,
}: {
  goalKey: GoalKey;
  gateAnswers: GateState;
  setGateAnswers: (s: GateState) => void;
  resolvedQuestions: Record<number, boolean>;
  setResolvedQuestions: (r: Record<number, boolean>) => void;
}) {
  const questions = GATE_QUESTIONS[goalKey];
  const keys: GateAnswerKey[] = ["q1", "q2", "q3"];
  const [coaching, setCoaching] = useState<GateCoachingRow[]>([]);

  useEffect(() => {
    (supabase.from("gate_coaching") as ReturnType<typeof supabase.from>)
      .select("goal_key,question_number,heading,body,action_line,return_line")
      .eq("goal_key", goalKey)
      .order("question_number")
      .then(({ data }) => { if (data) setCoaching(data as GateCoachingRow[]); });
  }, [goalKey]);

  function setAnswer(key: GateAnswerKey, value: GateAnswer) {
    setGateAnswers({ ...gateAnswers, [key]: value });
  }

  function markResolved(index: number) {
    setAnswer(keys[index], "yes");
    setResolvedQuestions({ ...resolvedQuestions, [index]: true });
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">
        Before we build your strategy, let us check three things.
      </h1>
      <p className="text-muted-foreground mt-2">
        All three must be true before we can build you a useful plan.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {questions.map((q, i) => {
          const key = keys[i];
          const answer = gateAnswers[key];
          const showCoaching = answer === "not_yet" && !resolvedQuestions[i];

          return (
            <div
              key={i}
              className={cn(
                "rounded-2xl border-2 px-6 py-5 transition",
                answer === "yes"
                  ? "border-accent bg-accent/5"
                  : answer === "not_yet"
                  ? "border-destructive/50 bg-destructive/5"
                  : "border-border",
              )}
            >
              <p className="font-semibold text-base">{q.question}</p>
              <p className="text-sm text-muted-foreground mt-1">{q.helper}</p>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setAnswer(key, "yes")}
                  className={cn(
                    "px-5 py-2 rounded-full border-2 text-sm font-medium transition",
                    answer === "yes"
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border hover:border-foreground/20",
                  )}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setAnswer(key, "not_yet")}
                  className={cn(
                    "px-5 py-2 rounded-full border-2 text-sm font-medium transition",
                    answer === "not_yet"
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border hover:border-foreground/20",
                  )}
                >
                  Not yet
                </button>
              </div>

              {showCoaching && (() => {
                const c = coaching.find((r) => r.question_number === i + 1);
                const hasBody = c?.body?.trim();
                return (
                  <div className="mt-4 rounded-xl bg-muted/50 border border-border px-5 py-4">
                    {hasBody ? (
                      <div className="flex flex-col gap-1.5">
                        {c!.heading && (
                          <p className="text-sm font-semibold text-foreground">{c!.heading}</p>
                        )}
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c!.body}</p>
                        {c!.action_line && (
                          <p className="text-sm text-foreground font-medium mt-1">
                            This week: {c!.action_line}
                          </p>
                        )}
                        {c!.return_line && (
                          <p className="text-xs text-muted-foreground italic mt-0.5">{c!.return_line}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        More guidance coming soon. Take your time and come back when you are ready.
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => markResolved(i)}
                    >
                      I have resolved this
                    </Button>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 4: Business type selector ─────────────────────────────────────── */

function StepBusinessType({
  businessType,
  setBusinessType,
}: {
  businessType: BusinessType | null;
  setBusinessType: (t: BusinessType) => void;
}) {
  const types: Array<{ key: BusinessType; label: string; description: string }> = [
    {
      key: "E",
      label: "Expertise Business",
      description:
        "You sell knowledge, advice, coaching, consulting, or a methodology. Your name is part of the brand.",
    },
    {
      key: "G",
      label: "Growing Business",
      description:
        "You run a team-based service or product business. The brand is bigger than one person.",
    },
    {
      key: "R",
      label: "Restaurant or Hospitality",
      description:
        "You run a physical location where customers come to you.",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">What best describes your business?</h1>
      <p className="text-muted-foreground mt-2">This shapes every recommendation we make.</p>
      <div className="flex flex-col gap-4 mt-8">
        {types.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setBusinessType(t.key)}
            className={cn(
              "w-full text-left rounded-2xl border-2 px-6 py-5 transition",
              businessType === t.key
                ? "border-accent bg-accent/5"
                : "border-border hover:border-foreground/20",
            )}
          >
            <div className="font-semibold">{t.label}</div>
            <div className="text-sm text-muted-foreground mt-1">{t.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 5: First move generation ─────────────────────────────────────── */

function StepFirstMove({
  text,
  loading,
  generationCount,
  onRegenerate,
  onSkip,
}: {
  text: string | null;
  loading: boolean;
  generationCount: number;
  onRegenerate: () => void;
  onSkip: () => void;
}) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Here is your first move.</h1>
      <p className="text-muted-foreground mt-2">
        One action. This week. That is how momentum starts.
      </p>

      <div className="mt-8">
        {loading && (
          <div className="rounded-2xl border border-border bg-muted/30 px-6 py-8 flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
            <span className="text-sm">MOXIEMO is thinking about your first move...</span>
          </div>
        )}

        {!loading && text && (
          <div className="rounded-2xl border-2 border-accent bg-accent/5 px-6 py-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                <span className="text-accent-foreground text-xs font-bold">M</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                MOXIEMO
              </span>
            </div>
            <p className="text-base leading-relaxed">{text}</p>
          </div>
        )}

        {!loading && text && (
          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={generationCount >= 3}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {generationCount >= 3 ? "No more regenerations" : "Regenerate"}
            </Button>
            {generationCount >= 3 && (
              <span className="text-xs text-muted-foreground">
                3 of 3 used — this is your first move.
              </span>
            )}
          </div>
        )}

        {!loading && !text && (
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={onRegenerate}>
              <RefreshCw className="h-4 w-4 mr-2" /> Try again
            </Button>
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-muted-foreground underline underline-offset-2 text-left"
            >
              Skip for now — I will come back to this
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Step 6: Complete & enter ───────────────────────────────────────────── */

const GOAL_LABELS: Record<GoalKey, string> = {
  first_100: "Get my first 100 customers",
  launch_offer: "Launch a specific offer",
};

const BUSINESS_LABELS: Record<BusinessType, string> = {
  E: "Expertise Business",
  G: "Growing Business",
  R: "Restaurant or Hospitality",
};

function StepComplete({
  goal,
  timeframeDays,
  businessType,
  finalizing,
  onFinalize,
}: {
  goal: GoalKey | null;
  timeframeDays: number | null;
  businessType: BusinessType | null;
  finalizing: boolean;
  onFinalize: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">You are ready to build.</h1>
      <p className="text-muted-foreground mt-2">
        Here is what MOXIEMO will build your strategy around.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-card px-6 py-6 space-y-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Goal
          </div>
          <div className="font-medium">{goal ? GOAL_LABELS[goal] : "—"}</div>
        </div>
        <div className="border-t border-border" />
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Timeframe
          </div>
          <div className="font-medium">{timeframeDays ? `${timeframeDays} days` : "—"}</div>
        </div>
        <div className="border-t border-border" />
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Business type
          </div>
          <div className="font-medium">{businessType ? BUSINESS_LABELS[businessType] : "—"}</div>
        </div>
      </div>

      {!confirmed ? (
        <div className="mt-8 space-y-3">
          <Button
            onClick={() => setConfirmed(true)}
            className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8 py-5"
          >
            Build my strategy <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground">
            This locks your goal, timeframe, and business type. You will not be able to change them without contacting support.
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border-2 border-accent bg-accent/5 px-6 py-5 space-y-4">
          <p className="font-semibold text-base">Ready to lock this in?</p>
          <p className="text-sm text-muted-foreground">
            Once you confirm, MOXIEMO will start building your strategy. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={onFinalize}
              disabled={finalizing}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {finalizing ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Building…</>
              ) : (
                <>Yes, build my strategy</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmed(false)}
              disabled={finalizing}
            >
              Go back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
