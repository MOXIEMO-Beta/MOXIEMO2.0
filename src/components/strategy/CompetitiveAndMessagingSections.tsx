import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Target, Copy, Loader2, Check, ChevronDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EditableField } from "@/components/strategy/EditableField";
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

export function CompetitiveAndMessagingSections() {
  const { strategy, setEnhanced } = useStrategyEditor();
  const ef = (strategy?.enhanced_foundation || {}) as any;
  const [open, setOpen] = useState(true);
  const [generating, setGenerating] = useState(false);

  const variations = ef.messagingVariations || {};
  const positioning: string = strategy?.positioning_statement || "";
  const firstSentence = positioning ? (positioning.match(/^[^.!?]+[.!?]?/)?.[0] || positioning).trim() : "";
  const oneLiner = variations.oneliner || firstSentence;
  const shortVersion = variations.short || (positioning ? positioning.slice(0, 160) : "");
  const elevator = variations.elevator || "";

  const handleSaveField = (key: string, value: string) => {
    setEnhanced([key], value);
    toast.success("Saved", { duration: 1500 });
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
      toast.error("Couldn't generate messaging", { description: e?.message });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Section 1 — Competitive Positioning */}
      <Card className="report-card border-border shadow-soft">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="w-full flex items-start justify-between gap-4 p-7 text-left">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent-soft flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-2xl tracking-[-0.01em]">How You Stand Out</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Define your competitive position — who you're for, who you're not for, and why clients choose you.
                </p>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 mt-2 ${open ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-7 pb-7 space-y-6 border-t border-border pt-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground block mb-2">
                  Who is NOT your ideal client?
                </label>
                <div className="text-sm leading-relaxed">
                  <EditableField
                    value={ef.antiClient}
                    onChange={(v) => handleSaveField("antiClient", v)}
                    multiline
                    placeholder="e.g. Founders who want quick fixes without doing the work"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 italic">
                  Being clear about who you don't serve makes your positioning stronger
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground block mb-2">
                  What are the alternatives to working with you?
                </label>
                <div className="text-sm leading-relaxed">
                  <EditableField
                    value={ef.alternatives}
                    onChange={(v) => handleSaveField("alternatives", v)}
                    multiline
                    placeholder="e.g. DIY online courses, hiring a full-time CMO, doing nothing"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 italic">
                  Clients will compare you to these — know what you're up against
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground block mb-2">
                  When a client chooses you over alternatives, why?
                </label>
                <div className="text-sm leading-relaxed">
                  <EditableField
                    value={ef.whyYouWin}
                    onChange={(v) => handleSaveField("whyYouWin", v)}
                    multiline
                    placeholder="e.g. I combine 10 years of real operator experience with a proven framework, not theory"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 italic">
                  This is your real differentiator — be ruthlessly specific
                </p>
              </div>
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