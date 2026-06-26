import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { aiErrorMessage } from "@/lib/aiErrors";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Sparkles, Compass, Download, Share2, Pencil, Check, X, Quote, Save, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { StrategyEditorProvider, useStrategyEditor } from "@/hooks/useStrategyEditor";
import { useReportData } from "@/hooks/useReportData";
import { Skeleton } from "@/components/ui/skeleton";
import { EditableField } from "@/components/strategy/EditableField";
import { EditableList } from "@/components/strategy/EditableList";
import { StrategyStrengthCard } from "@/components/strategy/StrategyStrengthCard";
import { RefineProvider, SectionPencil, setInPath, useRefine } from "@/components/strategy/RefineContext";
import { downloadStrategyPdf } from "@/lib/strategyPdf";
import { StrategyEngineInterstitial } from "@/components/StrategyEngineInterstitial";

import { ContentTab } from "@/components/strategy/tabs/ContentTab";
import { ChannelsTab } from "@/components/strategy/tabs/ChannelsTab";
import { MetricsTab } from "@/components/strategy/tabs/MetricsTab";
import { ActionPlanTab } from "@/components/strategy/tabs/ActionPlanTab";
import { CompetitiveAndMessagingSections } from "@/components/strategy/CompetitiveAndMessagingSections";

