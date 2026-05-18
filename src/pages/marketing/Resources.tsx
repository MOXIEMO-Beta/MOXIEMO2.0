import { useState, FormEvent, useRef } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Resource = { type: "Template" | "Guide" | "Toolkit" | "Framework"; title: string; description: string };

const FEATURED: Resource[] = [
  { type: "Template", title: "The Brand Architecture Worksheet", description: "Map your positioning, ideal client, voice, and content pillars in one structured doc." },
  { type: "Guide", title: "The Founder's LinkedIn Playbook", description: "Data-backed posting strategy for expertise-based founders: hooks, cadence, and content that converts." },
  { type: "Toolkit", title: "The Anti-AI-Slop Content Kit", description: "How to use AI for content without losing your voice, your authority, or your audience's trust." },
  { type: "Framework", title: "The 90-Day Marketing Engine", description: "Build a quarter of strategy-aligned content in one afternoon. Calendar, pillars, and platform plan included." },
  { type: "Template", title: "The Messaging Vault", description: "One-liner, elevator pitch, bio, and email signature — all written from your Brand Architecture." },
];

type PackTag = "Framework" | "Prompt" | "Guide" | "Toolkit" | "Checklist";
type Pack = { tag: PackTag; title: string; description: string; button: string; link: string };

const PACKS: Pack[] = [
  { tag: "Framework", title: "Website Copy Framework", description: "The structure behind high-converting websites. The exact prompts and frameworks used to build CRO-optimized headlines, CTA formulas, and audience-specific copy templates.", button: "Download the Website Copy Framework", link: "https://docs.google.com/document/d/1YYpJRhy2Hou4BSmwA1HzzA7OcnTaFJuo/" },
  { tag: "Framework", title: "Pitch Deck Framework", description: "Build decks investors can't ignore. Our full pitch deck framework — including deep research prompts, structure templates, and storytelling cues designed to win attention and funding.", button: "Access the Pitch Deck Framework", link: "https://docs.google.com/document/d/1sTyGI--JHZFEQEMVj63FrrMRjjC0a4Dr/" },
  { tag: "Prompt", title: "ChatGPT Founder Brain Prompt", description: "Train ChatGPT to think like you. Turn your AI into a second brain that remembers context, challenges your thinking, and co-creates with your style.", button: "Activate the Founder Brain Prompt", link: "https://docs.google.com/document/d/1sM_9i0uVd6HTKmbp8XmkM2sFO6odnt8M/" },
  { tag: "Prompt", title: "Market Size Prompt", description: "Validate your market with precision. A guided prompt for calculating TAM, SAM, and SOM — ideal for investor decks, pitch prep, or understanding your growth ceiling.", button: "Run the Market Size Prompt", link: "https://docs.google.com/document/d/1v26SLGIl7wpyWCHTEMOiJrdxcrhtheXq/" },
  { tag: "Prompt", title: "Competitor Prompt", description: "Know your landscape before you build. A single, powerful prompt for ChatGPT or Gemini that reveals competitor insights, positioning angles, and market opportunities.", button: "Download the Competitor Prompt", link: "https://docs.google.com/document/d/1pysYBdURqICRE-GaxZH-59UkHxlB2S8h/" },
  { tag: "Guide", title: "How To Create A Brand With AI", description: "From concept to creation — all inside AI. A full step-by-step system for building brands with AI, including prompts, tools, and real examples that show what's possible when creativity meets strategy.", button: "Unlock the Brand Creation Framework", link: "https://docs.google.com/document/d/1RIMDlqXAFp28ZrWj_riUNlEJsgMeaETr/" },
  { tag: "Toolkit", title: "Marketing Checklist", description: "Your AI-assisted marketing playbook. A complete list of how to market your brand — with prompts, strategies, and AI shortcuts for faster, smarter execution.", button: "Get the Marketing Checklist", link: "https://docs.google.com/document/d/1sG_Nc9yKpZ76BYmh_cuzQMBUzO8F-Xwq/" },
  { tag: "Toolkit", title: "Content Custom GPTs", description: "Generate ideas that go viral — on purpose. Includes two custom GPTs: one for crafting viral hooks and another for refining storytelling scripts built to convert.", button: "Try the Content GPTs", link: "https://docs.google.com/document/d/1MTkygCM2DE7knXu2BsVRUHb_Nax69TQN/" },
  { tag: "Checklist", title: "Business Stage Checklist With AI Tools", description: "Every stage. Every advantage. This checklist maps every phase of building a business — and the AI tools that give you leverage at each step.", button: "Access the Business Stage Checklist", link: "https://docs.google.com/document/d/1R41X9bXTcCVUg4y94iLpOTbadRzoC1fq/" },
  { tag: "Guide", title: "AI Tools Guide", description: "The exact AI stack behind modern creative teams. Explore the tools actually used — from research and branding to mockups and MVPs — and learn how to integrate them into your daily build process.", button: "Explore the Tools Guide", link: "https://docs.google.com/document/d/1LFoxWFYIBPrgMlVZQaXgcNKqWAkPGzbA/" },
  { tag: "Framework", title: "Deep Research Framework", description: "Research like a strategist, not a student. Learn how to prompt AI for true insight — validating demand, analyzing competitors, and surfacing pricing models that make sense for your market.", button: "Get the Deep Research Framework", link: "https://docs.google.com/document/d/121TF2julvfRkKT8HX8xbLEDSDPbz0NbF/" },
  { tag: "Framework", title: "How To Find A Business Idea With AI", description: "AI won't hand you a million-dollar idea — but it can help you discover one. This framework shows you how to use AI to identify market gaps, validate ideas, and uncover opportunities worth building.", button: "Get the Idea Discovery Framework", link: "https://docs.google.com/document/d/1Q-lB4UvQsX0Y_6lEftZ8GNOjCa7EXmeD/" },
  { tag: "Toolkit", title: "Branding Prompts", description: "Turn AI into your brand architect. The exact prompts used to build brand identity — from tone and color to logos, visual direction, and messaging. Design a brand that feels intentional, not automated.", button: "Access the Branding Toolkit", link: "https://docs.google.com/document/d/1uQRGPQ0UAGdBb6dAG4JvCiKEXoFpfYlw/" },
  { tag: "Guide", title: "High-Performance ChatGPT Setup", description: "Build your AI to think like a founder. A step-by-step guide to configure ChatGPT as your strategist, co-founder, and creative coach — for high-performance leaders who want sharper output and less mental friction.", button: "Download Your Setup Guide", link: "https://docs.google.com/document/d/1WBtfWMB5eAeA83URVdmJ9AoY0ELuL5SW/" },
  { tag: "Prompt", title: "AI Thought Partner Prompts", description: "Stop outsourcing your ideas — sharpen them. These prompts transform AI from a yes-machine into your boldest creative challenger. Push your thinking further, question assumptions, and unlock new directions for your brand or business.", button: "Unlock the Thought Partner Prompts", link: "https://docs.google.com/document/d/1NYu8nCgjf0lB9XbOUBK9jn51OvpiwRz6/" },
];

