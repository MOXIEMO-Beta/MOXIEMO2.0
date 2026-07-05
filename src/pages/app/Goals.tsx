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
  paying_users: number | null;
  mrr: number | null;
  retention_pct: number | null;
  testimonials: number | null;
  discovery_calls: number | null;
  posts_published: number | null;
  email_opens: number | null;
  notes: string | null;
  created_at?: string;
};

type Strategy = {
  success_definition: string | null;
  business_goal: string | null;
  strength_score: number | null;
  content_pillars: unknown;
  created_at: string | null;
};

const CORAL = "#E85A46";
const CORAL_LIGHT = "#FF8A6B";
const NAVY = "hsl(var(--brand-navy))";
const CORAL_TINT = "#F4C9BC";
const CORAL_TINT_SOFT = "#F4D9CF";
const LABEL_MUTED = "#AEB9C9";
const INK = "#15171C";
const CONFETTI_COLORS = ["#E85A46", "#FF8A6B", "#14243D", "#F4C9BC", "#AEB9C9", "#FFFFFF"];

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

function weeksSince(startIso: string | null | undefined): number {
  if (!startIso) return 1;
  const start = new Date(startIso);
  if (isNaN(start.getTime())) return 1;
  const now = new Date();
  const days = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  const n = Math.floor(days / 7) + 1;
  return Math.min(52, Math.max(1, n));
}

function lastReported<K extends keyof GoalEntry>(entries: GoalEntry[], key: K): number | null {
  for (const e of entries) {
    const v = e[key];
    if (typeof v === "number" && !isNaN(v)) return v;
  }
  return null;
}

function fmtMoney(n: number | null): string {
  if (n === null || n === undefined) return "Not reported";
  return `$${n.toLocaleString()}`;
}
function fmtInt(n: number | null): string {
  if (n === null || n === undefined) return "Not reported";
  return String(n);
}
function fmtPct(n: number | null): string {
  if (n === null || n === undefined) return "Not reported";
  return `${n}%`;
}

type Field = {
  key: "paying_users" | "mrr" | "retention_pct" | "testimonials" | "discovery_calls";
  label: string;
  hint: string;
  prefix?: string;
  suffix?: string;
};

const FIELDS: Field[] = [
  { key: "paying_users", label: "Paying users", hint: "Total count today." },
  { key: "mrr", label: "MRR this month", hint: "Dollars, entered directly.", prefix: "$" },
  { key: "retention_pct", label: "Retention", hint: "Percent still active.", suffix: "%" },
  { key: "testimonials", label: "Testimonials", hint: "Wow moments captured." },
  { key: "discovery_calls", label: "Discovery calls", hint: "Booked this period." },
];

