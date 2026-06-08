import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Link } from "react-router-dom";

type TagKind = "New Feature" | "Improvement" | "Bug Fix" | "Coming Soon" | "Brand Update";

interface Entry {
  date: string;
  tag: TagKind;
  headline: string;
  body: string;
  closing?: string;
  links?: { label: string; href?: string }[];
}

const DISCORD_URL = "https://discord.gg/wa9JFx7nha";

const entries: Entry[] = [
  {
    date: "JUNE 5, 2026",
    tag: "New Feature",
    headline: "New content types, ad copy generation, and a homepage refresh.",
    body:
      "Three new content types are now live in the Content page.\n\nPodcast Script. Generate full episode scripts, episode outlines, interview question sets, guest prep documents, episode intros and outros, and show notes — all in your brand voice and anchored to your content pillars. If you have a podcast, this was built for you.\n\nMeta Ads and Google Ads copy. Generate strategy-anchored ad creative directly from the Content page. Meta ad sets include headline, primary text, description, and CTA — with per-field character counts and individual copy buttons so you can paste directly into Ads Manager. Google Search ads include three headlines and two descriptions, all within platform character limits. No API connection to your ad account required.\n\nPodcast transcript repurposing. Upload a transcript from a podcast episode, webinar, or keynote — and MOXIEMO atomizes it into LinkedIn posts, Instagram captions, email sections, newsletter content, and short-form video scripts. One piece of long-form content becomes many. All of it in your voice, all tied to your strategy.\n\nThe homepage was also refreshed. It now leads with a pain statement before introducing the product, includes a new outcome strip, and adds a \"Who This Is For\" section with founder archetype cards. The page now leads with identity before features.",
    closing: "— The MOXIEMO Team",
  },
  {
    date: "JUNE 3, 2026",
    tag: "Bug Fix",
    headline: "Founding Member Signup: Error Message Fix",
    body:
      "We launched private beta publicly today. On the same day, we caught a bug in the founding member signup form.\n\nUsers who had submitted before and came back to sign up again were seeing a generic \"Something went wrong\" error. That was wrong. The form was working fine for new signups the whole time. All data was being captured correctly. The problem was that one specific backend response was not being read correctly on the frontend, so it fell back to a generic error instead of telling you what was actually happening.\n\nFixed the same day. The form now correctly tells returning visitors they are already on the list.\n\nIf you saw that error and thought your signup did not go through, you are fine. We have your details. You will hear from us about your 1:1 kickoff call.\n\nSorry it happened on launch day. We caught it fast.",
    closing: "— The MOXIEMO Team",
  },
  {
    date: "MAY 6, 2026",
    tag: "Brand Update",
    headline: "We're now MOXIEMO. Here's why we made the move.",
    body:
      "Something I've always believed: the best founders communicate in real time, even when the news is inconvenient. So here's what happened this week — and why I think it makes MOXIEMO a stronger brand than MOXIE ever was.\n\nWhile preparing for our founding member launch, I did a routine trademark search. What came back gave me pause. The word \"MOXIE\" in Class 042 — the exact category that covers SaaS platforms — already has a live registered trademark held by another company. There was also a marketing platform called joinmoxie.com operating in an adjacent space. Two real risks. One clear decision.\n\nThe name needed to evolve.\n\nHere's the thing about catching this before launch rather than after: it's a gift. No confused users. No press with the wrong name. No cease and desist arriving six months from now when there's real momentum to protect. We caught it at day zero. The cost of the change was a few hours of work and a $13 domain purchase. The alternative — fighting a trademark dispute while trying to build a company — would have cost infinitely more.\n\nSo we searched MOXIEMO on the USPTO database. No results. Clean across every class. We acquired buildwithmoxiemo.com within the hour.\n\nAnd here's what I discovered in the process: MOXIEMO is actually a better name. MOXIE was bold but generic. MOXIEMO carries the same energy and adds a meaning — your Marketing Officer, your mock CMO, the MO behind your marketing system. The name does part of the sales job now. That's not a consolation prize. That's an upgrade.\n\nThe platform hasn't changed. The strategy hasn't changed. The founding member promise hasn't changed. The logo evolved — same coral mark, new wordmark. The URL is new. The social handles are new. Everything that matters is exactly the same.\n\nIf you saved buildwithmoxie.co anywhere, it will redirect to the new home. If you followed the old social handles, please find us at the new ones linked below.\n\nThis is what building in public looks like. Not just the wins. The pivots too.",
    closing: "— Karee",
    links: [
      { label: "New home: buildwithmoxiemo.com", href: "https://buildwithmoxiemo.com" },
      { label: "Instagram: @buildwithmoxiemo", href: "https://www.instagram.com/buildwithmoxiemo" },
      { label: "LinkedIn: linkedin.com/company/moxiemo", href: "https://www.linkedin.com/company/moxiemo" },
    ],
  },
  {
    date: "MAY 5, 2026",
    tag: "New Feature",
    headline: "The Community page is live — and it's honest.",
    body: "We rebuilt the Community page from scratch today. The old version had fictional testimonials and made-up statistics. We took it all down. What you see now is the real thing — our actual Discord server, the real channels Radica built, and the real people behind the community. If you're a founding member and you haven't joined the Discord yet, this is your sign. The link is right there on the page. Come introduce yourself.",
    closing: "— Karee",
  },
  {
    date: "MAY 4, 2026",
    tag: "New Feature",
    headline: "15 free AI prompt packs are now live on the Resources page.",
    body: "We added a full library of AI prompts, frameworks, and toolkits to the Resources page — 15 in total, all free, no signup required. These came from our sister brand Design Hiro and they cover everything from building a brand with AI to training ChatGPT to think like a founder. We believe in giving before asking. These are yours. Use them. If you build something with them, share it in #show-and-tell.",
    closing: "— Karee",
  },
  {
    date: "MAY 3, 2026",
    tag: "Improvement",
    headline: "The Content page got a complete redesign — meet the Creative Desk.",
    body: "The old Content page was a generic \"generate a post\" form with no personality. We rebuilt it as the Creative Desk — your unstructured creative space for ad-hoc content that isn't tied to a campaign or a schedule. It now greets you by name, shows your content pillars as clickable chips, and generates content that actually anchors to your strategy. The output area has three actions (Copy, Save to Drafts, Add to Queue) and a refine input so you can tell MOXIEMO what to adjust before you publish anything. This is the page you'll live in when inspiration hits.",
    closing: "— Karee",
  },
  {
    date: "MAY 2, 2026",
    tag: "New Feature",
    headline: "Campaigns now populate your Marketing Planner calendar automatically.",
    body: "Before today, creating a campaign and planning your calendar were two completely separate things. You'd build a campaign and it would just sit there as a card with zero content attached. That's fixed. When you create and save a campaign now, it automatically populates your Content Schedule with content slots distributed across the campaign's date range — one per platform per week, all pre-tagged to the campaign. The calendar finally shows you what executing a campaign actually looks like across a quarter.",
    closing: "— Karee",
  },
  {
    date: "MAY 2, 2026",
    tag: "Bug Fix",
    headline: "Email compose was rendering raw JSON. That's fixed.",
    body: "If you tried to generate an email today and saw something like `json { \"subject\": \"...\" }` dumped into the body editor — that was us, not you. The AI was returning a JSON object and we were injecting the raw string directly into the rich text area instead of parsing it. We added a client-side unwrap so the content renders correctly now. The subject line populates the subject field, the body renders as formatted paragraphs, and the editor is fully usable. We're sorry it shipped that way. It's fixed.",
    closing: "— The MOXIEMO team",
  },
  {
    date: "MAY 2, 2026",
    tag: "Improvement",
    headline: "Strategy generation now streams instead of crashing.",
    body: "We had a serious problem: strategy generation was timing out after 150 seconds and returning a blank screen. You'd go through all 16 Discovery questions, watch the loading spinner for two minutes, get an error, and lose everything. That was unacceptable. We rebuilt synthesize-strategy from a blocking request to a streaming response — the same way Discovery streams questions. It now reads your answers directly from the database (not from what the client sends), streams the strategy as it builds, and saves your answers before Anthropic is even called so nothing gets lost. If it still times out for any reason, your answers are safe and there's a retry button. No more blank screens.",
    closing: "— The MOXIEMO team",
  },
  {
    date: "MAY 1, 2026",
    tag: "Bug Fix",
    headline: "Clicking into the Discovery input no longer restarted MOXIEMO.",
    body: "This one was maddening — and I'm sorry it took us this long to catch. When you clicked into the answer textarea on Question 2 of Discovery, MOXIEMO would immediately start saying \"MOXIEMO is typing...\" and restart the conversation from the beginning before you could type anything. The root cause: the session-loading effect depended on the entire user object. Supabase fires auth events on focus, which created a new user object reference, which re-ran the effect, which restarted MOXIEMO. We switched the dependency to the stable user ID string. The effect now fires once when you log in and never again. Click freely.",
    closing: "— The MOXIEMO team",
  },
  {
    date: "APRIL 30, 2026",
    tag: "Coming Soon",
    headline: "Building with MOXIEMO — the blog is coming.",
    body: "We're building a blog and we're calling it Building with MOXIEMO. It will be strategy, content, founder stories, and honest takes on AI marketing — written for expertise-based founders who are building real businesses in the messy middle. No content marketing fluff. No SEO-bait listicles. Just useful things worth reading. The first issue will go to our founding members first. If you want to be notified the moment it drops, there's an email capture on the blog page. We'll write something worth your time.",
    closing: "— Karee",
  },
];