const FILTERS: Array<"All" | PackTag> = ["All", "Prompt", "Framework", "Guide", "Toolkit", "Checklist"];

function PromptPacksSection() {
  const [filter, setFilter] = useState<"All" | PackTag>("All");
  return (
    <section style={{ background: "#f8f8f8" }} className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-accent mb-5 px-4 py-2 rounded-full bg-accent-soft">
            AI Prompt Packs & Toolkits
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.1] text-foreground mb-5">
            AI systems and tools for founders,<br />builders, and strategic thinkers.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-[640px] mx-auto leading-relaxed">
            The exact prompts, frameworks, and toolkits to turn ideas into execution — with clarity, speed, and strategy. Free for everyone. No signup required.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 justify-start md:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors border ${
                  active ? "bg-accent text-white border-accent" : "bg-white text-foreground border-border hover:border-accent/50"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {PACKS.map((p) => {
            const hidden = filter !== "All" && p.tag !== filter;
            return (
              <div
                key={p.title}
                style={{ display: hidden ? "none" : "flex", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", borderRadius: 16 }}
                className="bg-white p-6 flex-col justify-between h-full"
              >
                <div>
                  <div className="text-accent font-bold mb-3" style={{ fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                    {p.tag}
                  </div>
                  <h3 className="text-[18px] font-bold text-foreground leading-snug mb-3">{p.title}</h3>
                  <p className="text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.7 }}>{p.description}</p>
                </div>
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 block text-center transition-colors hover:bg-accent hover:text-white"
                  style={{
                    border: "1.5px solid #ff6b6b",
                    color: "#ff6b6b",
                    background: "transparent",
                    borderRadius: 40,
                    padding: "12px 20px",
                    fontSize: 11,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    width: "100%",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#ff6b6b"; e.currentTarget.style.color = "#ffffff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ff6b6b"; }}
                >
                  {p.button}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ComingSoonPill() {
  return (
    <span className="inline-block rounded-full bg-accent text-white uppercase font-semibold" style={{ fontSize: 10, letterSpacing: 0.5, padding: "3px 8px" }}>
      Coming Soon
    </span>
  );
}

function ResourceCover({ title }: { title: string }) {
  return (
    <div className="aspect-[16/10] rounded-t-2xl overflow-hidden flex items-center justify-center p-4" style={{ background: "#1A2744" }}>
      {renderCoverSvg(title)}
    </div>
  );
}

function renderCoverSvg(title: string) {
  switch (title) {
    case "The Brand Architecture Worksheet":
      return (
        <svg viewBox="0 0 180 110" width="100%" role="img" aria-label="Brand Architecture Worksheet preview">
          <rect x="10" y="6" width="72" height="44" rx="3" fill="none" stroke="#C9A96E" strokeWidth="0.7" opacity="0.55"/>
          <text x="46" y="19" textAnchor="middle" fill="#C9A96E" fontSize="7.5" opacity="0.85">Positioning</text>
          <line x1="18" y1="26" x2="72" y2="26" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <line x1="18" y1="32" x2="62" y2="32" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <line x1="18" y1="38" x2="68" y2="38" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <line x1="18" y1="44" x2="56" y2="44" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <rect x="98" y="6" width="72" height="44" rx="3" fill="none" stroke="#C9A96E" strokeWidth="0.7" opacity="0.55"/>
          <text x="134" y="19" textAnchor="middle" fill="#C9A96E" fontSize="7.5" opacity="0.85">Ideal Client</text>
          <line x1="106" y1="26" x2="160" y2="26" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <line x1="106" y1="32" x2="148" y2="32" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <line x1="106" y1="38" x2="154" y2="38" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <line x1="106" y1="44" x2="144" y2="44" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <rect x="10" y="62" width="72" height="44" rx="3" fill="none" stroke="#C9A96E" strokeWidth="0.7" opacity="0.55"/>
          <text x="46" y="75" textAnchor="middle" fill="#C9A96E" fontSize="7.5" opacity="0.85">Brand Voice</text>
          <line x1="18" y1="82" x2="72" y2="82" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <line x1="18" y1="88" x2="60" y2="88" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <line x1="18" y1="94" x2="66" y2="94" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <line x1="18" y1="100" x2="52" y2="100" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <rect x="98" y="62" width="72" height="44" rx="3" fill="none" stroke="#C9A96E" strokeWidth="0.7" opacity="0.55"/>
          <text x="134" y="75" textAnchor="middle" fill="#C9A96E" fontSize="7.5" opacity="0.85">Content Pillars</text>
          <line x1="106" y1="82" x2="160" y2="82" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <line x1="106" y1="88" x2="150" y2="88" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <line x1="106" y1="94" x2="156" y2="94" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <line x1="106" y1="100" x2="142" y2="100" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.16"/>
          <line x1="82" y1="28" x2="98" y2="28" stroke="#C9A96E" strokeWidth="0.5" opacity="0.3"/>
          <line x1="82" y1="84" x2="98" y2="84" stroke="#C9A96E" strokeWidth="0.5" opacity="0.3"/>
          <line x1="46" y1="50" x2="46" y2="62" stroke="#C9A96E" strokeWidth="0.5" opacity="0.3"/>
          <line x1="134" y1="50" x2="134" y2="62" stroke="#C9A96E" strokeWidth="0.5" opacity="0.3"/>
          <circle cx="90" cy="56" r="4" fill="none" stroke="#C9A96E" strokeWidth="0.7" opacity="0.5"/>
          <circle cx="90" cy="56" r="1.5" fill="#C9A96E" opacity="0.8"/>
          <text x="170" y="108" textAnchor="end" fill="#C9A96E" fontSize="6.5" opacity="0.35">MOXIE</text>
        </svg>
      );
    case "The Founder's LinkedIn Playbook":
      return (
        <svg viewBox="0 0 180 110" width="100%" role="img" aria-label="Founder's LinkedIn Playbook preview">
          <line x1="8" y1="104" x2="172" y2="104" stroke="#F4EFE6" strokeWidth="0.5" opacity="0.15"/>
          <rect x="12" y="82" width="14" height="22" rx="2" fill="#C9A96E" opacity="0.22"/>
          <rect x="32" y="68" width="14" height="36" rx="2" fill="#C9A96E" opacity="0.32"/>
          <rect x="52" y="54" width="14" height="50" rx="2" fill="#C9A96E" opacity="0.42"/>
          <rect x="72" y="40" width="14" height="64" rx="2" fill="#C9A96E" opacity="0.54"/>
          <rect x="92" y="24" width="14" height="80" rx="2" fill="#C9A96E" opacity="0.68"/>
          <rect x="112" y="10" width="14" height="94" rx="2" fill="#C9A96E" opacity="0.88"/>
          <rect x="132" y="18" width="14" height="86" rx="2" fill="#C9A96E" opacity="0.72"/>
          <rect x="152" y="30" width="14" height="74" rx="2" fill="#C9A96E" opacity="0.55"/>
          <polyline points="19,82 39,68 59,54 79,40 99,24 119,10" fill="none" stroke="#F4EFE6" strokeWidth="1.1" opacity="0.45" strokeDasharray="3,2"/>
          <circle cx="19" cy="82" r="2.2" fill="#F4EFE6" opacity="0.45"/>
          <circle cx="39" cy="68" r="2.2" fill="#F4EFE6" opacity="0.45"/>
          <circle cx="59" cy="54" r="2.2" fill="#F4EFE6" opacity="0.45"/>
          <circle cx="79" cy="40" r="2.2" fill="#F4EFE6" opacity="0.45"/>
          <circle cx="99" cy="24" r="2.2" fill="#F4EFE6" opacity="0.55"/>
          <circle cx="119" cy="10" r="3" fill="#C9A96E"/>
          <text x="119" y="7" textAnchor="middle" fill="#C9A96E" fontSize="6.5" opacity="0.85">↑ 340%</text>
          <text x="19" y="109" textAnchor="middle" fill="#F4EFE6" fontSize="5.5" opacity="0.28">W1</text>
          <text x="52" y="109" textAnchor="middle" fill="#F4EFE6" fontSize="5.5" opacity="0.28">W2</text>
          <text x="86" y="109" textAnchor="middle" fill="#F4EFE6" fontSize="5.5" opacity="0.28">W3</text>
          <text x="119" y="109" textAnchor="middle" fill="#F4EFE6" fontSize="5.5" opacity="0.28">W4</text>
          <text x="152" y="109" textAnchor="middle" fill="#F4EFE6" fontSize="5.5" opacity="0.28">W5</text>
          <text x="170" y="108" textAnchor="end" fill="#C9A96E" fontSize="6.5" opacity="0.35">MOXIE</text>
        </svg>
      );
    case "The Anti-AI-Slop Content Kit":
      return (
        <svg viewBox="0 0 180 110" width="100%" role="img" aria-label="Anti-AI-Slop Content Kit preview">
          <text x="44" y="14" textAnchor="middle" fill="#F4EFE6" fontSize="7" opacity="0.28">Generic</text>
          <text x="134" y="14" textAnchor="middle" fill="#C9A96E" fontSize="7" opacity="0.9">Your voice</text>
          <line x1="90" y1="6" x2="90" y2="106" stroke="#C9A96E" strokeWidth="0.5" opacity="0.25"/>
          {[20,28,36,44,52,60,68,76,84,92].map((y) => (
            <rect key={y} x="12" y={y} width="62" height="4" rx="2" fill="#F4EFE6" opacity="0.1"/>
          ))}
          <line x1="12" y1="18" x2="74" y2="98" stroke="#C9A96E" strokeWidth="1.2" opacity="0.45"/>
          <line x1="74" y1="18" x2="12" y2="98" stroke="#C9A96E" strokeWidth="1.2" opacity="0.45"/>
          <rect x="98" y="20" width="44" height="4" rx="2" fill="#C9A96E" opacity="0.75"/>
          <rect x="98" y="28" width="68" height="4" rx="2" fill="#F4EFE6" opacity="0.2"/>
          <rect x="98" y="36" width="52" height="4" rx="2" fill="#F4EFE6" opacity="0.2"/>
          <rect x="98" y="44" width="70" height="4" rx="2" fill="#C9A96E" opacity="0.5"/>
          <rect x="98" y="52" width="38" height="4" rx="2" fill="#F4EFE6" opacity="0.2"/>
          <rect x="98" y="60" width="62" height="4" rx="2" fill="#F4EFE6" opacity="0.2"/>
          <rect x="98" y="68" width="48" height="4" rx="2" fill="#C9A96E" opacity="0.4"/>
          <rect x="98" y="76" width="68" height="4" rx="2" fill="#F4EFE6" opacity="0.2"/>
          <rect x="98" y="84" width="40" height="4" rx="2" fill="#F4EFE6" opacity="0.2"/>
          <rect x="98" y="92" width="58" height="4" rx="2" fill="#C9A96E" opacity="0.55"/>
          <text x="170" y="108" textAnchor="end" fill="#C9A96E" fontSize="6.5" opacity="0.35">MOXIE</text>
        </svg>
      );
    case "The 90-Day Marketing Engine":
      return (
        <svg viewBox="0 0 180 110" width="100%" role="img" aria-label="90-Day Marketing Engine preview">
          <text x="90" y="85" textAnchor="middle" fill="#C9A96E" fontSize="78" fontWeight="700" opacity="0.06">90</text>
          <text x="30" y="13" textAnchor="middle" fill="#C9A96E" fontSize="6.5" opacity="0.6">Month 1</text>
          <text x="90" y="13" textAnchor="middle" fill="#C9A96E" fontSize="6.5" opacity="0.7">Month 2</text>
          <text x="150" y="13" textAnchor="middle" fill="#C9A96E" fontSize="6.5" opacity="0.9">Month 3</text>
          <line x1="60" y1="8" x2="60" y2="72" stroke="#C9A96E" strokeWidth="0.5" opacity="0.2"/>
          <line x1="120" y1="8" x2="120" y2="72" stroke="#C9A96E" strokeWidth="0.5" opacity="0.2"/>
          <g opacity="0.45">
            <circle cx="14" cy="22" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="24" cy="22" r="2.5" fill="#C9A96E"/><circle cx="34" cy="22" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="44" cy="22" r="2.5" fill="#F4EFE6" opacity="0.35"/>
            <circle cx="14" cy="34" r="2.5" fill="#C9A96E"/><circle cx="24" cy="34" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="34" cy="34" r="2.5" fill="#C9A96E"/><circle cx="44" cy="34" r="2.5" fill="#F4EFE6" opacity="0.35"/>
            <circle cx="14" cy="46" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="24" cy="46" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="34" cy="46" r="2.5" fill="#C9A96E"/><circle cx="44" cy="46" r="2.5" fill="#C9A96E"/>
            <circle cx="14" cy="58" r="2.5" fill="#C9A96E"/><circle cx="24" cy="58" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="34" cy="58" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="44" cy="58" r="2.5" fill="#C9A96E"/>
          </g>
          <g opacity="0.65">
            <circle cx="72" cy="22" r="2.5" fill="#C9A96E"/><circle cx="82" cy="22" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="92" cy="22" r="2.5" fill="#C9A96E"/><circle cx="104" cy="22" r="2.5" fill="#F4EFE6" opacity="0.35"/>
            <circle cx="72" cy="34" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="82" cy="34" r="2.5" fill="#C9A96E"/><circle cx="92" cy="34" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="104" cy="34" r="2.5" fill="#C9A96E"/>
            <circle cx="72" cy="46" r="2.5" fill="#C9A96E"/><circle cx="82" cy="46" r="2.5" fill="#C9A96E"/><circle cx="92" cy="46" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="104" cy="46" r="2.5" fill="#C9A96E"/>
            <circle cx="72" cy="58" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="82" cy="58" r="2.5" fill="#C9A96E"/><circle cx="92" cy="58" r="2.5" fill="#C9A96E"/><circle cx="104" cy="58" r="2.5" fill="#F4EFE6" opacity="0.35"/>
          </g>
          <g opacity="0.92">
            <circle cx="130" cy="22" r="2.5" fill="#C9A96E"/><circle cx="140" cy="22" r="2.5" fill="#C9A96E"/><circle cx="152" cy="22" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="162" cy="22" r="2.5" fill="#C9A96E"/>
            <circle cx="130" cy="34" r="2.5" fill="#C9A96E"/><circle cx="140" cy="34" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="152" cy="34" r="2.5" fill="#C9A96E"/><circle cx="162" cy="34" r="2.5" fill="#C9A96E"/>
            <circle cx="130" cy="46" r="2.5" fill="#F4EFE6" opacity="0.35"/><circle cx="140" cy="46" r="2.5" fill="#C9A96E"/><circle cx="152" cy="46" r="2.5" fill="#C9A96E"/><circle cx="162" cy="46" r="2.5" fill="#C9A96E"/>
            <circle cx="130" cy="58" r="2.5" fill="#C9A96E"/><circle cx="140" cy="58" r="2.5" fill="#C9A96E"/><circle cx="152" cy="58" r="2.5" fill="#C9A96E"/><circle cx="162" cy="58" r="2.5" fill="#F4EFE6" opacity="0.35"/>
          </g>
          <rect x="14" y="78" width="152" height="4" rx="2" fill="#F4EFE6" opacity="0.08"/>
          <rect x="14" y="78" width="108" height="4" rx="2" fill="#C9A96E" opacity="0.55"/>
          <text x="90" y="94" textAnchor="middle" fill="#F4EFE6" fontSize="6.5" opacity="0.35">71% of quarter planned</text>
          <circle cx="16" cy="101" r="2.5" fill="#C9A96E" opacity="0.7"/><text x="22" y="104" fill="#C9A96E" fontSize="6" opacity="0.6">Scheduled</text>
          <circle cx="78" cy="101" r="2.5" fill="#F4EFE6" opacity="0.28"/><text x="84" y="104" fill="#F4EFE6" fontSize="6" opacity="0.28">Open</text>
          <text x="170" y="108" textAnchor="end" fill="#C9A96E" fontSize="6.5" opacity="0.35">MOXIE</text>
        </svg>
      );
    case "The Messaging Vault":
      return (
        <svg viewBox="0 0 180 110" width="100%" role="img" aria-label="Messaging Vault preview">
          <rect x="20" y="10" width="140" height="16" rx="3.5" fill="#F4EFE6" opacity="0.04"/>
          <rect x="16" y="14" width="140" height="16" rx="3.5" fill="#F4EFE6" opacity="0.05"/>
          <rect x="12" y="18" width="156" height="16" rx="3.5" fill="none" stroke="#C9A96E" strokeWidth="0.7" opacity="0.5"/>
          <text x="42" y="29" fill="#C9A96E" fontSize="7" opacity="0.8">One-liner</text>
          <line x1="85" y1="23" x2="158" y2="23" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.17"/>
          <line x1="85" y1="30" x2="145" y2="30" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.17"/>
          <rect x="12" y="42" width="156" height="16" rx="3.5" fill="none" stroke="#C9A96E" strokeWidth="0.7" opacity="0.62"/>
          <text x="42" y="53" fill="#C9A96E" fontSize="7" opacity="0.82">Elevator pitch</text>
          <line x1="96" y1="47" x2="158" y2="47" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.17"/>
          <line x1="96" y1="54" x2="150" y2="54" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.17"/>
          <rect x="12" y="66" width="156" height="16" rx="3.5" fill="none" stroke="#C9A96E" strokeWidth="0.7" opacity="0.76"/>
          <text x="42" y="77" fill="#C9A96E" fontSize="7" opacity="0.85">Bio</text>
          <line x1="58" y1="71" x2="158" y2="71" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.17"/>
          <line x1="58" y1="78" x2="132" y2="78" stroke="#F4EFE6" strokeWidth="0.6" opacity="0.17"/>
          <rect x="12" y="90" width="156" height="16" rx="3.5" fill="rgba(201,169,110,0.1)" stroke="#C9A96E" strokeWidth="0.8" opacity="0.95"/>
          <text x="42" y="101" fill="#C9A96E" fontSize="7" opacity="0.95">Email signature</text>
          <line x1="102" y1="95" x2="158" y2="95" stroke="#C9A96E" strokeWidth="0.6" opacity="0.4"/>
          <line x1="102" y1="102" x2="148" y2="102" stroke="#C9A96E" strokeWidth="0.6" opacity="0.4"/>
          <circle cx="7" cy="26" r="1.8" fill="#C9A96E" opacity="0.28"/>
          <circle cx="7" cy="50" r="1.8" fill="#C9A96E" opacity="0.46"/>
          <circle cx="7" cy="74" r="1.8" fill="#C9A96E" opacity="0.68"/>
          <circle cx="7" cy="98" r="2.5" fill="#C9A96E" opacity="1"/>
          <line x1="7" y1="28" x2="7" y2="48" stroke="#C9A96E" strokeWidth="0.5" opacity="0.28"/>
          <line x1="7" y1="52" x2="7" y2="72" stroke="#C9A96E" strokeWidth="0.5" opacity="0.42"/>
          <line x1="7" y1="76" x2="7" y2="96" stroke="#C9A96E" strokeWidth="0.5" opacity="0.58"/>
          <text x="170" y="108" textAnchor="end" fill="#C9A96E" fontSize="6.5" opacity="0.35">MOXIE</text>
        </svg>
      );
    default:
      return null;
  }
}

function ResourcesEmail({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("resources_waitlist").insert({ email: email.trim().toLowerCase() });
    setLoading(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error("Something went wrong. Try again.");
      return;
    }
    setSubmitted(true);
    setEmail("");
  }

  if (submitted) return <p className={`text-sm font-medium ${dark ? "text-white" : "text-foreground"}`}>You're on the list.</p>;

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto w-full">
      <Input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`h-12 flex-1 ${dark ? "bg-white text-foreground border-white" : ""}`}
      />
      <Button type="submit" disabled={loading} className="h-12 px-5 rounded-md bg-accent hover:bg-accent/90 text-white font-semibold">
        Get early access <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </form>
  );
}

function FeaturedCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  function scrollBy(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const w = card ? card.offsetWidth + 24 : 320;
    el.scrollBy({ left: dir * w, behavior: "smooth" });
    setIdx((i) => Math.max(0, Math.min(FEATURED.length - 1, i + dir)));
  }

  return (
    <div className="relative">
      <div ref={ref} className="flex gap-6 overflow-x-auto snap-x scroll-smooth pb-4 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FEATURED.map((r) => (
          <div key={r.title} data-card className="snap-start shrink-0 w-[85%] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
            <ResourceCover title={r.title} />
            <div className="p-6 flex flex-col gap-3 flex-1">
              <span className="self-start inline-block rounded-full bg-accent-soft text-accent text-xs font-bold uppercase tracking-wider px-3 py-1">{r.type}</span>
              <h3 className="text-[20px] font-bold leading-snug text-foreground">{r.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
              <span className="mt-auto text-sm font-medium text-muted-foreground">Coming Soon →</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4">
        <button onClick={() => scrollBy(-1)} aria-label="Previous" className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/90">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-1.5">
          {FEATURED.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-accent" : "w-1.5 bg-muted-foreground/30"}`} />
          ))}
        </div>
        <button onClick={() => scrollBy(1)} aria-label="Next" className="h-10 w-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/90">
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function Resources() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 text-center">
          <div className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-accent mb-6 px-4 py-2 rounded-full bg-accent-soft">
            Resources
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-[-0.04em] leading-[1.02] text-foreground mb-5">
            Everything you need to build smarter.
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground font-light max-w-3xl mx-auto">
            Templates, toolkits, guides, and frameworks — built specifically for expertise-based founders at $250K+.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-14 w-full space-y-16">
        <FeaturedCarousel />
      </main>

      <PromptPacksSection />

      <section className="bg-[#101116] py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1] mb-4">
            Get early access to every resource.
          </h2>
          <p className="text-white/70 text-lg mb-7">
            We'll send you each resource the moment it drops — free for founding members.
          </p>
          <ResourcesEmail dark />
          <p className="text-white/50 text-xs mt-4">Free for founding members. No spam.</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}