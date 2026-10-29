import { Link } from "react-router-dom";
import { ArticlePage, ArticleP, ArticleH3, ArticleList } from "@/components/ArticlePage";

export default function BrandArchitectureMethod() {
  return (
    <ArticlePage
      eyebrow="The Method"
      title="The Brand Architecture Method: the strategy-first system that gates every output"
      dek="Most marketing fails because it starts with production. The Brand Architecture Method starts with clarity. It is the system expertise-based founders use to get their brand right once, so everything they make after that is consistent, differentiated, and theirs."
      metaTitle="The Brand Architecture Method | MOXIEMO"
      metaDescription="The strategy-first system that gates every output. Get your brand right once, so everything after is consistent, differentiated, and yours."
      canonicalPath="/brand-architecture-method"
      cta={{
        text: "See where your brand stands across all eight dimensions.",
        buttonLabel: "Get your free growth assessment",
        href: "/brand-audit",
      }}
      sections={[
        {
          id: "what-it-is",
          tocLabel: "What the Brand Architecture Method is",
          heading: "What the Brand Architecture Method is",
          body: (
            <ArticleP>
              The Brand Architecture Method is a strategy-first system for building a brand from the foundation up. It defines who you serve, what you stand for, how you sound, and how you show up, and it locks those decisions in before a single piece of content is made. Architecture is the right word. A building does not start with paint. It starts with a structure that everything else depends on. A brand is the same. Get the structure right and every later decision becomes easier and more consistent. Skip it and you spend forever redoing surface work that never quite holds together.
            </ArticleP>
          ),
        },
        {
          id: "principle",
          tocLabel: "The principle it was founded on",
          heading: "The principle it was founded on",
          body: (
            <ArticleP>
              The method rests on one principle: clarity before creation. Strategy before production. Founders are told to post more, publish more, and ship more, as if volume were the problem. It is not. The problem is that most of what gets made is built on nothing underneath. No clear position, no defined audience, no point of view. So it reads as generic, it does not compound, and it does not move the business. The Brand Architecture Method refuses to let creation happen before the thinking is done. Clarity is not a nice-to-have at the start. It is the thing that makes everything after it work.
            </ArticleP>
          ),
        },
        {
          id: "slop",
          tocLabel: "Why marketing without it turns to slop",
          heading: "Why marketing without it turns to slop",
          body: (
            <ArticleP>
              When you can generate a month of content in an afternoon, the bottleneck stops being production and becomes judgment. Most tools optimize for the wrong one. They make it easy to produce more, faster, with no opinion underneath. The result is slop: content that is technically fine and completely forgettable, indistinguishable from what every competitor is publishing. Slop is expensive. It trains your audience to ignore you. The Brand Architecture Method treats this as the central risk, not an afterthought. It puts a gate between strategy and execution, so nothing gets made until there is a clear brand for it to express.
            </ArticleP>
          ),
        },
        {
          id: "two-layers",
          tocLabel: "The two layers: foundation and expression",
          heading: "The two layers: foundation and expression",
          body: (
            <ArticleP>
              The method organizes a brand into two layers, and the order matters. The foundation comes first. It is the strategy: your positioning, your messaging, your brand story, and your purpose and values. These are the decisions that do not change week to week. The expression comes second. It is how the brand shows up: your visual identity, the face of your brand, your content, and your findability. Expression is downstream of foundation by design. When founders struggle with their marketing, they almost always try to fix it at the expression layer, with a new logo or a new posting schedule, when the real gap is in the foundation. The method makes you build in the right order.
            </ArticleP>
          ),
        },
        {
          id: "eight-dimensions",
          tocLabel: "The eight dimensions of a brand",
          heading: "The eight dimensions of a brand",
          body: (
            <>
              <ArticleP>The method breaks a brand into eight dimensions, four in each layer.</ArticleP>
              <ArticleH3>Foundation</ArticleH3>
              <ArticleList>
                <li><strong>Positioning and differentiation.</strong> Where you stand, and what you stand against.</li>
                <li><strong>Messaging and voice.</strong> What you say, and how you sound saying it.</li>
                <li><strong>Brand story.</strong> Why you exist, told as a story rather than a bio.</li>
                <li><strong>Purpose and values.</strong> The why beyond profit, named and specific.</li>
              </ArticleList>
              <ArticleH3>Expression</ArticleH3>
              <ArticleList>
                <li><strong>Visual identity.</strong> The logo, type, and color that make you recognizable.</li>
                <li><strong>The face of the brand.</strong> The human people actually trust.</li>
                <li><strong>Content and consistency.</strong> Showing up on a rhythm, on message.</li>
                <li><strong>Findability and search.</strong> Being discoverable where people look.</li>
              </ArticleList>
              <ArticleP>
                Each dimension is useful on its own. Together they are a complete picture of a brand. This is the same structure behind the <Link to="/brand-audit" className="text-accent underline underline-offset-4">MOXIEMO free growth assessment</Link>, which scores a brand across all eight.
              </ArticleP>
            </>
          ),
        },
        {
          id: "gate",
          tocLabel: "How the gate works",
          heading: "How the gate works",
          body: (
            <ArticleP>
              The gate is what makes the method more than a worksheet. Once your foundation is defined, it governs every output that comes after. Before a piece of content, a campaign, or a page gets made, it passes through the foundation. Does it fit the positioning. Does it sound like the brand. Does it carry the story. If it does not, it does not ship. This is the opposite of set-and-forget automation that produces volume and hopes for the best. The method keeps the founder, and the strategy, in the loop. Execution is gated by clarity, every time.
            </ArticleP>
          ),
        },
        {
          id: "why-founders",
          tocLabel: "Why this matters for founders",
          heading: "Why this matters for founders",
          body: (
            <ArticleP>
              You did not build an expertise business to spend twenty hours a week making marketing that sounds like everyone else. The Brand Architecture Method gives a founder three things that matter. First, differentiation. A clear position means your marketing sounds like you and no one else, which is the only durable advantage in a crowded category. Second, leverage. Decide the foundation once and every later piece gets faster and more consistent, because the hard thinking is already done. Third, compounding. Consistent, on-strategy output builds recognition over time instead of resetting every week. The method is not about making more. It is about making things that are worth making.
            </ArticleP>
          ),
        },
        {
          id: "apply",
          tocLabel: "How to apply the method",
          heading: "How to apply the method",
          body: (
            <ArticleP>
              You can apply the method in two ways. You can do the thinking yourself, using the framework to define each dimension in order, foundation first. The This Is Branding worksheet walks through it. Or you can let MOXIEMO run it with you. The <Link to="/brand-audit" className="text-accent underline underline-offset-4">free growth assessment</Link> shows you where your brand stands across all eight dimensions today, and what to fix first. Inside the platform, Discover builds your full foundation, and from then on the method gates everything MOXIEMO helps you make. Either way the sequence is the same. Get clear first. Then create.
            </ArticleP>
          ),
        },
        {
          id: "origin",
          tocLabel: "Where the method came from",
          heading: "Where the method came from",
          body: (
            <ArticleP>
              The Brand Architecture Method did not come from a software roadmap. It came from years of brand strategy work with founders, and it is the method behind the book This Is Branding. It was built in the room with real businesses that had real traction and marketing that did not match. MOXIEMO is what happens when that method is productized, so the clarity that used to require a strategist is available to any founder who is ready to get clear before they create. Read more about that in <Link to="/why-moxiemo" className="text-accent underline underline-offset-4">Why MOXIEMO</Link>.
            </ArticleP>
          ),
        },
      ]}
    />
  );
}
