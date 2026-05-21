import { useEffect, useRef, useState } from "react";
import { Pause, Play, LayoutDashboard, MessageSquare, Target, FileText, Calendar, BarChart3 } from "lucide-react";

const CORAL = "#FF6B5C";
const INK = "#15171C";
const PAPER = "#F7F5F1";
const MUTED = "rgba(21,23,28,0.50)";
const DIVIDER = "rgba(21,23,28,0.08)";

const SCENE_DURATION = 10000;
const SCENES = [
  { id: 0, key: "DISCOVERY", label: "Discovery", kicker: "01 DISCOVERY" },
  { id: 1, key: "BUILDING", label: "Building", kicker: "02 STRATEGY ENGINE" },
  { id: 2, key: "DASHBOARD", label: "Dashboard", kicker: "03 DASHBOARD" },
  { id: 3, key: "STRATEGY", label: "Strategy", kicker: "04 STRATEGY" },
];

const NAV_ITEMS = [
  { key: "Dashboard", icon: LayoutDashboard },
  { key: "Discovery", icon: MessageSquare },
  { key: "Strategy", icon: Target },
  { key: "Content", icon: FileText },
  { key: "Planner", icon: Calendar },
  { key: "Analytics", icon: BarChart3 },
];

function Sidebar({ active }: { active: string }) {
  return (
    <div className="flex flex-col" style={{ width: 180, background: INK, color: "#fff" }}>
      <div style={{ background: PAPER, padding: "14px 16px", display: "flex", alignItems: "center" }}>
        <img src="/MOXIEMO_Logo_No_background.png" style={{ width: 140 }} alt="MOXIEMO" />
      </div>
      <div className="flex-1 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium"
              style={{
                background: isActive ? "rgba(255,107,92,0.15)" : "transparent",
                color: isActive ? CORAL : "rgba(255,255,255,0.75)",
                borderLeft: isActive ? `2px solid ${CORAL}` : "2px solid transparent",
              }}
            >
              <Icon size={13} />
              <span>{item.key}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div
          className="flex items-center justify-center text-[10px] font-bold"
          style={{ width: 28, height: 28, borderRadius: 999, background: CORAL, color: "#fff" }}
        >
          KL
        </div>
        <div className="leading-tight">
          <div className="text-[11px] font-semibold text-white">Karee L.</div>
          <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>Founding Member</div>
        </div>
      </div>
    </div>
  );
}

function TopBar({ name }: { name: string }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-2.5"
      style={{ borderBottom: `1px solid ${DIVIDER}`, background: "#fff" }}
    >
      <div className="text-[12px] font-semibold" style={{ color: INK }}>{name}</div>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: CORAL }} />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: CORAL }} />
        </span>
        <span className="text-[10px] font-medium" style={{ color: MUTED }}>LIVE</span>
      </div>
    </div>
  );
}

/* ---------- Scene 1: Discovery ---------- */
const DISCOVERY_MSGS = [
  { from: "moxie", text: "Hi Karee — let's build your strategy together. Who do you serve best?" },
  { from: "user", text: "Female founders scaling past $250K who feel scattered." },
  { from: "moxie", text: "Love that. What's the transformation they get with you?" },
  { from: "user", text: "They go from chaos to a calm, repeatable marketing engine." },
  { from: "moxie", text: "Beautiful. What makes your approach different?" },
  { from: "user", text: "I blend operator-level execution with brand soul." },
  { from: "moxie", text: "Got it. And what's the goal for the next 90 days?" },
  { from: "user", text: "Sign 6 high-fit clients without burning out on content." },
  { from: "moxie", text: "Perfect — synthesizing your positioning now." },
  { from: "user", text: "Yes please." },
];

