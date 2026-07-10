// ─── MAIN BUILDER ───────────────────────────────────────────────
export function buildReportData(strategy: any = {}, profile: any = {}) {
  const ef  = strategy.enhanced_foundation ?? {};
  const raw = strategy.raw_foundation      ?? {};
  const get = (efKey: string, rawKey: string, colVal: any, fallback = '—') =>
    ef[efKey] ?? raw[rawKey] ?? colVal ?? fallback;

  const data = {
    meta:            buildMeta(profile, strategy),
    positioning:     buildPositioning(strategy, ef, raw, get),
    archetype:       buildArchetype(strategy, ef, raw),
    coreValues:      buildCoreValues(strategy, ef),
    voice:           buildVoice(strategy, ef, raw),
    contentStrategy: buildContentStrategy(strategy, ef, raw),
    calendar:        buildCalendar(strategy),
    channels:        buildChannels(strategy, ef, raw),
    metrics:         buildMetrics(strategy, ef, raw),
    actionPlan:      buildActionPlan(strategy, ef, raw),
    competitive:     buildCompetitive(strategy, ef),
    messagingFormats: buildMessagingFormats(strategy, ef),
  };
  // eslint-disable-next-line no-console
  try { console.log('[reportData]', data, '[raw strategy]', strategy); } catch {}
  return data;
}

// ─── META ───────────────────────────────────────────────────────
function buildMeta(profile: any, strategy: any) {
  const businessName = profile?.business_name ?? profile?.full_name ?? "Your Business";
  return {
    preparedFor:   profile?.full_name     ?? profile?.email ?? 'Founder',
    businessName,
    email:         profile?.email         ?? '',
    date:          formatDate(strategy.created_at ? new Date(strategy.created_at) : new Date()),
    reportTitle:   `${businessName} Strategic Report`,
    confidential:  true,
    strengthScore: strategy.strength_score ?? null,
  };
}

// ─── POSITIONING ────────────────────────────────────────────────
function buildPositioning(s: any, ef: any, raw: any, get: Function) {
  const statement =
    s.positioning_statement ??
    ef.positioningStatement ??
    raw.positioningStatement ??
    buildPositioningTemplate(s);

  const pb = ef.positioningBreakdown ?? {};
  return {
    statement,
    breakdown: {
      who:            pb.idealClient    ?? ef.idealClient    ?? raw.idealClient    ?? s.ideal_client ?? '—',
      problem:        pb.painPoint      ?? ef.painPoint      ?? raw.painPoint      ?? s.pain_point ?? '—',
      solution:       pb.uniqueApproach ?? ef.uniqueApproach ?? raw.uniqueApproach ?? s.positioning_statement ?? '—',
      result:         pb.outcome        ?? pb.transformation ?? ef.transformation  ?? s.transformation ?? '—',
      method:         pb.method         ?? s.methodology     ?? ef.methodology     ?? raw.methodology ?? '—',
      transformation: pb.transformation ?? buildTransformationArc(s),
    },
    variations: ef.positioningVariations ?? buildVariations(statement, s, ef),
  };
}

function buildPositioningTemplate(s: any) {
  const client = s.ideal_client   ?? 'your ideal clients';
  const pain   = s.pain_point     ?? 'their core challenge';
  const result = s.transformation ?? 'lasting results';
  const method = s.methodology    ?? 'your proprietary framework';
  return `I help ${client} overcome ${pain} through ${method} so they can achieve ${result}.`;
}

function buildTransformationArc(s: any) {
  const from = s.pain_point     ?? 'unclear and overwhelmed';
  const to   = s.transformation ?? 'clear, energized, and revenue-ready';
  return `From '${from}' to '${to}'`;
}

function buildVariations(statement: string, s: any, ef: any) {
  const client = s.ideal_client  ?? ef.idealClient  ?? 'founders';
  const pain   = s.pain_point    ?? ef.painPoint    ?? 'unclear messaging';
  const goal   = s.business_goal ?? ef.businessGoal ?? 'their revenue goals';
  return {
    short:    `I help ${client} turn their expertise into a clear, revenue-driving personal brand.`,
    tweet:    `${capitalize(pain)} doesn't have to be your reality. I help ${client} find their message and show up with confidence.`,
    elevator: `You know how many ${client} have built great businesses but feel totally stuck on their personal brand? I help them find clarity, so they can achieve ${goal}.`,
  };
}