// Defensive parse: a synthesis bug sometimes persists enhanced_foundation /
// raw_foundation as a JSON-encoded string instead of an object. Parse so the
// UI's nested lookups (e.g. enhanced_foundation.voiceGuidelines.toneByPlatform)
// resolve to populated values on initial mount.
function parseIfJsonString(v: unknown) {
  if (typeof v !== "string") return v;
  const trimmed = v.trim();
  if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[")) return v;
  try {
    return JSON.parse(trimmed);
  } catch {
    return v;
  }
}
function normalizeStrategy(s: any) {
  if (!s) return s;
  return {
    ...s,
    enhanced_foundation: parseIfJsonString(s.enhanced_foundation),
    raw_foundation: parseIfJsonString(s.raw_foundation),
  };
}

const TAB_PLACEHOLDER = (label: string) => (
  <Card className="p-10 border-dashed border-border bg-background text-center">
    <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Coming next sprint</div>
    <h3 className="font-display text-2xl mb-2">{label}</h3>
    <p className="text-sm text-muted-foreground max-w-md mx-auto">
      This workspace section is part of the next strategy build-out. Your foundation data is already captured — we're laying out the views.
    </p>
  </Card>
);

function SaveStatusIndicator() {
  const { status, lastSavedAt } = useStrategyEditor();
  const time = lastSavedAt ? lastSavedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : null;
  if (status === "saving") return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>;
  if (status === "dirty") return <span className="inline-flex items-center gap-1.5 text-xs text-accent"><AlertCircle className="h-3 w-3" /> Unsaved changes</span>;
  if (status === "saved" || (status === "idle" && time)) return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3 w-3 text-accent" /> Saved {time && `· ${time}`}</span>;
  return null;
}

function StrategyHeader() {
  const { editing, setEditing, status, saveNow, strategy, setEnhanced } = useStrategyEditor();
  const { user } = useAuth();
  const { reportData } = useReportData();
  const [exporting, setExporting] = useState(false);
  const [generating, setGenerating] = useState(false);

  const ef = (strategy?.enhanced_foundation || {}) as any;
  const hasExecutionPlan = !!(ef.quarterlyThemes?.length || ef.channelStrategy?.primary || ef.successMetrics?.primary || ef.actionPlan?.week1);

  const handleGenerate = async () => {
    if (editing) await saveNow();
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-execution-plan", { body: { strategy } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // Merge new sections into enhanced_foundation, preserving Sprint 1 fields.
      const merged = {
        ...ef,
        quarterlyThemes: data.quarterlyThemes,
        contentCalendar: data.contentCalendar,
        channelStrategy: data.channelStrategy,
        successMetrics: data.successMetrics,
        actionPlan: data.actionPlan,
      };
      setEnhanced([], merged);
      await saveNow();
      toast.success("Execution plan generated", { description: "Content, Channels, Metrics and Action Plan are ready." });
    } catch (e: any) {
      console.error(e);
      toast.error("Couldn't generate plan", { description: e?.message || "Try again in a moment." });
    } finally {
      setGenerating(false);
    }
  };

  const buildFileName = (ext: string) => {
    const full = String(reportData?.meta?.preparedFor || "Founder").trim();
    const first = (full.split(/\s+/)[0] || "Founder").replace(/[^A-Za-z0-9_-]/g, "");
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return `${first}-MOXIEMO-Strategy-${date}.${ext}`;
  };

  const handleExportPdf = async () => {
    if (!reportData) { toast.error("Report data not ready yet."); return; }
    if (editing) await saveNow();
    setExporting(true);
    try {
      await downloadStrategyPdf(reportData, buildFileName("pdf"));
    } catch (e: any) {
      console.error(e);
      toast.error("PDF export failed", { description: e?.message || "Try again." });
    } finally {
      setExporting(false);
    }
  };


  return (
    <div className="mb-7 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      <div>
        <div className="inline-block text-[11px] font-bold uppercase tracking-[0.1em] text-accent mb-2">Your strategy</div>
        <h1 className="text-[20px] font-bold tracking-[-0.3px] text-foreground mb-1.5" style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>Marketing foundation</h1>
        <p className="text-[13px] text-foreground/80 max-w-2xl leading-[1.6]">This strategy powers every piece of content, email, and post MOXIEMO generates.</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="uppercase tracking-[0.2em] text-[10px]">Prepared for</span>
            {reportData?.meta?.preparedFor ? (
              <span className="text-foreground/80">{reportData.meta.preparedFor}</span>
            ) : (
              <Skeleton className="h-3 w-24 inline-block align-middle" />
            )}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="uppercase tracking-[0.2em] text-[10px]">Date</span>
            {reportData?.meta?.date ? (
              <span className="text-foreground/80">{reportData.meta.date}</span>
            ) : (
              <Skeleton className="h-3 w-28 inline-block align-middle" />
            )}
          </span>
        </div>
        <div className="mt-3"><SaveStatusIndicator /></div>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <Button onClick={handleGenerate} size="sm" disabled={generating || !strategy} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg">
          {generating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-2 h-3.5 w-3.5" />}
          {hasExecutionPlan ? "Regenerate plan" : "Generate execution plan"}
        </Button>
        {editing ? (
          <>
            <Button onClick={() => saveNow()} size="sm" disabled={status === "saving"} className="bg-foreground text-background hover:bg-foreground/90 rounded-lg">
              <Save className="mr-2 h-3.5 w-3.5" /> Save changes
            </Button>
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setEditing(false)}>Done</Button>
          </>
        ) : (
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setEditing(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
          </Button>
        )}
        <Button variant="outline" size="sm" className="rounded-lg" onClick={handleExportPdf} disabled={exporting || !reportData}>
          {exporting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
          Download PDF
        </Button>
      </div>
    </div>
  );
}

function OverviewTab() {
  const { strategy, setField, setEnhanced, editing } = useStrategyEditor();
  const ef = (strategy.enhanced_foundation || {}) as any;
  const breakdown = ef.positioningBreakdown || {};
  const variations = ef.positioningVariations || {};
  const archetype = ef.brandArchetype;
  const competitive = ef.competitivePositioning;
  const coreValues: any[] = ef.coreValues || [];
  const distribution = ef.distribution;
  const isService = strategy?.strategy_lane === "service";

  const colPencil = (col: string, label: string, description: string) => (
    <SectionPencil
      target={() => ({
        refineKey: col,
        label,
        description,
        currentValue: Array.isArray(strategy?.[col]) ? (strategy[col] as any[]).join(", ") : (strategy?.[col] || ""),
        buildPatch: (v) => {
          const isArr = Array.isArray(strategy?.[col]);
          return { [col]: isArr ? v.split(/,|\n/).map((s) => s.trim()).filter(Boolean) : v };
        },
      })}
    />
  );
  const efPencil = (path: (string | number)[], label: string, description: string, opts?: { darkBg?: boolean; arrayJoin?: boolean }) => (
    <SectionPencil
      className={opts?.darkBg ? "text-background/40 hover:text-background/80 hover:bg-background/10" : undefined}
      target={() => {
        const cur = path.reduce<any>((acc, k) => (acc == null ? acc : acc[k]), strategy?.enhanced_foundation || {});
        const isArr = Array.isArray(cur);
        return {
          refineKey: `enhanced:${path.join(".")}`,
          label,
          description,
          currentValue: isArr ? cur.join(", ") : (cur || ""),
          buildPatch: (v) => {
            const value = isArr || opts?.arrayJoin ? v.split(/,|\n/).map((s) => s.trim()).filter(Boolean) : v;
            return { enhanced_foundation: setInPath(strategy?.enhanced_foundation || {}, path, value) };
          },
        };
      }}
    />
  );

  const breakdownFields: [string, string, string][] = [
    ["Who", "idealClient", "Who you serve"],
    ["Problem", "painPoint", "The pain you solve"],
    ["Solution", "uniqueApproach", "Your unique approach"],
    ["Result", "outcome", "The end result"],
    ["Method", "method", "How you do it"],
    ["Transformation", "transformation", "The shift you create"],
  ];

  return (
    <div className="space-y-6 mt-0 report-page mx-auto" style={{ pageBreakAfter: "always", maxWidth: 1100 }}>
      {/* Top band: Brand Archetype + Brand Positioning quadrant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Brand archetype card (left) */}
        {(archetype || editing) ? (
        <Card className="group relative report-card border-0 shadow-none" style={{ background: "#FFFFFF", border: "1px solid #ECEAE5", borderRadius: 14, padding: 24 }}>
          {efPencil(["brandArchetype", "description"], "brand archetype", "Your dominant archetype and how it shows up in your brand.")}
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] mb-4" style={{ color: "#9A9896" }}>Brand archetype</div>
          <div className="flex items-start gap-4 mb-5">
            <div className="text-5xl leading-none">
              <EditableField
                value={archetype?.icon || ""}
                onChange={(v) => setEnhanced(["brandArchetype", "icon"], v)}
                placeholder="🧙"
                className="!text-5xl !w-16 !text-center"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-3xl tracking-[-0.02em]">
                <EditableField
                  value={archetype?.name}
                  onChange={(v) => setEnhanced(["brandArchetype", "name"], v)}
                  placeholder="The Sage"
                />
              </h3>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                Secondary:{" "}
                <EditableField
                  value={archetype?.secondary}
                  onChange={(v) => setEnhanced(["brandArchetype", "secondary"], v)}
                  placeholder="—"
                />
              </div>
            </div>
          </div>
          <p className="text-base leading-relaxed mb-5">
            <EditableField
              value={archetype?.description}
              onChange={(v) => setEnhanced(["brandArchetype", "description"], v)}
              multiline
              placeholder="Archetype description"
            />
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-accent-soft/40">
              <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Brands</div>
              <div className="text-sm">
                <EditableList
                  items={archetype?.exampleBrands || []}
                  onChange={(next) => setEnhanced(["brandArchetype", "exampleBrands"], next)}
                  renderItem={(it, i) => (
                    <p key={i} className="mb-2 last:mb-0">{it}</p>
                  )}
                />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-accent-soft/40">
              <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Values</div>
              <div className="text-sm">
                <EditableList
                  items={archetype?.coreValues || []}
                  onChange={(next) => setEnhanced(["brandArchetype", "coreValues"], next)}
                  renderItem={(it, i) => (
                    <p key={i} className="mb-2 last:mb-0">{it}</p>
                  )}
                />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-accent-soft/40">
              <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Content approach</div>
              <p className="text-sm">
                <EditableField
                  value={archetype?.contentApproach}
                  onChange={(v) => setEnhanced(["brandArchetype", "contentApproach"], v)}
                  multiline
                  placeholder="How you approach content"
                />
              </p>
            </div>
          </div>
        </Card>
        ) : <div />}

        {/* Brand positioning — dark card (right) */}
        <div className="p-6" style={{ background: "#0E0F10", color: "#FFFFFF", borderRadius: 14 }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "#E85A46" }}>
            Brand positioning
          </div>
          {strategy?.positioning_statement && (
            <p className="text-[14px] leading-[1.55] mb-5" style={{ color: "#FFFFFF" }}>
              {strategy.positioning_statement}
            </p>
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {([
              { label: "Who", val: breakdown.idealClient || strategy?.ideal_client },
              { label: "Problem", val: breakdown.painPoint || strategy?.pain_point },
              { label: "Solution", val: breakdown.uniqueApproach || breakdown.method },
              { label: "Result", val: breakdown.outcome },
              { label: "Method", val: breakdown.method },
              { label: "Transformation", val: breakdown.transformation || strategy?.transformation },
            ] as any[]).map((q) => (
              <div key={q.label}>
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: "#E85A46" }}>
                  {q.label}
                </div>
                <p className="text-[12.5px] leading-[1.55]" style={{ color: q.val ? "#FFFFFF" : "rgba(255,255,255,0.4)" }}>
                  {q.val || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Core values */}
      {(coreValues.length > 0 || editing) && (
        <Card className="report-card p-7 border-border shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Core values & decision filters</div>
            {editing && (
              <Button variant="ghost" size="sm" onClick={() => setEnhanced(["coreValues"], [...coreValues, { name: "New value", decisionFilter: "", description: "", yesExamples: [], noExamples: [] }])}>
                + Add value
              </Button>
            )}
          </div>
          <div className="space-y-5">
            {coreValues.map((v: any, i: number) => (
              <div key={i} className={i > 0 ? "pt-5 border-t border-border" : ""}>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-display text-2xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h4 className="font-display text-xl tracking-[-0.01em] uppercase flex-1">
                    <EditableField
                      value={v.name}
                      onChange={(val) => setEnhanced(["coreValues", i, "name"], val)}
                      placeholder="Value name"
                    />
                  </h4>
                  {editing && (
                    <button onClick={() => setEnhanced(["coreValues"], coreValues.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive" aria-label="Remove value">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="rounded-lg bg-muted/60 px-4 py-3 mb-3 text-sm italic">
                  <span className="text-muted-foreground not-italic text-xs uppercase tracking-[0.2em] mr-2">Decision filter:</span>
                  <EditableField
                    value={v.decisionFilter}
                    onChange={(val) => setEnhanced(["coreValues", i, "decisionFilter"], val)}
                    placeholder="e.g. Does this go deep or stay superficial?"
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  <EditableField
                    value={v.description}
                    onChange={(val) => setEnhanced(["coreValues", i, "description"], val)}
                    multiline
                    placeholder="What this value means in practice"
                  />
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <EditableBulletList
                    label={<span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Yes</span>}
                    items={v.yesExamples || []}
                    onChange={(next) => setEnhanced(["coreValues", i, "yesExamples"], next)}
                    accent
                  />
                  <EditableBulletList
                    label={<span className="flex items-center gap-1.5 text-muted-foreground"><X className="h-3.5 w-3.5" /> No</span>}
                    items={v.noExamples || []}
                    onChange={(next) => setEnhanced(["coreValues", i, "noExamples"], next)}
                    muted
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Competitive positioning */}
      {(competitive || editing) && (
        <Card className="group relative report-card p-7 border-border shadow-soft">
          {efPencil(["competitivePositioning", "yourPosition"], "competitive positioning", "Your unique market position and the gap you fill versus alternatives.")}
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">
            {isService ? "Competitive positioning — your ownable gap" : "Competitive positioning"}
          </div>
          <p className="font-display text-xl tracking-[-0.01em] mb-3">
            <EditableField
              value={competitive?.yourPosition}
              onChange={(v) => setEnhanced(["competitivePositioning", "yourPosition"], v)}
              placeholder="Your unique position in the market"
            />
          </p>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            <EditableField
              value={competitive?.marketGap}
              onChange={(v) => setEnhanced(["competitivePositioning", "marketGap"], v)}
              multiline
              placeholder="The gap in the market you fill"
            />
          </p>

          <DifferentiatorTable
            items={competitive?.differentiators || []}
            onChange={(next) => setEnhanced(["competitivePositioning", "differentiators"], next)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div className="p-4 rounded-lg bg-accent-soft/40">
              <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Competitive advantages</div>
              <EditableBulletList
                items={competitive?.competitiveAdvantages || []}
                onChange={(next) => setEnhanced(["competitivePositioning", "competitiveAdvantages"], next)}
                accent
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/60">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">What you don't compete on</div>
              <EditableBulletList
                items={competitive?.doNotCompeteOn || []}
                onChange={(next) => setEnhanced(["competitivePositioning", "doNotCompeteOn"], next)}
                muted
              />
            </div>
          </div>
        </Card>
      )}

      {/* Distribution (service strategies) */}
      {isService && (distribution || editing) && (
        <Card className="group relative report-card p-7 border-border shadow-soft">
          {efPencil(["distribution", "doubleDownOn"], "distribution channels", "The channels already winning for you and where to double down.")}
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Distribution channels</div>
          {(distribution?.doubleDownOn || editing) && (
            <div className="rounded-xl bg-accent-soft/40 p-5 mb-5">
              <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Double down on what's working</div>
              <p className="font-display text-xl tracking-[-0.01em] mb-1">
                <EditableField
                  value={distribution?.doubleDownOn}
                  onChange={(v) => setEnhanced(["distribution", "doubleDownOn"], v)}
                  placeholder="The channel already winning for you"
                />
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <EditableField
                  value={distribution?.doubleDownRationale}
                  onChange={(v) => setEnhanced(["distribution", "doubleDownRationale"], v)}
                  multiline
                  placeholder="Why doubling down beats adding more channels"
                />
              </p>
            </div>
          )}
          {(distribution?.recommendedChannels?.length || editing) && (
            <>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Recommended local channels</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(distribution?.recommendedChannels || []).map((c: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg border border-border bg-background">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="font-medium text-sm">
                        <EditableField
                          value={c.name}
                          onChange={(v) => setEnhanced(["distribution", "recommendedChannels", i, "name"], v)}
                          placeholder="Channel"
                        />
                      </p>
                      {c.priority && (
                        <Badge variant="secondary" className="bg-accent-soft text-accent border-0 hover:bg-accent-soft text-[10px] uppercase tracking-wider">
                          {c.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <EditableField
                        value={c.why}
                        onChange={(v) => setEnhanced(["distribution", "recommendedChannels", i, "why"], v)}
                        multiline
                        placeholder="Why this channel fits"
                      />
                    </p>
                  </div>
                ))}
                {editing && (
                  <button
                    onClick={() => setEnhanced(["distribution", "recommendedChannels"], [...(distribution?.recommendedChannels || []), { name: "", why: "", priority: "medium" }])}
                    className="p-4 rounded-lg border border-dashed border-accent/50 text-sm text-accent hover:bg-accent/5"
                  >
                    + Add channel
                  </button>
                )}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Success + goal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="group relative report-card p-6 border-border shadow-soft">
          {colPencil("success_definition", "success metric", "How you'll measure traction — a number you can track weekly or monthly.")}
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Success looks like</div>
          <p>
            <EditableField value={strategy.success_definition} onChange={(v) => setField("success_definition", v)} multiline placeholder="What success looks like" />
          </p>
        </Card>
        <Card className="group relative report-card p-6 border-border shadow-soft">
          {colPencil("business_goal", "business goal", "Your primary revenue or client target for the next 90–180 days.")}
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Business goal</div>
          <p>
            <EditableField value={strategy.business_goal} onChange={(v) => setField("business_goal", v)} multiline placeholder="Your primary business goal" />
          </p>
        </Card>
      </div>
    </div>
  );
}

function EditableBulletList({
  label,
  items,
  onChange,
  bullet = "•",
  accent,
  muted,
}: {
  label?: React.ReactNode;
  items: string[];
  onChange: (next: string[]) => void;
  bullet?: React.ReactNode;
  accent?: boolean;
  muted?: boolean;
}) {
  const { editing } = useStrategyEditor();
  const [draft, setDraft] = useState("");
  const add = () => { const v = draft.trim(); if (!v) return; onChange([...items, v]); setDraft(""); };
  return (
    <div>
      {label && <div className={`text-xs uppercase tracking-[0.25em] mb-3 ${accent ? "text-accent" : "text-muted-foreground"}`}>{label}</div>}
      <ul className="space-y-2">
        {items.map((r, i) => (
          <li key={i} className={`flex gap-2 text-sm leading-relaxed ${muted ? "text-muted-foreground" : ""}`}>
            {typeof bullet === "string" ? <span className={accent ? "text-accent mt-1" : "mt-1"}>{bullet}</span> : bullet}
            <span className="flex-1">
              <EditableField value={r} onChange={(v) => { if (!v.trim()) onChange(items.filter((_, j) => j !== i)); else onChange(items.map((x, j) => j === i ? v : x)); }} placeholder="Item (clear to remove)" />
            </span>
          </li>
        ))}
        {editing && (
          <li className="flex gap-2 text-sm">
            <span className={accent ? "text-accent mt-1" : "text-muted-foreground mt-1"}>+</span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
              onBlur={add}
              placeholder="Add item…"
              className="flex-1 bg-background/40 border border-dashed border-accent/50 rounded-md px-2 py-1 outline-none focus:border-accent focus:bg-background"
            />
          </li>
        )}
      </ul>
    </div>
  );
}

function DifferentiatorTable({ items, onChange }: { items: any[]; onChange: (next: any[]) => void }) {
  const { editing } = useStrategyEditor();
  if (!items.length && !editing) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-border mb-2">
      <div className="grid grid-cols-3 bg-muted/60 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <div>Factor</div><div>You</div><div>Competitors</div>
      </div>
      {items.map((d, i) => (
        <div key={i} className="grid grid-cols-3 px-4 py-3 text-sm border-t border-border gap-2 items-start">
          <div className="font-medium pr-3">
            <EditableField value={d.factor} onChange={(v) => onChange(items.map((x, j) => j === i ? { ...x, factor: v } : x))} placeholder="Factor" />
          </div>
          <div className="text-foreground pr-3">
            <EditableField value={d.you} onChange={(v) => onChange(items.map((x, j) => j === i ? { ...x, you: v } : x))} multiline placeholder="Your approach" />
          </div>
          <div className="text-muted-foreground flex gap-2 items-start">
            <span className="flex-1"><EditableField value={d.competitors} onChange={(v) => onChange(items.map((x, j) => j === i ? { ...x, competitors: v } : x))} multiline placeholder="Competitor approach" /></span>
            {editing && <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive shrink-0" aria-label="Remove row"><X className="h-3.5 w-3.5" /></button>}
          </div>
        </div>
      ))}
      {editing && (
        <div className="px-4 py-2 border-t border-border">
          <button onClick={() => onChange([...items, { factor: "", you: "", competitors: "" }])} className="text-xs text-accent hover:underline">+ Add differentiator</button>
        </div>
      )}
    </div>
  );
}

function VoiceTab() {
  const { strategy, setField, setEnhanced, editing } = useStrategyEditor();
  const ef = (strategy.enhanced_foundation || {}) as any;
  const vg = ef.voiceGuidelines || {};
  const attributes: any[] = vg.attributes || [];
  const sentence = vg.sentenceStructure || {};
  const vocab = vg.vocabulary || {};
  const tone = vg.toneByPlatform || {};
  const examples = vg.voiceExamples || {};
  const never: any[] = vg.neverSoundLike || [];

  const colPencil = (col: string, label: string, description: string) => (
    <SectionPencil
      target={() => ({
        refineKey: col,
        label,
        description,
        currentValue: Array.isArray(strategy?.[col]) ? (strategy[col] as any[]).join(", ") : (strategy?.[col] || ""),
        buildPatch: (v) => {
          const isArr = Array.isArray(strategy?.[col]);
          return { [col]: isArr ? v.split(/,|\n/).map((s) => s.trim()).filter(Boolean) : v };
        },
      })}
    />
  );
  const efPencil = (path: (string | number)[], label: string, description: string) => (
    <SectionPencil
      target={() => {
        const cur = path.reduce<any>((acc, k) => (acc == null ? acc : acc[k]), strategy?.enhanced_foundation || {});
        const isArr = Array.isArray(cur);
        return {
          refineKey: `enhanced:${path.join(".")}`,
          label,
          description,
          currentValue: isArr ? cur.join(", ") : (cur || ""),
          buildPatch: (v) => {
            const value = isArr ? v.split(/,|\n/).map((s) => s.trim()).filter(Boolean) : v;
            return { enhanced_foundation: setInPath(strategy?.enhanced_foundation || {}, path, value) };
          },
        };
      }}
    />
  );

  return (
    <div className="space-y-6 mt-0 report-page" style={{ pageBreakAfter: "always" }}>
      {/* Voice attributes */}
      <Card className="group relative report-card p-7 border-border shadow-soft">
        {colPencil("voice_attributes", "voice attributes", "The 2–3 traits that define how your brand sounds in writing.")}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Voice attributes</div>
          {editing && (
            <Button variant="ghost" size="sm" onClick={() => setEnhanced(["voiceGuidelines", "attributes"], [...attributes, { trait: "New trait", meaning: "", inPractice: "", example: "" }])}>+ Add</Button>
          )}
        </div>
        {attributes.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border">
            {attributes.map((a, i) => (
              <div key={i} className={`grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-4 px-4 py-4 ${i > 0 ? "border-t border-border" : ""}`}>
                <div>
                  <Badge className="bg-accent-soft text-accent border-0 hover:bg-accent-soft font-medium">
                    <EditableField value={a.trait} onChange={(v) => setEnhanced(["voiceGuidelines", "attributes", i, "trait"], v)} placeholder="Trait" />
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">
                    <EditableField value={a.meaning} onChange={(v) => setEnhanced(["voiceGuidelines", "attributes", i, "meaning"], v)} placeholder="What this trait means" />
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <EditableField value={a.inPractice} onChange={(v) => setEnhanced(["voiceGuidelines", "attributes", i, "inPractice"], v)} multiline placeholder="In practice…" />
                  </p>
                  <p className="text-sm italic text-muted-foreground border-l-2 border-accent pl-3">
                    <EditableField value={a.example} onChange={(v) => setEnhanced(["voiceGuidelines", "attributes", i, "example"], v)} multiline placeholder="Example phrase" />
                  </p>
                </div>
                {editing && (
                  <button onClick={() => setEnhanced(["voiceGuidelines", "attributes"], attributes.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive self-start" aria-label="Remove attribute"><X className="h-4 w-4" /></button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <EditableList
              items={(strategy.voice_attributes as string[]) || []}
              onChange={(next) => setField("voice_attributes", next)}
              renderItem={(v, i) => <Badge key={i} variant="secondary" className="bg-accent-soft text-accent border-0 hover:bg-accent-soft">{v}</Badge>}
            />
          </div>
        )}
      </Card>

      {/* Sentence structure */}
      <Card className="group relative report-card p-7 border-border shadow-soft">
        {efPencil(["voiceGuidelines", "sentenceStructure", "example"], "sentence structure", "How your sentences are shaped — rhythm, length, and a canonical example.")}
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Sentence structure</div>
        <div className="mb-5">
          <EditableBulletList
            items={sentence.rules || []}
            onChange={(next) => setEnhanced(["voiceGuidelines", "sentenceStructure", "rules"], next)}
            bullet={<Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />}
          />
        </div>
        <div className="rounded-lg bg-muted/60 p-5 border-l-4 border-accent">
          <Quote className="h-4 w-4 text-accent mb-2" />
          <p className="text-base leading-relaxed italic">
            "<EditableField value={sentence.example} onChange={(v) => setEnhanced(["voiceGuidelines", "sentenceStructure", "example"], v)} multiline placeholder="Example sentence demonstrating your voice" />"
          </p>
        </div>
      </Card>

      {/* Vocabulary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="group relative report-card words-use p-6 border-border shadow-soft">
          {efPencil(["voiceGuidelines", "vocabulary", "use"], "words to use", "The vocabulary that should consistently show up in your writing.")}
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-accent mb-3"><Check className="h-3.5 w-3.5" /> Words to use</div>
          <EditableList
            items={vocab.use || []}
            onChange={(next) => setEnhanced(["voiceGuidelines", "vocabulary", "use"], next)}
            chipClassName="bg-accent-soft text-accent"
          />
        </Card>
        <Card className="group relative report-card words-avoid p-6 border-border shadow-soft">
          {efPencil(["voiceGuidelines", "vocabulary", "avoid"], "words to avoid", "The vocabulary that should never appear — generic, jargon, or off-brand terms.")}
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3"><X className="h-3.5 w-3.5" /> Words to avoid</div>
          <EditableList
            items={vocab.avoid || []}
            onChange={(next) => setEnhanced(["voiceGuidelines", "vocabulary", "avoid"], next)}
            chipClassName="bg-muted text-muted-foreground line-through"
          />
        </Card>
      </div>

      {/* Tone by platform */}
      <Card className="group relative report-card p-7 border-border shadow-soft">
        {efPencil(["voiceGuidelines", "toneByPlatform", "linkedin", "tone"], "tone by platform", "How your voice shifts across LinkedIn, email, and podcast.")}
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Tone by platform</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["linkedin", "email", "podcast"] as const).map((p) => {
            const t = tone[p] || {};
            return (
              <div key={p} className="p-4 rounded-lg border border-border">
                <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">{p}</div>
                <p className="text-sm font-medium mb-1">
                  <EditableField value={t.tone} onChange={(v) => setEnhanced(["voiceGuidelines", "toneByPlatform", p, "tone"], v)} placeholder="Tone" />
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  <EditableField value={t.mode} onChange={(v) => setEnhanced(["voiceGuidelines", "toneByPlatform", p, "mode"], v)} placeholder="Mode" />
                </p>
                <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-2">
                  <EditableField value={t.example} onChange={(v) => setEnhanced(["voiceGuidelines", "toneByPlatform", p, "example"], v)} multiline placeholder="Example" />
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Voice examples */}
      <Card className="group relative report-card p-7 border-border shadow-soft">
        {efPencil(["voiceGuidelines", "voiceExamples", "openingHook", "good"], "voice examples", "Concrete good/bad examples — hooks, teaching points, and CTAs in your voice.")}
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-5">Voice examples</div>
        <div className="space-y-5">
          {([
            ["Opening hook", "openingHook"],
            ["Teaching point", "teachingPoint"],
            ["Call to action", "callToAction"],
          ] as const).map(([label, key]) => {
            const ex = examples[key] || {};
            return (
              <div key={key}>
                <div className="text-xs uppercase tracking-[0.2em] font-medium mb-3">{label}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                  <div className="p-4 rounded-lg bg-accent-soft/40 border-l-4 border-accent">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-accent mb-2"><Check className="h-3 w-3" /> Good</div>
                    <p className="text-sm leading-relaxed">
                      "<EditableField value={ex.good} onChange={(v) => setEnhanced(["voiceGuidelines", "voiceExamples", key, "good"], v)} multiline placeholder="A good example in your voice" />"
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/60 border-l-4 border-muted-foreground/30">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2"><X className="h-3 w-3" /> Bad</div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      "<EditableField value={ex.bad} onChange={(v) => setEnhanced(["voiceGuidelines", "voiceExamples", key, "bad"], v)} multiline placeholder="What to avoid" />"
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  <EditableField value={ex.why} onChange={(v) => setEnhanced(["voiceGuidelines", "voiceExamples", key, "why"], v)} placeholder="Why the good version works better" />
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Never sound like */}
      <Card className="group relative report-card p-7 border-border shadow-soft">
        {colPencil("anti_positioning", "what you'd never sound like", "Styles, phrases, or vibes your brand actively rejects.")}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Never sound like</div>
          {editing && (
            <Button variant="ghost" size="sm" onClick={() => setEnhanced(["voiceGuidelines", "neverSoundLike"], [...never, { style: "", example: "", why: "" }])}>+ Add</Button>
          )}
        </div>
        {never.length > 0 ? (
          <div className="space-y-3">
            {never.map((n, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/40 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <X className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm flex-1">
                    <EditableField value={n.style} onChange={(v) => setEnhanced(["voiceGuidelines", "neverSoundLike", i, "style"], v)} placeholder="Style label (e.g. Corporate jargon)" />
                  </span>
                  {editing && (
                    <button onClick={() => setEnhanced(["voiceGuidelines", "neverSoundLike"], never.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive" aria-label="Remove"><X className="h-3.5 w-3.5" /></button>
                  )}
                </div>
                <p className="text-sm italic text-muted-foreground mb-1">
                  "<EditableField value={n.example} onChange={(v) => setEnhanced(["voiceGuidelines", "neverSoundLike", i, "example"], v)} multiline placeholder="Example phrase to avoid" />"
                </p>
                <p className="text-xs text-muted-foreground">
                  <EditableField value={n.why} onChange={(v) => setEnhanced(["voiceGuidelines", "neverSoundLike", i, "why"], v)} placeholder="Why this doesn't fit" />
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            <EditableField value={strategy.anti_positioning} onChange={(v) => setField("anti_positioning", v)} multiline placeholder="What you'd never sound like" />
          </p>
        )}
      </Card>
    </div>
  );
}

function StrategyContent({ reportData }: { reportData?: any }) {
  const { strategy, applyServerPatch } = useStrategyEditor();
  const { user } = useAuth();
  const [strengthDismissed, setStrengthDismissed] = useState(false);

  const score = strategy?.strength_score as number | null | undefined;
  const weak = (strategy?.weak_areas || []) as any[];
  const strong = (strategy?.strong_areas || []) as any[];

  // Shared apply: writes a patch + recomputes strength score, then syncs local state.
  const applyRefine = async ({ refineKey, patch }: { refineKey: string; newValue: string; patch: Record<string, any> }) => {
    if (!user) return;

    // Recompute strength score: bump the refined area to full points if present in
    // weak/strong arrays. Sections without a tracked area leave the score untouched.
    const curWeak = (strategy?.weak_areas || []) as any[];
    const curStrong = (strategy?.strong_areas || []) as any[];
    const bump = (arr: any[]) => arr.map((a) => (a?.refineKey === refineKey ? { ...a, points: a.max } : a));
    const bumpedWeak = bump(curWeak);
    const bumpedStrong = bump(curStrong);
    const movers = bumpedWeak.filter((a) => a?.refineKey === refineKey && a.points >= a.max);
    const remainingWeak = bumpedWeak.filter((a) => !(a?.refineKey === refineKey && a.points >= a.max));
    const mergedStrong = [...bumpedStrong, ...movers];
    const all = [...mergedStrong, ...remainingWeak];
    const totalMax = all.reduce((s, a) => s + (Number(a?.max) || 0), 0);
    const totalPts = all.reduce((s, a) => s + (Number(a?.points) || 0), 0);
    const trackedInAreas = [...curWeak, ...curStrong].some((a) => a?.refineKey === refineKey);
    const newScore =
      trackedInAreas && totalMax > 0
        ? Math.round((totalPts / totalMax) * 100)
        : (strategy?.strength_score ?? null);

    const fullPatch: Record<string, any> = {
      ...patch,
      weak_areas: remainingWeak,
      strong_areas: mergedStrong,
      strength_score: newScore,
    };

    const { error } = await supabase
      .from("strategies")
      .update(fullPatch as never)
      .eq("user_id", user.id);
    if (error) throw error;

    applyServerPatch(fullPatch);
  };

  const defaultContext = {
    ideal_client: strategy?.ideal_client,
    pain_point: strategy?.pain_point,
    transformation: strategy?.transformation,
    voice_attributes: strategy?.voice_attributes,
    positioning_statement: strategy?.positioning_statement,
  };

  return (
    <RefineProvider apply={applyRefine} defaultContext={defaultContext}>
      <StrategyContentInner
        reportData={reportData}
        score={score ?? null}
        weak={weak}
        strong={strong}
        strengthDismissed={strengthDismissed}
        setStrengthDismissed={setStrengthDismissed}
        strategy={strategy}
      />
    </RefineProvider>
  );
}

function StrategyContentInner({
  reportData,
  score,
  weak,
  strong,
  strengthDismissed,
  setStrengthDismissed,
  strategy,
}: any) {
  const { open: openRefineModal } = useRefine();

  // Map a strength-card area onto the shared refine-open flow.
  const handleStrengthRefine = (area: { refineKey: string; label: string }) => {
    const colName = area.refineKey;
    const cur = strategy?.[colName];
    const currentValue = Array.isArray(cur) ? cur.join(", ") : (cur || "");
    openRefineModal({
      refineKey: colName,
      label: area.label,
      currentValue,
      buildPatch: (v) => {
        const next = Array.isArray(cur)
          ? v.split(/,|\n/).map((s) => s.trim()).filter(Boolean)
          : v;
        return { [colName]: next };
      },
    });
  };

  return (
    <div className="moxie-strategy-page px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      <StrategyHeader />
      <div id="moxie-strategy-report">
      {!strengthDismissed && (
        <StrategyStrengthCard
          score={score ?? null}
          weakAreas={weak}
          strongAreas={strong}
          onRefine={handleStrengthRefine}
          onDismiss={() => setStrengthDismissed(true)}
        />
      )}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-transparent h-auto w-full mb-7 flex flex-wrap justify-start gap-6 rounded-none p-0 border-b border-[#ECEAE5]">
          {[
            { v: "overview", l: "Overview" },
            { v: "voice", l: "Voice & Brand" },
            { v: "content", l: "Content" },
            { v: "channels", l: "Channels" },
            { v: "metrics", l: "Metrics" },
            { v: "action", l: "Action Plan" },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="relative rounded-none px-0 pb-3 pt-1 text-[13px] font-medium text-[#6B6860] bg-transparent border-b-2 border-transparent transition-colors hover:text-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:border-[#E85A46] data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview" className="mt-0 data-[state=inactive]:hidden" forceMount>
          <div id="strategy-export-overview"><OverviewTab /></div>
        </TabsContent>
        <TabsContent value="voice" className="mt-0 data-[state=inactive]:hidden" forceMount>
          <div id="strategy-export-voice"><VoiceTab /></div>
        </TabsContent>
        <TabsContent value="content" className="mt-0"><ContentTab /></TabsContent>
        <TabsContent value="channels" className="mt-0"><ChannelsTab /></TabsContent>
        <TabsContent value="metrics" className="mt-0"><MetricsTab /></TabsContent>
        <TabsContent value="action" className="mt-0"><ActionPlanTab /></TabsContent>
      </Tabs>
      <CompetitiveAndMessagingSections />
      </div>
    </div>
  );
}

export default function Strategy() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [strategy, setStrategy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { reportData, isLoading, error } = useReportData();
  const [session, setSession] = useState<{ id: string; messageCount: number; synthesis_status: string; synthesis_attempts: number; synthesis_last_error: string | null; lane: "lane1" | "lane2" | null } | null>(null);
  const autoRetryDoneRef = useRef(false);
  const triggeredRef = useRef(false);
  // Tracks whether the dark interstitial has finished its fade-out after
  // synthesis completes. Until then we keep rendering it on top so the
  // user never sees a flash of the dashboard or any white state.
  const [interstitialDismissed, setInterstitialDismissed] = useState(false);
  // Whether we ever entered the building state — used to decide if we should
  // run the fade-out on completion or render the dashboard immediately.
  const sawBuildingRef = useRef(false);
  // Captures the synthesis_status the *first* time we display the interstitial
  // on this page mount. If we land directly on "in_progress" (user navigated
  // away and came back), we render the reentry state instead of the live
  // animation from 0%.
  const [reentryMode, setReentryMode] = useState(false);
  const reentryDecidedRef = useRef(false);
  // Pending navigation captured by the in-app blocker modal.
  const [pendingNav, setPendingNav] = useState<null | { type: "link"; href: string } | { type: "back" }>(null);

  // Initial load
  useEffect(() => {
    if (!user) return;
    (async () => {
      await refresh();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function refresh() {
    if (!user) return;
    const [{ data: strat }, { data: sess }] = await Promise.all([
      supabase.from("strategies").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("discovery_sessions")
        .select("id, messages, updated_at, lane, synthesis_status, synthesis_attempts, synthesis_last_error")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setStrategy(normalizeStrategy(strat));
    if (sess) {
      const msgs = Array.isArray((sess as any).messages) ? (sess as any).messages : [];
      setSession({
        id: (sess as any).id,
        messageCount: msgs.length,
        synthesis_status: (sess as any).synthesis_status || "pending",
        synthesis_attempts: (sess as any).synthesis_attempts ?? 0,
        synthesis_last_error: (sess as any).synthesis_last_error ?? null,
        lane: ((sess as any).lane as "lane1" | "lane2" | null) ?? null,
      });
    }
  }

  async function triggerSynthesis() {
    if (!user || !session) return;
    triggeredRef.current = true;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session: authSess } } = await supabase.auth.getSession();
      const authToken = authSess?.access_token ?? supabaseKey;
      // Optimistically mark in_progress so polling reflects the new state.
      await supabase
        .from("discovery_sessions")
        .update({ synthesis_status: "in_progress", synthesis_last_error: null } as any)
        .eq("id", session.id);
      setSession((s) => s ? { ...s, synthesis_status: "in_progress" } : s);
      fetch(`${supabaseUrl}/functions/v1/synthesize-strategy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${authToken}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({
          sessionId: session.id,
          lane: session.lane ?? "lane1",
          responseMode: "json",
        }),
        keepalive: true,
      }).catch((err) => console.warn("trigger dispatch failed:", err));
    } catch (e) {
      console.error("triggerSynthesis", e);
    }
  }

  // Auto-trigger when status is pending
  useEffect(() => {
    if (!session || strategy) return;
    if (session.synthesis_status === "pending" && !triggeredRef.current) {
      triggerSynthesis();
    }
  }, [session, strategy]);

  // Poll every 5s while in_progress/pending
  useEffect(() => {
    if (!session || strategy) return;
    if (session.synthesis_status !== "in_progress" && session.synthesis_status !== "pending") return;
    const t = window.setInterval(() => { refresh(); }, 5000);
    return () => window.clearInterval(t);
  }, [session, strategy]);

  // Auto-retry once on failure, after 30 seconds.
  useEffect(() => {
    if (!session || strategy) return;
    if (session.synthesis_status !== "failed") return;
    if (autoRetryDoneRef.current) return;
    if (session.synthesis_attempts >= 2) return; // already tried automatic + initial
    autoRetryDoneRef.current = true;
    const t = window.setTimeout(() => {
      console.log("Auto-retrying synthesis after failure");
      triggeredRef.current = false;
      triggerSynthesis();
    }, 30_000);
    return () => window.clearTimeout(t);
  }, [session, strategy]);

  // Detect reentry: if synthesis was already in_progress when we mounted
  // (this session never triggered it), show the reentry interstitial state.
  useEffect(() => {
    if (reentryDecidedRef.current) return;
    if (!session || strategy) return;
    const s = session.synthesis_status;
    if (s === "pending" || s === "in_progress") {
      reentryDecidedRef.current = true;
      if (s === "in_progress" && !triggeredRef.current) {
        setReentryMode(true);
      }
    }
  }, [session, strategy]);

  // While the interstitial is visible, intercept internal link clicks and
  // browser back so we can show the in-app "Stay here / Leave anyway" modal
  // instead of an abrupt navigation. Synthesis keeps running server-side.
  const _curStatus = session?.synthesis_status;
  const interstitialVisible =
    !strategy && !!session && session.messageCount > 0 && (_curStatus === "pending" || _curStatus === "in_progress");
  useEffect(() => {
    if (!interstitialVisible) return;
    // Push a guard entry so the first Back press fires our popstate handler.
    window.history.pushState({ moxieGuard: true }, "");
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as Element | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      // Allow modal's own buttons (not anchors anyway), external links, and
      // links targeting a new window.
      if (anchor.target && anchor.target !== "" && anchor.target !== "_self") return;
      if (/^(https?:)?\/\//i.test(href) && !href.startsWith(window.location.origin)) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
      // Same-page hash — let it through.
      if (href.startsWith("#")) return;
      // Already on this URL — ignore.
      const normalized = href.startsWith("http") ? new URL(href).pathname + new URL(href).search : href;
      if (normalized === window.location.pathname + window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingNav({ type: "link", href: normalized });
    };
    const onPopState = () => {
      // Re-push the guard so the URL stays put while the modal is open.
      window.history.pushState({ moxieGuard: true }, "");
      setPendingNav({ type: "back" });
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [interstitialVisible]);

  const confirmLeave = () => {
    const nav = pendingNav;
    setPendingNav(null);
    if (!nav) return;
    if (nav.type === "link") {
      navigate(nav.href);
    } else {
      // Pop our guard entry and then go back one more.
      window.history.go(-1);
    }
  };

  if (isLoading) return <p className="p-10 text-muted-foreground">Loading strategy...</p>;
  if (error) return <p className="p-10 text-destructive">Error: {error.message}</p>;

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;

  const hasSession = session && session.messageCount > 0;
  const status = session?.synthesis_status;
  const isBuilding = !strategy && hasSession && (status === "pending" || status === "in_progress");
  const isFailed = !strategy && hasSession && status === "failed";
  if (isBuilding) sawBuildingRef.current = true;

  // Render the dark interstitial whenever we're building, or while it's still
  // fading out after strategy arrived. Sits above any underlying content.
  const showInterstitial =
    isBuilding || (sawBuildingRef.current && !!strategy && !interstitialDismissed);

  const showManualRetry = isFailed && (autoRetryDoneRef.current || (session?.synthesis_attempts ?? 0) >= 2);

  const emptyOrFailedState = !strategy ? (
    <div className="px-6 lg:px-10 py-16 max-w-3xl mx-auto text-center">
      <div className="h-16 w-16 rounded-2xl bg-foreground mx-auto mb-6 flex items-center justify-center"><Compass className="h-7 w-7 text-accent" /></div>
      {isBuilding ? null : isFailed && !showManualRetry ? (
          <>
            <h1 className="font-display text-4xl mb-3">Strategy generation hit a snag</h1>
            <p className="text-muted-foreground mb-8">
              We're automatically retrying in a moment — your Discovery answers are safe.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <span>Retrying soon…</span>
            </div>
          </>
        ) : isFailed ? (
          <>
            <h1 className="font-display text-4xl mb-3">Strategy generation didn't complete</h1>
            <p className="text-muted-foreground mb-8">
              Your Discovery answers are saved. Click below to try again.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                onClick={() => { autoRetryDoneRef.current = false; triggeredRef.current = false; triggerSynthesis(); }}
                className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 rounded-lg"
              >
                <Zap className="mr-2 h-4 w-4" /> Try again
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-lg">
                <Link to="/app/discovery">Review Discovery</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl mb-3">No strategy yet</h1>
            <p className="text-muted-foreground mb-8">Run MOXIEMO Discovery to extract your positioning, voice, and content foundation.</p>
            <Button asChild className="bg-foreground text-background hover:bg-foreground/90 h-11 rounded-lg">
              <Link to="/app/discovery"><Sparkles className="mr-2 h-4 w-4 text-accent" /> Begin discovery</Link>
            </Button>
          </>
        )}
      </div>
  ) : null;

  return (
    <>
      {strategy ? (
        <StrategyEditorProvider initial={strategy} userId={user!.id}>
          <StrategyContent reportData={reportData} />
        </StrategyEditorProvider>
      ) : (
        emptyOrFailedState
      )}
      {showInterstitial && (
        <StrategyEngineInterstitial
          active
          done={!!strategy}
          mode={reentryMode ? "reentry" : "live"}
          onFadedOut={() => setInterstitialDismissed(true)}
        />
      )}
      {pendingNav && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center px-6"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setPendingNav(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="moxie-leave-title"
            style={{
              backgroundColor: "#1A1C20",
              borderRadius: 12,
              padding: 28,
              maxWidth: 400,
              width: "100%",
            }}
          >
            <h2
              id="moxie-leave-title"
              style={{ color: "#fff", fontSize: 18, fontWeight: 700, lineHeight: 1.3, margin: 0 }}
            >
              Your strategy is being built
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 14,
                lineHeight: 1.6,
                marginTop: 12,
                marginBottom: 24,
              }}
            >
              Processing continues in the background, but leaving now means you won't see live progress. You can return to this page at any time to check status.
            </p>
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={confirmLeave}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 14,
                  cursor: "pointer",
                  padding: "8px 4px",
                }}
              >
                Leave anyway
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => setPendingNav(null)}
                style={{
                  backgroundColor: "#FF6B5C",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  border: 0,
                  borderRadius: 8,
                  padding: "10px 18px",
                  cursor: "pointer",
                }}
              >
                Stay here
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}