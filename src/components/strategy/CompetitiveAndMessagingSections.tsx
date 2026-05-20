import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Target, Copy, Loader2, Check, ChevronDown, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStrategyEditor } from "@/hooks/useStrategyEditor";

function CopyBlock({ label, text, placeholder }: { label: string; text: string; placeholder?: string }) {
  const [copied, setCopied] = useState(false);
  const isEmpty = !text || !text.trim();

  const handleCopy = async () => {
    if (isEmpty) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={handleCopy}
          disabled={isEmpty}
        >
          {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <p className={`text-sm leading-relaxed ${isEmpty ? "italic text-muted-foreground" : ""}`}>
        {isEmpty ? placeholder : text}
      </p>
    </div>
  );
}

type FieldKey = "antiClient" | "alternatives" | "whyYouWin";

function AlwaysEditableField({
  label,
  hint,
  value,
  onSave,
  placeholder,
}: {
  label: string;
  hint: string;
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState<string>(value ?? "");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { setDraft(value ?? ""); }, [value]);

  // Auto-resize
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [draft]);

  const commit = () => {
    if ((draft ?? "") !== (value ?? "")) {
      onSave(draft);
      setSavedAt(Date.now());
    }
  };

  const showSaved = savedAt && Date.now() - savedAt < 2500;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground block">
          {label}
        </label>
        {showSaved && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-accent" /> Saved
          </span>
        )}
      </div>
      <Textarea
        ref={ref}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        className="min-h-[64px] resize-none text-sm leading-relaxed bg-background/40 border-dashed focus-visible:bg-background"
      />
      <p className="text-xs text-muted-foreground mt-1.5 italic">{hint}</p>
    </div>
  );
}