// ─── ARCHETYPE ──────────────────────────────────────────────────
function buildArchetype(s: any, ef: any, raw: any) {
  const a = ef.brandArchetype ?? s.archetype ?? ef.archetype ?? raw.archetype ?? {};
  const cap = (x: any) => {
    if (!x || typeof x !== 'string') return x;
    if (/\s/.test(x)) return x; // already formatted
    return 'The ' + x.charAt(0).toUpperCase() + x.slice(1).toLowerCase();
  };
  const fmtArchetype = (x: any) => {
    if (!x) return '';
    if (typeof x !== 'string') return safeName(x);
    // Preserve already-formatted like "The Sage", "RULER"
    if (x === x.toUpperCase() && x.length <= 12) return x;
    if (x.toLowerCase().startsWith('the ')) return x;
    return cap(x);
  };
  return {
    primary:          fmtArchetype(a.name ?? a.primary) || 'The Sage',
    secondary:        fmtArchetype(a.secondary) || '',
    description:      a.description      ?? '',
    brandInspiration: a.exampleBrands    ?? a.brandInspiration ?? ef.brandInspiration ?? [],
    values:           a.coreValues       ?? ef.archetypeValues ?? [],
    contentApproach:  a.contentApproach  ?? '',
    whyThisFits:      a.whyThisFits      ?? [],
    howToApply:       a.howToApply       ?? [],
    strengths:        a.strengths        ?? [],
    pitfalls:         a.pitfalls         ?? [],
    voiceAttributes:  a.voiceAttributes  ?? [],
  };
}

function safeName(x: any): string {
  if (!x) return '';
  if (typeof x === 'string') return x;
  return x.name ?? x.title ?? x.label ?? '';
}

// ─── CORE VALUES ────────────────────────────────────────────────
function buildCoreValues(s: any, ef: any) {
  const arr = ef.coreValues ?? s.core_values ?? [];
  if (!Array.isArray(arr)) return [];
  return arr.map((v: any) => ({
    name:           v?.name ?? v?.title ?? '',
    decisionFilter: v?.decisionFilter ?? v?.filter ?? '',
    description:    v?.description ?? '',
    derivedFrom:    v?.derivedFrom ?? '',
    yesExamples:    Array.isArray(v?.yesExamples) ? v.yesExamples : [],
    noExamples:     Array.isArray(v?.noExamples)  ? v.noExamples  : [],
  }));
}

// ─── VOICE ──────────────────────────────────────────────────────
function buildVoice(s: any, ef: any, raw: any) {
  const toStr = (w: any): string =>
    typeof w === 'string'
      ? w
      : (w?.name ?? w?.word ?? w?.text ?? w?.value ?? w?.label ?? '');
  const vg = ef.voiceGuidelines ?? {};
  const attrsRich: any[] = Array.isArray(vg.attributes) ? vg.attributes : [];
  const attrs    = attrsRich.length
    ? attrsRich.map((a: any) => a?.trait ?? a?.name ?? '').filter(Boolean)
    : coerceArray(s.voice_attributes ?? ef.personalityTraits ?? []).map(toStr).filter(Boolean);
  const useWords = (vg.vocabulary?.use   ?? coerceArray(s.use_words ?? ef.extractedVocabulary ?? [])).map(toStr).filter(Boolean);
  const avoid    = (vg.vocabulary?.avoid ?? coerceStringOrArray(s.anti_positioning ?? ef.antiPositioning ?? '')).map(toStr).filter(Boolean);
  const tonePlatform = vg.toneByPlatform ?? {};
  const tone: Record<string, string> = {};
  Object.entries(tonePlatform).forEach(([k, v]: [string, any]) => {
    tone[k] = typeof v === 'string' ? v : (v?.tone ?? v?.mode ?? '');
  });

  return {
    attributes:     attrs,
    attributesRich: attrsRich,
    useWords,
    wordsToUse:     useWords,
    avoidWords:     avoid,
    wordsToAvoid:   avoid,
    exampleLine:    vg.sentenceStructure?.example ?? ef.voiceSampleQuote ?? raw.voiceSampleQuote ?? extractVoiceQuote(ef.voiceSample ?? raw.voiceSample),
    fullExample:    vg.sentenceStructure?.example ?? '',
    sentenceStructure: vg.sentenceStructure?.rules ?? [],
    neverSoundLike: s.anti_positioning  ?? 'Corporate jargon and empty buzzwords.',
    neverSoundLikeRich: Array.isArray(vg.neverSoundLike) ? vg.neverSoundLike : [],
    toneByChannel:  Object.keys(tone).length ? tone : { email: 'Consultative', linkedin: 'Thought Leader', podcast: 'Warm Educator' },
    toneByPlatform: tonePlatform,
    voiceExamples:  vg.voiceExamples ?? {},
    sentenceRules:  vg.sentenceStructure?.rules ?? [
      'Start with a punchy observation.',
      'Use the Rule of Three for emphasis.',
      'Keep sentences short and rhythmic.',
    ],
  };
}

