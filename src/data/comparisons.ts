export type CellValue = "yes" | "no" | "partial" | string;

export interface Row {
  group: "Discover" | "Define" | "Prioritize" | "Execute" | "Measure and adapt" | "Plus";
  id: string;
  label: string;
}

export const ROWS: Row[] = [
  { group: "Discover", id: "discovery", label: "Strategic brand discovery built in" },
  { group: "Define", id: "strategyPdf", label: "Downloadable strategy foundation" },
  { group: "Define", id: "icp", label: "ICP and messaging framework" },
  { group: "Define", id: "pillars", label: "Content pillars and brand voice system" },
  { group: "Prioritize", id: "planner", label: "Marketing planner and content calendar" },
  { group: "Prioritize", id: "campaigns", label: "Campaign planning and themes" },
  { group: "Execute", id: "contentFromStrategy", label: "Content generated from your strategy" },
  { group: "Execute", id: "emailSocial", label: "Email and social content in your voice" },
  { group: "Execute", id: "publishing", label: "Social publishing" },
  { group: "Execute", id: "platformRules", label: "Platform-specific content rules" },
  { group: "Measure and adapt", id: "performance", label: "Performance tied back to strategy" },
  { group: "Measure and adapt", id: "autonomous", label: "Autonomous loop" },
  { group: "Plus", id: "builtForFounders", label: "Built for founders and growing businesses" },
  { group: "Plus", id: "pricing", label: "Pricing" },
];

export const MOXIEMO: Record<string, CellValue> = {
  discovery: "yes", strategyPdf: "yes", icp: "yes", pillars: "yes",
  contentFromStrategy: "yes", emailSocial: "yes",
  planner: "yes", campaigns: "yes",
  publishing: "LinkedIn now; Facebook and Instagram coming", platformRules: "yes",
  performance: "yes (basic)", autonomous: "Coming in MOXIEMO 2.0",
  builtForFounders: "yes", pricing: "From $99/mo; founding members get 50% off for life",
};

export interface ComparisonSections {
  howCompetitor: string;
  howMoxiemo: string;
  honestDifference: string;
  honestLimitation: string;
  whereItFits: string;
}

export interface Comparison {
  slug: string;
  competitor: string;
  oneLiner: string;
  heroHeadline: string;
  heroSubhead: string;
  values: Record<string, CellValue>;
  sections: ComparisonSections;
}

