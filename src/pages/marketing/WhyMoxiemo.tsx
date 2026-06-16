import { Link } from "react-router-dom";
import { ArticlePage, ArticleP } from "@/components/ArticlePage";

export default function WhyMoxiemo() {
  return (
    <ArticlePage
      eyebrow="Why MOXIEMO"
      title="Why MOXIEMO: the case for getting clear before you create"
      dek="MOXIEMO is your AI CMO. One platform that learns your brand, builds your strategy, and publishes your content. This is the case for why it exists, what it is worth to a founder, and where it came from."
      metaTitle="Why MOXIEMO | The case for getting clear before you create"
      metaDescription="MOXIEMO is the AI CMO for expertise-based founders. Learn why it exists, what it is worth, and where it came from."
      canonicalPath="/why-moxiemo"
      cta={{
        text: "Run your free Brand Audit, then join the Founding Round.",
        buttonLabel: "Run your free Brand Audit",
        href: "/brand-audit",
      }}
      extraCtas={[
        { text: "", buttonLabel: "Join the Founding Round", href: "/founding" },
      ]}
      sections={[
        {
          id: "what-it-is",
          tocLabel: "What MOXIEMO is",
          heading: "What MOXIEMO is",
          body: (
            <ArticleP>
              MOXIEMO is an AI CMO for expertise-based founders. It is one platform that learns your brand, builds your complete marketing strategy, and publishes your content. It replaces the stack of disconnected tools most founders are stitching together, and it replaces the blank page. The point is not another tool. The point is a system that knows your brand and acts on it.
            </ArticleP>
          ),
        },
        {
          id: "problem",
          tocLabel: "The problem it was built to solve",
          heading: "The problem it was built to solve",
          body: (
            <ArticleP>
              Most founders doing real revenue are drowning in their own marketing. Four or more tools that do not talk to each other. Twenty or more hours a week spent on work that has nothing to do with their expertise. A calendar full of fifteen dollar an hour tasks done by a founder whose time is worth far more. They are not short on effort. They are short on a system. Marketing becomes the thing that is always behind, always starting from scratch, and never quite good enough. That is the problem MOXIEMO was built to end.
            </ArticleP>
          ),
        },
        {
          id: "worth",
          tocLabel: "What MOXIEMO is actually worth",
          heading: "What MOXIEMO is actually worth",
          body: (
            <ArticleP>
              It would be easy to say MOXIEMO saves time. It does, but that is not the point. The journey is what matters. A founder starts out drowning in tools and operational work. MOXIEMO consolidates that into one platform and takes the weekly load down to about two hours. That frees roughly eighteen hours a week. The value is not the hours saved. It is what those hours become. Eighteen hours of strategic capacity is the difference between running in place and actually standing out, differentiating, and growing revenue. MOXIEMO is not sold as a way to do marketing faster. It is a way to get your time and your strategic attention back, and to put them where they grow the business.
            </ArticleP>
          ),
        },
        {
          id: "strategy-first",
          tocLabel: "The strategy-first difference",
          heading: "The strategy-first difference",
          body: (
            <ArticleP>
              The AI marketing market is splitting into two camps. One is autonomous: set it and forget it, let the machine produce, and accept whatever comes out. The other is strategy-first: keep the founder and the strategy in the loop, and gate the output by a clear brand. MOXIEMO is built deliberately in the second camp. It runs on the <Link to="/brand-architecture-method" className="text-accent underline underline-offset-4">Brand Architecture Method</Link>, which means nothing gets made until your brand foundation is defined, and everything after that is gated by it. This is the anti-slop position. Other tools help you make more. MOXIEMO makes sure what you make is differentiated, consistent, and yours.
            </ArticleP>
          ),
        },
        {
          id: "value",
          tocLabel: "How MOXIEMO creates value for founders",
          heading: "How MOXIEMO creates value for founders",
          body: (
            <ArticleP>
              The value shows up in four places. Clarity: MOXIEMO learns your brand and gives you a foundation to build on, instead of a blank page. Consistency: every piece comes out on-strategy and on-voice, because the strategy gates the output. Consolidation: one platform replaces the tangle of tools and the cost and context-switching that come with them. Capacity: the time and attention you get back go into the strategic work only you can do. For an expertise-based founder, that combination is the difference between marketing that drains the business and marketing that compounds it.
            </ArticleP>
          ),
        },
        {
          id: "story",
          tocLabel: "The brand story",
          heading: "The brand story",
          body: (
            <ArticleP>
              MOXIEMO did not start as software. It started in the room with founders. It grew out of years of brand strategy and fractional CMO work, and out of the method behind the book This Is Branding. The pattern was always the same. Talented founders with real businesses, and marketing that did not match the quality of what they had built. The fix was never more content. It was clarity first, then everything else. MOXIEMO is that work, productized. It takes the thinking that used to require a strategist and makes it available to any founder ready to get clear.
            </ArticleP>
          ),
        },
        {
          id: "evolution",
          tocLabel: "The evolution",
          heading: "The evolution",
          body: (
            <ArticleP>
              The evolution runs in one direction: from a method, to a platform, without losing the principle it started with. The method came first, refined across real engagements and written down in This Is Branding. The platform came when it became clear that the same clarity could be delivered as a system, not only as a service. MOXIEMO is being built in public, in the open, wins and misses alike, because the brand it is built on values honesty over polish. What began as one strategist helping founders one at a time is becoming a system that helps them at scale.
            </ArticleP>
          ),
        },
        {
          id: "who-for",
          tocLabel: "Who MOXIEMO is for",
          heading: "Who MOXIEMO is for",
          body: (
            <ArticleP>
              MOXIEMO is built for expertise-based founders who are already making real money and are ready to stop doing fifteen dollar an hour marketing work. It is for the course creator charging real money who still loses hours figuring out what to post. The executive coach who is strategic with every client but has no time for their own brand. The consultant who is fully booked and fully burnt out, with visibility always last on the list. The service or tech founder who knows exactly what they do but cannot make it sound like it on the outside. If you have built something real and your marketing does not show it yet, MOXIEMO is for you.
            </ArticleP>
          ),
        },
        {
          id: "moxie",
          tocLabel: "What building with moxie means",
          heading: "What building with moxie means",
          body: (
            <ArticleP>
              The name is the philosophy. Building a business takes moxie. Not certainty, not a constant feeling of confidence, but the nerve to keep building through the messy middle. Founders do not get to skip the hard part. They choose their hardships. MOXIEMO does not pretend otherwise, and it does not sell the fantasy that the right tool makes building easy. What it offers is leverage and clarity for the parts that can be made easier, so your moxie goes where it is actually needed. Building takes strength and resilience. This is a tool for founders who already have both.
            </ArticleP>
          ),
        },
        {
          id: "start",
          tocLabel: "Where to start",
          heading: "Where to start",
          body: (
            <ArticleP>
              The fastest way to see what MOXIEMO does is to run a <Link to="/brand-audit" className="text-accent underline underline-offset-4">free Brand Audit</Link>. It scores your brand across the eight dimensions of the <Link to="/brand-architecture-method" className="text-accent underline underline-offset-4">Brand Architecture Method</Link> and shows you what to fix first. From there, the <Link to="/founding" className="text-accent underline underline-offset-4">Founding Round</Link> is open while MOXIEMO Beta 2.0 is in the build phase, with limited founding-member spots for founders who want to build with us early. Start by getting clear. Everything else follows from that.
            </ArticleP>
          ),
        },
      ]}
    />
  );
}
