import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Pin, Pencil, Dices, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type Theme = { quarter?: string; label?: string; theme?: string; title?: string } | string;

export type GenerateParams = {
  topic: string;
  emailType: string;
};

const EMAIL_TYPES = [
  "Weekly Newsletter",
  "Framework Deep-Dive",
  "Client Win Story",
  "Discovery Call Invite",
];

type FocusMode = "pillar" | "custom" | "surprise" | null;

function pickRandomPillar(pillars: string[]): string {
  if (!pillars.length) return "founder positioning";
  return pillars[Math.floor(Math.random() * pillars.length)];
}

export default function GeneratePanel({
  pillars,
  themes,
  generating,
  onGenerate,
}: {
  pillars: string[];
  themes: Theme[];
  generating: boolean;
  onGenerate: (params: GenerateParams) => void;
}) {
  const [focusMode, setFocusMode] = useState<FocusMode>(null);
  const [selectedPillar, setSelectedPillar] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [surprisePick, setSurprisePick] = useState<string>("");
  const [emailType, setEmailType] = useState<string>("");

  const hasFocus =
    (focusMode === "pillar" && selectedPillar) ||
    (focusMode === "custom" && customTopic.trim().length > 0) ||
    (focusMode === "surprise" && surprisePick);

  const canGenerate = !!hasFocus && !!emailType;

  function selectCard(mode: Exclude<FocusMode, null>) {
    setFocusMode(mode);
    if (mode !== "pillar") setSelectedPillar("");
    if (mode !== "custom") setCustomTopic("");
    if (mode === "surprise") {
      setSurprisePick(pickRandomPillar(pillars));
    } else {
      setSurprisePick("");
    }
  }

  function handleGenerate() {
    let topic = "";
    if (focusMode === "pillar") topic = selectedPillar;
    else if (focusMode === "custom") topic = customTopic.trim();
    else if (focusMode === "surprise") topic = surprisePick;
    onGenerate({ topic, emailType });
  }

  const noStrategy = pillars.length === 0 && themes.length === 0;
  const stepLabel = hasFocus ? "Step 2 of 2 — Choose email type" : "Step 1 of 2 — Choose your focus";

  const cardBase = "text-left rounded-lg border-2 p-4 transition-all";
  const cardSelected = "border-orange-500 bg-orange-50";
  const cardUnselected = "border-border bg-background hover:border-orange-300";

  return (
    <Card className="border-orange-200 bg-orange-50/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-orange-600" />
            Generate with MOXIE
          </CardTitle>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {stepLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {noStrategy && (
          <div className="rounded-md border border-dashed bg-background p-3 text-sm">
            Complete your strategy to unlock pillar-based generation —{" "}
            <Link to="/app/strategy" className="text-orange-600 underline">
              Go to Strategy →
            </Link>
          </div>
        )}

        {/* Step 1 */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Step 1 — Choose your focus</h3>
            <p className="text-xs text-muted-foreground">
              Pick one starting point for your email
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Content Pillar card */}
            <button
              type="button"
              onClick={() => selectCard("pillar")}
              className={cn(
                cardBase,
                focusMode === "pillar" ? cardSelected : cardUnselected,
              )}
            >
              <div className="flex items-center gap-2 font-medium">
                <Pin className="h-4 w-4 text-orange-600" />
                Content Pillar
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pick from your strategy — stays on-brand automatically
              </p>
            </button>

            {/* Custom Topic card */}
            <button
              type="button"
              onClick={() => selectCard("custom")}
              className={cn(
                cardBase,
                focusMode === "custom" ? cardSelected : cardUnselected,
              )}
            >
              <div className="flex items-center gap-2 font-medium">
                <Pencil className="h-4 w-4 text-orange-600" />
                Custom Topic
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Write your own angle, idea, or story
              </p>
            </button>
          </div>

          {/* Surprise me — full width */}
          <button
            type="button"
            onClick={() => selectCard("surprise")}
            className={cn(
              cardBase,
              "w-full",
              focusMode === "surprise" ? cardSelected : cardUnselected,
            )}
          >
            <div className="flex items-center gap-2 font-medium">
              <Dices className="h-4 w-4 text-orange-600" />
              Surprise me
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              MOXIE picks a focus from your strategy and runs with it
            </p>
            {focusMode === "surprise" && surprisePick && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-orange-600" />
                <span>MOXIE picked: <span className="font-medium">{surprisePick}</span></span>
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSurprisePick(pickRandomPillar(pillars));
                  }}
                  className="ml-2 text-orange-600 underline cursor-pointer"
                >
                  pick again
                </span>
              </div>
            )}
          </button>

          {/* Expanded content for Pillar */}
          {focusMode === "pillar" && (
            <div className="animate-fade-in rounded-md border bg-background p-3">
              {pillars.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Complete your strategy to unlock this option —{" "}
                  <Link to="/app/strategy" className="text-orange-600 underline">
                    Go to Strategy →
                  </Link>
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {pillars.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPillar(p)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-sm transition",
                        selectedPillar === p
                          ? "bg-orange-600 text-white border-orange-600"
                          : "bg-background hover:border-orange-400",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Expanded content for Custom */}
          {focusMode === "custom" && (
            <div className="animate-fade-in">
              <Textarea
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Why I stopped posting every day and what happened next..."
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Step 2 */}
        {hasFocus && (
          <div className="space-y-3 animate-fade-in">
            <div>
              <h3 className="text-sm font-semibold">Step 2 — What type of email?</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {EMAIL_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEmailType(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-sm transition",
                    emailType === t
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background hover:border-foreground/40",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generate */}
        {hasFocus && emailType && (
          <div className="space-y-2 animate-fade-in">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate with MOXIE
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              MOXIE will use your strategy, voice, and selected focus to write the full email
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
