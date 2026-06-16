export type Mark = "yes" | "no" | "partial" | "na";

export interface ComparisonRow {
  id: string;
  label: string;
  note?: string;
}

export interface ComparisonGroup {
  heading: "Discover" | "Create" | "Distribute" | "Grow" | "Plus";
  rows: ComparisonRow[];
}

export const comparisonGroups: ComparisonGroup[] = [
  {
    heading: "Discover",
    rows: [
      { id: "discovery", label: "Strategic brand discovery built in" },
      { id: "foundation", label: "Downloadable strategy foundation (positioning, ICP, voice)" },
      { id: "icp", label: "ICP and messaging framework" },
      { id: "pillars", label: "Content pillars and brand voice system" },
    ],
  },
  {
    heading: "Create",
    rows: [
      { id: "from-strategy", label: "Content generated from your strategy, not generic prompts" },
      { id: "voice", label: "Email and social content in your voice" },
    ],
  },
  {
    heading: "Distribute",
    rows: [
      { id: "planner", label: "Marketing planner and content calendar" },
      { id: "campaigns", label: "Campaign planning and themes" },
      { id: "publishing", label: "Social publishing (LinkedIn, Facebook, Instagram)" },
      { id: "platform-rules", label: "Platform-specific content rules" },
    ],
  },
  {
    heading: "Grow",
    rows: [
      { id: "performance", label: "Performance tied back to strategy" },
      {
        id: "autonomous",
        label: "Autonomous loop: drafts, schedules, and publishes on your strategy",
        note: "Beta 2.0",
      },
    ],
  },
  {
    heading: "Plus",
    rows: [
      { id: "founding", label: "Founding member pricing" },
      { id: "audience", label: "Built for founders and growing businesses" },
    ],
  },
];

export interface Competitor {
  slug: string;
  name: string;
  heroHeadline: string;
  heroSubhead: string;
  metaTitle: string;
  metaDescription: string;
  marks: Record<string, Mark>;
  moxiemoOverrides?: Record<string, Mark>;
  narrative: string[];
  verified: boolean;
}

const chatgpt: Competitor = {
  slug: "chatgpt",
  name: "ChatGPT",
  heroHeadline: "MOXIEMO vs ChatGPT: a growth system, not a blank prompt",
  heroSubhead:
    "ChatGPT generates content when you already know what to ask. MOXIEMO knows what to build, because it starts with your strategy and carries it through to published content.",
  metaTitle: "MOXIEMO vs ChatGPT, 2026 comparison",
  metaDescription:
    "A side by side look at MOXIEMO and ChatGPT. Strategy, content, distribution, and growth in one system versus a blank prompt.",
  marks: {
    discovery: "no",
    foundation: "no",
    icp: "no",
    pillars: "partial",
    "from-strategy": "no",
    voice: "partial",
    planner: "no",
    campaigns: "no",
    publishing: "no",
    "platform-rules": "no",
    performance: "no",
    autonomous: "no",
    founding: "na",
    audience: "no",
  },
  narrative: [
    "ChatGPT is a powerful writing assistant. It will draft almost anything you ask for. The catch is in those last three words. You have to know what to ask, every time, and the quality of what you get back depends entirely on the quality of your prompt and the context you remember to give it.",
    "MOXIEMO works the other way around. It starts with a structured discovery of your brand, your audience, and your positioning, and it holds that strategy as the foundation for everything it makes. You are not re-explaining who you are with every request. The system already knows.",
    "ChatGPT has no brand memory, no strategy layer, and no marketing calendar. It produces a paragraph, not a go-to-market. MOXIEMO produces the strategy, the content that carries it, the plan that distributes it, and the proof that it worked.",
    "If you want a faster way to write, ChatGPT is excellent. If you want a system that decides what to write, sounds like you, and runs your go-to-market, that is MOXIEMO.",
  ],
  verified: false,
};

function stub(
  slug: string,
  name: string,
  angle: string,
  metaTail: string,
): Competitor {
  return {
    slug,
    name,
    heroHeadline: `MOXIEMO vs ${name}: ${angle}`,
    heroSubhead: `A clear look at where ${name} ends and a complete go-to-market system begins.`,
    metaTitle: `MOXIEMO vs ${name}, 2026 comparison`,
    metaDescription: metaTail,
    marks: {
      discovery: "no",
      foundation: "no",
      icp: "no",
      pillars: "no",
      "from-strategy": "no",
      voice: "partial",
      planner: "no",
      campaigns: "no",
      publishing: "no",
      "platform-rules": "no",
      performance: "no",
      autonomous: "no",
      founding: "na",
      audience: "no",
    },
    narrative: [
      `Narrative for ${name} is in draft. The angle: ${angle}.`,
      "Verify features and pricing before publishing this comparison.",
    ],
    verified: false,
  };
}

export const competitors: Competitor[] = [
  stub(
    "averi",
    "Averi",
    "brand to go-to-market, not just content",
    "Averi focuses on content output. MOXIEMO builds the brand and the go-to-market system around it.",
  ),
  chatgpt,
  stub(
    "claude",
    "Claude",
    "a general AI assistant versus a purpose-built growth system",
    "Claude is a great general assistant. MOXIEMO is a purpose-built growth system with discovery, strategy output, and an execution layer.",
  ),
  stub(
    "jasper",
    "Jasper",
    "content production versus strategy-first execution",
    "Jasper is a content production tool for marketing teams. MOXIEMO is built for the founder or small team who needs strategy before execution.",
  ),
  stub(
    "blaze",
    "Blaze",
    "speed and volume versus strategy and brand integrity",
    "Blaze generates content fast. MOXIEMO generates content that sounds like you and ties back to a real strategy.",
  ),
  stub(
    "rella",
    "Rella",
    "a scheduler with light AI versus a system that starts with strategy",
    "Rella schedules. MOXIEMO starts with strategy, then writes, plans, and publishes from it.",
  ),
  stub(
    "gemini",
    "Gemini",
    "Google's general AI versus a brand-aware growth system",
    "Gemini is a general AI assistant. MOXIEMO adds a brand layer, a strategy foundation, and the marketing infrastructure around it.",
  ),
  stub(
    "canva",
    "Canva",
    "a design tool with AI writing versus a go-to-market system",
    "Canva is a design tool with AI writing features. MOXIEMO is a go-to-market system. Different category, different job.",
  ),
];

export const competitorMap: Record<string, Competitor> = Object.fromEntries(
  competitors.map((c) => [c.slug, c]),
);

export const competitorSlugs = competitors.map((c) => c.slug);