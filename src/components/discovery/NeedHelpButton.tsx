import { useState } from "react";
import { X, Lightbulb, MessageCircle, Headphones } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const HINTS_LANE1: Record<number, string> = {
  1: "My clients go from feeling like the best-kept secret in their industry to being recognized as the go-to authority in their niche.",
  2: "I work with early-stage SaaS founders who are generating revenue but struggling to articulate their value proposition clearly.",
  3: "They're posting consistently but getting crickets — no DMs, no inbound leads, no sense that anyone is actually listening.",
  4: "Unlike most strategists who hand you a deck and disappear, I build the system alongside you and stay until it's working.",
  5: "I want people to feel like they finally found someone who gets it — and that working with me would actually move the needle.",
  6: "Honestly? Marketing advice on the internet is mostly noise. Here's the one thing I'd bet money on if you're starting from zero…",
  7: "Buttoned-up corporate speak, vague buzzwords, or anything that sounds like a LinkedIn guru trying to sell you a course.",
  8: "Positioning for technical founders, the psychology of pricing, and what actually works on LinkedIn in 2026.",
  9: "LinkedIn — it's where my buyers spend their work hours and where long-form thinking still gets rewarded.",
  10: "Short text posts and the occasional carousel — fast to make, easy to test, and they perform well for my audience.",
  11: "Inbound conversations from qualified buyers — DMs, calls booked, replies that lead somewhere real.",
  12: "Hit $30K MRR by end of Q3 with a repeatable inbound engine I don't have to babysit every week.",
  13: "About 3 hours a week — enough to write and engage, but not enough to film, edit, and repurpose across five platforms.",
  14: "$300K–$600K",
  15: "Creating content consistently — I know what to say, I just can't keep up the cadence on my own.",
  16: "I've tried agencies and freelancers before and ended up rewriting most of what they produced. I need something that sounds like me from day one.",
};

const HINTS_LANE2: Record<number, string> = {
  1: "We offer done-for-you bookkeeping for small businesses — clients send us their statements each month and get clean books plus a short financial review back within five days.",
  2: "We solve the 'I don't actually know where my money is going' problem. Without us, owners make pricing and hiring decisions on gut feel and end up undercharging or running out of cash.",
  3: "Recurring or subscription — clients pay a flat monthly retainer for ongoing service.",
  4: "Other businesses (B2B) — mostly small service firms and agencies.",
  5: "Owner-operated service businesses doing $500K–$3M a year, past the scrappy phase but not big enough for a full finance team. They value clarity and hate spreadsheets.",
  6: "National — we work with clients anywhere in the country and everything is delivered online.",
  7: "'Will these people actually understand my business, or am I going to spend hours explaining it every month?'",
  8: "We specialize in one industry instead of taking anyone with a credit card, so we already know the patterns and can spot issues most generalists miss.",
  9: "'They actually care about our business — it doesn't feel like we're just another account in a queue.'",
  10: "Warm and approachable but seriously competent. Like a trusted advisor, not a salesperson.",
  11: "Confused, ignored, or like they're being talked down to for asking a basic question.",
  12: "Getting found by new customers — referrals have carried us this far but they're not predictable.",
  13: "Word of mouth and referrals, plus a little Google. Referrals convert best by a wide margin.",
  14: "Our two main competitors are bigger and have more polished marketing, but their service feels transactional and clients churn after a year.",
  15: "Add 30 net-new monthly retainer clients and hit $1.2M ARR by next December — with a sales process that doesn't depend on me personally.",
};

type Props = {
  currentQuestion: number;
  totalQuestions: number;
  firstName?: string;
  lane?: "lane1" | "lane2" | null;
};