export function CompetitiveAndMessagingSections() {
  const { strategy, setEnhanced } = useStrategyEditor();
  const ef = (strategy?.enhanced_foundation || {}) as any;
  const [open, setOpen] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regenPositioning, setRegenPositioning] = useState(false);
  const inferredOnceRef = useRef(false);

  // TEMP debug: confirm which fields the strategy actually exposes for messaging cards.
  // Remove once verified.
  // eslint-disable-next-line no-console
  console.log('[Messaging] Full strategy object:', strategy);
  // eslint-disable-next-line no-console
  console.log('[Messaging] raw_foundation:', strategy?.raw_foundation);
  // eslint-disable-next-line no-console
  console.log('[Messaging] enhanced_foundation:', strategy?.enhanced_foundation);

  // Support both new shape (messagingVariations) and the shape produced by
  // synthesize-strategy (positioningVariations: { short, tweet, elevator }).
  const messagingVars = ef.messagingVariations || {};
  const positioningVars = ef.positioningVariations || {};
  const positioning: string = strategy?.positioning_statement || "";
  const firstSentence = positioning ? (positioning.match(/^[^.!?]+[.!?]?/)?.[0] || positioning).trim() : "";
  const oneLiner =
    messagingVars.oneliner ||
    positioningVars.tweet ||
    positioningVars.short ||
    firstSentence;
  const shortVersion =
    messagingVars.short ||
    positioningVars.short ||
    (positioning ? positioning.slice(0, 160) : "");
  const elevator =
    messagingVars.elevator ||
    positioningVars.elevator ||
    ef.elevator_pitch ||
    ef.elevatorPitch ||
    ef.positioningBreakdown?.elevator ||
    "";

  // Infer initial values for empty competitive positioning fields and persist them.
  useEffect(() => {
    if (!strategy || inferredOnceRef.current) return;
    const hasAny = ef.antiClient || ef.alternatives || ef.whyYouWin;
    if (hasAny) { inferredOnceRef.current = true; return; }

    const inferredAntiClient = strategy.ideal_client
      ? `Founders who are NOT ${String(strategy.ideal_client).toLowerCase()}`
      : "";
    const inferredAlternatives = strategy.pain_point
      ? "DIY approaches, doing nothing, or hiring generalist help"
      : "";
    const inferredWhyYouWin = strategy.positioning_statement || "";

    if (inferredAntiClient || inferredAlternatives || inferredWhyYouWin) {
      const next = {
        ...ef,
        antiClient: inferredAntiClient,
        alternatives: inferredAlternatives,
        whyYouWin: inferredWhyYouWin,
      };
      setEnhanced([], next);
      inferredOnceRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy?.id]);

  const handleSaveField = (key: FieldKey, value: string) => {
    setEnhanced([key], value);
  };

  const handleRegeneratePositioning = async () => {
    setRegenPositioning(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-competitive-positioning", {
        body: { strategy },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const next = {
        ...ef,
        antiClient: data.antiClient || "",
        alternatives: data.alternatives || "",
        whyYouWin: data.whyYouWin || "",
      };
      setEnhanced([], next);
      toast.success("Competitive positioning generated — review and refine to make it yours.");
    } catch (e: any) {
      console.error(e);
      toast.error(aiErrorMessage("generic", e));
    } finally {
      setRegenPositioning(false);
    }
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-messaging-variations", {
        body: { strategy },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const next = {
        oneliner: data.oneliner || "",
        short: data.short || "",
        elevator: data.elevator || "",
      };
      setEnhanced(["messagingVariations"], next);
      toast.success("Messaging updated. Copy and use anywhere.");
    } catch (e: any) {
      console.error(e);
      toast.error(aiErrorMessage("generic", e));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Section 1 — Competitive Positioning */}
      <Card className="report-card border-border shadow-soft">
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="w-full flex items-start justify-between gap-4 p-7">
            <CollapsibleTrigger className="flex items-start gap-3 text-left flex-1 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-2xl tracking-[-0.01em]">How You Stand Out</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Define your competitive position — who you're for, who you're not for, and why clients choose you.
                </p>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 mt-2 ${open ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRegeneratePositioning}
              disabled={regenPositioning}
              className="shrink-0 text-xs"
            >
              {regenPositioning ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
              Regenerate
            </Button>
          </div>
          <CollapsibleContent>
            <div className="px-7 pb-7 space-y-6 border-t border-border pt-6">
              <AlwaysEditableField
                label="Who is NOT your ideal client?"
                hint="Being clear about who you don't serve makes your positioning stronger"
                value={ef.antiClient || ""}
                onSave={(v) => handleSaveField("antiClient", v)}
                placeholder="e.g. Founders who want quick fixes without doing the work"
              />
              <AlwaysEditableField
                label="What are the alternatives to working with you?"
                hint="Clients will compare you to these — know what you're up against"
                value={ef.alternatives || ""}
                onSave={(v) => handleSaveField("alternatives", v)}
                placeholder="e.g. DIY online courses, hiring a full-time CMO, doing nothing"
              />
              <AlwaysEditableField
                label="When a client chooses you over alternatives, why?"
                hint="This is your real differentiator — be ruthlessly specific"
                value={ef.whyYouWin || ""}
                onSave={(v) => handleSaveField("whyYouWin", v)}
                placeholder="e.g. I combine 10 years of real operator experience with a proven framework, not theory"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Section 2 — Messaging Variations */}
      <Card className="report-card p-7 border-border shadow-soft">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
              <Copy className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display text-2xl tracking-[-0.01em]">Your Messaging in Every Format</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Use these across your bio, website, social profiles, and pitches.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleRegenerate}
            disabled={generating}
            className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg shrink-0"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />}
            Regenerate all
          </Button>
        </div>

        <div className="space-y-3">
          <CopyBlock
            label="One-liner (for bios and introductions)"
            text={oneLiner}
            placeholder="Complete your strategy to generate this"
          />
          <CopyBlock
            label="Short version (for social bios, 160 chars max)"
            text={shortVersion}
            placeholder="Complete your strategy to generate this"
          />
          <CopyBlock
            label="Elevator pitch (for networking and introductions)"
            text={elevator}
            placeholder="Complete your strategy to generate this"
          />
        </div>
      </Card>
    </div>
  );
}