function extractVoiceQuote(sample: string | undefined) {
  if (!sample) return "You've built the business. You've proven the model. Now let's build the bridge to your audience.";
  const sentences = sample.match(/[^.!?]+[.!?]+/g) ?? [];
  return sentences.slice(0, 2).join(' ').trim() || sample.slice(0, 140);
}

// ─── CONTENT STRATEGY ───────────────────────────────────────────
function buildContentStrategy(s: any, ef: any, raw: any) {
  const pillars = coerceArray(
    s.content_pillars ?? ef.contentThemes ?? [
      s.methodology ?? 'Your Core Framework',
      'Founder Mindset',
      'Personal Brand for Revenue',
    ]
  );

  let quarters: any[];
  if (Array.isArray(ef.quarterlyThemes) && ef.quarterlyThemes.length) {
    quarters = ef.quarterlyThemes.map((q: any) => ({
      label: q.quarter ?? q.label ?? '',
      theme: q.theme ?? '',
      arc:   q.overview ?? q.arc ?? '',
      rationale:  q.strategicRationale ?? '',
      cta:        q.cta ?? '',
      metric:     q.successMetric ?? '',
      businessGoal: q.businessGoal ?? '',
      contentTopics: Array.isArray(q.contentTopics) ? q.contentTopics : [],
    }));
  } else if (s.content_themes?.length) {
    quarters = s.content_themes;
  } else if (ef.contentThemes?.length) {
    quarters = buildQuartersFromThemes(ef.contentThemes, s);
  } else {
    quarters = buildDefaultQuarters(s);
  }

  return {
    pillars,
    quarters,
    contentMix: buildContentMix(s),
  };
}

function buildDefaultQuarters(s: any) {
  const method = s.methodology ?? 'The Framework';
  return [
    { label: 'Q2 2026', theme: `${method}: Architecting Your Message`,  weeks: 12, arc: 'Problem, solution, authority',   color: '#ff6b6b', cta: 'Book a Discovery Call',          metric: s.success_definition ?? 'Qualified discovery calls' },
    { label: 'Q3 2026', theme: "The Confident Founder's Mindset",        weeks: 12, arc: 'Mindset, confidence, execution', color: '#f5a623', cta: 'Book a Clarity Call',            metric: 'Increase engagement rate by 20%' },
    { label: 'Q4 2026', theme: 'Building a Personal Brand That Sells',   weeks: 12, arc: 'Visibility, leads, revenue',     color: '#3cb87a', cta: 'Apply for Private Consultation', metric: 'Sign 3 new clients per month' },
  ];
}

function buildQuartersFromThemes(themes: any[], s: any) {
  const colors = ['#ff6b6b', '#f5a623', '#3cb87a', '#3b82f6'];
  return themes.slice(0, 4).map((t: any, i: number) => ({
    label:  `Q${i + 2} 2026`,
    theme:  typeof t === 'string' ? t : t.name,
    weeks:  12,
    arc:    typeof t === 'object' ? t.arc   : '',
    color:  colors[i],
    cta:    typeof t === 'object' ? t.cta   : 'Book a Discovery Call',
    metric: typeof t === 'object' ? t.metric : s.success_definition ?? '',
  }));
}

