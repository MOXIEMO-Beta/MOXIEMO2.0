// Shared derivation of the three enrichment sections (Positioning, Values, Tone)
// for the Brand Kit. Works structure-agnostically across:
//   1. New kit_json shape returned by generate-brand-kit (positioning/values/tone)
//   2. Older strategies.enhanced_foundation with actionPlan/positioningBreakdown keys
// The helper never fabricates: if data is genuinely missing, it returns nulls
// so callers can decide how to render (skip vs. render section shell).

export type PositioningEnrichment = {
  statement: string;
  who: string;
  problem: string;
  solution: string;
  result: string;
};

export type ValueEnrichment = { name: string; filter: string };

export type ToneEnrichment = {
  words_to_use: string[];
  words_to_avoid: string[];
  tone_by_platform: { platform: string; descriptor: string }[];
};

const stripDashes = (s: string) =>
  s.replace(/[\u2014\u2013]/g, ", ").replace(/\s+,/g, ",").replace(/\s+/g, " ").trim();

function clean(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return stripDashes(v);
  if (typeof v === "object") return stripDashes(String(v?.name ?? v?.text ?? v?.value ?? v?.label ?? ""));
  return "";
}

function arr(v: any): any[] {
  return Array.isArray(v) ? v : [];
}

function ef(strategyOrKit: any) {
  // Accept either a strategy row or a kit_json that may embed enhanced_foundation
  const s = strategyOrKit || {};
  const e = s.enhanced_foundation ?? s.enhancedFoundation ?? {};
  const ap = e.actionPlan ?? {};
  return { e, ap };
}

export function derivePositioning(kit: any, strategy: any): PositioningEnrichment | null {
  // Prefer explicitly generated kit.positioning
  const k = kit?.positioning ?? {};
  const { e, ap } = ef(strategy);
  const pb = e.positioningBreakdown ?? ap.positioningBreakdown ?? {};

  const statement = clean(
    k.statement ??
      strategy?.positioning_statement ??
      e.positioningStatement ??
      e.positioning?.statement ??
      "",
  );
  const who = clean(
    k.who ?? pb.idealClient ?? e.idealClient ?? strategy?.ideal_client ?? "",
  );
  const problem = clean(
    k.problem ?? pb.painPoint ?? e.painPoint ?? strategy?.pain_point ?? "",
  );
  const solution = clean(
    k.solution ??
      pb.uniqueApproach ??
      pb.method ??
      e.uniqueApproach ??
      strategy?.differentiation ??
      "",
  );
  const result = clean(
    k.result ??
      pb.outcome ??
      pb.transformation ??
      e.transformation ??
      strategy?.transformation ??
      "",
  );

  if (!statement && !who && !problem && !solution && !result) return null;
  return { statement, who, problem, solution, result };
}

export function deriveValues(kit: any, strategy: any): ValueEnrichment[] {
  const kitVals = arr(kit?.values).map((v: any) => ({
    name: clean(v?.name ?? v?.title ?? v),
    filter: clean(v?.filter ?? v?.decisionFilter ?? v?.decision_filter ?? ""),
  }));
  if (kitVals.some((v) => v.name)) return kitVals.filter((v) => v.name).slice(0, 6);

  const { e, ap } = ef(strategy);
  const source =
    arr(e.coreValues).length ? arr(e.coreValues) :
    arr(ap.coreValues).length ? arr(ap.coreValues) :
    arr(e.brandArchetype?.coreValues).length ? arr(e.brandArchetype?.coreValues) :
    [];
  return source
    .map((v: any) => ({
      name: clean(v?.name ?? v?.title ?? v),
      filter: clean(v?.decisionFilter ?? v?.filter ?? v?.decision_filter ?? ""),
    }))
    .filter((v) => v.name)
    .slice(0, 6);
}

export function deriveTone(kit: any, strategy: any): ToneEnrichment {
  const k = kit?.tone ?? {};
  const { e, ap } = ef(strategy);
  const vg = e.voiceGuidelines ?? ap.voiceGuidelines ?? {};
  const vocab = vg.vocabulary ?? {};

  const words_to_use = (
    arr(k.words_to_use).length ? arr(k.words_to_use) : arr(vocab.use)
  )
    .map(clean)
    .filter(Boolean)
    .slice(0, 12);
  const words_to_avoid = (
    arr(k.words_to_avoid).length ? arr(k.words_to_avoid) : arr(vocab.avoid)
  )
    .map(clean)
    .filter(Boolean)
    .slice(0, 12);

  let tone_by_platform: { platform: string; descriptor: string }[] = arr(k.tone_by_platform).map(
    (t: any) => ({ platform: clean(t?.platform), descriptor: clean(t?.descriptor ?? t?.tone) }),
  );
  if (!tone_by_platform.some((t) => t.descriptor)) {
    const tp = vg.toneByPlatform ?? {};
    const readOne = (v: any) =>
      typeof v === "string" ? clean(v) : clean(v?.tone ?? v?.mode ?? v?.descriptor ?? "");
    tone_by_platform = [
      { platform: "Email", descriptor: readOne(tp.email) },
      { platform: "LinkedIn", descriptor: readOne(tp.linkedin) },
      { platform: "Podcast", descriptor: readOne(tp.podcast) },
    ];
  }
  tone_by_platform = tone_by_platform.filter((t) => t.platform && t.descriptor);

  return { words_to_use, words_to_avoid, tone_by_platform };
}

export function deriveEnrichment(kit: any, strategy: any) {
  return {
    positioning: derivePositioning(kit, strategy),
    values: deriveValues(kit, strategy),
    tone: deriveTone(kit, strategy),
  };
}