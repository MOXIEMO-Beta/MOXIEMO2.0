// ─── MAIN BUILDER ───────────────────────────────────────────────
export function buildReportData(strategy: any = {}, profile: any = {}) {
  const ef  = strategy.enhanced_foundation ?? {};
  const raw = strategy.raw_foundation      ?? {};
  const get = (efKey: string, rawKey: string, colVal: any, fallback = '—') =>
    ef[efKey] ?? raw[rawKey] ?? colVal ?? fallback;

  return {
    meta:            buildMeta(profile, strategy),
    positioning:     buildPositioning(strategy, ef, raw, get),
    archetype:       buildArchetype(strategy, ef, raw),
    voice:           buildVoice(strategy, ef, raw),
    contentStrategy: buildContentStrategy(strategy, ef, raw),
    calendar:        buildCalendar(strategy),
    channels:        buildChannels(strategy, ef, raw),
    metrics:         buildMetrics(strategy, ef, raw),
    actionPlan:      buildActionPlan(strategy, ef, raw),
  };
}

// ─── META ───────────────────────────────────────────────────────
function buildMeta(profile: any, strategy: any) {
  return {
    preparedFor:   profile?.full_name     ?? profile?.email ?? 'Founder',
    businessName:  profile?.business_name ?? profile?.full_name ?? 'Your Business',
    email:         profile?.email         ?? '',
    date:          formatDate(strategy.created_at ? new Date(strategy.created_at) : new Date()),
    reportTitle:   'Chief MOXIEMO Officer Strategic Report',
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

  return {
    statement,
    breakdown: {
      who:            get('idealClient',    'idealClient',    s.ideal_client),
      problem:        get('painPoint',      'painPoint',      s.pain_point),
      solution:       get('positioning',    'positioning',    s.positioning_statement?.slice(0, 80)),
      result:         get('transformation', 'transformation', s.transformation),
      method:         s.methodology ?? ef.methodology ?? raw.methodology ?? 'Your Proprietary Framework',
      transformation: buildTransformationArc(s),
    },
    variations: buildVariations(statement, s, ef),
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
  return `From '${from}' → '${to}'`;
}

function buildVariations(statement: string, s: any, ef: any) {
  const client = s.ideal_client  ?? ef.idealClient  ?? 'founders';
  const pain   = s.pain_point    ?? ef.painPoint    ?? 'unclear messaging';
  const goal   = s.business_goal ?? ef.businessGoal ?? 'their revenue goals';
  return {
    short:    `I help ${client} turn their expertise into a clear, revenue-driving personal brand.`,
    tweet:    `${capitalize(pain)} doesn't have to be your reality. I help ${client} find their message and show up with confidence.`,
    elevator: `You know how many ${client} have built great businesses but feel totally stuck on their personal brand? I help them find clarity — so they can achieve ${goal}.`,
  };
}

// ─── ARCHETYPE ──────────────────────────────────────────────────
function buildArchetype(s: any, ef: any, raw: any) {
  const a = s.archetype ?? ef.archetype ?? raw.archetype ?? {};
  return {
    primary:          a.primary          ?? 'The Sage',
    secondary:        a.secondary        ?? 'The Caregiver',
    description:      a.description      ?? 'Seeks truth and provides clarity. Uses expertise to guide others through confusion to energized execution.',
    brandInspiration: a.brandInspiration ?? ef.brandInspiration ?? ['Harvard Business Review', 'Simon Sinek', 'Masterclass'],
    values:           a.coreValues       ?? ef.coreValues       ?? ['Clarity', 'Authority', 'Humanity'],
    contentApproach:  a.contentApproach  ?? 'Framework-first teaching that breaks complex problems into simple, actionable paths.',
  };
}

// ─── VOICE ──────────────────────────────────────────────────────
function buildVoice(s: any, ef: any, raw: any) {
  const attrs    = coerceArray(s.voice_attributes ?? ef.personalityTraits ?? ['Authoritative', 'Empathetic', 'Direct']);
  const useWords = coerceArray(s.use_words        ?? ef.extractedVocabulary ?? ['Clarity', 'Relief', 'Framework', 'Path', 'Execution']);
  const avoid    = coerceStringOrArray(s.anti_positioning ?? ef.antiPositioning ?? 'synergy, holistic, leverage, ideation');

  return {
    attributes:     attrs,
    useWords,
    avoidWords:     avoid,
    exampleLine:    ef.voiceSampleQuote ?? raw.voiceSampleQuote ?? extractVoiceQuote(ef.voiceSample ?? raw.voiceSample),
    neverSoundLike: s.anti_positioning  ?? 'Corporate jargon and empty buzzwords.',
    toneByChannel: {
      email:    ef.emailTone    ?? 'Consultative',
      linkedin: ef.linkedinTone ?? 'Thought Leader',
      podcast:  ef.podcastTone  ?? 'Warm Educator',
    },
    sentenceRules: [
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

  const quarters = s.content_themes?.length
    ? s.content_themes
    : ef.contentThemes?.length
    ? buildQuartersFromThemes(ef.contentThemes, s)
    : buildDefaultQuarters(s);

  return {
    pillars,
    quarters,
    contentMix: buildContentMix(s),
  };
}

function buildDefaultQuarters(s: any) {
  const method = s.methodology ?? 'The Framework';
  return [
    { label: 'Q2 2026', theme: `${method}: Architecting Your Message`,  weeks: 12, arc: 'Problem → Solution → Authority',   color: '#ff6b6b', cta: 'Book a Discovery Call',          metric: s.success_definition ?? 'Qualified discovery calls' },
    { label: 'Q3 2026', theme: "The Confident Founder's Mindset",        weeks: 12, arc: 'Mindset → Confidence → Execution', color: '#f5a623', cta: 'Book a Clarity Call',            metric: 'Increase engagement rate by 20%' },
    { label: 'Q4 2026', theme: 'Building a Personal Brand That Sells',   weeks: 12, arc: 'Visibility → Leads → Revenue',     color: '#3cb87a', cta: 'Apply for Private Consultation', metric: 'Sign 3 new clients per month' },
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
    metric: typeof t === 'object' ? t.metric : s.success_definition ?? '—',
  }));
}

function buildContentMix(s: any) {
  return {
    primary:   { channel: s.primary_channel ?? 'LinkedIn', frequency: s.posting_frequency ?? '7 posts/week', sends: s.posting_frequency ?? '7/week' },
    secondary: { channel: 'Email',   frequency: '1x/week',  sends: '4/month' },
    tertiary:  { channel: 'Podcast', frequency: '1x/month', sends: '1/month' },
  };
}

// ─── CALENDAR ───────────────────────────────────────────────────
function buildCalendar(s: any) {
  if (Array.isArray(s.calendar_entries) && s.calendar_entries.length > 0) {
    return s.calendar_entries.map((e: any) => ({
      date:    e.date,
      dayName: e.dayName ?? getDayName(e.date),
      channel: e.channel    ?? s.primary_channel ?? 'LinkedIn',
      type:    e.contentType ?? e.type ?? 'Text Post',
      title:   e.topic      ?? e.title ?? '',
      pillar:  e.pillar      ?? '',
      status:  e.status      ?? 'pending',
    }));
  }
  return scaffoldCalendar(s);
}

function scaffoldCalendar(s: any) {
  const pillar  = coerceArray(s.content_pillars ?? [])[0] ?? s.methodology ?? 'Your Core Framework';
  const formats = ['Text Post', 'Carousel', 'Personal Story', 'Poll', 'Explainer', 'Case Study', 'Behind-the-Scenes', 'How-to Carousel'];
  const start   = new Date();
  const entries: any[] = [];

  for (let i = 0; entries.length < 22; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d.getDay() === 0) continue;
    entries.push({
      date:    d.toISOString().split('T')[0],
      dayName: getDayName(d),
      channel: s.primary_channel ?? 'LinkedIn',
      type:    formats[entries.length % formats.length],
      title:   `${pillar} — Post ${entries.length + 1}`,
      pillar,
      status:  'pending',
    });
  }
  return entries;
}

// ─── CHANNELS ───────────────────────────────────────────────────
function buildChannels(s: any, ef: any, raw: any) {
  const ch     = s.primary_channel   ?? ef.primaryChannel   ?? 'LinkedIn';
  const freq   = s.posting_frequency ?? ef.postingFrequency ?? '7 posts/week';
  const hrs    = deriveHours(s.time_capacity);
  const metric = s.success_definition ?? ef.successDefinition ?? '3–4 qualified calls/week';

  return {
    primary: {
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
    tertiary: {
      name: 'Podcast', label: 'Tertiary', color: '#a855f7', icon: '🎙',
      freq: '1x/month', hrs: '3 hrs/month',
      cta: 'Apply for Consultation',
      bullets: ['Guest appearances only', 'B2B Founder-focused shows', `Topic: ${s.methodology ?? 'Your Framework'}`, '1–2 discovery calls/appearance'],
      metrics: { appearances: '1/month', callsAttributed: '1–2/month', goal: 'Authority + reach' },
    },
  };
}

// ─── METRICS ────────────────────────────────────────────────────
function buildMetrics(s: any, ef: any, raw: any) {
  const bh = s.brand_health ?? ef.brandHealth ?? {};
  return {
    northStar: s.success_definition ?? ef.successDefinition ?? 'Qualified discovery calls',
    businessGoals: [
      { label: 'Monthly Revenue',        value: ef.revenueTarget ? `$${(ef.revenueTarget / 1000).toFixed(0)}k` : extractRevenue(s.business_goal) },
      { label: 'New Clients / Month',    value: ef.clientTarget  ?? '3'   },
      { label: 'Discovery Calls / Week', value: ef.callsPerWeek  ?? '3–4' },
      { label: 'Podcast Appearances',    value: '1 / month'               },
    ],
    linkedin: { profileViews: '+15% MoM', engagementRate: '>3%', posts: s.posting_frequency ?? '7/week', dms: '10–15 ICP/week' },
    email:    { openRate: '>40%', clickRate: '>5%', sends: '4/month' },
    brandHealth: {
      archetypeAlignment: bh.archetypeAlignment ?? s.strength_score ?? 7.5,
      voiceConsistency:   bh.voiceConsistency   ?? 8.0,
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

function deriveHours(timeCapStr: string | null) {
  if (!timeCapStr) return 10;
  const n = parseFloat(timeCapStr);
  return isNaN(n) ? 10 : n;
}

function extractRevenue(goalStr: string | null) {
  if (!goalStr) return '$50k';
  const m = goalStr.match(/\$[\d,]+k?|\d+[kK]/);
  return m ? m[0] : '$50k';
}