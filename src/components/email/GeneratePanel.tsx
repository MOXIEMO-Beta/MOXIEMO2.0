import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Dices, Loader2 } from "lucide-react";
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

type FocusMode = "pillar" | "theme" | "custom" | "surprise" | null;

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
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [emailType, setEmailType] = useState<string>("");

  const themeLabel = (t: Theme): string => {
    if (typeof t === "string") return t;
    const q = t.quarter ? `${t.quarter}: ` : "";
    return `${q}${t.label || t.theme || t.title || ""}`.trim();
  };

  const hasFocus =
    focusMode === "surprise" ||
    (focusMode === "pillar" && selectedPillar) ||
    (focusMode === "theme" && selectedTheme) ||
    (focusMode === "custom" && customTopic.trim().length > 0);

  const canGenerate = hasFocus && (focusMode === "surprise" || emailType);

  function pickFocus(mode: Exclude<FocusMode, null>) {
    setFocusMode(mode);
    if (mode !== "pillar") setSelectedPillar("");
    if (mode !== "theme") setSelectedTheme("");
    if (mode !== "custom") setCustomTopic("");
  }

  function handleGenerate() {
    let topic = "";
    let type = emailType;
    if (focusMode === "pillar") topic = selectedPillar;
    else if (focusMode === "theme") topic = selectedTheme;
    else if (focusMode === "custom") topic = customTopic.trim();
    else if (focusMode === "surprise") {
      topic = pillars.length
        ? pillars[Math.floor(Math.random() * pillars.length)]
        : "founder positioning";
      if (!type) type = "Weekly Newsletter";
    }
    onGenerate({ topic, emailType: type });
  }

  const noStrategy = pillars.length === 0 && themes.length === 0;

  return (
    <Card className="border-orange-200 bg-orange-50/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-orange-600" />
          Generate with MOXIE
        </CardTitle>
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
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Step 1 — What's this email about?
          </Label>

          {pillars.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Content pillar</p>
              <div className="flex flex-wrap gap-2">
                {pillars.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      pickFocus("pillar");
                      setSelectedPillar(p);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-sm transition",
                      focusMode === "pillar" && selectedPillar === p
                        ? "bg-orange-600 text-white border-orange-600"
                        : "bg-background hover:border-orange-400",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {themes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Quarterly theme</p>
              <div className="flex flex-wrap gap-2">
                {themes.map((t, i) => {
                  const label = themeLabel(t);
                  if (!label) return null;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        pickFocus("theme");
                        setSelectedTheme(label);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-sm transition",
                        focusMode === "theme" && selectedTheme === label
                          ? "bg-orange-600 text-white border-orange-600"
                          : "bg-background hover:border-orange-400",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Custom topic</p>
            <Input
              value={customTopic}
              onChange={(e) => {
                pickFocus("custom");
                setCustomTopic(e.target.value);
              }}
              placeholder="What do you want to write about?"
              className={cn(
                focusMode === "custom" && "border-orange-500 ring-1 ring-orange-500",
              )}
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => pickFocus("surprise")}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition",
                focusMode === "surprise"
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-background hover:border-orange-400",
              )}
            >
              <Dices className="h-4 w-4" />
              Surprise me — generate from my strategy
            </button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Step 2 — Email type
          </Label>
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

        {/* Step 3 */}
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
      </CardContent>
    </Card>
  );
}