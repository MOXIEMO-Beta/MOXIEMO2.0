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
  /** Time per task for tasks 1-5 (ms). Task 6 holds indeterminate until done. */
  perTaskMs?: number;
  onFadedOut?: () => void;
};

/**
 * Full-screen branded interstitial shown while the strategy is being generated.
 * - Tasks 1-5 animate sequentially over `perTaskMs` each, then complete.
 * - Task 6 ("Compiling your strategy") enters an indeterminate hold until `done`.
 * - Fades out over ~300ms once `done` is true, then calls `onFadedOut`.
 */
export function StrategyEngineInterstitial({ active, done, perTaskMs = 4500, onFadedOut }: Props) {
  // Elapsed ms drives tasks 1-5; task 6 uses its own looping animation.
  const [elapsed, setElapsed] = useState(0);
  const [fading, setFading] = useState(false);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      setFading(false);
      startRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    startRef.current = performance.now();
    const tick = () => {
      const start = startRef.current ?? performance.now();
      setElapsed(performance.now() - start);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  useEffect(() => {
    if (!active || !done) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const t = window.setTimeout(() => {
      setFading(true);
      const t2 = window.setTimeout(() => onFadedOut?.(), 320);
      return () => window.clearTimeout(t2);
    }, 300);
    return () => window.clearTimeout(t);
  }, [done, active, onFadedOut]);

  if (!active) return null;

  // Tasks 1-5 each fill over perTaskMs (sequential). Task 6 is indeterminate.
  const sequentialCount = TASKS.length - 1; // 5
  const taskPcts: number[] = [];
  for (let i = 0; i < sequentialCount; i++) {
    const taskStart = i * perTaskMs;
    const raw = (elapsed - taskStart) / perTaskMs;
    taskPcts.push(Math.max(0, Math.min(1, raw)));
  }
  // Task 6: 0 until earlier tasks complete, then "indeterminate" — render as
  // an oscillating value (display only); completes to 1 when `done`.
  const seqElapsed = sequentialCount * perTaskMs;
  let task6Pct = 0;
  let task6Indeterminate = false;
  if (done) {
    task6Pct = 1;
  } else if (elapsed >= seqElapsed) {
    task6Indeterminate = true;
    // Oscillate between 0.25 and 0.85 for visual liveliness.
    const phase = ((elapsed - seqElapsed) % 2400) / 2400; // 0..1
    task6Pct = 0.25 + 0.6 * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2));
  }
  const allTaskPcts = [...taskPcts, task6Pct];

  // Master progress: 0..85% across tasks 1-5, then asymptote toward 95%
  // while task 6 holds; jumps to 100% on done.
  let masterPct: number;
  if (done) {
    masterPct = 100;
  } else if (elapsed < seqElapsed) {
    masterPct = Math.round((elapsed / seqElapsed) * 85);
  } else {
    const extra = elapsed - seqElapsed;
    masterPct = Math.round(85 + 10 * (1 - Math.exp(-extra / 30000)));
  }

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
            const taskPct = allTaskPcts[i];
            const isLast = i === TASKS.length - 1;
            const complete = taskPct >= 1 && !(isLast && task6Indeterminate && !done);
            const active = !complete && taskPct > 0;
            const showIndeterminate = isLast && task6Indeterminate && !done;
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
                    animation: showIndeterminate ? "moxie-pulse 1.6s ease-in-out infinite" : undefined,
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
                      {showIndeterminate ? "…" : `${Math.round(taskPct * 100)}%`}
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
            {masterPct}%
          </span>
        </div>
        <div
          className="w-full overflow-hidden"
          style={{ height: 2, backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <div
            style={{
              height: "100%",
              width: `${masterPct}%`,
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