function buildContentMix(s: any) {
  return {
    primary:   { channel: s.primary_channel ?? 'LinkedIn', frequency: s.posting_frequency ?? '7 posts/week', sends: s.posting_frequency ?? '7/week' },
    secondary: { channel: 'Email',   frequency: '1x/week',  sends: '4/month' },
    tertiary:  { channel: 'Podcast', frequency: '1x/month', sends: '1/month' },
  };
}

// ─── COMPETITIVE ────────────────────────────────────────────────
function buildCompetitive(s: any, ef: any) {
  const cp = ef.competitivePositioning ?? {};
  return {
    headline:              cp.yourPosition ?? '',
    landscape:             cp.marketGap ?? '',
    differentiators:       Array.isArray(cp.differentiators) ? cp.differentiators : [],
    competitiveAdvantages: Array.isArray(cp.competitiveAdvantages) ? cp.competitiveAdvantages : [],
    doNotCompeteOn:        Array.isArray(cp.doNotCompeteOn) ? cp.doNotCompeteOn : [],
    antiClient:            ef.antiClient ?? '',
    alternatives:          ef.alternatives ?? '',
    whyYouWin:             ef.whyYouWin ?? '',
  };
}

// ─── MESSAGING FORMATS ──────────────────────────────────────────
function buildMessagingFormats(s: any, ef: any) {
  const pv = ef.positioningVariations ?? {};
  const mv = ef.messagingVariations ?? {};
  return {
    oneLiner:  mv.oneLiner  ?? pv.short    ?? '',
    short:     mv.short     ?? pv.tweet    ?? '',
    elevator:  mv.elevator  ?? pv.elevator ?? '',
  };
}

// ─── CALENDAR ───────────────────────────────────────────────────
function buildCalendar(s: any) {
  // Prefer the richer/longer source so we surface all 30 days when available.
  const a: any[] = Array.isArray(s.calendar_entries) ? s.calendar_entries : [];
  const b: any[] = Array.isArray(s.enhanced_foundation?.contentCalendar) ? s.enhanced_foundation.contentCalendar : [];
  const src: any[] | undefined = (b.length >= a.length ? b : a).length > 0
    ? (b.length >= a.length ? b : a)
    : undefined;
  if (src) {
    return src.map((e: any) => ({
      date:    e.date,
      dayName: e.dayName ?? e.day ?? getDayName(e.date),
      // Guard: render the calendar Channel cell verbatim from the stored
      // channel/platform value. Never compose or clip; the strategy view and
      // its PDF must show the full channelPlan channel name as authored.
      channel: pickString(e.channel, e.platform, s.primary_channel) ?? 'LinkedIn',
      type:    e.contentType ?? e.type ?? 'Text Post',
      title:   pickString(e.title, e.topic, e.name, e.text) ?? '',
      pillar:  e.pillar ?? e.theme ?? '',
      theme:   e.theme ?? '',
      week:    e.week ?? '',
      length:  e.estimatedLength ?? '',
      status:  e.status      ?? 'pending',
    }));
  }
  return scaffoldCalendar(s);
}

function scaffoldCalendar(s: any) {
  const firstPillar = coerceArray(s.content_pillars ?? [])[0];
  const pillar: string =
    (typeof firstPillar === 'string'
      ? firstPillar
      : firstPillar?.name ?? firstPillar?.title ?? firstPillar?.text ?? null) ??
    s.methodology ??
    'Your Core Framework';
  const ch = shortChannel(s.primary_channel) ?? 'LinkedIn';
  const formats = ['Text Post', 'Carousel', 'Personal Story', 'Poll', 'Explainer', 'Case Study', 'Behind-the-Scenes', 'How-to Carousel'];
  const start   = new Date();
  const entries: any[] = [];

  for (let i = 0; entries.length < 18; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d.getDay() === 0) continue;
    entries.push({
      date:    d.toISOString().split('T')[0],
      dayName: getDayName(d),
      channel: ch,
      type:    formats[entries.length % formats.length],
      title:   `${pillar}, post ${entries.length + 1}`,
      pillar,
      status:  'pending',
    });
  }
  return entries;
}

