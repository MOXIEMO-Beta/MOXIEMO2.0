import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, RotateCcw, History, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PageLoader } from "@/components/ui/PageLoader";

// ─── Design tokens (matches brand, keeps Admin self-contained) ────────────────
const C = {
  coral: "#FF6B5C", navy: "#14243D", paper: "#F7F5F1",
  warmPaper: "#F4F2ED", white: "#FFFFFF", ink: "#15171C",
  muted: "#6B6B6B", sage: "#B8C5A6", border: "#E8E4DD",
  green: "#22C55E", red: "#EF4444", amber: "#F59E0B",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminTab = "members" | "flags" | "reservations" | "playbook" | "content";

type Member = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  email: string | null;
  plan: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  is_admin: boolean | null;
  created_at: string | null;
};

type FlagRow = {
  key: string;
  enabled: boolean;
  description: string | null;
};

type PlaybookRule = {
  id: string;
  version: number;
  rule_key: string;
  rule_text: string;
  why_line: string;
  conflict_priority: number;
  is_active: boolean;
  updated_at: string;
};

type PlaybookRuleVersion = {
  id: string;
  rule_id: string;
  version: number;
  rule_text: string;
  why_line: string;
  conflict_priority: number;
  is_active: boolean;
  saved_at: string;
};

type PlaybookEditState = {
  rule_text: string;
  why_line: string;
  conflict_priority: number;
  is_active: boolean;
};

type GateCoachingRow = {
  id: string;
  goal_key: string;
  question_number: number;
  heading: string;
  body: string;
  action_line: string;
  return_line: string;
  updated_at: string;
};

type CoachingEditState = {
  heading: string;
  body: string;
  action_line: string;
  return_line: string;
};

// ─── Static label maps ────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  founding_member: { label: "Founding",   color: C.amber },
  foundation:      { label: "Foundation", color: C.coral },
  growth:          { label: "Growth",     color: C.navy  },
  scale:           { label: "Scale",      color: "#7C3AED" },
};

const SUB_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: "Active",    color: C.green },
  inactive:  { label: "Inactive",  color: C.muted },
  cancelled: { label: "Cancelled", color: C.red   },
  past_due:  { label: "Past due",  color: C.amber  },
};

const GOAL_LABELS: Record<string, string> = {
  first_100:    "First 100 customers",
  launch_offer: "Launch an offer",
};

const Q_LABELS: Record<number, { first_100: string; launch_offer: string }> = {
  1: {
    first_100:    "Can a stranger sign up / download / buy it this week?",
    launch_offer: "Can you deliver this offer right now?",
  },
  2: {
    first_100:    'Can you finish: "It helps ___ do ___"?',
    launch_offer: "Has anyone paid for it or committed to it yet?",
  },
  3: {
    first_100:    "Can you name ten real people (or places full of them) who have this problem?",
    launch_offer: "Does it have a price?",
  },
};

// ─── Shared style primitives ──────────────────────────────────────────────────

const card: React.CSSProperties  = { background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 20 };
const th: React.CSSProperties    = { fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: C.muted, padding: "10px 16px", textAlign: "left" as const, borderBottom: `1.5px solid ${C.border}`, background: C.warmPaper };
const td: React.CSSProperties    = { fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ink, padding: "12px 16px", borderBottom: `1px solid ${C.border}` };
const label: React.CSSProperties = { fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, color: C.muted, display: "block", marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: 13, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", background: C.white, outline: "none", boxSizing: "border-box" as const };
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: "vertical" as const };

function pill(text: string, color: string) {
  return (
    <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans Variable',sans-serif", whiteSpace: "nowrap" as const }}>
      {text}
    </span>
  );
}

