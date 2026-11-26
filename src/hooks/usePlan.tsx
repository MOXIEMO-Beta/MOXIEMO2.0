import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { currentMonthKey, GENERATION_LIMIT, PlanId } from "@/lib/planConfig";

type Usage = { generations_used: number; month: string; reset_date?: string | null } | null;

type ServerUsage = { plan?: string; used?: number; limit?: number | null; month?: string; reset_date?: string | null };

type Ctx = {
  plan: PlanId;
  usage: Usage;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Check before firing a generation. Returns true if allowed. If false, opens upgrade dialog. */
  checkGenerationLimit: () => Promise<boolean>;
  /** Refresh usage after a server-side generation (server already incremented). */
  incrementUsage: () => Promise<void>;
  /** Inspect the response from a generation edge function. Returns true if the server blocked the call. */
  handleGenerationResponse: (data: unknown, error: unknown) => boolean;
  /** Apply a usage snapshot returned by the server (avoids a refetch). */
  applyServerUsage: (u: ServerUsage | undefined | null) => void;
  openUpgrade: (forPlan?: PlanId) => void;
  upgradeOpen: PlanId | null;
  closeUpgrade: () => void;
};

const PlanContext = createContext<Ctx | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanId>("founding_member");
  const [usage, setUsage] = useState<Usage>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState<PlanId | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setPlan("founding_member");
      setUsage(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [acctRes, usageRes] = await Promise.all([
      supabase.from("accounts").select("plan").eq("owner_id", user.id).maybeSingle(),
      supabase
        .from("usage_tracking")
        .select("generations_used, month, last_reset, reset_date")
        .eq("user_id", user.id)
        .order("last_reset", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    const acct = acctRes.error ? null : acctRes.data;
    const usageRow = usageRes.error ? null : usageRes.data;
    type UsageRow = { reset_date?: string | null };
    const usage = usageRow as (typeof usageRow & UsageRow) | null;
    const p = ((acct as { plan?: string } | null)?.plan as PlanId) || "founding_member";
    setPlan(p);
    if (usage) {
      // If the stored period has already elapsed, the next server-side
      // generation will reset to 0. Reflect that optimistically in the UI.
      const resetAt = usage.reset_date ? new Date(usage.reset_date) : null;
      const elapsed = resetAt && !isNaN(resetAt.getTime()) && resetAt.getTime() <= Date.now();
      setUsage({
        generations_used: elapsed ? 0 : (usage.generations_used ?? 0),
        month: usage.month,
        reset_date: usage.reset_date ?? null,
      });
    } else {
      setUsage({ generations_used: 0, month: currentMonthKey(), reset_date: null });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openUpgrade = useCallback((forPlan?: PlanId) => {
    setUpgradeOpen(forPlan ?? plan);
  }, [plan]);

  const closeUpgrade = useCallback(() => setUpgradeOpen(null), []);

  const checkGenerationLimit = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    const limit = GENERATION_LIMIT[plan];
    if (limit === null) return true; // unlimited

    // Optimistic client-side check using last-known usage. The edge function
    // is the authoritative enforcer — this is only to avoid an obvious round-trip.
    const used = usage?.generations_used ?? 0;
    if (used >= limit) {
      setUpgradeOpen(plan);
      return false;
    }
    return true;
  }, [user, plan, usage]);

  const incrementUsage = useCallback(async () => {
    // Server-side enforcement increments and returns the new usage via the
    // generation response. We just refresh from the DB to stay in sync.
    await fetchAll();
  }, [fetchAll]);

  const applyServerUsage = useCallback((u: ServerUsage | undefined | null) => {
    if (!u || typeof u.used !== "number") return;
    const month = u.month || currentMonthKey();
    setUsage({ generations_used: u.used, month, reset_date: u.reset_date ?? null });
    if (u.plan && u.plan !== plan) setPlan(u.plan as PlanId);
  }, [plan]);

  const handleGenerationResponse = useCallback((data: unknown, error: unknown): boolean => {
    // Server returned { limit_reached: true, ... } in the body (with 200).
    const d = (data ?? {}) as { limit_reached?: boolean; usage?: ServerUsage } & ServerUsage;
    if (d?.limit_reached) {
      // Sync local state to server snapshot before opening dialog.
      applyServerUsage({ plan: d.plan, used: d.used, limit: d.limit, month: d.month, reset_date: d.reset_date });
      setUpgradeOpen((d.plan as PlanId) ?? plan);
      return true;
    }
    // Some legacy paths may surface a 4xx with a message — also catch that.
    const errMsg = (error as { message?: string } | null)?.message ?? "";
    if (errMsg.toLowerCase().includes("limit_reached")) {
      setUpgradeOpen(plan);
      return true;
    }
    // Success path: edge function returns { ..., usage: { used, limit, plan, month } }
    if (d?.usage) applyServerUsage(d.usage);
    return false;
  }, [plan, applyServerUsage]);

  const value = useMemo<Ctx>(
    () => ({ plan, usage, loading, refresh: fetchAll, checkGenerationLimit, incrementUsage, handleGenerationResponse, applyServerUsage, openUpgrade, upgradeOpen, closeUpgrade }),
    [plan, usage, loading, fetchAll, checkGenerationLimit, incrementUsage, handleGenerationResponse, applyServerUsage, openUpgrade, upgradeOpen, closeUpgrade],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}