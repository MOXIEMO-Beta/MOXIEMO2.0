import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type GoalEntry = {
  id: string;
  user_id: string;
  week_of: string;
  paying_users: number;
  discovery_calls: number;
  posts_published: number;
  email_opens: number;
  notes: string | null;
};

type Strategy = {
  success_definition: string | null;
  business_goal: string | null;
  strength_score: number | null;
  content_pillars: any;
};

const CORAL = "#E85A46";
const CORAL_LIGHT = "#FF6B5C";
const INK = "#15171C";
const CONFETTI_COLORS = ["#E85A46", "#FF6B5C", "#B8C5A6", "#D97706", "#0A66C2", "#15171C", "#F4B0A3"];

function brandFire() {
  confetti({
    particleCount: 140,
    spread: 90,
    origin: { y: 0.32 },
    colors: CONFETTI_COLORS,
  });
}

function startOfWeekISO(d = new Date()): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function weekOfYear(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = (d.getTime() - start.getTime()) / 86400000;
  return Math.floor(diff / 7) + 1;
}

export default function Goals() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [entries, setEntries] = useState<GoalEntry[]>([]);
  const [engine, setEngine] = useState({ pieces: 0, drafts: 0, pillarsCovered: 0, pillarsTotal: 5 });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payingInput, setPayingInput] = useState<string>("");
  const [callsInput, setCallsInput] = useState<string>("");
  const [noteInput, setNoteInput] = useState<string>("");

  const currentWeek = useMemo(() => startOfWeekISO(), []);
  const currentEntry = useMemo(() => entries.find((e) => e.week_of === currentWeek), [entries, currentWeek]);
  const lastEntry = useMemo(() => entries.find((e) => e.week_of !== currentWeek), [entries, currentWeek]);
  const weekNum = weekOfYear();
  const yearPct = Math.min(100, Math.round((weekNum / 52) * 100));

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
      const [stratRes, entriesRes, postsRes] = await Promise.all([
        supabase.from("strategies").select("success_definition, business_goal, strength_score, content_pillars").eq("user_id", user.id).maybeSingle(),
        supabase.from("goal_entries").select("*").eq("user_id", user.id).order("week_of", { ascending: false }).limit(8),
        supabase.from("social_posts").select("id, status, pillar, created_at").eq("user_id", user.id).gte("created_at", weekStart.toISOString()),
      ]);
      if (cancelled) return;
      const strat = (stratRes.data ?? null) as Strategy | null;
      const ents = (entriesRes.data ?? []) as GoalEntry[];
      const posts = (postsRes.data ?? []) as Array<{ status: string; pillar: string | null }>;
      const pillarsTotal = Array.isArray(strat?.content_pillars) ? Math.max(strat!.content_pillars.length, 5) : 5;
      const pillarsCovered = new Set(posts.map((p) => p.pillar).filter(Boolean)).size;
      const drafts = posts.filter((p) => p.status === "draft").length;
      setStrategy(strat);
      setEntries(ents);
      setEngine({ pieces: posts.length, drafts, pillarsCovered, pillarsTotal });
      // Pre-fill from last week's entry
      const last = ents.find((e) => e.week_of !== currentWeek);
      if (last) {
        setPayingInput(String(last.paying_users ?? 0));
        setCallsInput(String(last.discovery_calls ?? 0));
      }
      const thisWeek = ents.find((e) => e.week_of === currentWeek);
      if (thisWeek) {
        setPayingInput(String(thisWeek.paying_users ?? 0));
        setCallsInput(String(thisWeek.discovery_calls ?? 0));
        setNoteInput(thisWeek.notes ?? "");
        setSaved(true);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, currentWeek]);

  async function saveWeek() {
    if (!user) return;
    setSaving(true);
    try {
      const paying = parseInt(payingInput || "0", 10);
      const calls = parseInt(callsInput || "0", 10);
      const payload = {
        user_id: user.id,
        week_of: currentWeek,
        paying_users: isNaN(paying) ? 0 : paying,
        discovery_calls: isNaN(calls) ? 0 : calls,
        posts_published: currentEntry?.posts_published ?? 0,
        email_opens: currentEntry?.email_opens ?? 0,
        notes: noteInput.trim() ? noteInput.trim() : null,
      };
      const { data, error } = await supabase.from("goal_entries").upsert(payload, { onConflict: "user_id,week_of" }).select().single();
      if (error) throw error;
      setEntries((prev) => {
        const others = prev.filter((e) => e.week_of !== currentWeek);
        return [data as GoalEntry, ...others].sort((a, b) => (a.week_of < b.week_of ? 1 : -1)).slice(0, 8);
      });
      setSaved(true);
      brandFire();
    } catch (e: any) {
      toast.error("Could not save", { description: e?.message ?? "Try again." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-56 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  const hasStrategy = !!strategy?.success_definition;
  const payingUsersNow = currentEntry?.paying_users ?? 0;
  const strength = strategy?.strength_score ?? 0;

  if (!hasStrategy) {
    return (
      <div className="p-6 md:p-10 max-w-3xl">
        <div className="text-[11px] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color: CORAL }}>Your goals</div>
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4">Complete your strategy to set goals</h1>
        <Link to="/app/discovery" className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ background: CORAL }}>
          <Sparkles className="h-4 w-4" /> Start MOXIEMO Discovery
        </Link>
      </div>
    );
  }

  const smartCards = [
    { category: "Growth", pill: { label: "You report", tone: "amber" as const }, title: "Reach $80K MRR", target: "$80K", now: `$${(payingUsersNow * 20).toLocaleString()}`, meta: "Jun 2027", lever: "Grows when paying users climb." },
    { category: "Conversion", pill: { label: "MOXIEMO tracks", tone: "green" as const }, title: "Audit lead to paid trial", target: "15%", now: "0%", meta: "Brand Audit", lever: "Improve when audit CTA converts." },
    { category: "Retention", pill: { label: "You report", tone: "amber" as const }, title: "Hold cohort retention", target: "85%", now: "—", meta: "Month 1", lever: "Report monthly once cohorts land." },
    { category: "Advocacy", pill: { label: "You report", tone: "amber" as const }, title: "Wow testimonials and referrals", target: "20", now: "0", meta: "Founding", lever: "Ask happy founders to write one." },
  ];

  return (
    <div className="w-full p-6 md:p-10 space-y-8">
      {/* HEADER */}
      <header>
        <div className="text-[11px] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color: CORAL }}>Your goals</div>
        <h1 className="font-display text-3xl md:text-[42px] leading-tight text-foreground">Where you are headed.</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-3">
          Week {weekNum} of 52 · Strategy locked at {strength}/100 · The engine is already producing.
        </p>
        <div className="mt-4 h-[5px] w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${yearPct}%`, background: CORAL }} />
        </div>
      </header>

      {/* NORTH STAR HERO */}
      <section className="relative overflow-hidden rounded-2xl p-8 md:p-10 shadow-[0_18px_40px_-18px_rgba(232,90,70,0.55)]"
        style={{ background: `linear-gradient(135deg, ${CORAL_LIGHT} 0%, ${CORAL} 100%)` }}>
        <div className="absolute top-4 right-6 text-white/25 text-4xl select-none pointer-events-none">✦</div>
        <div className="absolute bottom-8 right-16 text-white/20 text-2xl select-none pointer-events-none">✦</div>
        <div className="absolute top-16 right-24 text-white/15 text-xl select-none pointer-events-none">✦</div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: "#4A1B0C" }}>★ North star</span>
          <span className="text-[11px] uppercase tracking-wider font-semibold rounded-full px-2.5 py-1 text-white/95" style={{ background: "rgba(21,23,28,0.35)" }}>◔ You report this</span>
        </div>
        <h2 className="font-display font-bold text-[26px] md:text-[32px] leading-tight" style={{ color: INK }}>
          500 paying users in 12 months
        </h2>
        <p className="mt-2 text-sm md:text-base font-medium" style={{ color: "#6E2412" }}>
          $80K MRR · $960K ARR · by June 2027
        </p>

        {/* Milestone bar */}
        <div className="mt-6">
          <div className="relative h-3 rounded-full bg-white/30 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (payingUsersNow / 500) * 100)}%`, background: INK }} />
            {[10, 30, 60].map((t) => (
              <div key={t} className="absolute top-0 bottom-0 w-px bg-white/50" style={{ left: `${t}%` }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-semibold" style={{ color: "#4A1B0C" }}>
            <span>0</span><span>50</span><span>150</span><span>300</span><span>500 🎉</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs md:text-sm max-w-md" style={{ color: "#4A1B0C" }}>
            Lever: every paying user pulls MRR forward. Log wins as they close.
          </p>
          <button onClick={brandFire} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition" style={{ background: INK }}>
            🎉 Log a win
          </button>
        </div>
      </section>

      {/* SMART CARDS */}
      <section className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        {smartCards.map((c) => (
          <article key={c.title} className="rounded-xl bg-card border border-border p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">{c.category}</span>
              <span className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                style={c.pill.tone === "green"
                  ? { background: "#EAF7EF", color: "#16A34A" }
                  : { background: "#FEF3E2", color: "#D97706" }}>
                {c.pill.tone === "green" ? "✓ " : "◔ "}{c.pill.label}
              </span>
            </div>
            <h3 className="font-display font-semibold text-base text-foreground mb-4 leading-snug">{c.title}</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Target</div>
                <div className="font-display text-lg font-semibold text-foreground">{c.target}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Now</div>
                <div className="font-display text-lg font-semibold text-foreground">{c.now}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">By</div>
                <div className="text-xs font-medium text-foreground mt-1.5">{c.meta}</div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground italic border-t border-border pt-2">{c.lever}</p>
          </article>
        ))}
      </section>

      {/* SECONDARY GOALS STRIP */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { title: "Publication features", value: "0 of 4–6" },
          { title: "Platform awards", value: "0 of 3–4" },
          { title: "Social growth", value: "Baseline from zero" },
        ].map((t) => (
          <div key={t.title} className="rounded-[10px] p-4" style={{ background: "#F7F6F3" }}>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{t.title}</div>
            <div className="text-sm font-semibold text-foreground">{t.value}</div>
          </div>
        ))}
      </section>

      {/* ENGINE HEALTH */}
      <section className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: "#16A34A" }}>⚡ Engine health, this week</div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Logged for you</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Pieces generated", value: String(engine.pieces) },
            { label: "Pillar coverage", value: `${engine.pillarsCovered} of ${engine.pillarsTotal}` },
            { label: "Strategy strength", value: String(strength), coral: true },
            { label: "Drafts ready", value: String(engine.drafts) },
          ].map((t) => (
            <div key={t.label} className="rounded-lg border border-border/60 p-4" style={{ background: "#FAFAF7" }}>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t.label}</div>
              <div className="font-display text-2xl font-semibold" style={{ color: t.coral ? CORAL : INK }}>{t.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WEEKLY CHECK-IN */}
      <section
        className="rounded-xl p-6 md:p-8 border transition-colors"
        style={saved
          ? { background: "linear-gradient(135deg, #FFF3F0 0%, #FEEDE8 100%)", borderColor: "#F8CFC5" }
          : { background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
      >
        {saved ? (
          <div>
            <div className="text-3xl mb-2">🎉</div>
            <h3 className="font-display text-2xl font-semibold text-foreground mb-1">Week {weekNum} is in the books!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Streak going. Come back next Monday and keep the numbers honest.
            </p>
            <button
              onClick={() => setSaved(false)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
              style={{ background: CORAL }}
            >
              Log another number
            </button>
          </div>
        ) : (
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] font-bold mb-2" style={{ color: CORAL }}>Weekly check-in</div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-1">Two numbers. Two minutes.</h3>
            <p className="text-sm text-muted-foreground mb-5">
              We pre-filled last week to save typing. Adjust or skip. Both fields optional.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <label className="block">
                <span className="text-xs font-medium text-foreground">Paying users</span>
                <input
                  type="number" min={0} value={payingInput}
                  onChange={(e) => setPayingInput(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[--ring]"
                  placeholder="0"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-foreground">Discovery calls booked</span>
                <input
                  type="number" min={0} value={callsInput}
                  onChange={(e) => setCallsInput(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[--ring]"
                  placeholder="0"
                />
              </label>
            </div>
            <label className="block mb-5">
              <span className="text-xs font-medium text-foreground">Note (optional)</span>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[--ring]"
                placeholder="What moved this week?"
              />
            </label>
            <button
              onClick={saveWeek}
              disabled={saving}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-60"
              style={{ background: CORAL }}
            >
              {saving ? "Saving..." : "Save week"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
