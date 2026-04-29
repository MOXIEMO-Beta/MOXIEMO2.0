import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Target, Sparkles, Loader2, Compass } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type GoalEntry = {
  id: string;
  user_id: string;
  week_of: string;
  discovery_calls: number;
  posts_published: number;
  email_opens: number;
  notes: string | null;
};

type Strategy = {
  success_definition: string | null;
  business_goal: string | null;
  strength_score: number | null;
};

function startOfWeekISO(d = new Date()): string {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun..6 Sat
  const diff = (day + 6) % 7; // Monday-based
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function formatWeek(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Goals() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [entries, setEntries] = useState<GoalEntry[]>([]);
  const [savingField, setSavingField] = useState<string | null>(null);

  const currentWeek = useMemo(() => startOfWeekISO(), []);
  const currentEntry = useMemo(
    () => entries.find((e) => e.week_of === currentWeek),
    [entries, currentWeek],
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [stratRes, entriesRes] = await Promise.all([
        supabase
          .from("strategies")
          .select("success_definition, business_goal, strength_score")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("goal_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("week_of", { ascending: false })
          .limit(8),
      ]);
      if (cancelled) return;
      if (stratRes.error) console.error(stratRes.error);
      if (entriesRes.error) console.error(entriesRes.error);
      setStrategy(stratRes.data ?? null);
      setEntries((entriesRes.data ?? []) as GoalEntry[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function upsertField(
    weekOf: string,
    field: "discovery_calls" | "posts_published" | "email_opens" | "notes",
    value: number | string | null,
  ) {
    if (!user) return;
    const fieldKey = `${weekOf}:${field}`;
    setSavingField(fieldKey);
    try {
      const existing = entries.find((e) => e.week_of === weekOf);
      const payload: any = {
        user_id: user.id,
        week_of: weekOf,
        discovery_calls: existing?.discovery_calls ?? 0,
        posts_published: existing?.posts_published ?? 0,
        email_opens: existing?.email_opens ?? 0,
        notes: existing?.notes ?? null,
        [field]: value,
      };
      const { data, error } = await supabase
        .from("goal_entries")
        .upsert(payload, { onConflict: "user_id,week_of" })
        .select()
        .single();
      if (error) throw error;
      setEntries((prev) => {
        const others = prev.filter((e) => e.week_of !== weekOf);
        return [data as GoalEntry, ...others].sort((a, b) => (a.week_of < b.week_of ? 1 : -1)).slice(0, 8);
      });
    } catch (e: any) {
      console.error(e);
      toast.error("Couldn't save", { description: e?.message ?? "Try again." });
    } finally {
      setSavingField(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const hasStrategy = !!strategy?.success_definition;

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">
            <Target className="h-3.5 w-3.5" /> Your Goals
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-foreground">
            {hasStrategy ? strategy!.success_definition : "Complete your strategy to set goals"}
          </h1>
          {!hasStrategy && (
            <Button asChild variant="default" className="mt-4">
              <Link to="/app/discovery">
                <Sparkles className="h-4 w-4 mr-2" /> Start MOXIE Discovery
              </Link>
            </Button>
          )}
        </div>
      </div>

      {hasStrategy && (
        <>
          {/* Primary goal card */}
          <Card className="p-8 bg-card border-border">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Success looks like</div>
            <p className="font-display text-2xl md:text-3xl text-foreground leading-snug mb-8">
              {strategy!.success_definition}
            </p>
            <div className="border-t border-border pt-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                How many discovery calls did you book this week?
              </label>
              <div className="flex items-center gap-3 max-w-sm">
                <Input
                  type="number"
                  min={0}
                  defaultValue={currentEntry?.discovery_calls ?? 0}
                  onBlur={(e) =>
                    upsertField(currentWeek, "discovery_calls", parseInt(e.target.value || "0", 10))
                  }
                  className="text-lg"
                />
                {savingField === `${currentWeek}:discovery_calls` && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Week of {formatWeek(currentWeek)}
              </div>
            </div>
          </Card>

          {/* 3-column metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-card border-border">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">This week</div>
              <div className="font-display text-lg text-foreground mb-3">Posts published</div>
              <Input
                type="number"
                min={0}
                defaultValue={currentEntry?.posts_published ?? 0}
                onBlur={(e) =>
                  upsertField(currentWeek, "posts_published", parseInt(e.target.value || "0", 10))
                }
              />
            </Card>
            <Card className="p-6 bg-card border-border">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">This week</div>
              <div className="font-display text-lg text-foreground mb-3">Email open rate %</div>
              <Input
                type="number"
                min={0}
                max={100}
                defaultValue={currentEntry?.email_opens ?? 0}
                onBlur={(e) =>
                  upsertField(currentWeek, "email_opens", parseInt(e.target.value || "0", 10))
                }
              />
            </Card>
            <Card className="p-6 bg-card border-border">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">From strategy</div>
              <div className="font-display text-lg text-foreground mb-3">Strategy strength</div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl text-foreground">
                  {strategy!.strength_score ?? "—"}
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
            </Card>
          </div>

          {/* Weekly log */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-1">Log</div>
                <h2 className="font-display text-xl text-foreground">Last 8 weeks</h2>
              </div>
              <Badge variant="secondary" className="text-xs">{entries.length} {entries.length === 1 ? "week" : "weeks"}</Badge>
            </div>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No entries yet — your weekly numbers will appear here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Week</th>
                      <th className="py-2 pr-4 font-medium">Calls</th>
                      <th className="py-2 pr-4 font-medium">Posts</th>
                      <th className="py-2 pr-4 font-medium">Email opens %</th>
                      <th className="py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-b border-border/60">
                        <td className="py-3 pr-4 text-foreground whitespace-nowrap">
                          {formatWeek(entry.week_of)}
                        </td>
                        <td className="py-2 pr-4">
                          <Input
                            type="number"
                            min={0}
                            defaultValue={entry.discovery_calls}
                            onBlur={(e) =>
                              upsertField(entry.week_of, "discovery_calls", parseInt(e.target.value || "0", 10))
                            }
                            className="h-9 w-20"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <Input
                            type="number"
                            min={0}
                            defaultValue={entry.posts_published}
                            onBlur={(e) =>
                              upsertField(entry.week_of, "posts_published", parseInt(e.target.value || "0", 10))
                            }
                            className="h-9 w-20"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={entry.email_opens}
                            onBlur={(e) =>
                              upsertField(entry.week_of, "email_opens", parseInt(e.target.value || "0", 10))
                            }
                            className="h-9 w-20"
                          />
                        </td>
                        <td className="py-2">
                          <Textarea
                            defaultValue={entry.notes ?? ""}
                            onBlur={(e) => upsertField(entry.week_of, "notes", e.target.value || null)}
                            placeholder="Add a note…"
                            className="min-h-[36px] h-9 resize-y"
                            rows={1}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Business goal banner */}
          {strategy!.business_goal && (
            <Card className="p-8 bg-accent/10 border-accent/30">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-accent/20 p-3 shrink-0">
                  <Compass className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">Business goal</div>
                  <p className="font-display text-xl md:text-2xl text-foreground leading-snug">
                    {strategy!.business_goal}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}