export const COMPARISONS: Comparison[] = [
  {
    slug: "chatgpt",
    competitor: "ChatGPT",
    oneLiner: "General-purpose AI, you bring the system.",
    heroHeadline: "MOXIEMO vs ChatGPT: a growth system, not a blank prompt",
    heroSubhead: "ChatGPT generates content when you already know what to ask. MOXIEMO knows what to build, because it starts with your strategy and carries it through to published content.",
    values: { discovery:"no", strategyPdf:"no", icp:"partial", pillars:"partial", contentFromStrategy:"partial", emailSocial:"partial", planner:"no", campaigns:"no", publishing:"no", platformRules:"partial", performance:"no", autonomous:"no", builtForFounders:"no", pricing:"Free to about $200/mo; main paid $20" },
    sections: {
      howCompetitor: "ChatGPT is a general-purpose AI assistant, and a very good one. It writes, edits, researches, generates images, and can take multi-step actions through its agent mode. You can give it custom instructions, save context in memory, and build custom GPTs. For drafting a post, rewriting an email, or brainstorming, it is fast and capable. The thing to understand is that ChatGPT is a tool you direct. It does what you ask, as well as you ask it. It does not arrive knowing your brand strategy, your audience, or your plan. You bring those every time, in your prompts.",
      howMoxiemo: "MOXIEMO is a marketing growth system that works in six stages. Discover asks about your goals, audience, offer and proof. Diagnose shows the gap between where your brand is and where you want it to go. Define sets your positioning, messaging and content pillars. Prioritize turns that into a roadmap with your next best actions. Execute creates content in your voice and publishes what you approve, on LinkedIn today with Facebook and Instagram next. Measure and adapt reads the results against your goals and shapes the next round. The strategy is not something you paste in. It is the foundation the whole system is built on.",
      honestDifference: "ChatGPT gives you raw capability. MOXIEMO gives you that capability shaped into who you are, what to make, and where it goes, without you having to hold it all together.",
      honestLimitation: "ChatGPT will not build or hold a structured brand strategy, it has no marketing calendar or campaign planner, and it does not publish to your channels. Its output is only as aligned as your prompt. MOXIEMO is not a general-purpose chatbot. It will not write your code or answer trivia. It is a focused marketing system, and some of its reach arrives in MOXIEMO 2.0.",
      whereItFits: "If you want a brilliant, flexible assistant that does almost anything you can describe, ChatGPT is excellent, and many MOXIEMO users keep it alongside. If you want a system that already knows your brand, decides what to create, keeps it on strategy, and puts it in market without a fresh brief every time, that is MOXIEMO.",
    },
  },
  {
    slug: "averi",
    competitor: "Averi",
    oneLiner: "A foundation built from discovery, not read off your old site.",
    heroHeadline: "MOXIEMO vs Averi: a foundation built from discovery, not from your existing site",
    heroSubhead: "Averi establishes your brand by analyzing the website you already have, then creates content to rank. MOXIEMO builds your foundation through a guided discovery, from who you are and where you are going, so your strategy is not limited by a site that may not reflect you yet.",
    values: { discovery:"partial", strategyPdf:"partial", icp:"yes", pillars:"yes", contentFromStrategy:"yes", emailSocial:"partial", planner:"yes", campaigns:"partial", publishing:"partial", platformRules:"yes", performance:"yes (mature)", autonomous:"partial", builtForFounders:"yes", pricing:"Free plus paid tiers (verify before publish)" },
    sections: {
      howCompetitor: "Averi is an AI content engine. When you onboard, it analyzes your existing website to establish a Brand Core, your voice, positioning, products, and audience, which you then review and confirm. From there it researches topics, drafts content optimized for search and AI discovery, publishes to your CMS, and tracks performance, getting smarter as you publish. It is fast, and for a brand whose website already reflects who they are, it is a strong, compounding content system.",
      howMoxiemo: "MOXIEMO builds your foundation a different way. Discovery is a guided process that starts from who you serve, the transformation you create, your values, and your voice, not from whatever happens to be on your site today. That foundation then drives your content across social and email, your calendar, and your campaigns. The strategy is built from you, not inferred from your existing pages.",
      honestDifference: "Both platforms create a brand foundation. The difference is where it comes from. Averi derives yours by reading your existing website. That works well if your site already says what you mean. But many founders will tell you their site is not where they want it to be. When the input is a site you have outgrown, the foundation inherits its gaps, and the content compounds on a starting point you did not choose. MOXIEMO builds the foundation through discovery first, and can treat the website as something to fix rather than the source it copies.",
      honestLimitation: "Averi is content and discoverability first, so multi-social breadth and the founder-brand social go-to-market are not its center, and today its analytics and search depth are ahead of MOXIEMO. MOXIEMO does not optimize for search the way Averi does, its analytics today are basic, and the deeper loop arrives in MOXIEMO 2.0.",
      whereItFits: "Choose Averi if your site already reflects you and your growth is search and content led. Choose MOXIEMO if you want the foundation built from who you are rather than from your current pages, and your growth is brand and social led.",
    },
  },
  {
    slug: "claude",
    competitor: "Claude",
    oneLiner: "MOXIEMO runs on Claude. The difference is everything built around it.",
    heroHeadline: "MOXIEMO vs Claude: a marketing system, built on the intelligence",
    heroSubhead: "Claude is a brilliant general-purpose assistant, and MOXIEMO runs on it. The difference is that MOXIEMO turns that intelligence into a marketing system, so you do not have to know what to prompt, what to feed it, or what to build.",
    values: { discovery:"no", strategyPdf:"no", icp:"partial", pillars:"partial", contentFromStrategy:"partial", emailSocial:"partial", planner:"no", campaigns:"no", publishing:"no", platformRules:"partial", performance:"no", autonomous:"no", builtForFounders:"no", pricing:"Free tier plus paid plans" },
    sections: {
      howCompetitor: "Claude is a general-purpose AI assistant built by Anthropic, and one of the strongest available for reasoning and writing. It can draft, edit, analyze, and work through complex problems, and with features like Projects it can hold context you give it. For a founder, it is an excellent thinking and writing partner. Like any general assistant, it does what you direct. To use Claude as your marketing function, you would need to know what to prompt, what context to feed it each time, and how to assemble the pieces into a strategy, a calendar, and a publishing routine yourself.",
      howMoxiemo: "MOXIEMO runs on Claude. We built the marketing system around that intelligence so you do not have to assemble it. Discovery builds your foundation, the system holds it, and that foundation drives your content, your calendar, your campaigns, and your publishing. You bring your judgment and your approval. MOXIEMO brings the structure.",
      honestDifference: "This is not really MOXIEMO versus Claude, because MOXIEMO is built on Claude. The honest comparison is between using a general-purpose assistant directly and using a marketing system built on top of one. Claude gives you raw capability. MOXIEMO shapes that capability into who you are, what to make, and where it goes.",
      honestLimitation: "Claude is general-purpose, so the strategy, structure, and consistency are on you, prompt by prompt. MOXIEMO is narrower by design, a marketing system rather than a do-anything assistant, and some of its reach arrives in MOXIEMO 2.0.",
      whereItFits: "Keep Claude for thinking, writing, and everything general. Use MOXIEMO when you want that intelligence pointed at your marketing, running on your strategy, without the prompting and assembly falling to you.",
    },
  },
  {
    slug: "jasper",
    competitor: "Jasper",
    oneLiner: "Built for the marketing department, not the founder.",
    heroHeadline: "MOXIEMO vs Jasper: built for the founder, not the marketing department",
    heroSubhead: "Jasper is a powerful marketing operating system for teams and enterprises, built around brand voice at scale and content orchestration. MOXIEMO gives a founder the same strategic backbone without the team, the setup, or the enterprise price.",
    values: { discovery:"no", strategyPdf:"no", icp:"partial", pillars:"yes", contentFromStrategy:"partial", emailSocial:"yes", planner:"yes", campaigns:"yes", publishing:"partial", platformRules:"yes", performance:"partial", autonomous:"partial", builtForFounders:"no", pricing:"About $39 to $59 per seat/mo annual; Business custom" },
    sections: {
      howCompetitor: "Jasper is an enterprise-grade marketing platform built for marketing teams, agencies, and large brands. Its strength is brand voice at scale: Brand Voice and Brand IQ learn your tone and guidelines and hold them consistent across everyone on the account. It runs content pipelines and campaign orchestration that take work from brief to publication, and its marketing agents can research, optimize for search, and schedule content. There is even a no-code builder for custom AI apps. You bring your data into a knowledge base, and Jasper produces high volumes of on-brand content across channels.",
      howMoxiemo: "MOXIEMO is built for the individual founder or a lean growing business, not a marketing department. It starts with a guided discovery that builds your strategic foundation from who you are and who you serve, rather than asking you to assemble a knowledge base first. That foundation drives your content across social and email, your calendar, and your campaigns, in your voice. One founder, one flat price, no seats to manage.",
      honestDifference: "Jasper is genuinely powerful, and at team scale it is ahead on brand-voice governance, agentic automation, and custom app-building. But that power is aimed at marketing teams, it expects you to bring your own data, it carries a learning curve, and the real capability lives in custom-priced enterprise tiers with per-seat costs and add-ons. MOXIEMO is aimed at the founder who does not have a team or a marketing-ops budget.",
      honestLimitation: "Jasper can be heavy and expensive for a solo founder, much of its value sits behind enterprise pricing, and it does not run a guided discovery, you feed it your data. MOXIEMO is not an enterprise platform, it is not built for large teams or governance across many people, and some of its automation arrives in MOXIEMO 2.0.",
      whereItFits: "Choose Jasper if you run a marketing team or agency that needs brand-voice governance and high-volume orchestration across many people. Choose MOXIEMO if you are the founder who needs the strategy and the go-to-market handled, in your voice, without hiring a team or buying an enterprise contract.",
    },
  },
  {
    slug: "blaze",
    competitor: "Blaze",
    oneLiner: "Strong automation, but the strategy is analyzed from your site.",
    heroHeadline: "MOXIEMO vs Blaze: a foundation built from discovery, not analyzed from your site",
    heroSubhead: "Blaze is a strong all-in-one that automates content, scheduling, and a learning loop. The real difference is underneath. Blaze builds your strategy by analyzing the website you already have. MOXIEMO builds it from a guided discovery of who you are and who you want to become.",
    values: { discovery:"partial", strategyPdf:"partial", icp:"partial", pillars:"yes", contentFromStrategy:"yes", emailSocial:"yes", planner:"yes", campaigns:"yes", publishing:"yes (more channels live)", platformRules:"yes", performance:"yes", autonomous:"yes (live)", builtForFounders:"yes", pricing:"$79 to $149/mo platform; done-for-you separate" },
    sections: {
      howCompetitor: "Blaze is an all-in-one AI marketing platform for solopreneurs and small teams, and a capable one. It learns your brand voice by analyzing your website and existing materials, generates content across formats, turns one piece into many, publishes and schedules directly to LinkedIn, Facebook, Instagram, TikTok, and WordPress, generates images, checks SEO, and runs an autopilot loop that plans, posts, tracks performance, and learns from what works. By its own description, you are the creative director approving while Blaze executes. It is affordable, broad, and it genuinely automates a lot of the doing.",
      howMoxiemo: "MOXIEMO overlaps with much of that, and it is honest about where Blaze does more today. Where MOXIEMO is different is the foundation. Blaze builds your strategy by analyzing your existing website and competitors and generating a brand profile. MOXIEMO builds your foundation through a guided discovery that starts from who you serve, the transformation you create, your values, and your voice. If your site is not where you want it, a strategy analyzed from it inherits those gaps. MOXIEMO builds the foundation first, from you.",
      honestDifference: "This is the closest comparison, so here is the straight version. Blaze does more automation today: more live publishing channels, a running autopilot loop, and built-in images. What it does not do is discovery or a full strategy. Its strategy is a brand profile analyzed from your existing website, and its output is metered by credits and posting accounts. On price the two are close, Blaze runs $79 to $149 a month for the platform while MOXIEMO is $99, so this is not a cost decision. It is a decision about what the automation is built on.",
      honestLimitation: "Blaze builds its strategy from your existing site rather than a discovery, leans toward content volume, meters output by credits and posting accounts, and its true done-for-you option is a separate, pricier managed service. MOXIEMO does less automation today and publishes to fewer channels right now, with the autonomous loop arriving in MOXIEMO 2.0.",
      whereItFits: "Choose Blaze if you want the broadest automation and channel coverage right now. Choose MOXIEMO if you believe the foundation is the point, want it built from who you are rather than analyzed from your site, and want the depth of positioning that makes a founder or growing business stand out.",
    },
  },
  {
    slug: "rella",
    competitor: "Rella",
    oneLiner: "The publishing layer. MOXIEMO is the strategy above it.",
    heroHeadline: "MOXIEMO vs Rella: the strategy behind the content, not just the calendar",
    heroSubhead: "Rella is a polished tool for planning, scheduling, and collaborating on content across platforms. MOXIEMO sits upstream, building the strategy that decides what to publish and why, then creating it.",
    values: { discovery:"no", strategyPdf:"no", icp:"no", pillars:"partial", contentFromStrategy:"partial", emailSocial:"partial", planner:"yes", campaigns:"partial", publishing:"yes (eight platforms)", platformRules:"partial", performance:"partial", autonomous:"no", builtForFounders:"no", pricing:"$20 to $48 per member/mo" },
    sections: {
      howCompetitor: "Rella is a content planning and collaboration platform built for creators, social media managers, and boutique agencies. You bring or draft your content, organize it in calendar, board, or Kanban views, preview your Instagram grid, and auto-post across eight platforms. Its standout is collaboration: share a link with no login required, and clients or teammates can comment and approve in one click. It also tracks creator income and sponsorships, and its AI assistant, Ella, suggests captions and content ideas on the higher tiers. For managing and publishing content, it is polished and well loved.",
      howMoxiemo: "MOXIEMO sits a layer above that. Before anything goes on a calendar, it runs a guided discovery to build your strategic foundation, your positioning, your ideal customer, your voice, and your content pillars. That foundation decides what your content should be and why, and then MOXIEMO creates it in your voice. Where Rella helps you organize and publish, MOXIEMO decides what is worth publishing in the first place.",
      honestDifference: "This is the most clear-cut comparison, because the two barely overlap. Rella is downstream: planning, scheduling, previewing, approving, and posting, and it is genuinely good at it, with more live publishing channels than MOXIEMO has today. MOXIEMO is upstream: the strategy and go-to-market that determine the content. A creator could plan beautifully in Rella and still have no strategy underneath it. That gap is what MOXIEMO fills.",
      honestLimitation: "Rella does not build strategy, run discovery, or function as a go-to-market system, by design, and its AI and analytics are light. MOXIEMO publishes to fewer channels today, with more arriving in MOXIEMO 2.0, and it is not built to be a multi-client content calendar for an agency the way Rella is.",
      whereItFits: "Choose Rella if your main need is to organize, schedule, and collaborate on content across many platforms, especially as a creator or social media manager. Choose MOXIEMO if you need the strategy and go-to-market that decide what to publish before it ever reaches the calendar.",
    },
  },
  {
    slug: "gemini",
    competitor: "Gemini",
    oneLiner: "General-purpose AI with Google integration, you bring the system.",
    heroHeadline: "MOXIEMO vs Gemini: a marketing system, not a general assistant",
    heroSubhead: "Gemini is a powerful general-purpose AI, strongest inside Google's ecosystem. MOXIEMO is the marketing system, so you do not have to turn a general assistant into one yourself.",
    values: { discovery:"no", strategyPdf:"no", icp:"partial", pillars:"partial", contentFromStrategy:"partial", emailSocial:"partial", planner:"no", campaigns:"no", publishing:"no", platformRules:"partial", performance:"no", autonomous:"no", builtForFounders:"no", pricing:"Free to about $200/mo" },
    sections: {
      howCompetitor: "Gemini is Google's general-purpose AI assistant, and a strong one for reasoning, writing, research, and image and video generation. Its real advantage is integration: it lives inside Google Search, Docs, Gmail, Slides, and Chrome, so if you work in Google's tools all day it is right there. You can build custom assistants with Gems and run Deep Research. Like any general assistant, it does what you direct. To use Gemini as your marketing function, you would need to know what to prompt, what to feed it, and how to assemble the pieces yourself.",
      howMoxiemo: "MOXIEMO is the system you would otherwise be assembling. Discovery builds your foundation, that foundation drives your content across social and email, your calendar, and your campaigns, and it publishes. You bring your judgment and approval. MOXIEMO brings the structure, the strategy, and the marketing logic that a general assistant leaves to you.",
      honestDifference: "Gemini gives you raw capability with excellent Google integration. It does not build a brand strategy, hold your go-to-market, plan a calendar, or publish to your channels. MOXIEMO does, because it is built for one job, a founder's marketing.",
      honestLimitation: "Gemini is general-purpose, so the strategy, the structure, and the consistency are on you, prompt by prompt. MOXIEMO is narrower by design, a marketing system rather than a do-anything assistant, and some of its reach arrives in MOXIEMO 2.0.",
      whereItFits: "Keep Gemini for general work, research, and anything that lives in your Google tools. Use MOXIEMO when you want the marketing strategy and go-to-market built and run for you, not assembled from prompts.",
    },
  },
  {
    slug: "canva",
    competitor: "Canva",
    oneLiner: "Design is its lane. MOXIEMO is strategy, and Canva plugs in.",
    heroHeadline: "MOXIEMO vs Canva: a different lane, and a tool that plugs in",
    heroSubhead: "Canva is the best in the world at making things look good, and it works inside MOXIEMO. The real difference is lane. Canva is design. MOXIEMO is the strategy and go-to-market that decides what to create in the first place.",
    values: { discovery:"no", strategyPdf:"no", icp:"no", pillars:"partial", contentFromStrategy:"partial", emailSocial:"partial", planner:"partial", campaigns:"no", publishing:"yes (Content Planner, basic)", platformRules:"partial", performance:"no", autonomous:"no", builtForFounders:"partial", pricing:"Free; Pro $15/mo; Business $20 per user/mo" },
    sections: {
      howCompetitor: "Canva is the world's most popular design tool, and deservedly so. With over a million templates, a huge asset library, Brand Kit, and the Magic Studio AI suite for writing and image generation, it lets anyone produce polished graphics, presentations, and videos without design skills. It even includes a Content Planner that schedules posts to several social platforms. For making things look good, fast, nothing beats it.",
      howMoxiemo: "MOXIEMO is in a different lane. It does not compete with Canva on design, it decides what to design and why. Discovery builds your strategic foundation, that foundation drives your content, your calendar, your campaigns, and your publishing. And because Canva is the design layer, it can be used inside MOXIEMO, so the visuals you make in Canva live inside a strategy that tells you what to make them about.",
      honestDifference: "This is not really a competition, it is a division of labor. Canva makes content look good. MOXIEMO decides what the content should be, who it is for, and why, then creates and publishes it. Canva's scheduler and analytics are intentionally light, because design is its job, not go-to-market. Used together, Canva handles the craft and MOXIEMO handles the strategy.",
      honestLimitation: "Canva is design-first, so it does not build a strategy, hold your go-to-market, or run real campaign and performance logic, and its built-in scheduler is basic. MOXIEMO is not a design studio, for heavy visual creation you will still want Canva, which is exactly why it plugs in.",
      whereItFits: "Keep Canva for design. It is the best at it, and it works inside MOXIEMO. Use MOXIEMO for the strategy and go-to-market that tell you what to design, what to say, and where it goes.",
    },
  },
];

export const comparisonMap: Record<string, Comparison> = Object.fromEntries(
  COMPARISONS.map((c) => [c.slug, c]),
);
