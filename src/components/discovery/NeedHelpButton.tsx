import { useState } from "react";
import { X, Lightbulb, MessageCircle, Headphones } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const HINTS: Record<number, string> = {
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

type Props = {
  currentQuestion: number;
  totalQuestions: number;
  firstName?: string;
};

export function NeedHelpButton({ currentQuestion, totalQuestions, firstName }: Props) {
  const [showHint, setShowHint] = useState(false);
  const isMobile = useIsMobile();

  const safeQ = Math.min(Math.max(currentQuestion, 1), totalQuestions);
  const hint = HINTS[safeQ];

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
          className="absolute right-12 top-0 w-[280px] p-3 rounded-xl bg-white"
          style={{
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