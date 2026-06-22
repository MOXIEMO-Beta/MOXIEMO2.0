import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { aiErrorMessage } from "@/lib/aiErrors";

const COACHING_PROMPTS: Record<string, { title: string; help: string; placeholder: string }> = {
  positioning_statement: {
    title: "Sharpen your positioning",
    help: "Be specific about WHO you serve and WHAT shifts. Example: 'I help VP-level women in tech (40-55) move from invisible to authoritative leaders.'",
    placeholder: "I help [type of person, ages, situation] go from [painful before] to [specific after] by [your unique method].",
  },
  ideal_client: {
    title: "Sharpen your ideal client",
    help: "Add age range, role, industry, and readiness. Example: 'VP-level women in tech, 40-55, ready to invest $10K+.'",
    placeholder: "[Type], ages [range], in [industry/role], who are [situation], ready to [readiness indicator].",
  },
  pain_point: {
    title: "Sharpen the pain point",
    help: "Use their words. Complete: 'They're struggling with ___, and it's causing them to feel ___.'",
    placeholder: "Struggling with ___, causing them to feel ___.",
  },
  transformation: {
    title: "Sharpen the transformation",
    help: "Concrete before/after. What's measurably different in their work or life?",
    placeholder: "BEFORE: [...]  AFTER: [...]  In one sentence: from [...] to [...].",
  },
  voice_attributes: {
    title: "Refine voice attributes",
    help: "Add 2-3 traits with examples. e.g. 'Direct (no hedging), Warm (uses second person), Specific (concrete examples).'",
    placeholder: "Direct, warm, specific — and what each means in practice.",
  },
  primary_channel: {
    title: "Refine your channel",
    help: "Where did your last 3 clients actually come from?",
    placeholder: "LinkedIn — last 3 clients all came from posts about [topic].",
  },
  success_definition: {
    title: "Quantify your success metric",
    help: "Use a number you can track weekly or monthly.",
    placeholder: "2-3 discovery calls per week | 500 email subscribers | $20K from new clients in 90 days",
  },
  business_goal: {
    title: "Sharpen your business goal",
    help: "Be specific: revenue target or client target.",
    placeholder: "$200K in new revenue by Q4 | 10 retained clients at $5K/month",
  },
  time_capacity: {
    title: "Refine time capacity",
    help: "Honest hours/week you can spend on marketing.",
    placeholder: "5 hours/week — Monday + Thursday mornings.",
  },
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sectionKey: string | null;
  sectionLabel?: string;
  currentValue: string;
  context: any;
  onApply: (newValue: string) => Promise<void> | void;
}

export function RefineSectionDialog({ open, onOpenChange, sectionKey, sectionLabel, currentValue, context, onApply }: Props) {
  const [step, setStep] = useState<"input" | "compare">("input");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [refined, setRefined] = useState("");
  const [rationale, setRationale] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const config = sectionKey ? COACHING_PROMPTS[sectionKey] : null;

  useEffect(() => {
    if (open) {
      setStep("input");
      setInput("");
      setRefined("");
      setRationale("");
      setSaving(false);
      setSaveError(null);
    }
  }, [open, sectionKey]);

  if (!sectionKey || !config) return null;

  async function generate() {
    if (!input.trim()) {
      toast.error("Add a bit of detail to refine.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("refine-section", {
        body: {
          section: sectionLabel || sectionKey,
          currentValue,
          userInput: input,
          context,
        },
      });
      if (error) throw error;
      if (!data?.refined_value) throw new Error("No refinement returned");
      setRefined(data.refined_value);
      setRationale(data.rationale || "");
      setStep("compare");
    } catch (e: any) {
      toast.error(aiErrorMessage("generic", e));
    } finally {
      setLoading(false);
    }
  }

  async function apply() {
    setSaving(true);
    setSaveError(null);
    try {
      await onApply(refined);
      toast.success("Section updated.", { duration: 3000 });
      onOpenChange(false);
    } catch (e: any) {
      console.error("Refine apply failed", e);
      setSaveError("Couldn't save your update — try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-[-0.02em] flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" /> {config.title}
          </DialogTitle>
          <DialogDescription>{config.help}</DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Current</div>
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed">
                {currentValue || <span className="text-muted-foreground italic">Empty</span>}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Your refinement input</div>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={config.placeholder}
                rows={4}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">MOXIEMO will rewrite the section using your input + the rest of your strategy as context.</p>
            </div>
          </div>
        )}

        {step === "compare" && (
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Before</div>
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed">
                {currentValue || <span className="text-muted-foreground italic">Empty</span>}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2 flex items-center gap-1">
                After <ArrowRight className="h-3 w-3" />
              </div>
              <div className="rounded-lg border border-accent/40 bg-accent-soft/40 p-4 text-sm leading-relaxed">
                {refined}
              </div>
              {rationale && <p className="text-xs text-muted-foreground mt-2 italic">{rationale}</p>}
              {saveError && (
                <p className="text-sm text-destructive mt-3" role="alert">{saveError}</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "input" ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={generate} disabled={loading} className="bg-foreground text-background hover:bg-foreground/90">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</> : <>Generate refinement <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep("input")} disabled={saving}>Keep refining</Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Revert</Button>
              <Button onClick={apply} disabled={saving} className="bg-foreground text-background hover:bg-foreground/90">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Use new version"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}