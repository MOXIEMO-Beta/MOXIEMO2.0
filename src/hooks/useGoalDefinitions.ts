import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { resolveGoalDefinitions } from "@/lib/goalResolver";

export type GoalCard = {
  category: string;
  title: string;
  target: string;
  deadline?: string;
  tracked_by?: "self" | "moxiemo";
  lever?: string;
  metric_key?: string | null;
};

export type NorthStar = {
  title?: string;
  target_value?: string;
  target_unit?: string;
  deadline?: string;
  lever?: string;
  tracked_by?: "self" | "moxiemo";
  metric_key?: string | null;
};

export type SecondaryGoal = { title: string; value: string };

export type GoalDefinitions = {
  id: string;
  user_id: string;
  strategy_id: string | null;
  north_star: NorthStar;
  smart_cards: GoalCard[];
  secondary_goals: SecondaryGoal[];
  generated_at: string;
};

function differs(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);
}

async function persistResolved(original: GoalDefinitions, resolved: GoalDefinitions) {
  if (!differs(original.north_star, resolved.north_star) && !differs(original.smart_cards, resolved.smart_cards)) return;
  const { error } = await supabase
    .from("goal_definitions")
    .update({
      north_star: resolved.north_star as any,
      smart_cards: resolved.smart_cards as any,
    })
    .eq("id", original.id)
    .eq("user_id", original.user_id);
  if (error) {
    console.error("[goalResolver] failed to persist resolved North Star", {
      goal_definition_id: original.id,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  } else {
    console.info("[goalResolver] persisted single-metric North Star", {
      goal_definition_id: original.id,
      target_value: resolved.north_star?.target_value,
      metric_key: resolved.north_star?.metric_key,
      smart_card_count: resolved.smart_cards?.length ?? 0,
    });
  }
}

function logResolution(source: string | undefined, original: GoalDefinitions, resolved: GoalDefinitions) {
  if (!source) return;
  console.info(`[goalResolver] ${source} read path`, {
    goal_definition_id: original.id,
    received: {
      north_star: original.north_star,
      smart_card_count: original.smart_cards?.length ?? 0,
    },
    returned: {
      primary_metric: resolved.north_star,
      secondary_cards: resolved.smart_cards?.filter((card) => {
        const target = String(card?.target ?? "").toLowerCase();
        return !original.smart_cards?.some((originalCard) => String(originalCard?.target ?? "").toLowerCase() === target);
      }) ?? [],
      smart_card_count: resolved.smart_cards?.length ?? 0,
    },
  });
}

export function useGoalDefinitions(opts: { autoGenerate?: boolean; hasStrategy?: boolean; debugSource?: string } = {}) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalDefinitions | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoGenerate = opts.autoGenerate ?? true;

  const generate = useCallback(async (force = false) => {
    setGenerating(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-goal-definitions" + (force ? "?force=1" : ""),
        { body: {} },
      );
      if (error) throw error;
      if (data?.goals) {
        const original = data.goals as GoalDefinitions;
        const resolved = resolveGoalDefinitions(original);
        logResolution(opts.debugSource, original, resolved);
        setGoals(resolved);
        void persistResolved(original, resolved);
        return resolved;
      }
      return null;
    } catch (e: any) {
      setError(e?.message ?? String(e));
      return null;
    } finally {
      setGenerating(false);
    }
  }, [opts.debugSource]);

  useEffect(() => {
    // Reset when user changes so a prior user's cache never bleeds through.
    setGoals(null);
    setError(null);
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("goal_definitions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) setError(error.message);
      if (data) {
        const original = data as unknown as GoalDefinitions;
        const resolved = resolveGoalDefinitions(original);
        logResolution(opts.debugSource, original, resolved);
        setGoals(resolved);
        void persistResolved(original, resolved);
        setLoading(false);
      } else if (autoGenerate && opts.hasStrategy) {
        setLoading(false);
        void generate(false);
      } else {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, autoGenerate, opts.hasStrategy, opts.debugSource, generate]);

  return { goals, loading, generating, error, generate, hasGoals: !!goals?.north_star?.title };
}