export function NeedHelpButton({ currentQuestion, totalQuestions, firstName, lane }: Props) {
  const [showHint, setShowHint] = useState(false);
  const isMobile = useIsMobile();

  const safeQ = Math.min(Math.max(currentQuestion, 1), totalQuestions);
  const hintMap = lane === "lane2" ? HINTS_LANE2 : HINTS_LANE1;
  const hint = hintMap[safeQ];

  const mailto = `mailto:hello@buildwithmoxiemo.com?subject=${encodeURIComponent(
    `Discovery Help — Question ${safeQ} of ${totalQuestions}`,
  )}`;

  // Collapsed = 40x40 circle (icon only). Expanded (group-hover on desktop) = ~180px pill with label.
  // On mobile, pills stay collapsed permanently.
  const pillBase =
    "group/pill relative flex items-center h-10 rounded-full overflow-hidden " +
    "transition-[width] duration-[250ms] ease-out " +
    (isMobile
      ? "w-10 justify-center"
      : "w-10 hover:w-[180px] focus:w-[180px] focus-visible:w-[180px] justify-start");

  const iconWrap = "flex items-center justify-center w-10 h-10 flex-shrink-0";
  const labelCls = isMobile
    ? "hidden"
    : "whitespace-nowrap text-sm font-medium pr-3.5 opacity-0 group-hover/pill:opacity-100 group-focus/pill:opacity-100 transition-opacity duration-200 delay-75";

  return (
    <div
      className={
        "fixed z-50 flex flex-col gap-1.5 " +
        (isMobile ? "right-0 bottom-20" : "right-0 top-[170px]")
      }
      style={{ filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.12))" }}
    >
      {/* Hint pill */}
      <button
        type="button"
        onClick={() => setShowHint((s) => !s)}
        aria-label="Get a hint for this question"
        className={pillBase}
        style={{ backgroundColor: "#FF6B5C", color: "#FFFFFF" }}
      >
        <span className={iconWrap}>
          <Lightbulb className="h-[18px] w-[18px]" />
        </span>
        <span className={labelCls}>Get a hint</span>
      </button>

      {/* Inline hint bubble */}
      {showHint && hint && (
        <div
          className="fixed w-[280px] max-w-[280px] p-3 rounded-xl bg-white"
          style={{
            right: "16px",
            bottom: isMobile ? "calc(80px + 132px + 12px)" : "auto",
            top: isMobile ? "auto" : "calc(170px - 12px)",
            transform: isMobile ? undefined : "translateY(-100%)",
            zIndex: 60,
            border: "1.5px solid #FF6B5C",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          <button
            onClick={() => setShowHint(false)}
            className="absolute top-2 right-2 p-0.5 rounded hover:bg-black/5"
            aria-label="Dismiss hint"
          >
            <X className="h-3.5 w-3.5" style={{ color: "rgba(21,23,28,0.50)" }} />
          </button>
          <div
            className="text-[10px] font-semibold uppercase mb-1"
            style={{ color: "#FF6B5C", letterSpacing: "0.1em" }}
          >
            Example answer:
          </div>
          <p className="text-sm leading-relaxed pr-4" style={{ color: "#15171C" }}>
            {hint}
          </p>
        </div>
      )}

      {/* Support pill (outlined) */}
      <a
        href={mailto}
        aria-label="Chat with support"
        className={pillBase}
        style={{
          backgroundColor: "#FFFFFF",
          color: "#FF6B5C",
          border: "1.5px solid #FF6B5C",
        }}
      >
        <span className={iconWrap}>
          <MessageCircle className="h-[18px] w-[18px]" />
        </span>
        <span className={labelCls}>Chat with support</span>
      </a>

      {/* Discord pill */}
      <a
        href="https://discord.gg/wa9JFx7nha"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join Discord"
        className={pillBase}
        style={{ backgroundColor: "rgba(255,107,92,0.85)", color: "#FFFFFF" }}
      >
        <span className={iconWrap}>
          <Headphones className="h-[18px] w-[18px]" />
        </span>
        <span className={labelCls}>Join Discord</span>
      </a>
    </div>
  );
}