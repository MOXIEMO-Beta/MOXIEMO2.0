import { useEffect, useRef, useState } from "react";

const TASKS = [
  "Analyzing your answers",
  "Mapping your audience",
  "Synthesizing your positioning",
  "Generating quarterly themes",
  "Drafting your content pillars",
  "Compiling your strategy",
];

type Props = {
  active: boolean;
  done: boolean;
  /** Estimated API duration in ms — used to pace progress. */
  estimatedMs?: number;
  onFadedOut?: () => void;
};

/**
 * Full-screen branded interstitial shown while the strategy is being generated.
 * - Progress paces toward 95% over `estimatedMs`, then completes when `done` is true.
 * - Fades out over 300ms once `done` is true, then calls `onFadedOut`.
 */
export function StrategyEngineInterstitial({ active, done, estimatedMs = 45000, onFadedOut }: Props) {
  const [progress, setProgress] = useState(0); // 0..1
  const [fading, setFading] = useState(false);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      setFading(false);
      startRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    startRef.current = performance.now();
    const tick = () => {
      const start = startRef.current ?? performance.now();
      const elapsed = performance.now() - start;
      // Ease toward 95% over estimatedMs; never exceed 0.95 until `done`.
      const raw = Math.min(0.95, elapsed / estimatedMs);
      // Slight easing so it doesn't feel linear.
      const eased = 1 - Math.pow(1 - raw / 0.95, 1.6);
      setProgress(Math.min(0.95, eased * 0.95));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, estimatedMs]);

  useEffect(() => {
    if (!active || !done) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setProgress(1);
    const t = window.setTimeout(() => {
      setFading(true);
      const t2 = window.setTimeout(() => onFadedOut?.(), 320);
      return () => window.clearTimeout(t2);
    }, 400);
    return () => window.clearTimeout(t);
  }, [done, active, onFadedOut]);

  if (!active) return null;

  const pct = Math.round(progress * 100);
  // Distribute tasks across progress: task i runs from i/6 .. (i+1)/6
  const taskCount = TASKS.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse at center, #181B22 0%, #0B0C10 100%)",
        opacity: fading ? 0 : 1,
        transition: "opacity 300ms ease",
      }}
    >
      {/* dot grid overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative flex-1 flex flex-col px-6 sm:px-10 lg:px-16 py-8 sm:py-12 max-w-3xl w-full mx-auto">
        {/* Header pill */}
        <div className="flex">
          <span
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "9px",
              letterSpacing: "0.12em",
              color: "#FF6B5C",
              backgroundColor: "rgba(255,107,92,0.18)",
              border: "1px solid rgba(255,107,92,0.35)",
              borderRadius: "999px",
              padding: "5px 11px",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            ◈ MOXIEMO · STRATEGY ENGINE
          </span>
        </div>

        {/* Headline */}
        <h1
          className="mt-6"
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: "24px",
            lineHeight: 1.2,
            letterSpacing: "-0.025em",
            maxWidth: "420px",
          }}
        >
          Turning your answers into a year of content.
        </h1>

        {/* Task list */}
        <ul className="mt-10 sm:mt-14 space-y-5">
          {TASKS.map((label, i) => {
            const start = i / taskCount;
            const end = (i + 1) / taskCount;
            const taskRaw = (progress - start) / (end - start);
            const taskPct = Math.max(0, Math.min(1, taskRaw));
            const complete = taskPct >= 1;
            const active = taskPct > 0 && !complete;
            return (
              <li key={label} className="flex items-center gap-3 sm:gap-4">
                <span
                  aria-hidden
                  className="flex-shrink-0 rounded-full transition-all duration-300"
                  style={{
                    height: 10,
                    width: 10,
                    backgroundColor: complete || active ? "#FF6B5C" : "rgba(255,255,255,0.12)",
                    boxShadow: complete ? "0 0 8px #FF6B5C" : "none",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="truncate"
                      style={{
                        color: complete ? "#fff" : "rgba(255,255,255,0.70)",
                        fontSize: "14px",
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.55)",
                        flexShrink: 0,
                      }}
                    >
                      {Math.round(taskPct * 100)}%
                    </span>
                  </div>
                  <div
                    className="mt-2 w-full overflow-hidden rounded-full"
                    style={{ height: 3, backgroundColor: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${taskPct * 100}%`,
                        backgroundColor: "#FF6B5C",
                        transition: "width 200ms linear",
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Master progress bar */}
      <div className="relative px-6 sm:px-10 lg:px-16 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "9px",
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
            }}
          >
            MOXIEMO · Strategy Engine
          </span>
          <span
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "9px",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            {pct}%
          </span>
        </div>
        <div
          className="w-full overflow-hidden"
          style={{ height: 2, backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              backgroundColor: "#FF6B5C",
              transition: "width 200ms linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default StrategyEngineInterstitial;