function relativeTime(iso: string | null) {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)         return "just now";
  if (diff < 3600)       return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [tab, setTab]               = useState<AdminTab>("members");
  const [pageLoading, setPageLoading] = useState(true);

  // Members
  const [members, setMembers]       = useState<Member[]>([]);
  const [search, setSearch]         = useState("");
  const [changingPlan, setChangingPlan] = useState<string | null>(null);

  // Feature flags
  const [flags, setFlags]           = useState<FlagRow[]>([]);
  const [savingFlag, setSavingFlag] = useState<string | null>(null);

  // Reservations
  const [reservations, setReservations] = useState<unknown[]>([]);

  // Playbook rules
  const [playbookRules, setPlaybookRules]   = useState<PlaybookRule[]>([]);
  const [editingRuleId, setEditingRuleId]   = useState<string | null>(null);
  const [editState, setEditState]           = useState<PlaybookEditState | null>(null);
  const [savingRule, setSavingRule]         = useState<string | null>(null);
  const [restoringRule, setRestoringRule]   = useState<string | null>(null);
  const [ruleHistory, setRuleHistory]       = useState<Record<string, PlaybookRuleVersion[]>>({});
  const [openHistoryId, setOpenHistoryId]   = useState<string | null>(null);
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null);

  // Gate coaching
  const [coachingRows, setCoachingRows]         = useState<GateCoachingRow[]>([]);
  const [editingCoachingId, setEditingCoachingId] = useState<string | null>(null);
  const [coachingEditState, setCoachingEditState] = useState<CoachingEditState | null>(null);
  const [savingCoaching, setSavingCoaching]     = useState<string | null>(null);

  // ── Data loaders ─────────────────────────────────────────────────────────────

  const loadMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,business_name,plan,subscription_status,stripe_customer_id,stripe_subscription_id,current_period_end,is_admin,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load members.");
    setMembers((data ?? []) as Member[]);
  }, []);

  const loadFlags = useCallback(async () => {
    const { data, error } = await supabase.from("feature_flags").select("*").order("key");
    if (error) toast.error("Failed to load feature flags.");
    setFlags((data ?? []) as FlagRow[]);
  }, []);

  const loadReservations = useCallback(async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Failed to load reservations.");
    setReservations(data ?? []);
  }, []);

  const loadPlaybookRules = useCallback(async () => {
    const { data, error } = await (supabase.from("playbook_rules") as ReturnType<typeof supabase.from>)
      .select("id,version,rule_key,rule_text,why_line,conflict_priority,is_active,updated_at")
      .order("conflict_priority", { ascending: true });
    if (error) toast.error("Failed to load playbook rules.");
    setPlaybookRules((data ?? []) as PlaybookRule[]);
  }, []);

  const loadCoaching = useCallback(async () => {
    const { data, error } = await (supabase.from("gate_coaching") as ReturnType<typeof supabase.from>)
      .select("id,goal_key,question_number,heading,body,action_line,return_line,updated_at")
      .order("goal_key")
      .order("question_number");
    if (error) toast.error("Failed to load coaching copy.");
    setCoachingRows((data ?? []) as GateCoachingRow[]);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    setPageLoading(true);
    Promise.all([
      loadMembers(),
      loadFlags(),
      loadReservations(),
      loadPlaybookRules(),
      loadCoaching(),
    ]).finally(() => setPageLoading(false));
  }, [isAdmin, loadMembers, loadFlags, loadReservations, loadPlaybookRules, loadCoaching]);

  // ── Auth guard ────────────────────────────────────────────────────────────────

  if (authLoading) return <PageLoader variant="fullscreen" />;
  if (!isAdmin)    return <Navigate to="/app" replace />;
  if (pageLoading) return <PageLoader variant="fullscreen" label="Loading admin…" />;

  // ── Members actions ───────────────────────────────────────────────────────────

  const changePlan = async (memberId: string, newPlan: string) => {
    setChangingPlan(memberId);
    const { error } = await supabase.from("profiles").update({ plan: newPlan } as never).eq("id", memberId);
    if (error) { toast.error("Failed to change plan."); }
    else {
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, plan: newPlan } : m));
      toast.success("Plan updated.");
    }
    setChangingPlan(null);
  };

  // ── Feature flag actions ──────────────────────────────────────────────────────

  const toggleFlag = async (key: string, current: boolean) => {
    setSavingFlag(key);
    const { error } = await supabase.from("feature_flags").update({ enabled: !current, updated_at: new Date().toISOString() } as never).eq("key", key);
    if (error) { toast.error("Failed to update flag."); }
    else {
      setFlags((prev) => prev.map((f) => f.key === key ? { ...f, enabled: !current } : f));
      toast.success(`${key} → ${!current ? "ON" : "OFF"}`);
    }
    setSavingFlag(null);
  };

  // ── Playbook actions ──────────────────────────────────────────────────────────

  const startEditRule = (rule: PlaybookRule) => {
    setEditingRuleId(rule.id);
    setOpenHistoryId(null);
    setEditState({
      rule_text:         rule.rule_text,
      why_line:          rule.why_line,
      conflict_priority: rule.conflict_priority,
      is_active:         rule.is_active,
    });
  };

  const cancelEditRule = () => { setEditingRuleId(null); setEditState(null); };

  const savePlaybookRule = async (ruleId: string, currentVersion: number) => {
    if (!editState) return;
    setSavingRule(ruleId);
    // The DB trigger snapshot_playbook_rule() captures the OLD row automatically
    // before the UPDATE, so the history is preserved without an explicit insert here.
    const { error } = await (supabase.from("playbook_rules") as ReturnType<typeof supabase.from>)
      .update({
        rule_text:         editState.rule_text,
        why_line:          editState.why_line,
        conflict_priority: editState.conflict_priority,
        is_active:         editState.is_active,
        version:           currentVersion + 1,
        updated_at:        new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", ruleId);
    if (error) {
      toast.error("Failed to save rule.");
    } else {
      setPlaybookRules((prev) =>
        prev.map((r) => r.id === ruleId ? { ...r, ...editState, version: currentVersion + 1 } : r),
      );
      // Invalidate cached history so next open reflects the new snapshot
      setRuleHistory((prev) => { const next = { ...prev }; delete next[ruleId]; return next; });
      toast.success("Rule saved. Previous version archived.");
      setEditingRuleId(null);
      setEditState(null);
    }
    setSavingRule(null);
  };

  const loadRuleHistory = async (ruleId: string) => {
    if (ruleHistory[ruleId]) {
      setOpenHistoryId((prev) => prev === ruleId ? null : ruleId);
      return;
    }
    setLoadingHistoryId(ruleId);
    const { data, error } = await (supabase.from("playbook_rule_versions") as ReturnType<typeof supabase.from>)
      .select("id,rule_id,version,rule_text,why_line,conflict_priority,is_active,saved_at")
      .eq("rule_id", ruleId)
      .order("saved_at", { ascending: false })
      .limit(20);
    setLoadingHistoryId(null);
    if (error) { toast.error("Could not load version history."); return; }
    setRuleHistory((prev) => ({ ...prev, [ruleId]: (data ?? []) as PlaybookRuleVersion[] }));
    setOpenHistoryId(ruleId);
  };

  const restoreRuleVersion = async (rule: PlaybookRule, version: PlaybookRuleVersion) => {
    const confirmed = window.confirm(`Restore version ${version.version} of "${rule.rule_key}"? The current version will be archived first.`);
    if (!confirmed) return;
    setRestoringRule(rule.id);
    const { error } = await (supabase.from("playbook_rules") as ReturnType<typeof supabase.from>)
      .update({
        rule_text:         version.rule_text,
        why_line:          version.why_line,
        conflict_priority: version.conflict_priority,
        is_active:         version.is_active,
        version:           rule.version + 1,
        updated_at:        new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", rule.id);
    if (error) {
      toast.error("Restore failed.");
    } else {
      await loadPlaybookRules();
      setRuleHistory((prev) => { const next = { ...prev }; delete next[rule.id]; return next; });
      setOpenHistoryId(null);
      toast.success(`Restored to version ${version.version}. Previous version archived.`);
    }
    setRestoringRule(null);
  };

  // ── Coaching copy actions ─────────────────────────────────────────────────────

  const startEditCoaching = (row: GateCoachingRow) => {
    setEditingCoachingId(row.id);
    setCoachingEditState({
      heading:     row.heading,
      body:        row.body,
      action_line: row.action_line,
      return_line: row.return_line,
    });
  };

  const cancelEditCoaching = () => { setEditingCoachingId(null); setCoachingEditState(null); };

  const saveCoaching = async (rowId: string) => {
    if (!coachingEditState || !user) return;
    setSavingCoaching(rowId);
    const { error } = await (supabase.from("gate_coaching") as ReturnType<typeof supabase.from>)
      .update({
        heading:     coachingEditState.heading.trim(),
        body:        coachingEditState.body.trim(),
        action_line: coachingEditState.action_line.trim(),
        return_line: coachingEditState.return_line.trim(),
        updated_by:  user.id,
        updated_at:  new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", rowId);
    if (error) {
      toast.error("Failed to save coaching copy.");
    } else {
      setCoachingRows((prev) =>
        prev.map((r) => r.id === rowId ? { ...r, ...coachingEditState } : r),
      );
      toast.success("Coaching copy saved. Live immediately.");
      setEditingCoachingId(null);
      setCoachingEditState(null);
    }
    setSavingCoaching(null);
  };

  // ── Derived values ────────────────────────────────────────────────────────────

  const filtered      = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.full_name?.toLowerCase().includes(q) || m.business_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
  });
  const activeCount   = members.filter((m) => m.subscription_status === "active").length;
  const foundingCount = members.filter((m) => m.plan === "founding_member").length;
  const paidCount     = members.filter((m) => m.plan !== "founding_member" && m.plan !== null).length;

  const coachingComplete = coachingRows.length > 0 && coachingRows.every((r) => r.body.trim().length > 0);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: C.paper, minHeight: "100vh", padding: "36px 48px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 24, fontWeight: 700, color: C.ink, margin: 0 }}>
            Admin
          </h1>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, margin: "4px 0 0" }}>
            Only visible to Karee.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total members",    value: members.length  },
            { label: "Active paid",      value: activeCount     },
            { label: "Paid plans",       value: paidCount       },
            { label: "Founding members", value: foundingCount   },
          ].map((s) => (
            <div key={s.label} style={card}>
              <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 32, fontWeight: 800, color: C.ink }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: `1.5px solid ${C.border}`, marginBottom: 24 }}>
          {(["members", "flags", "reservations", "playbook", "content"] as AdminTab[]).map((t) => {
            const labels: Record<AdminTab, string> = {
              members: "Members", flags: "Feature flags", reservations: "Reservations",
              playbook: "Playbook rules", content: "Gate coaching",
            };
            const hasAlert = t === "content" && !coachingComplete;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "10px 20px", border: "none", background: "transparent",
                  fontFamily: "'DM Sans Variable',sans-serif", fontSize: 13, fontWeight: 700,
                  color: tab === t ? C.navy : C.muted, cursor: "pointer",
                  borderBottom: tab === t ? `2px solid ${C.coral}` : "2px solid transparent",
                  marginBottom: -1.5, display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {labels[t]}
                {hasAlert && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.amber, display: "inline-block" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── MEMBERS ── */}
        {tab === "members" && (
          <div style={card}>
            <div style={{ marginBottom: 16 }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or business…"
                style={{ ...inputStyle, width: 340 }}
              />
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Name / Business</th>
                    <th style={th}>Email</th>
                    <th style={th}>Plan</th>
                    <th style={th}>Status</th>
                    <th style={th}>Joined</th>
                    <th style={th}>Change plan</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const planInfo = PLAN_LABELS[m.plan ?? ""] ?? { label: m.plan ?? "—", color: C.muted };
                    const subInfo  = SUB_LABELS[m.subscription_status ?? ""] ?? { label: m.subscription_status ?? "—", color: C.muted };
                    return (
                      <tr key={m.id} style={{ background: m.is_admin ? C.warmPaper : C.white }}>
                        <td style={td}>
                          <div style={{ fontWeight: 600 }}>{m.full_name ?? "—"}</div>
                          <div style={{ color: C.muted, fontSize: 12 }}>{m.business_name ?? "—"}</div>
                          {m.is_admin && <span style={{ fontSize: 10, color: C.coral, fontWeight: 700 }}>ADMIN</span>}
                        </td>
                        <td style={{ ...td, color: C.muted, fontSize: 12 }}>{m.email ?? "—"}</td>
                        <td style={td}>{pill(planInfo.label, planInfo.color)}</td>
                        <td style={td}>{pill(subInfo.label, subInfo.color)}</td>
                        <td style={{ ...td, color: C.muted }}>{relativeTime(m.created_at)}</td>
                        <td style={td}>
                          <select
                            value={m.plan ?? "founding_member"}
                            onChange={(e) => changePlan(m.id, e.target.value)}
                            disabled={changingPlan === m.id}
                            style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, border: `1.5px solid ${C.border}`, borderRadius: 6, padding: "5px 10px", background: C.white, cursor: "pointer" }}
                          >
                            <option value="founding_member">Founding</option>
                            <option value="foundation">Foundation</option>
                            <option value="growth">Growth</option>
                            <option value="scale">Scale</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ ...td, color: C.muted, fontStyle: "italic", textAlign: "center" }}>
                        No members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FEATURE FLAGS ── */}
        {tab === "flags" && (
          <div style={card}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Flag</th>
                  <th style={th}>Description</th>
                  <th style={th}>State</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((f) => (
                  <tr key={f.key}>
                    <td style={{ ...td, fontWeight: 700, fontFamily: "'DM Sans Variable',sans-serif", fontSize: 13 }}>{f.key}</td>
                    <td style={{ ...td, color: C.muted }}>{f.description ?? "—"}</td>
                    <td style={td}>
                      <button
                        onClick={() => toggleFlag(f.key, f.enabled)}
                        disabled={savingFlag === f.key}
                        aria-label={`${f.key} ${f.enabled ? "on" : "off"}`}
                        style={{ width: 48, height: 26, borderRadius: 13, border: "none", background: f.enabled ? C.coral : C.border, cursor: "pointer", position: "relative", transition: "background 0.2s" }}
                      >
                        <span style={{ position: "absolute", top: 3, left: f.enabled ? 25 : 3, width: 20, height: 20, borderRadius: "50%", background: C.white, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                      </button>
                      <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 12, color: f.enabled ? C.coral : C.muted, marginLeft: 10, fontWeight: 700 }}>
                        {f.enabled ? "ON" : "OFF"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── RESERVATIONS ── */}
        {tab === "reservations" && (
          <div style={card}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Email</th>
                  <th style={th}>Business type</th>
                  <th style={th}>Session</th>
                  <th style={th}>UTM source</th>
                  <th style={th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {(reservations as Record<string, unknown>[]).map((r, i) => (
                  <tr key={String(r.id ?? i)}>
                    <td style={td}>{String(r.email ?? "—")}</td>
                    <td style={{ ...td, color: C.muted }}>{String(r.business_type ?? "—")}</td>
                    <td style={{ ...td, color: C.muted }}>{String(r.session_picked ?? "—")}</td>
                    <td style={{ ...td, color: C.muted }}>{String(r.utm_source ?? "—")}</td>
                    <td style={{ ...td, color: C.muted }}>{relativeTime(String(r.created_at ?? ""))}</td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ ...td, color: C.muted, fontStyle: "italic", textAlign: "center" }}>
                      No reservations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PLAYBOOK RULES ── */}
        {tab === "playbook" && (
          <div>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, marginBottom: 16 }}>
              Conflict resolution runs lowest priority number first. Every save archives the previous version automatically. Use History to view or restore any prior version.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {playbookRules.map((rule) => (
                <div key={rule.id} style={{ ...card, padding: 0, overflow: "hidden" }}>

                  {/* Rule header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 20px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 12, fontWeight: 700, color: C.navy }}>{rule.rule_key}</span>
                        {pill(rule.is_active ? "Active" : "Inactive", rule.is_active ? C.green : C.muted)}
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.muted }}>v{rule.version} · updated {relativeTime(rule.updated_at)}</span>
                      </div>
                      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ink, margin: 0, whiteSpace: "pre-wrap" }}>{rule.rule_text}</p>
                      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted, margin: "4px 0 0", fontStyle: "italic" }}>Why: {rule.why_line}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 2 }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editingRuleId === rule.id ? cancelEditRule() : startEditRule(rule)}
                      >
                        {editingRuleId === rule.id ? "Cancel" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loadingHistoryId === rule.id || restoringRule === rule.id}
                        onClick={() => loadRuleHistory(rule.id)}
                        style={{ display: "flex", alignItems: "center", gap: 4 }}
                      >
                        {loadingHistoryId === rule.id
                          ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                          : <History size={12} />
                        }
                        History
                        {openHistoryId === rule.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </Button>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {editingRuleId === rule.id && editState && (
                    <div style={{ background: C.warmPaper, borderTop: `1.5px solid ${C.border}`, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                      <SectionLabel>Edit rule</SectionLabel>
                      <div>
                        <span style={label}>Rule text</span>
                        <textarea
                          value={editState.rule_text}
                          onChange={(e) => setEditState({ ...editState, rule_text: e.target.value })}
                          rows={3}
                          style={textareaStyle}
                        />
                      </div>
                      <div>
                        <span style={label}>Why line</span>
                        <input
                          value={editState.why_line}
                          onChange={(e) => setEditState({ ...editState, why_line: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                        <div>
                          <span style={label}>Conflict priority</span>
                          <input
                            type="number"
                            value={editState.conflict_priority}
                            onChange={(e) => setEditState({ ...editState, conflict_priority: parseInt(e.target.value, 10) || 0 })}
                            style={{ ...inputStyle, width: 90 }}
                          />
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={editState.is_active}
                            onChange={(e) => setEditState({ ...editState, is_active: e.target.checked })}
                          />
                          Active
                        </label>
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <Button
                          size="sm"
                          disabled={savingRule === rule.id}
                          onClick={() => savePlaybookRule(rule.id, rule.version)}
                          style={{ background: C.coral, color: C.white, border: "none" }}
                        >
                          {savingRule === rule.id
                            ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite", marginRight: 6 }} />Saving…</>
                            : "Save — archives current version"
                          }
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditRule}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Version history panel */}
                  {openHistoryId === rule.id && ruleHistory[rule.id] && (
                    <div style={{ borderTop: `1.5px solid ${C.border}`, background: C.warmPaper }}>
                      <div style={{ padding: "12px 20px 8px", fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted }}>
                        Version history ({ruleHistory[rule.id].length} archived)
                      </div>
                      {ruleHistory[rule.id].length === 0 && (
                        <p style={{ padding: "0 20px 16px", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, fontStyle: "italic" }}>
                          No archived versions yet. The first save will create one.
                        </p>
                      )}
                      {ruleHistory[rule.id].map((v) => (
                        <div key={v.id} style={{ borderTop: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                              v{v.version} · saved {relativeTime(v.saved_at)}
                            </div>
                            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.ink, margin: 0, whiteSpace: "pre-wrap" }}>{v.rule_text}</p>
                            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.muted, margin: "2px 0 0", fontStyle: "italic" }}>Why: {v.why_line}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={restoringRule === rule.id}
                            onClick={() => restoreRuleVersion(rule, v)}
                            style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <RotateCcw size={12} />
                            Restore
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {playbookRules.length === 0 && (
                <div style={{ ...card, color: C.muted, fontStyle: "italic", textAlign: "center", padding: 32 }}>
                  No playbook rules found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── GATE COACHING ── */}
        {tab === "content" && (
          <div>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, marginBottom: 8 }}>
              Coaching copy shown to founders who answer "Not yet" on the readiness gate. MOXIE's voice — say what is missing, give one thing to do this week, and say how to come back.
            </p>
            {!coachingComplete && (
              <div style={{ background: C.amber + "22", border: `1.5px solid ${C.amber}`, borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ink }}>
                <strong>Action needed:</strong> Some coaching copy is still empty. The gate will show a placeholder until these are filled.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {coachingRows.map((row) => {
                const goalLabel = GOAL_LABELS[row.goal_key] ?? row.goal_key;
                const qLabel    = Q_LABELS[row.question_number]?.[row.goal_key as keyof typeof Q_LABELS[1]] ?? `Question ${row.question_number}`;
                const isEmpty   = !row.body.trim();
                const isEditing = editingCoachingId === row.id;

                return (
                  <div key={row.id} style={{ ...card, padding: 0, overflow: "hidden", border: isEmpty ? `1.5px solid ${C.amber}` : `1.5px solid ${C.border}` }}>
                    {/* Row header */}
                    <div style={{ padding: "14px 20px", display: "flex", alignItems: "flex-start", gap: 16 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.navy }}>
                            {goalLabel} · Q{row.question_number}
                          </span>
                          {isEmpty
                            ? pill("Empty", C.amber)
                            : pill("Live", C.green)
                          }
                          {!isEmpty && (
                            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.muted }}>
                              updated {relativeTime(row.updated_at)}
                            </span>
                          )}
                        </div>
                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted, margin: 0, fontStyle: "italic" }}>
                          Gate question: {qLabel}
                        </p>
                        {!isEmpty && !isEditing && (
                          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                            {row.heading && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: C.ink, margin: 0 }}>{row.heading}</p>}
                            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ink, margin: 0, whiteSpace: "pre-wrap" }}>{row.body}</p>
                            {row.action_line && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.navy, margin: 0 }}>This week: {row.action_line}</p>}
                            {row.return_line && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted, margin: 0, fontStyle: "italic" }}>{row.return_line}</p>}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => isEditing ? cancelEditCoaching() : startEditCoaching(row)}
                        style={{ flexShrink: 0 }}
                      >
                        {isEditing ? "Cancel" : isEmpty ? "Add copy" : "Edit"}
                      </Button>
                    </div>

                    {/* Inline edit form */}
                    {isEditing && coachingEditState && (
                      <div style={{ background: C.warmPaper, borderTop: `1.5px solid ${C.border}`, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                        <SectionLabel>Edit coaching copy</SectionLabel>
                        <div>
                          <span style={label}>Heading <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(bold first line, optional)</span></span>
                          <input
                            value={coachingEditState.heading}
                            onChange={(e) => setCoachingEditState({ ...coachingEditState, heading: e.target.value })}
                            placeholder="e.g. Here is what is missing."
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <span style={label}>Body copy <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(MOXIE's voice — required)</span></span>
                          <textarea
                            value={coachingEditState.body}
                            onChange={(e) => setCoachingEditState({ ...coachingEditState, body: e.target.value })}
                            rows={4}
                            placeholder="Explain what is missing and why it matters for the strategy…"
                            style={textareaStyle}
                          />
                        </div>
                        <div>
                          <span style={label}>This week: one action <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(required)</span></span>
                          <input
                            value={coachingEditState.action_line}
                            onChange={(e) => setCoachingEditState({ ...coachingEditState, action_line: e.target.value })}
                            placeholder="e.g. Write down five names of people who have this problem."
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <span style={label}>How to come back <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></span>
                          <input
                            value={coachingEditState.return_line}
                            onChange={(e) => setCoachingEditState({ ...coachingEditState, return_line: e.target.value })}
                            placeholder="e.g. When you have your answer, come back and try this question again."
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <Button
                            size="sm"
                            disabled={savingCoaching === row.id || !coachingEditState.body.trim() || !coachingEditState.action_line.trim()}
                            onClick={() => saveCoaching(row.id)}
                            style={{ background: C.coral, color: C.white, border: "none" }}
                          >
                            {savingCoaching === row.id
                              ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite", marginRight: 6 }} />Saving…</>
                              : "Save — goes live immediately"
                            }
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditCoaching}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
