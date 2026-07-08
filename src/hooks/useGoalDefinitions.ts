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

export function useGoalDefinitions(opts: { autoGenerate?: boolean; hasStrategy?: boolean } = {}) {
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
        const resolved = resolveGoalDefinitions(data.goals as GoalDefinitions);
        setGoals(resolved);
        return resolved;
      }
      return null;
    } catch (e: any) {
      setError(e?.message ?? String(e));
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

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
        setGoals(resolveGoalDefinitions(data as unknown as GoalDefinitions));
        setLoading(false);
      } else if (autoGenerate && opts.hasStrategy) {
        setLoading(false);
        void generate(false);
      } else {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, autoGenerate, opts.hasStrategy, generate]);

  return { goals, loading, generating, error, generate, hasGoals: !!goals?.north_star?.title };
}