// ─── CHANNELS ───────────────────────────────────────────────────
function buildChannels(s: any, ef: any, raw: any) {
  const cs = ef.channelStrategy ?? {};
  const hrs    = deriveHours(s.time_capacity);
  const buildTier = (tier: any, fallback: any) => {
    if (!tier) return fallback;
    const ts = tier.contentStrategy ?? {};
    const ps = Array.isArray(tier.postingSchedule) ? tier.postingSchedule : [];
    const sm = tier.successMetrics ?? {};
    const ta = tier.timeAllocation ?? {};
    return {
      name:          shortChannel(tier.platform) ?? safeName(tier.platform) ?? fallback.name,
      fullName:      tier.platform ?? fallback.name,
      label:         fallback.label,
      color:         fallback.color,
      icon:          fallback.icon,
      freq:          ts.frequency ?? fallback.freq,
      hrs:           ta.total ?? fallback.hrs,
      cta:           fallback.cta,
      rationale:     Array.isArray(tier.rationale) ? tier.rationale : [],
      tone:          ts.tone ?? '',
      contentTypes:  Array.isArray(ts.types) ? ts.types : [],
      schedule:      ps,
      bullets:       Array.isArray(ts.types) && ts.types.length ? ts.types : fallback.bullets,
      metrics:       sm,
      timeBreakdown: ta.breakdown ?? {},
    };
  };
  const ch     = shortChannel(cs.primary?.platform ?? s.primary_channel ?? ef.primaryChannel) ?? 'LinkedIn';
  const freq   = cs.primary?.contentStrategy?.frequency ?? s.posting_frequency ?? ef.postingFrequency ?? '7 posts/week';
  const metric = s.success_definition ?? ef.successDefinition ?? '3–4 qualified calls/week';

  const defaults = {
    primary:   {
      name: ch, label: 'Primary', color: '#ff6b6b', icon: '💼',
      freq, hrs: `${Math.round(hrs * 0.65)} hrs/week`,
      cta: 'Book a Discovery Call',
      bullets: [`${freq} — all content formats`, 'Mon–Fri: Framework & Education', 'Sat–Sun: Mindset & Reflection', 'Posting window: 8–11 AM local'],
      metrics: { profileViews: '+15% MoM', engagementRate: '>3%', postsPerWeek: freq, discoveryCalls: metric },
    },
    secondary: {
      name: 'Email', label: 'Secondary', color: '#3b82f6', icon: '✉️',
      freq: '1x/week', hrs: `${Math.round(hrs * 0.15)} hrs/week`,
      cta: 'Book a Discovery Call',
      bullets: ['Weekly Wisdom Newsletter', 'Every Tuesday 7:00 AM EST', 'Deeper dive on primary channel topic', 'Open rate target: >40%'],
      metrics: { openRate: '>40%', clickRate: '>5%', sendsPerMonth: '4', goal: 'Discovery calls' },
    },
    tertiary:  {
      name: 'Podcast', label: 'Tertiary', color: '#a855f7', icon: '🎙',
      freq: '1x/month', hrs: '3 hrs/month',
      cta: 'Apply for Consultation',
      bullets: ['Guest appearances only', 'B2B Founder-focused shows', `Topic: ${s.methodology ?? 'Your Framework'}`, '1–2 discovery calls/appearance'],
      metrics: { appearances: '1/month', callsAttributed: '1–2/month', goal: 'Authority + reach' },
    },
  };
  return {
    primary:   buildTier(cs.primary,   defaults.primary),
    secondary: buildTier(cs.secondary, defaults.secondary),
    tertiary:  buildTier(cs.tertiary,  defaults.tertiary),
  };
}

