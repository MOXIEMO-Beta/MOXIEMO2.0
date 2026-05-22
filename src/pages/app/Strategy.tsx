import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { aiErrorMessage } from "@/lib/aiErrors";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Sparkles, Compass, Download, Share2, Pencil, Check, X, Quote, Save, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { StrategyEditorProvider, useStrategyEditor } from "@/hooks/useStrategyEditor";
import { useReportData } from "@/hooks/useReportData";
import { Skeleton } from "@/components/ui/skeleton";
import { EditableField } from "@/components/strategy/EditableField";
import { EditableList } from "@/components/strategy/EditableList";
import { StrategyStrengthCard } from "@/components/strategy/StrategyStrengthCard";
import { RefineSectionDialog } from "@/components/strategy/RefineSectionDialog";
import { downloadStrategyPdf } from "@/lib/strategyPdf";

import { ContentTab } from "@/components/strategy/tabs/ContentTab";
import { ChannelsTab } from "@/components/strategy/tabs/ChannelsTab";
import { MetricsTab } from "@/components/strategy/tabs/MetricsTab";
import { ActionPlanTab } from "@/components/strategy/tabs/ActionPlanTab";
import { CompetitiveAndMessagingSections } from "@/components/strategy/CompetitiveAndMessagingSections";

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
  if (status === "error") return <span className="inline-flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3 w-3" /> Save failed — retry</span>;
  if (status === "saved" || (status === "idle" && time)) return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3 w-3 text-accent" /> Saved {time && `· ${time}`}</span>;
  return null;
}