function DiscoveryScene({ progress }: { progress: number }) {
  // reveal messages over time
  const visibleCount = Math.min(DISCOVERY_MSGS.length, Math.floor(progress * (DISCOVERY_MSGS.length + 1)));
  const showTyping = visibleCount < DISCOVERY_MSGS.length && (progress * (DISCOVERY_MSGS.length + 1)) % 1 > 0.4;
  return (
    <div className="flex flex-1 flex-col" style={{ background: PAPER }}>
      <TopBar name="Discovery" />
      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-6 py-4">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.18em]"
            style={{ background: "rgba(255,107,92,0.12)", color: CORAL }}
          >
            ◈ MOXIEMO DISCOVERY
          </span>
        </div>
        <h3 className="text-[18px] font-bold leading-tight" style={{ color: INK }}>
          Build your strategy through conversation.
        </h3>
        <div className="flex flex-1 flex-col gap-2 overflow-hidden">
          {DISCOVERY_MSGS.slice(0, visibleCount).map((m, i) => {
            const isMoxie = m.from === "moxie";
            return (
              <div
                key={i}
                className={`flex items-end gap-2 ${isMoxie ? "justify-start" : "justify-end"} animate-fade-in`}
                style={{ animationDuration: "300ms" }}
              >
                {isMoxie && (
                  <div
                    className="flex items-center justify-center text-[9px] font-bold"
                    style={{ width: 20, height: 20, borderRadius: 999, background: CORAL, color: "#fff" }}
                  >
                    M
                  </div>
                )}
                <div
                  className="max-w-[70%] rounded-2xl px-3 py-2 text-[11px] leading-snug"
                  style={
                    isMoxie
                      ? { background: "#fff", color: INK, border: `1px solid ${DIVIDER}` }
                      : { background: CORAL, color: "#fff" }
                  }
                >
                  {m.text}
                </div>
              </div>
            );
          })}
          {showTyping && (
            <div className="flex items-end gap-2">
              <div
                className="flex items-center justify-center text-[9px] font-bold"
                style={{ width: 20, height: 20, borderRadius: 999, background: CORAL, color: "#fff" }}
              >
                M
              </div>
              <div className="flex gap-1 rounded-2xl bg-white px-3 py-2.5" style={{ border: `1px solid ${DIVIDER}` }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="block h-1.5 w-1.5 rounded-full"
                    style={{
                      background: MUTED,
                      animation: `mxmDot 1s ${i * 0.15}s infinite ease-in-out`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div
          className="flex items-center gap-2 rounded-full bg-white px-3 py-2"
          style={{ border: `1px solid ${DIVIDER}` }}
        >
          <span className="flex-1 text-[11px]" style={{ color: MUTED }}>Your answer...</span>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full text-white"
            style={{ background: CORAL }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Scene 2: Building ---------- */
const BUILD_TASKS = [
  "Analyzing your answers",
  "Mapping your audience",
  "Synthesizing positioning",
  "Generating quarterly themes",
  "Drafting content pillars",
  "Compiling your strategy",
];

function BuildingScene({ progress }: { progress: number }) {
  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden"
      style={{
        background: "#0B0C10",
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
        color: "#fff",
      }}
    >
      <div className="flex flex-1 gap-6 px-6 py-5">
        <div className="flex flex-1 flex-col gap-3">
          <span
            className="self-start rounded-full px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.18em]"
            style={{ background: "rgba(255,107,92,0.12)", color: CORAL }}
          >
            ◈ 02 — STRATEGY ENGINE
          </span>
          <h3 className="text-[18px] font-bold leading-tight">
            Turning your answers into a year of content.
          </h3>
          <div className="mt-2 flex flex-col gap-2">
            {BUILD_TASKS.map((task, i) => {
              const taskProgress = Math.max(0, Math.min(1, progress * BUILD_TASKS.length - i));
              const done = taskProgress >= 1;
              return (
                <div key={task} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="block h-1.5 w-1.5 rounded-full"
                        style={{
                          background: done ? CORAL : "rgba(255,255,255,0.3)",
                          boxShadow: done ? `0 0 8px ${CORAL}` : "none",
                        }}
                      />
                      <span style={{ color: done ? "#fff" : "rgba(255,255,255,0.7)" }}>{task}</span>
                    </div>
                    <span style={{ color: CORAL }} className="font-mono">
                      {Math.round(taskProgress * 100)}%
                    </span>
                  </div>
                  <div className="h-[3px] w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full transition-all"
                      style={{ width: `${taskProgress * 100}%`, background: CORAL }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-auto">
            <div className="mb-1 flex items-center justify-between text-[9px]">
              <span className="font-mono tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
                MOXIEMO · STRATEGY ENGINE
              </span>
              <span className="font-mono" style={{ color: CORAL }}>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full" style={{ width: `${progress * 100}%`, background: CORAL }} />
            </div>
          </div>
        </div>
        <div className="hidden w-[180px] items-center justify-center md:flex">
          <svg viewBox="0 0 160 160" width="160" height="160">
            {[1, 2, 3].map((r, idx) => (
              <circle
                key={r}
                cx="80"
                cy="80"
                r={r * 24}
                fill="none"
                stroke={CORAL}
                strokeOpacity={0.3}
                strokeWidth="1"
                style={{ animation: `mxmPulse 2s ${idx * 0.3}s infinite ease-out` }}
              />
            ))}
            <circle cx="80" cy="80" r="3" fill={CORAL} />
            {[0, 1, 2, 3].map((i) => {
              const angle = (progress * 360 + i * 90) * (Math.PI / 180);
              const x = 80 + Math.cos(angle) * 56;
              const y = 80 + Math.sin(angle) * 56;
              return <circle key={i} cx={x} cy={y} r="3" fill={CORAL} opacity={0.8} />;
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ---------- Scene 3: Dashboard ---------- */
const KPIS = [
  { label: "Content Published", value: "24", delta: "+18%" },
  { label: "Avg. Engagement", value: "4.6%", delta: "+0.8%" },
  { label: "Leads Generated", value: "31", delta: "+12" },
  { label: "Brand Consistency", value: "94%", delta: "+6%" },
];
const QUEUE = [
  { ch: "LinkedIn post", status: "Draft", color: "rgba(255,107,92,0.15)", text: CORAL },
  { ch: "Newsletter", status: "Scheduled", color: "rgba(99,102,241,0.15)", text: "#4f46e5" },
  { ch: "Instagram", status: "Published", color: "rgba(16,185,129,0.15)", text: "#059669" },
];

function DashboardScene({ progress }: { progress: number }) {
  const underlineW = Math.min(1, progress * 2);
  return (
    <div className="flex flex-1 flex-col" style={{ background: PAPER }}>
      <TopBar name="Dashboard" />
      <div className="flex flex-1 flex-col gap-4 px-6 py-5">
        <div>
          <h3 className="inline-block text-[20px] font-bold leading-tight" style={{ color: INK }}>
            Good afternoon, Karee.
            <div
              className="mt-1 h-[3px] rounded-full transition-all duration-700"
              style={{ width: `${underlineW * 140}px`, background: CORAL }}
            />
          </h3>
          <p className="mt-2 text-[12px]" style={{ color: MUTED }}>You have 1 draft ready to review.</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="rounded-xl bg-white p-3 animate-fade-in"
              style={{ border: `1px solid ${DIVIDER}`, animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
            >
              <div className="text-[9px] font-medium uppercase tracking-wider" style={{ color: MUTED }}>{k.label}</div>
              <div className="mt-1 text-[18px] font-bold" style={{ color: INK }}>{k.value}</div>
              <div className="text-[10px] font-semibold" style={{ color: CORAL }}>{k.delta}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-white" style={{ border: `1px solid ${DIVIDER}` }}>
          <div className="px-4 py-2.5 text-[11px] font-semibold" style={{ color: INK, borderBottom: `1px solid ${DIVIDER}` }}>
            Content Queue
          </div>
          {QUEUE.map((q, i) => (
            <div
              key={q.ch}
              className="flex items-center justify-between px-4 py-2.5 animate-fade-in"
              style={{
                borderBottom: i < QUEUE.length - 1 ? `1px solid ${DIVIDER}` : "none",
                animationDelay: `${300 + i * 100}ms`,
                animationFillMode: "backwards",
              }}
            >
              <div className="text-[11px] font-medium" style={{ color: INK }}>{q.ch}</div>
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ background: q.color, color: q.text }}
              >
                {q.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Scene 4: Strategy ---------- */
const PILLARS = [
  { name: "Authority", color: "#FF6B5C" },
  { name: "Education", color: "#6366f1" },
  { name: "Behind-the-Scenes", color: "#0ea5e9" },
  { name: "Engagement", color: "#10b981" },
  { name: "Client Stories", color: "#f59e0b" },
];
const CALENDAR = [
  { date: "Apr 02", title: "The CMO mindset for solo founders", channel: "LinkedIn", pillar: "Authority" },
  { date: "Apr 09", title: "5 signals you're outgrowing DIY marketing", channel: "Newsletter", pillar: "Education" },
  { date: "Apr 16", title: "Inside a real MOXIEMO build week", channel: "Instagram", pillar: "Behind-the-Scenes" },
  { date: "Apr 23", title: "Ask Me Anything: positioning", channel: "LinkedIn Live", pillar: "Engagement" },
  { date: "Apr 30", title: "How Sarah went from chaos to clarity", channel: "LinkedIn", pillar: "Client Stories" },
  { date: "May 07", title: "The strategy doc nobody reads (and what to do instead)", channel: "Newsletter", pillar: "Authority" },
  { date: "May 14", title: "Content pillars, explained simply", channel: "LinkedIn", pillar: "Education" },
  { date: "May 21", title: "Founder feature: meet the MOXIEMO community", channel: "Instagram", pillar: "Client Stories" },
];

function StrategyScene({ progress }: { progress: number }) {
  const visible = Math.min(CALENDAR.length, Math.ceil(progress * CALENDAR.length * 1.5));
  return (
    <div className="flex flex-1 flex-col" style={{ background: PAPER }}>
      <TopBar name="Strategy" />
      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-6 py-4">
        <span
          className="self-start rounded-full px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.18em]"
          style={{ background: "rgba(21,23,28,0.06)", color: INK }}
        >
          04 — A YEAR OF STRATEGIC CONTENT
        </span>
        <h3 className="text-[18px] font-bold leading-tight" style={{ color: INK }}>
          From answers to a full calendar.
        </h3>
        <div className="flex flex-wrap gap-2">
          {PILLARS.map((p) => (
            <div key={p.name} className="flex items-center gap-1.5">
              <span className="block h-2 w-2 rounded-full" style={{ background: p.color }} />
              <span className="text-[10px] font-medium" style={{ color: INK }}>{p.name}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
          {CALENDAR.slice(0, visible).map((c, i) => {
            const pillar = PILLARS.find((p) => p.name === c.pillar)!;
            return (
              <div
                key={c.date + c.title}
                className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 animate-fade-in"
                style={{
                  border: `1px solid ${DIVIDER}`,
                  borderLeft: `3px solid ${pillar.color}`,
                  animationDuration: "300ms",
                  animationDelay: `${i * 60}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <div className="w-12 text-[10px] font-mono font-semibold" style={{ color: MUTED }}>{c.date}</div>
                <div className="flex-1 text-[11px] font-medium" style={{ color: INK }}>{c.title}</div>
                <div className="text-[9px]" style={{ color: MUTED }}>
                  {c.channel} · <span style={{ color: pillar.color, fontWeight: 600 }}>{c.pillar}</span>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                  style={{ background: "rgba(16,185,129,0.15)", color: "#059669" }}
                >
                  Ready
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Main component ---------- */
export function MoxiemoDemoShowcase() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    function tick(ts: number) {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      if (playing) {
        setProgress((prev) => {
          const next = prev + dt / SCENE_DURATION;
          if (next >= 1) {
            setSceneIndex((i) => (i + 1) % SCENES.length);
            return 0;
          }
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing]);

  function jumpTo(i: number) {
    setSceneIndex(i);
    setProgress(0);
  }

  const activeNav =
    sceneIndex === 0 ? "Discovery" : sceneIndex === 2 ? "Dashboard" : sceneIndex === 3 ? "Strategy" : "";

  return (
    <div
      className="mx-auto w-full max-w-[1100px] overflow-hidden rounded-2xl"
      style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)", border: `1px solid ${DIVIDER}`, background: "#fff", maxWidth: "min(1100px, 100vw)", boxSizing: "border-box" }}
    >
      <style>{`
        @keyframes mxmDot { 0%,80%,100% { opacity: 0.2; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-2px); } }
        @keyframes mxmPulse { 0% { transform: scale(0.6); opacity: 0.8; } 100% { transform: scale(1.4); opacity: 0; } }
      `}</style>

      {/* Browser chrome */}
      <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2.5" style={{ background: "#1A1A1A" }}>
        <div className="hidden sm:flex gap-1.5">
          <span className="block h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
          <span className="block h-3 w-3 rounded-full" style={{ background: "#febc2e" }} />
          <span className="block h-3 w-3 rounded-full" style={{ background: "#28c840" }} />
        </div>
        <div className="flex flex-1 items-center justify-center gap-1 min-w-0 flex-wrap">
          {SCENES.map((s, i) => {
            const active = i === sceneIndex;
            return (
              <button
                key={s.id}
                onClick={() => jumpTo(i)}
                className="rounded-md px-2 sm:px-2.5 py-1 font-semibold transition-colors whitespace-nowrap"
                style={{
                  fontSize: "clamp(9px, 2vw, 11px)",
                  background: active ? "rgba(255,107,92,0.18)" : "rgba(255,255,255,0.06)",
                  color: active ? CORAL : "rgba(255,255,255,0.7)",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div
          className="hidden items-center rounded-md px-3 py-1 text-[10px] md:flex"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", minWidth: 200 }}
        >
          <span className="mr-1.5" style={{ color: "#28c840" }}>●</span>
          app.buildwithmoxiemo.com
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={12} /> : <Play size={12} />}
        </button>
      </div>

      {/* App shell */}
      <div className="relative flex w-full" style={{ aspectRatio: "16 / 10", minHeight: 320 }}>
        <Sidebar active={activeNav} />
        <div className="relative flex flex-1 overflow-hidden">
          {sceneIndex === 0 && <DiscoveryScene progress={progress} />}
          {sceneIndex === 1 && <BuildingScene progress={progress} />}
          {sceneIndex === 2 && <DashboardScene progress={progress} />}
          {sceneIndex === 3 && <StrategyScene progress={progress} />}

          {/* Kicker */}
          <div
            className="absolute bottom-3 left-3 rounded-full px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.18em] backdrop-blur"
            style={{ background: "rgba(11,12,16,0.7)", color: "#fff" }}
          >
            {SCENES[sceneIndex].kicker}
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "rgba(0,0,0,0.06)" }}>
          <div className="h-full transition-[width] duration-100" style={{ width: `${progress * 100}%`, background: CORAL }} />
        </div>
      </div>
    </div>
  );
}

export default MoxiemoDemoShowcase;