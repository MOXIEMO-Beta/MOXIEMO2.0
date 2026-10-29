import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { BlogArticle, H2, P } from "@/components/BlogArticle";
import { MoxieBlogImage } from "@/components/MoxieBlogImage";
import { RouteMetadata } from "@/components/RouteMetadata";
import { Button } from "@/components/ui/button";

export const MOXIE_POST_TITLE = "My own website couldn't tell you who MOXIE is";
export const MOXIE_POST_DESCRIPTION = "MOXIE showed up all over our website and meant four different things. Here's how I missed it, and a 30-minute check that catches it on your site.";

export default function MyWebsiteCouldNotExplainMoxie() {
  return (
    <>
      <RouteMetadata title={`${MOXIE_POST_TITLE} | MOXIEMO`} description={MOXIE_POST_DESCRIPTION} canonicalPath="/blog/my-website-could-not-explain-moxie" />
      <BlogArticle
        heroContent={<MoxieBlogImage className="w-full aspect-video max-h-[480px] rounded-b-2xl" />}
        category="Founder Stories"
        date="October 29, 2026"
        readTime="4 min read"
        headline={MOXIE_POST_TITLE}
        byline="By Karee T. Laing."
        closingCta={
          <div className="text-center mt-10">
            <h3 className="font-bold text-foreground text-[22px] mb-4">See what your site is saying</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">The free growth assessment reads your website the way a new visitor does and shows you where your message isn't landing. It takes a few minutes, and it's free.</p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground min-h-12 h-auto px-7 py-3 rounded-full font-semibold whitespace-normal">
              <Link to="/brand-audit">Get my free growth assessment <ArrowRight className="ml-2 h-4 w-4 shrink-0" /></Link>
            </Button>
          </div>
        }
      >
        <P>Our home page said it right under the headline: "MOXIEMO figures out what moves your brand forward. MOXIE makes sure it happens."</P>
        <P>This week I read that line the way a new visitor would, and I got stuck on one word. Who's MOXIE?</P>
        <P>So I went through every page on the site looking for the answer. I came back with four.</P>

        <H2>Four MOXIEs on one website</H2>
        <P>On our Why MOXIEMO page, MOXIE was a texting feature. "MOXIE texts you when a decision is waiting or a priority slips." We're building that. It isn't live yet.</P>
        <P>In the ticker that scrolls across the home page, MOXIE was a mood. "MOXIE keeps it moving." Keeps what moving? And who's doing the keeping?</P>
        <P>Inside the app, MOXIE was the writer. "MOXIE needs your positioning and voice to generate content."</P>
        <P>And on our own blog, MOXIE was the company. We renamed to MOXIEMO in May, after a trademark search turned up a conflict. One post still had the heading "Why I'm building MOXIE." My author bio said I was the founder of MOXIE.</P>
        <P>A feature, a mood, a writer and a former company name. Four meanings for a word we put on almost every page.</P>

        <H2>I do this for a living</H2>
        <P>That's the part that stung. I've spent fifteen years telling founders to define their words before they publish them. Your positioning. Your offer. The name of your method. If a stranger has to guess what a word means, they'll guess wrong, or they'll leave.</P>
        <P>And I missed it on my own site, with my own product.</P>
        <P>Nobody decided MOXIE should mean four things. Each line was written on a different day, for a different page, and each one made sense where it sat. Read together, they cancel each other out.</P>
        <P>I see this in almost every business I work with. The words you use most are the ones you stop seeing. You know what you mean, so every version reads fine to you. Your visitor only gets the page in front of them, and they can't ask you what you meant.</P>

        <H2>What we decided</H2>
        <P>We wrote one sentence and made every page agree with it.</P>
        <P>MOXIE is your growth companion.</P>
        <P>MOXIEMO builds the strategy and the work. MOXIE is the one who talks to you about it: what needs you next, the post waiting for your approval, the priority that stalled. MOXIE talks. MOXIEMO builds.</P>
        <P>Then we set three rules so it stays that way:</P>
        <ol className="list-decimal pl-6 mb-6 space-y-2">
          <li>He speaks in first person. On the site he says "Hi, I am MOXIE," never "MOXIE is an AI assistant that..."</li>
          <li>He's a he. Not an it, and never a bot.</li>
          <li>He doesn't promise what isn't built. Until texting ships, every page says the same thing: two-way texting with MOXIE is coming in a future release.</li>
        </ol>
        <P>He has a face now, too. A lilac head, navy glasses, a coral bow tie and a phone in his hand for the day texting opens. When he shows up on a page, you know who's talking.</P>

        <H2>The 30-minute check for your own site</H2>
        <P>You don't need a rebrand to find this. You need half an hour and a notepad.</P>
        <ol className="list-decimal pl-6 mb-6 space-y-2">
          <li>Write down three words a stranger wouldn't know. Usually that's your product name, the name of your method and the name of your main offer.</li>
          <li>Find every place each word shows up. Search Google for site:yourdomain.com plus the word in quotes, or open each page and use find.</li>
          <li>Next to each one, write a single line: what does the word mean here?</li>
          <li>Count the meanings. One is fine. Two means some visitors are confused. Three or more means they're guessing.</li>
          <li>Write a one-sentence definition and put it where the word first appears on your home page.</li>
        </ol>
        <P>The last step matters most. Most visitors meet your word once, near the top of the page, and decide right there. If the definition isn't next to it, they never see it.</P>

        <H2>What changed on our site</H2>
        <P>The hero now reads "MOXIEMO figures out what moves your brand forward. MOXIE, your growth companion, makes sure it happens." The Meet MOXIE section says what he does today and what's coming. Pricing, the ticker and that old blog post all tell the same story now. Every change is listed in the Founder's Log.</P>
        <P>It took one sentence to fix. Finding it took reading my own site like a stranger, which is the first thing I ask every client to do.</P>
      </BlogArticle>
    </>
  );
}