function StrategyHeader() {
  const { editing, setEditing, status, saveNow, strategy, setEnhanced } = useStrategyEditor();
  const { user } = useAuth();
  const { reportData } = useReportData();
  const [exporting, setExporting] = useState(false);
  const [exportingMd, setExportingMd] = useState(false);
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

  const handleExportMd = async () => {
    if (!reportData) { toast.error("Report data not ready yet."); return; }
    if (editing) await saveNow();
    setExportingMd(true);
    try {
      const md = buildStrategyMarkdown(reportData);
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = buildFileName("md");
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setExportingMd(false);
    }
  };

  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      <div>
        <div className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-accent px-3 py-1.5 rounded-full bg-accent-soft mb-3">Your strategy</div>
        <h1 className="font-display text-5xl md:text-6xl tracking-[-0.03em] mb-3">Marketing foundation</h1>
        <p className="text-muted-foreground max-w-2xl">This strategy powers every piece of content, email, and post MOXIEMO generates. Update it any time — your execution layer adapts automatically.</p>
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
        <Button variant="outline" size="sm" className="rounded-lg" onClick={handleExportMd} disabled={exportingMd || !reportData}>
          {exportingMd ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-2 h-3.5 w-3.5" />}
          Download Markdown
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

  const breakdownFields: [string, string, string][] = [
    ["Who", "idealClient", "Who you serve"],
    ["Problem", "painPoint", "The pain you solve"],
    ["Solution", "uniqueApproach", "Your unique approach"],
    ["Result", "outcome", "The end result"],
    ["Method", "method", "How you do it"],
    ["Transformation", "transformation", "The shift you create"],
  ];

  return (
    <div className="space-y-6 mt-0 report-page" style={{ pageBreakAfter: "always" }}>
      {/* Positioning */}
      <Card className="report-card p-8 bg-foreground text-background border-0">
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-4">Positioning statement</div>
        <div className="font-display text-2xl md:text-3xl leading-relaxed mb-6">
          <EditableField
            value={strategy.positioning_statement}
            onChange={(v) => setField("positioning_statement", v)}
            multiline
            placeholder="Your positioning statement"
            ariaLabel="Positioning statement"
          />
        </div>

        {(editing || Object.values(breakdown).some(Boolean)) && (
          <div className="rounded-xl bg-background/5 border border-background/10 p-5">
            <div className="text-[10px] uppercase tracking-[0.25em] text-background/60 mb-3">Breakdown</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {breakdownFields.map(([label, key, ph]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-background/60 min-w-[110px]">• {label}:</span>
                  <span className="flex-1">
                    <EditableField
                      value={breakdown[key]}
                      onChange={(v) => setEnhanced(["positioningBreakdown", key], v)}
                      placeholder={ph}
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(editing || Object.values(variations).some(Boolean)) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {([["Short", "short"], ["Tweet", "tweet"], ["Elevator", "elevator"]] as const).map(([label, key]) => (
              <div key={key} className="rounded-lg bg-background/5 border border-background/10 p-3">
                <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-1.5">{label}</div>
                <div className="text-sm leading-relaxed text-background/90">
                  <EditableField
                    value={variations[key]}
                    onChange={(v) => setEnhanced(["positioningVariations", key], v)}
                    multiline
                    placeholder={`${label} version`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Brand archetype */}
      {(archetype || editing) && (
        <Card className="report-card p-7 border-border shadow-soft">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Brand archetype</div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-lg bg-accent-soft/40">
              <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Brands</div>
              <div className="text-sm">
                <EditableList
                  items={archetype?.exampleBrands || []}
                  onChange={(next) => setEnhanced(["brandArchetype", "exampleBrands"], next)}
                  renderItem={(it) => <span key={it}>{it}</span>}
                />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-accent-soft/40">
              <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Values</div>
              <div className="text-sm">
                <EditableList
                  items={archetype?.coreValues || []}
                  onChange={(next) => setEnhanced(["brandArchetype", "coreValues"], next)}
                  renderItem={(it) => <span key={it}>{it}</span>}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableBulletList
              label="Why this fits you"
              items={archetype?.whyThisFits || []}
              onChange={(next) => setEnhanced(["brandArchetype", "whyThisFits"], next)}
              bullet="•"
            />
            <EditableBulletList
              label="How to use this"
              items={archetype?.howToApply || []}
              onChange={(next) => setEnhanced(["brandArchetype", "howToApply"], next)}
              bullet={<Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />}
            />
          </div>
        </Card>
      )}

      {/* Audience snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Ideal client", key: "ideal_client" },
          { label: "Pain point", key: "pain_point" },
          { label: "Transformation", key: "transformation" },
        ].map((s) => (
          <Card key={s.key} className="report-card p-5 border-border shadow-soft">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">{s.label}</div>
            <p className="text-sm leading-relaxed">
              <EditableField
                value={strategy[s.key]}
                onChange={(v) => setField(s.key, v)}
                multiline
                placeholder={s.label}
              />
            </p>
          </Card>
        ))}
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
        <Card className="report-card p-7 border-border shadow-soft">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Competitive positioning</div>
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

      {/* Success + goal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="report-card p-6 border-border shadow-soft">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Success looks like</div>
          <p>
            <EditableField value={strategy.success_definition} onChange={(v) => setField("success_definition", v)} multiline placeholder="What success looks like" />
          </p>
        </Card>
        <Card className="report-card p-6 border-border shadow-soft">
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

  return (
    <div className="space-y-6 mt-0 report-page" style={{ pageBreakAfter: "always" }}>
      {/* Voice attributes */}
      <Card className="report-card p-7 border-border shadow-soft">
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
      <Card className="report-card p-7 border-border shadow-soft">
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
        <Card className="report-card p-6 border-border shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-accent mb-3"><Check className="h-3.5 w-3.5" /> Words to use</div>
          <EditableList
            items={vocab.use || []}
            onChange={(next) => setEnhanced(["voiceGuidelines", "vocabulary", "use"], next)}
            chipClassName="bg-accent-soft text-accent"
          />
        </Card>
        <Card className="report-card p-6 border-border shadow-soft">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3"><X className="h-3.5 w-3.5" /> Words to avoid</div>
          <EditableList
            items={vocab.avoid || []}
            onChange={(next) => setEnhanced(["voiceGuidelines", "vocabulary", "avoid"], next)}
            chipClassName="bg-muted text-muted-foreground line-through"
          />
        </Card>
      </div>

      {/* Tone by platform */}
      <Card className="report-card p-7 border-border shadow-soft">
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
      <Card className="report-card p-7 border-border shadow-soft">
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
      <Card className="report-card p-7 border-border shadow-soft">
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
  const { strategy, setField } = useStrategyEditor();
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineKey, setRefineKey] = useState<string | null>(null);
  const [refineLabel, setRefineLabel] = useState<string | undefined>();
  const [strengthDismissed, setStrengthDismissed] = useState(false);

  const score = strategy?.strength_score as number | null | undefined;
  const weak = (strategy?.weak_areas || []) as any[];
  const strong = (strategy?.strong_areas || []) as any[];

  const openRefine = (area: { refineKey: string; label: string }) => {
    setRefineKey(area.refineKey);
    setRefineLabel(area.label);
    setRefineOpen(true);
  };

  const refineCurrentValue = (() => {
    if (!refineKey) return "";
    const v = strategy?.[refineKey];
    if (Array.isArray(v)) return v.join(", ");
    return v || "";
  })();

  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      <StrategyHeader />
      <div id="moxie-strategy-report">
      {!strengthDismissed && (
        <StrategyStrengthCard
          score={score ?? null}
          weakAreas={weak}
          strongAreas={strong}
          onRefine={openRefine}
          onDismiss={() => setStrengthDismissed(true)}
        />
      )}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-muted/60 h-auto p-1 mb-6 flex flex-wrap justify-start gap-1">
          <TabsTrigger value="overview" className="rounded-md">Overview</TabsTrigger>
          <TabsTrigger value="voice" className="rounded-md">Voice & Brand</TabsTrigger>
          <TabsTrigger value="content" className="rounded-md">Content</TabsTrigger>
          <TabsTrigger value="channels" className="rounded-md">Channels</TabsTrigger>
          <TabsTrigger value="metrics" className="rounded-md">Metrics</TabsTrigger>
          <TabsTrigger value="action" className="rounded-md">Action Plan</TabsTrigger>
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

      <RefineSectionDialog
        open={refineOpen}
        onOpenChange={setRefineOpen}
        sectionKey={refineKey}
        sectionLabel={refineLabel}
        currentValue={refineCurrentValue}
        context={{
          ideal_client: strategy?.ideal_client,
          pain_point: strategy?.pain_point,
          transformation: strategy?.transformation,
          voice_attributes: strategy?.voice_attributes,
          positioning_statement: strategy?.positioning_statement,
        }}
        onApply={(newValue) => {
          if (!refineKey) return;
          // voice_attributes is an array column — split commas back out.
          if (refineKey === "voice_attributes") {
            const arr = newValue.split(/,|\n/).map((s) => s.trim()).filter(Boolean);
            setField(refineKey, arr);
          } else {
            setField(refineKey, newValue);
          }
        }}
      />

    </div>
  );
}

export default function Strategy() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { reportData, isLoading, error } = useReportData();
  const [recoverableSession, setRecoverableSession] = useState<{ id: string; messageCount: number } | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: strat } = await supabase
        .from("strategies")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setStrategy(strat);
      if (!strat) {
        const { data: sess } = await supabase
          .from("discovery_sessions")
          .select("id, messages, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const msgs = Array.isArray((sess as any)?.messages) ? (sess as any).messages : [];
        if (sess && msgs.length > 0) {
          setRecoverableSession({ id: (sess as any).id, messageCount: msgs.length });
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const handleGenerateFromSession = async () => {
    if (!recoverableSession) return;
    setGenerating(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token ?? supabaseKey;
      const resp = await fetch(`${supabaseUrl}/functions/v1/synthesize-strategy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ sessionId: recoverableSession.id }),
      });
      if (!resp.ok || !resp.body) throw new Error(`Synthesis failed: ${resp.status}`);
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let data: any = null;
      let streamError: string | null = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "complete") data = evt.strategy;
            else if (evt.type === "error") streamError = evt.message || "Stream error";
          } catch { /* heartbeat */ }
        }
      }
      if (streamError) throw new Error(streamError);
      if (!data) throw new Error("Stream ended before strategy was generated");
      const { error: upsertErr } = await supabase
        .from("strategies")
        .upsert({ ...data, user_id: user!.id }, { onConflict: "user_id" });
      if (upsertErr) throw upsertErr;
      toast.success("Strategy generated");
      const { data: fresh } = await supabase.from("strategies").select("*").eq("user_id", user!.id).maybeSingle();
      setStrategy(fresh);
      setRecoverableSession(null);
    } catch (e: any) {
      console.error(e);
      toast.error(aiErrorMessage("discovery", e));
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) return <p className="p-10 text-muted-foreground">Loading strategy...</p>;
  if (error) return <p className="p-10 text-destructive">Error: {error.message}</p>;

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;

  if (!strategy) {
    return (
      <div className="px-6 lg:px-10 py-16 max-w-3xl mx-auto text-center">
        <div className="h-16 w-16 rounded-2xl bg-foreground mx-auto mb-6 flex items-center justify-center"><Compass className="h-7 w-7 text-accent" /></div>
        {recoverableSession ? (
          <>
            <h1 className="font-display text-4xl mb-3">Your Discovery is ready</h1>
            <p className="text-muted-foreground mb-8">
              We found your previous Discovery conversation ({recoverableSession.messageCount} messages). Generate your strategy now — no need to redo Discovery.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                onClick={handleGenerateFromSession}
                disabled={generating}
                className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 rounded-lg"
              >
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                {generating ? "Generating…" : "Generate My Strategy"}
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
    );
  }

  return (
    <StrategyEditorProvider initial={strategy} userId={user!.id}>
      <StrategyContent reportData={reportData} />
    </StrategyEditorProvider>
  );
}