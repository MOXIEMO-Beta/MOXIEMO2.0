import { useState } from "react";
import { HelpCircle, X, Lightbulb, Mail, MessageCircle } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isMobile = useIsMobile();

  const safeQ = Math.min(Math.max(currentQuestion, 1), totalQuestions);
  const hint = HINTS[safeQ];

  const mailto = `mailto:hello@buildwithmoxiemo.com?subject=${encodeURIComponent(
    `Discovery Help — ${firstName || "Founder"} — Question ${safeQ} of ${totalQuestions}`,
  )}`;

  function close() {
    setOpen(false);
    setTimeout(() => setShowHint(false), 200);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs transition hover:opacity-80"
        style={{
          backgroundColor: "rgba(21,23,28,0.05)",
          color: "rgba(21,23,28,0.60)",
        }}
      >
        <HelpCircle className="h-3 w-3" /> Need help?
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/40 animate-in fade-in-0 duration-200"
            onClick={close}
          />
          {/* Panel */}
          <div
            className={
              isMobile
                ? "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto"
                : "fixed right-0 top-0 bottom-0 z-50 w-[400px] max-w-[90vw] bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto"
            }
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-start justify-between"
              style={{ borderBottom: "3px solid #FF6B5C" }}
            >
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "#15171C" }}>
                  Need help?
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(21,23,28,0.50)" }}>
                  You're on Question {safeQ} of {totalQuestions}.
                </p>
              </div>
              <button
                onClick={close}
                className="p-1 rounded hover:bg-black/5"
                aria-label="Close help"
              >
                <X className="h-4 w-4" style={{ color: "rgba(21,23,28,0.60)" }} />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {/* Option 1: Hint */}
              <button
                onClick={() => setShowHint((s) => !s)}
                className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition hover:bg-black/[0.03]"
                style={{ border: "1px solid rgba(21,23,28,0.08)" }}
              >
                <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#FF6B5C" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "#15171C" }}>
                    Get a hint for this question
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(21,23,28,0.50)" }}>
                    See a one-sentence example of a strong answer.
                  </div>
                </div>
              </button>

              {showHint && hint && (
                <div
                  className="p-3 rounded-xl relative"
                  style={{
                    border: "1.5px solid #FF6B5C",
                    backgroundColor: "rgba(255,107,92,0.05)",
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
                    className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                    style={{ color: "#FF6B5C", letterSpacing: "0.1em" }}
                  >
                    Example answer:
                  </div>
                  <p className="text-sm leading-relaxed pr-4" style={{ color: "#15171C" }}>
                    {hint}
                  </p>
                </div>
              )}

              {/* Option 2: Email */}
              <a
                href={mailto}
                className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition hover:bg-black/[0.03]"
                style={{ border: "1px solid rgba(21,23,28,0.08)" }}
              >
                <Mail className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#FF6B5C" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "#15171C" }}>
                    Chat with support
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(21,23,28,0.50)" }}>
                    Email hello@buildwithmoxiemo.com — we reply fast.
                  </div>
                </div>
              </a>

              {/* Option 3: Discord */}
              <a
                href="https://discord.gg/wa9JFx7nha"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition hover:bg-black/[0.03]"
                style={{ border: "1px solid rgba(21,23,28,0.08)" }}
              >
                <MessageCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#FF6B5C" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "#15171C" }}>
                    Join our Discord
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(21,23,28,0.50)" }}>
                    Hang out with other founders building with MOXIEMO.
                  </div>
                </div>
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}