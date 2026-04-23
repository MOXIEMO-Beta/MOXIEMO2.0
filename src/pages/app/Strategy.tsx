import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Sparkles, Compass, Download, Share2, Pencil, Check, X, Quote } from "lucide-react";

const TAB_PLACEHOLDER = (label: string) => (
  <Card className="p-10 border-dashed border-border bg-background text-center">
    <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Coming next sprint</div>
    <h3 className="font-display text-2xl mb-2">{label}</h3>
    <p className="text-sm text-muted-foreground max-w-md mx-auto">
      This workspace section is part of the next strategy build-out. Your foundation data is already captured — we're laying out the views.
    </p>
  </Card>
);

export default function Strategy() {
  const { user } = useAuth();
  const [strategy, setStrategy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("strategies").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setStrategy(data); setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="p-10 text-muted-foreground">Loading…</div>;

  if (!strategy) {
    return (
      <div className="px-6 lg:px-10 py-16 max-w-3xl mx-auto text-center">
        <div className="h-16 w-16 rounded-2xl bg-foreground mx-auto mb-6 flex items-center justify-center"><Compass className="h-7 w-7 text-accent" /></div>
        <h1 className="font-display text-4xl mb-3">No strategy yet</h1>
        <p className="text-muted-foreground mb-8">Run AI Discovery to extract your positioning, voice, and content foundation.</p>
        <Button asChild className="bg-foreground text-background hover:bg-foreground/90 h-11 rounded-lg">
          <Link to="/app/discovery"><Sparkles className="mr-2 h-4 w-4 text-accent" /> Begin discovery</Link>
        </Button>
      </div>
    );
  }

  const ef = (strategy.enhanced_foundation || {}) as any;
  const updated = strategy.updated_at ? new Date(strategy.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-accent px-3 py-1.5 rounded-full bg-accent-soft mb-3">Your strategy</div>
          <h1 className="font-display text-5xl md:text-6xl tracking-[-0.03em] mb-3">Marketing foundation</h1>
          <p className="text-muted-foreground max-w-2xl">This strategy powers every piece of content, email, and post MOXIE generates. Update it any time — your execution layer adapts automatically.</p>
          {updated && <div className="text-xs text-muted-foreground mt-3">Last updated: {updated}</div>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="rounded-lg"><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</Button>
          <Button variant="outline" size="sm" className="rounded-lg"><Download className="mr-2 h-3.5 w-3.5" /> PDF</Button>
          <Button variant="outline" size="sm" className="rounded-lg"><Share2 className="mr-2 h-3.5 w-3.5" /> Share</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-muted/60 h-auto p-1 mb-6 flex flex-wrap justify-start gap-1">
          <TabsTrigger value="overview" className="rounded-md">Overview</TabsTrigger>
          <TabsTrigger value="voice" className="rounded-md">Voice & Brand</TabsTrigger>
          <TabsTrigger value="content" className="rounded-md">Content</TabsTrigger>
          <TabsTrigger value="channels" className="rounded-md">Channels</TabsTrigger>
          <TabsTrigger value="metrics" className="rounded-md">Metrics</TabsTrigger>
          <TabsTrigger value="action" className="rounded-md">Action Plan</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Positioning */}
          <Card className="p-8 bg-foreground text-background border-0">
            <div className="text-xs uppercase tracking-[0.25em] text-accent mb-4">Positioning statement</div>
            <p className="font-display text-2xl md:text-3xl leading-relaxed mb-6">{strategy.positioning_statement}</p>
            {ef.positioningBreakdown && (
              <div className="rounded-xl bg-background/5 border border-background/10 p-5">
                <div className="text-[10px] uppercase tracking-[0.25em] text-background/60 mb-3">Breakdown</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  {[
                    ["Who", ef.positioningBreakdown.idealClient],
                    ["Problem", ef.positioningBreakdown.painPoint],
                    ["Solution", ef.positioningBreakdown.uniqueApproach],
                    ["Result", ef.positioningBreakdown.outcome],
                    ["Method", ef.positioningBreakdown.method],
                    ["Transformation", ef.positioningBreakdown.transformation],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="flex gap-2"><span className="text-background/60 min-w-[110px]">• {k}:</span><span>{v}</span></div>
                  ))}
                </div>
              </div>
            )}
            {ef.positioningVariations && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {[
                  ["Short", ef.positioningVariations.short],
                  ["Tweet", ef.positioningVariations.tweet],
                  ["Elevator", ef.positioningVariations.elevator],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-background/5 border border-background/10 p-3">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-1.5">{k}</div>
                    <p className="text-sm leading-relaxed text-background/90">{v}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Brand archetype */}
          {ef.brandArchetype && (
            <Card className="p-7 border-border shadow-soft">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Brand archetype</div>
              <div className="flex items-start gap-4 mb-5">
                <div className="text-5xl leading-none">{ef.brandArchetype.icon}</div>
                <div>
                  <h3 className="font-display text-3xl tracking-[-0.02em]">{ef.brandArchetype.name}</h3>
                  {ef.brandArchetype.secondary && <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Secondary: {ef.brandArchetype.secondary}</div>}
                </div>
              </div>
              <p className="text-base leading-relaxed mb-5">{ef.brandArchetype.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {ef.brandArchetype.exampleBrands?.length > 0 && (
                  <div className="p-4 rounded-lg bg-accent-soft/40">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Brands</div>
                    <p className="text-sm">{ef.brandArchetype.exampleBrands.join(", ")}</p>
                  </div>
                )}
                {ef.brandArchetype.coreValues?.length > 0 && (
                  <div className="p-4 rounded-lg bg-accent-soft/40">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Values</div>
                    <p className="text-sm">{ef.brandArchetype.coreValues.join(", ")}</p>
                  </div>
                )}
                {ef.brandArchetype.contentApproach && (
                  <div className="p-4 rounded-lg bg-accent-soft/40">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Content approach</div>
                    <p className="text-sm">{ef.brandArchetype.contentApproach}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ef.brandArchetype.whyThisFits?.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Why this fits you</div>
                    <ul className="space-y-2">
                      {ef.brandArchetype.whyThisFits.map((r: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm leading-relaxed"><span className="text-accent mt-1">•</span><span>{r}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                {ef.brandArchetype.howToApply?.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">How to use this</div>
                    <ul className="space-y-2">
                      {ef.brandArchetype.howToApply.map((r: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm leading-relaxed"><Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span>{r}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Audience snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Ideal client", value: strategy.ideal_client },
              { label: "Pain point", value: strategy.pain_point },
              { label: "Transformation", value: strategy.transformation },
            ].map((s) => (
              <Card key={s.label} className="p-5 border-border shadow-soft">
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">{s.label}</div>
                <p className="text-sm leading-relaxed">{s.value}</p>
              </Card>
            ))}
          </div>

          {/* Core values */}
          {ef.coreValues?.length > 0 && (
            <Card className="p-7 border-border shadow-soft">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-5">Core values & decision filters</div>
              <div className="space-y-5">
                {ef.coreValues.map((v: any, i: number) => (
                  <div key={i} className={i > 0 ? "pt-5 border-t border-border" : ""}>
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="font-display text-2xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                      <h4 className="font-display text-xl tracking-[-0.01em] uppercase">{v.name}</h4>
                    </div>
                    {v.decisionFilter && (
                      <div className="rounded-lg bg-muted/60 px-4 py-3 mb-3 text-sm italic">
                        <span className="text-muted-foreground not-italic text-xs uppercase tracking-[0.2em] mr-2">Decision filter:</span>
                        "{v.decisionFilter}"
                      </div>
                    )}
                    {v.description && <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{v.description}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {v.yesExamples?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-accent mb-2"><Check className="h-3.5 w-3.5" /> Yes</div>
                          <ul className="space-y-1">{v.yesExamples.map((y: string, j: number) => <li key={j} className="text-sm">• {y}</li>)}</ul>
                        </div>
                      )}
                      {v.noExamples?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2"><X className="h-3.5 w-3.5" /> No</div>
                          <ul className="space-y-1">{v.noExamples.map((n: string, j: number) => <li key={j} className="text-sm text-muted-foreground">• {n}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Competitive positioning */}
          {ef.competitivePositioning && (
            <Card className="p-7 border-border shadow-soft">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Competitive positioning</div>
              {ef.competitivePositioning.yourPosition && (
                <p className="font-display text-xl tracking-[-0.01em] mb-3">{ef.competitivePositioning.yourPosition}</p>
              )}
              {ef.competitivePositioning.marketGap && (
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{ef.competitivePositioning.marketGap}</p>
              )}

              {ef.competitivePositioning.differentiators?.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border mb-5">
                  <div className="grid grid-cols-3 bg-muted/60 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    <div>Factor</div><div>You</div><div>Competitors</div>
                  </div>
                  {ef.competitivePositioning.differentiators.map((d: any, i: number) => (
                    <div key={i} className="grid grid-cols-3 px-4 py-3 text-sm border-t border-border">
                      <div className="font-medium pr-3">{d.factor}</div>
                      <div className="text-foreground pr-3">{d.you}</div>
                      <div className="text-muted-foreground">{d.competitors}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ef.competitivePositioning.competitiveAdvantages?.length > 0 && (
                  <div className="p-4 rounded-lg bg-accent-soft/40">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-accent mb-2">Competitive advantages</div>
                    <ul className="space-y-1">{ef.competitivePositioning.competitiveAdvantages.map((a: string, i: number) => <li key={i} className="text-sm">• {a}</li>)}</ul>
                  </div>
                )}
                {ef.competitivePositioning.doNotCompeteOn?.length > 0 && (
                  <div className="p-4 rounded-lg bg-muted/60">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">What you don't compete on</div>
                    <ul className="space-y-1">{ef.competitivePositioning.doNotCompeteOn.map((a: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {a}</li>)}</ul>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Success + goal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 border-border shadow-soft">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Success looks like</div>
              <p>{strategy.success_definition}</p>
            </Card>
            <Card className="p-6 border-border shadow-soft">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Business goal</div>
              <p>{strategy.business_goal}</p>
            </Card>
          </div>
        </TabsContent>

        {/* VOICE & BRAND */}
        <TabsContent value="voice" className="space-y-6 mt-0">
          {/* Voice attributes */}
          <Card className="p-7 border-border shadow-soft">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Voice attributes</div>
            {ef.voiceGuidelines?.attributes?.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-border">
                {ef.voiceGuidelines.attributes.map((a: any, i: number) => (
                  <div key={i} className={`grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 px-4 py-4 ${i > 0 ? "border-t border-border" : ""}`}>
                    <div>
                      <Badge className="bg-accent-soft text-accent border-0 hover:bg-accent-soft font-medium">{a.trait}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">{a.meaning}</p>
                      {a.inPractice && <p className="text-sm text-muted-foreground mb-2">{a.inPractice}</p>}
                      {a.example && <p className="text-sm italic text-muted-foreground border-l-2 border-accent pl-3">{a.example}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(strategy.voice_attributes || []).map((v: string) => (
                  <Badge key={v} variant="secondary" className="bg-accent-soft text-accent border-0 hover:bg-accent-soft">{v}</Badge>
                ))}
              </div>
            )}
          </Card>

          {/* Sentence structure */}
          {ef.voiceGuidelines?.sentenceStructure && (
            <Card className="p-7 border-border shadow-soft">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Sentence structure</div>
              {ef.voiceGuidelines.sentenceStructure.rules?.length > 0 && (
                <ul className="space-y-2 mb-5">
                  {ef.voiceGuidelines.sentenceStructure.rules.map((r: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm"><Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span>{r}</span></li>
                  ))}
                </ul>
              )}
              {ef.voiceGuidelines.sentenceStructure.example && (
                <div className="rounded-lg bg-muted/60 p-5 border-l-4 border-accent">
                  <Quote className="h-4 w-4 text-accent mb-2" />
                  <p className="text-base leading-relaxed italic">"{ef.voiceGuidelines.sentenceStructure.example}"</p>
                </div>
              )}
            </Card>
          )}

          {/* Vocabulary */}
          {ef.voiceGuidelines?.vocabulary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 border-border shadow-soft">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-accent mb-3"><Check className="h-3.5 w-3.5" /> Words to use</div>
                <div className="flex flex-wrap gap-1.5">
                  {(ef.voiceGuidelines.vocabulary.use || []).map((w: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 text-sm rounded-md bg-accent-soft text-accent">{w}</span>
                  ))}
                </div>
              </Card>
              <Card className="p-6 border-border shadow-soft">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3"><X className="h-3.5 w-3.5" /> Words to avoid</div>
                <div className="flex flex-wrap gap-1.5">
                  {(ef.voiceGuidelines.vocabulary.avoid || []).map((w: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 text-sm rounded-md bg-muted text-muted-foreground line-through">{w}</span>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Tone by platform */}
          {ef.voiceGuidelines?.toneByPlatform && (
            <Card className="p-7 border-border shadow-soft">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Tone by platform</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["linkedin", "email", "podcast"] as const).map((p) => {
                  const t = ef.voiceGuidelines.toneByPlatform[p];
                  if (!t) return null;
                  return (
                    <div key={p} className="p-4 rounded-lg border border-border">
                      <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">{p}</div>
                      <p className="text-sm font-medium mb-1">{t.tone}</p>
                      {t.mode && <p className="text-xs text-muted-foreground mb-3">{t.mode}</p>}
                      {t.example && <p className="text-xs italic text-muted-foreground border-l-2 border-border pl-2">{t.example}</p>}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Voice examples */}
          {ef.voiceGuidelines?.voiceExamples && (
            <Card className="p-7 border-border shadow-soft">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-5">Voice examples</div>
              <div className="space-y-5">
                {[
                  ["Opening hook", ef.voiceGuidelines.voiceExamples.openingHook],
                  ["Teaching point", ef.voiceGuidelines.voiceExamples.teachingPoint],
                  ["Call to action", ef.voiceGuidelines.voiceExamples.callToAction],
                ].filter(([, ex]) => ex).map(([label, ex]: any) => (
                  <div key={label}>
                    <div className="text-xs uppercase tracking-[0.2em] font-medium mb-3">{label}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                      <div className="p-4 rounded-lg bg-accent-soft/40 border-l-4 border-accent">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-accent mb-2"><Check className="h-3 w-3" /> Good</div>
                        <p className="text-sm leading-relaxed">"{ex.good}"</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/60 border-l-4 border-muted-foreground/30">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2"><X className="h-3 w-3" /> Bad</div>
                        <p className="text-sm leading-relaxed text-muted-foreground line-through">"{ex.bad}"</p>
                      </div>
                    </div>
                    {ex.why && <p className="text-xs text-muted-foreground italic">{ex.why}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Never sound like */}
          <Card className="p-7 border-border shadow-soft">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Never sound like</div>
            {ef.voiceGuidelines?.neverSoundLike?.length > 0 ? (
              <div className="space-y-3">
                {ef.voiceGuidelines.neverSoundLike.map((n: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/40 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <X className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{n.style}</span>
                    </div>
                    <p className="text-sm italic text-muted-foreground line-through mb-1">"{n.example}"</p>
                    {n.why && <p className="text-xs text-muted-foreground">{n.why}</p>}
                  </div>
                ))}
              </div>
            ) : strategy.anti_positioning ? (
              <p className="text-sm text-muted-foreground italic">{strategy.anti_positioning}</p>
            ) : null}
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-0">{TAB_PLACEHOLDER("Content themes")}</TabsContent>
        <TabsContent value="channels" className="mt-0">{TAB_PLACEHOLDER("Channel strategy")}</TabsContent>
        <TabsContent value="metrics" className="mt-0">{TAB_PLACEHOLDER("Success metrics")}</TabsContent>
        <TabsContent value="action" className="mt-0">{TAB_PLACEHOLDER("Action plan")}</TabsContent>
      </Tabs>
    </div>
  );
}