export default function Goals() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [entries, setEntries] = useState<GoalEntry[]>([]);
  const [engine, setEngine] = useState({ pieces: 0, drafts: 0, pillarsCovered: 0, pillarsTotal: 5 });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inputs, setInputs] = useState<Record<Field["key"], string>>({
    paying_users: "", mrr: "", retention_pct: "", testimonials: "", discovery_calls: "",
  });

  const currentWeek = useMemo(() => startOfWeekISO(), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
      const [stratRes, entriesRes, postsRes] = await Promise.all([
        supabase.from("strategies").select("success_definition, business_goal, strength_score, content_pillars, created_at").eq("user_id", user.id).maybeSingle(),
        supabase.from("goal_entries").select("*").eq("user_id", user.id).order("week_of", { ascending: false }).limit(24),
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

      const next: Record<Field["key"], string> = { paying_users: "", mrr: "", retention_pct: "", testimonials: "", discovery_calls: "" };
      for (const f of FIELDS) {
        const v = lastReported(ents, f.key);
        next[f.key] = v === null ? "" : String(v);
      }
      setInputs(next);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const weekNum = useMemo(() => weeksSince(strategy?.created_at ?? null), [strategy]);
  const yearPct = Math.min(100, Math.round((weekNum / 52) * 100));

  const payingNow = useMemo(() => lastReported(entries, "paying_users"), [entries]);
  const mrrNow = useMemo(() => lastReported(entries, "mrr"), [entries]);
  const retentionNow = useMemo(() => lastReported(entries, "retention_pct"), [entries]);
  const testimonialsNow = useMemo(() => lastReported(entries, "testimonials"), [entries]);

  async function saveNumbers() {
    if (!user) return;
    setSaving(true);
    try {
      const parse = (s: string): number | null => {
        if (s.trim() === "") return null;
        const n = parseInt(s, 10);
        return isNaN(n) ? null : n;
      };
      const payload = {
        user_id: user.id,
        week_of: currentWeek,
        paying_users: parse(inputs.paying_users),
        mrr: parse(inputs.mrr),
        retention_pct: parse(inputs.retention_pct),
        testimonials: parse(inputs.testimonials),
        discovery_calls: parse(inputs.discovery_calls),
      };
      const { data, error } = await supabase
        .from("goal_entries")
        .upsert(payload, { onConflict: "user_id,week_of" })
        .select()
        .single();
      if (error) throw error;
      const saved = data as GoalEntry;
      setEntries((prev) => {
        const others = prev.filter((e) => e.week_of !== currentWeek);
        return [saved, ...others].sort((a, b) => (a.week_of < b.week_of ? 1 : -1)).slice(0, 24);
      });
      setSaved(true);
      brandFire();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Try again.";
      toast.error("Could not save", { description: msg });
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
    { category: "Growth", pill: "you", title: "Reach $80K MRR", target: "$80K", now: fmtMoney(mrrNow), meta: "Jun 2027", lever: "Enter MRR each month, it never derives from user count." },
    { category: "Conversion", pill: "moxie", title: "Audit lead to paid trial", target: "15%", now: "0%", meta: "Brand Audit", lever: "Improves when audit CTA converts." },
    { category: "Retention", pill: "you", title: "Hold cohort retention", target: "85%", now: fmtPct(retentionNow), meta: "Month 1", lever: "Report monthly once cohorts land." },
    { category: "Advocacy", pill: "you", title: "Wow testimonials and referrals", target: "20", now: fmtInt(testimonialsNow), meta: "Founding", lever: "Ask happy founders to write one." },
  ] as const;

  const payingProgress = payingNow ?? 0;
  const payingPct = Math.min(100, (payingProgress / 500) * 100);

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

      {/* NORTH STAR HERO — NAVY */}
      <section
        className="relative overflow-hidden rounded-2xl p-8 md:p-10 shadow-[0_18px_40px_-18px_rgba(20,36,61,0.55)]"
        style={{ background: NAVY }}
      >
        <div className="absolute top-4 right-6 text-white/15 text-4xl select-none pointer-events-none">✦</div>
        <div className="absolute bottom-8 right-16 text-white/10 text-2xl select-none pointer-events-none">✦</div>
        <div className="absolute top-16 right-24 text-white/10 text-xl select-none pointer-events-none">✦</div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: CORAL_LIGHT }}>★ North star</span>
          <span
            className="text-[11px] uppercase tracking-wider font-semibold rounded-full px-2.5 py-1"
            style={{ background: "rgba(255,255,255,0.12)", color: CORAL_TINT_SOFT }}
          >
            ◔ You report this
          </span>
        </div>
        <h2 className="font-display font-bold text-[26px] md:text-[32px] leading-tight" style={{ color: "#FFFFFF" }}>
          500 paying users in 12 months
        </h2>
        <p className="mt-2 text-sm md:text-base font-medium" style={{ color: CORAL_TINT }}>
          $80K MRR · $960K ARR · by June 2027
        </p>

        {/* Milestone bar */}
        <div className="mt-6">
          <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.14)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${payingPct}%`, background: CORAL }} />
            {[10, 30, 60].map((t) => (
              <div key={t} className="absolute top-0 bottom-0 w-px" style={{ left: `${t}%`, background: "rgba(255,255,255,0.4)" }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-semibold" style={{ color: LABEL_MUTED }}>
            <span>0</span><span>50</span><span>150</span><span>300</span><span>500 🎉</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs md:text-sm max-w-md flex items-center gap-2" style={{ color: LABEL_MUTED }}>
            <span style={{ color: CORAL_LIGHT }}>→</span>
            Lever: every paying user pulls the North Star forward. Log wins as they close.
          </p>
          <button
            onClick={brandFire}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
            style={{ background: CORAL }}
          >
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
              <span
                className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                style={c.pill === "moxie"
                  ? { background: "#EAF7EF", color: "#16A34A" }
                  : { background: "#FEF3E2", color: "#D97706" }}
              >
                {c.pill === "moxie" ? "✓ MOXIEMO tracks" : "◔ You report"}
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
          { title: "Publication features", value: "0 of 4 to 6" },
          { title: "Platform awards", value: "0 of 3 to 4" },
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

      {/* UPDATE YOUR NUMBERS */}
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
              Numbers saved. Come back anytime to update any field.
            </p>
            <button
              onClick={() => setSaved(false)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
              style={{ background: CORAL }}
            >
              Update numbers again
            </button>
          </div>
        ) : (
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] font-bold mb-2" style={{ color: CORAL }}>Update your numbers</div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-1">One field per goal you report.</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Each field is pre-filled with your last reported value. Update what changed, leave the rest. Every field is optional.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
              {FIELDS.map((f) => (
                <label key={f.key} className="block">
                  <span className="text-xs font-medium text-foreground">{f.label}</span>
                  <div className="relative mt-1">
                    {f.prefix && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{f.prefix}</span>
                    )}
                    <input
                      type="number" min={0}
                      value={inputs[f.key]}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      className="block w-full rounded-lg border border-border bg-background py-2 text-base focus:outline-none focus:ring-2 focus:ring-[--ring]"
                      style={{ paddingLeft: f.prefix ? 24 : 12, paddingRight: f.suffix ? 28 : 12 }}
                      placeholder=""
                    />
                    {f.suffix && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{f.suffix}</span>
                    )}
                  </div>
                  <span className="mt-1 block text-[11px] text-muted-foreground">{f.hint}</span>
                </label>
              ))}
            </div>
            <button
              onClick={saveNumbers}
              disabled={saving}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-60"
              style={{ background: CORAL }}
            >
              {saving ? "Saving..." : "Save numbers"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}