// ─── METRICS ────────────────────────────────────────────────────
function buildMetrics(s: any, ef: any, raw: any) {
  const sm = ef.successMetrics ?? {};
  const bh = sm.brandHealth ?? s.brand_health ?? ef.brandHealth ?? {};
  const bg = sm.businessGoals ?? {};
  const cp = sm.contentPerformance ?? {};
  const prim = sm.primary ?? {};
  // Revenue: parse from goals & detect cadence (monthly vs annual)
  const revenueSrc: string = String(bg.revenueGrowth ?? bg.scalingPlan ?? s.business_goal ?? '');
  const isAnnual = /\b(arr|annual|annually|year|yearly|\/yr|per\s*year)\b/i.test(revenueSrc);
  const revenueValue =
    extractRevenue(revenueSrc) ||
    (ef.revenueTarget ? `$${(ef.revenueTarget / 1000).toFixed(0)}K` : '$50K');
  const revenueLabel = isAnnual ? 'Annual Revenue' : 'Monthly Revenue';
  const revenueDisplay = isAnnual ? revenueValue : `${revenueValue}/mo`;
  const callsWeekly = prim.target?.weekly ?? ef.callsPerWeek ?? '3–4';
  const clientTarget = (bg.scalingPlan?.match(/(\d+)\s*(?:new\s*)?clients?\s*per\s*month/i)?.[1]) ?? ef.clientTarget ?? '3';
  return {
    northStar: prim.name ?? s.success_definition ?? ef.successDefinition ?? 'Qualified discovery calls',
    primaryMetric: prim,
    leadSources: Array.isArray(prim.leadSources) ? prim.leadSources : [],
    qualification: prim.qualification ?? {},
    contentPerformance: cp,
    businessGoals: [
      { label: revenueLabel,             value: revenueDisplay },
      { label: 'New Clients / Month',    value: String(clientTarget) },
      { label: 'Discovery Calls / Week', value: String(callsWeekly) },
      { label: 'Podcast Appearances',    value: '1 / month' },
    ],
    linkedin: cp.linkedin ?? { profileViews: '+15% MoM', engagementRate: '>3%', posts: s.posting_frequency ?? '7/week', dms: '10–15 ICP/week' },
    email:    cp.email    ?? { openRate: '>40%', clickRate: '>5%', sends: '4/month' },
    scalingPlan: bg.scalingPlan ?? '',
    revenueGrowth: bg.revenueGrowth ?? '',
    brandHealth: {
      archetypeAlignment: bh.archetypeAlignment ?? s.strength_score ?? 7.5,
      voiceConsistency:   bh.voiceConsistency ?? bh.voiceConsistencyScore ?? 8.0,
      notes:              bh.notes ?? '',
      archetypeGoal:      9.0,
      voiceGoal:          9.5,
    },
    strengthScore: s.strength_score            ?? null,
    strongAreas:   coerceArray(s.strong_areas  ?? []),
    weakAreas:     coerceArray(s.weak_areas    ?? []),
  };
}

// ─── ACTION PLAN ────────────────────────────────────────────────
function buildActionPlan(s: any, ef: any, raw: any) {
  const method = s.methodology     ?? ef.methodology     ?? 'Your Framework';
  const ch     = s.primary_channel ?? ef.primaryChannel  ?? 'LinkedIn';
  const apEf = ef.actionPlan ?? {};
  const efRoutine = apEf.ongoingRoutine ?? {};

  if (apEf.week1 || apEf.week2 || apEf.week3 || apEf.week4) {
    const weeks = [
      { week: 'Week 1', color: '#ff6b6b', theme: 'Set the Foundation', tasks: [apEf.week1].filter(Boolean) },
      { week: 'Week 2', color: '#f59e0b', theme: 'Launch',              tasks: [apEf.week2].filter(Boolean) },
      { week: 'Week 3', color: '#3b82f6', theme: 'Activate Engagement', tasks: [apEf.week3].filter(Boolean) },
      { week: 'Week 4', color: '#3cb87a', theme: 'Optimize',            tasks: [apEf.week4].filter(Boolean) },
    ];
    const wrapTier = (t: any) => {
      if (!t) return null;
      if (Array.isArray(t)) return { tasks: t };
      // Object { task, time }
      if (t.task) return { tasks: [[t.task, t.time].filter(Boolean)], hrs: t.time };
      return { tasks: [] };
    };
    return {
      weeks,
      ongoingRoutine: {
        daily:   wrapTier(efRoutine.daily)   ?? { hrs: '1 hr', tasks: [] },
        weekly:  wrapTier(efRoutine.weekly)  ?? { hrs: '6 hrs', tasks: [] },
        monthly: wrapTier(efRoutine.monthly) ?? { hrs: '4.5 hrs', tasks: [] },
        total:   efRoutine.totalTimePerWeek ?? `${deriveHours(s.time_capacity) + 2}–${deriveHours(s.time_capacity) + 4} hrs / week`,
      },
    };
  }

  return {
    weeks: [
      { week: 'Week 1', color: '#ff6b6b', theme: 'Set the Foundation',
        tasks: [`Optimize ${ch} profile with new positioning statement`, `Write and schedule first 7 posts (${method} intro)`, 'Send welcome newsletter to existing list', 'Research 5 target podcasts to pitch'] },
      { week: 'Week 2', color: '#f59e0b', theme: 'Build Momentum',
        tasks: ['Start daily 30-min proactive engagement', 'Batch-write Week 3 content', 'Send weekly newsletter — deeper dive', 'Send 3 podcast pitch emails'] },
      { week: 'Week 3', color: '#3b82f6', theme: 'Activate Outreach',
        tasks: ['Begin DM nurturing with warm connections', 'Review Week 1–2 metrics', 'Batch-write Week 4 content', 'Book first podcast recording'] },
      { week: 'Week 4', color: '#3cb87a', theme: 'Review & Optimize',
        tasks: ['Conduct full Week 1–4 performance review', 'Adjust messaging based on top-performing posts', 'Plan next month content calendar', 'Appear on first podcast'] },
    ],
    ongoingRoutine: {
      daily:   { hrs: '1 hr',    tasks: [['Proactive engagement (comments)', '30 min'], ['DM nurturing & outreach', '30 min']] },
      weekly:  { hrs: '6 hrs',   tasks: [['Batch-create 7 posts', '4 hrs'], ['Write & schedule newsletter', '1.5 hrs'], ['Review success metrics', '30 min']] },
      monthly: { hrs: '4.5 hrs', tasks: [['Content performance review', '2 hrs'], ['Research & pitch 5 podcasts', '1.5 hrs'], ['Podcast appearance', '1 hr']] },
      total:   `${deriveHours(s.time_capacity) + 2}–${deriveHours(s.time_capacity) + 4} hrs / week`,
    },
  };
}