function TagPill({ tag }: { tag: TagKind }) {
  const styles: Record<TagKind, string> = {
    "New Feature": "bg-[#ff6b6b] text-white border border-transparent",
    "Improvement": "bg-[#101116] text-white border border-transparent",
    "Bug Fix": "bg-[#c9a84c] text-white border border-transparent",
    "Coming Soon": "bg-muted text-foreground border border-dashed border-muted-foreground/50",
    "Brand Update": "bg-transparent text-[#101116] border-[1.5px] border-[#101116]",
  };
  if (tag === "Brand Update") {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-[20px] text-[11px] font-semibold uppercase tracking-[1px] bg-transparent text-[#101116] border-[1.5px] border-[#101116]">
        {tag}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${styles[tag]}`}>
      {tag}
    </span>
  );
}

export default function Changelog() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <section className="bg-background">
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-10 text-center">
          <div className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-accent mb-6 px-4 py-2 rounded-full bg-accent-soft">
            FOUNDER'S LOG
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-[-0.03em] text-foreground mb-6">
            Building in public.
          </h1>
          <p className="text-lg text-muted-foreground max-w-[560px] mx-auto leading-relaxed">
            Every update, fix, improvement, and honest reflection from the team building MOXIEMO. No corporate spin. No marketing gloss. Just what we shipped, what broke, what we learned, and what's coming next.
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Updated regularly by Karee and the MOXIEMO team.
          </p>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-[#ff6b6b] font-semibold hover:underline"
          >
            Get updates in real time → Join the Discord
          </a>
        </div>
      </section>

      <main className="flex-1 bg-background">
        <div className="max-w-[740px] mx-auto px-6 pt-[60px] pb-20">
          <div className="space-y-12">
            {entries.map((e, i) => (
              <article key={i} className="pl-6 border-l-[3px] border-[#ff6b6b]">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <span className="text-[13px] uppercase tracking-wider text-muted-foreground font-medium">
                    {e.date}
                  </span>
                  <TagPill tag={e.tag} />
                </div>
                <h2 className="text-[20px] font-bold text-foreground mb-3 leading-snug">
                  {e.headline}
                </h2>
                {e.body.split("\n\n").map((para, idx) => (
                  <p key={idx} className="text-[16px] text-muted-foreground leading-[1.8] mb-4 last:mb-0">
                    {para}
                  </p>
                ))}
                {e.closing && (
                  <p className="mt-4 italic text-muted-foreground text-[15px]">{e.closing}</p>
                )}
                {e.links && (
                  <div className="mt-4 space-y-1">
                    {e.links.map((l, idx) => (
                      l.href ? (
                        <a key={idx} href={l.href} target="_blank" rel="noopener noreferrer" className="block text-[13px] text-muted-foreground hover:text-foreground">
                          {l.label}
                        </a>
                      ) : (
                        <p key={idx} className="text-[13px] text-muted-foreground">{l.label}</p>
                      )
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </main>

      <section className="bg-muted/50 py-[60px]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[20px] font-bold text-foreground mb-2">Never miss an update.</p>
          <p className="text-[15px] text-muted-foreground mb-6">
            Join the Discord for real-time updates — or bookmark this page.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-[#ff6b6b] hover:bg-[#ff6b6b]/90 text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Join the Discord →
            </a>
            <Link to="/community" className="text-muted-foreground hover:text-foreground font-medium">
              ← Back to Community
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}