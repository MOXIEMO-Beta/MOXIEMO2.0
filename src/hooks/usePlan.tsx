import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { currentMonthKey, GENERATION_LIMIT, PlanId } from "@/lib/planConfig";

type Usage = { generations_used: number; month: string } | null;

type Ctx = {
  plan: PlanId;
  usage: Usage;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Check before firing a generation. Returns true if allowed. If false, opens upgrade dialog. */
  checkGenerationLimit: () => Promise<boolean>;
  /** Call AFTER a successful generation to increment usage. */
  incrementUsage: () => Promise<void>;
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
    const month = currentMonthKey();
    const [{ data: prof }, { data: usageRow }] = await Promise.all([
      supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
      supabase
        .from("usage_tracking")
        .select("generations_used, month, last_reset")
        .eq("user_id", user.id)
        .eq("month", month)
        .maybeSingle(),
    ]);
    const p = ((prof as { plan?: string } | null)?.plan as PlanId) || "founding_member";
    setPlan(p);
    setUsage(usageRow ? { generations_used: usageRow.generations_used ?? 0, month: usageRow.month } : { generations_used: 0, month });
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

    const month = currentMonthKey();
    const { data: row } = await supabase
      .from("usage_tracking")
      .select("id, generations_used, month, last_reset")
      .eq("user_id", user.id)
      .eq("month", month)
      .maybeSingle();

    let used = 0;
    if (!row) {
      const { error: insertErr } = await supabase
        .from("usage_tracking")
        .insert({ user_id: user.id, month, generations_used: 0, last_reset: new Date().toISOString() });
      if (insertErr && insertErr.code !== "23505") {
        console.error("usage_tracking insert failed", insertErr);
      }
      used = 0;
    } else {
      used = row.generations_used ?? 0;
    }
    setUsage({ generations_used: used, month });

    if (used >= limit) {
      setUpgradeOpen(plan);
      return false;
    }
    return true;
  }, [user, plan]);

  const incrementUsage = useCallback(async () => {
    if (!user) return;
    const limit = GENERATION_LIMIT[plan];
    if (limit === null) return;
    const month = currentMonthKey();
    const newCount = (usage?.generations_used ?? 0) + 1;
    const { error } = await supabase
      .from("usage_tracking")
      .update({ generations_used: newCount })
      .eq("user_id", user.id)
      .eq("month", month);
    if (error) {
      console.error("usage_tracking increment failed", error);
      return;
    }
    setUsage({ generations_used: newCount, month });
  }, [user, plan, usage]);

  const value = useMemo<Ctx>(
    () => ({ plan, usage, loading, refresh: fetchAll, checkGenerationLimit, incrementUsage, openUpgrade, upgradeOpen, closeUpgrade }),
    [plan, usage, loading, fetchAll, checkGenerationLimit, incrementUsage, openUpgrade, upgradeOpen, closeUpgrade],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}