// ─── HELPERS ────────────────────────────────────────────────────
function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getDayName(d: any) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
}

function capitalize(str: string) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function coerceArray(val: any): any[] {
  if (Array.isArray(val))      return val;
  if (typeof val === 'string') return val.split(',').map((s: string) => s.trim()).filter(Boolean);
  return [];
}

function coerceStringOrArray(val: any): string[] {
  if (Array.isArray(val))      return val;
  if (typeof val === 'string') return val.split(/[,;\/]/).map((s: string) => s.trim()).filter(Boolean);
  return [];
}

function pickString(...vals: any[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v;
    if (v && typeof v === 'object') {
      const s = v.name ?? v.title ?? v.text ?? v.topic ?? v.value;
      if (typeof s === 'string' && s.trim()) return s;
    }
  }
  return undefined;
}

/** Extract a short, single channel name from a possibly long strategy paragraph. */
function shortChannel(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val !== 'string') {
    const s = val?.name ?? val?.title ?? val?.channel;
    return typeof s === 'string' ? shortChannel(s) : undefined;
  }
  // Split on punctuation AND parentheses so "LinkedIn (proven conversion channel)" → "LinkedIn".
  const firstSeg = val.split(/[,;\/\n\-\u2014\u2013:\u2022|()]/)[0]?.trim() ?? '';
  if (!firstSeg) return undefined;
  const words = firstSeg.split(/\s+/).slice(0, 3).join(' ');
  return words.length > 28 ? words.slice(0, 28).trim() : words;
}

function deriveHours(timeCapStr: string | null) {
  if (!timeCapStr) return 10;
  const n = parseFloat(timeCapStr);
  return isNaN(n) ? 10 : n;
}

function extractRevenue(goalStr: string | null) {
  if (!goalStr) return '';
  // Match $50k, $50K, $300k, $50,000, 50k, $50 — preserve k/K suffix
  const m = goalStr.match(/\$?\d{1,3}(?:,\d{3})+(?:\.\d+)?[kKmM]?|\$?\d+(?:\.\d+)?[kKmM]/);
  if (!m) {
    const m2 = goalStr.match(/\$?\d+(?:\.\d+)?/);
    if (!m2) return '';
    const raw = m2[0].replace(/^\$/, '');
    const n = Number(raw);
    return isFinite(n) ? '$' + n.toLocaleString('en-US') : '$' + raw;
  }
  let v = m[0];
  if (!v.startsWith('$')) v = '$' + v;
  // Normalize suffix casing: $10k → $10K, $1m → $1M
  v = v.replace(/k$/, 'K').replace(/m$/, 'M');
  return v;
}