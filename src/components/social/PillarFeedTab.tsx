import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Telescope, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PILLAR_COLORS = [
  { dot: "#E85A46", bg: "#FEF1EE", text: "#993C1D" },
  { dot: "#0C447C", bg: "#E6F1FB", text: "#0C447C" },
  { dot: "#27500A", bg: "#EAF3DE", text: "#27500A" },
  { dot: "#633806", bg: "#FAEEDA", text: "#633806" },
  { dot: "#3C3489", bg: "#EEEDFE", text: "#3C3489" },
];

function relativeTime(iso: string | null): string {
  if (!iso) return "Never posted";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}
function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}
function badgeFor(d: number | null) {
  if (d == null) return { bg: "#FEF1EE", color: "#993C1D", label: "No posts yet" };
  if (d <= 7)  return { bg: "#EAF3DE", color: "#3B6D11", label: "Recent" };
  if (d <= 30) return { bg: "#FEF3C7", color: "#854F0B", label: `${d} days` };
  return { bg: "#FEF1EE", color: "#993C1D", label: "30+ days" };
}

export default function PillarFeedTab({ userId }: { userId: string | null }) {
  const navigate = useNavigate();
  const [pillars, setPillars] = useState<string[]>([]);
  const [hasStrategy, setHasStrategy] = useState<boolean | null>(null);
  const [lastByPillar, setLastByPillar] = useState<Record<string, string | null>>({});
  const [angles, setAngles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const { data: strat } = await supabase
        .from("strategies")
        .select("content_pillars, enhanced_foundation")
        .eq("user_id", userId)
        .maybeSingle();
      const ef = (strat as any)?.enhanced_foundation ?? {};
      const raw = ef?.contentPillars ?? (strat as any)?.content_pillars ?? [];
      const list: string[] = (Array.isArray(raw) ? raw : [])
        .map((p: any) => (typeof p === "string" ? p : p?.name ?? p?.title ?? ""))
        .filter(Boolean).slice(0, 5);
      setPillars(list);
      setHasStrategy(list.length > 0);

      if (list.length === 0) { setLoading(false); return; }

      const { data: published } = await supabase
        .from("social_posts")
        .select("pillar, published_at")
        .eq("user_id", userId)
        .eq("status", "published")
        .order("published_at", { ascending: false });
      const last: Record<string, string | null> = {};
      list.forEach((p) => { last[p] = null; });
      (published ?? []).forEach((row: any) => {
        if (row.pillar && last[row.pillar] === null) last[row.pillar] = row.published_at;
      });
      setLastByPillar(last);

      await loadAngles(false);
      setLoading(false);
    })();
  }, [userId]);

  async function loadAngles(force: boolean) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not signed in");
      const { data, error } = await supabase.functions.invoke("generate-pillar-angles", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { refresh: force },
      });
      if (error) throw error;
      const arr = (data?.angles?.angles ?? data?.angles ?? []) as { pillar: string; angle: string }[];
      const map: Record<string, string> = {};
      arr.forEach((a) => { map[a.pillar] = a.angle; });
      setAngles(map);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load angles");
    }
  }

  async function refresh() {
    setRefreshing(true);
    await loadAngles(true);
    setRefreshing(false);
    toast.success("Angles refreshed");
  }

  if (hasStrategy === false) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md"
          style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 14, padding: 32 }}>
          <Telescope size={28} color="#9A9896" className="mx-auto" />
          <div className="mt-3 text-[14px] font-semibold" style={{ color: "#0E0F10" }}>Pillar Feed needs your strategy.</div>
          <div className="mt-1 text-[12px]" style={{ color: "#9A9896" }}>
            Complete Discovery to unlock strategy-anchored post suggestions for each of your content pillars.
          </div>
          <button onClick={() => navigate("/app/discovery")}
            className="mt-4 text-[12px] font-semibold"
            style={{ background: "#E85A46", color: "#fff", borderRadius: 8, padding: "8px 14px" }}>
            Go to Start Here →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-5">
        <button onClick={refresh} disabled={refreshing}
          className="text-[11px] font-medium flex items-center gap-1"
          style={{ color: "#9A9896", border: "0.5px solid #ECEAE5", borderRadius: 20, padding: "4px 12px" }}>
          {refreshing && <Loader2 size={11} className="animate-spin" />}
          Refresh angles
        </button>
      </div>
      {loading ? (
        <div className="text-[12px]" style={{ color: "#9A9896" }}>Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {pillars.map((pillar, i) => {
            const color = PILLAR_COLORS[i % PILLAR_COLORS.length];
            const last = lastByPillar[pillar] ?? null;
            const d = daysSince(last);
            const badge = badgeFor(d);
            const angle = angles[pillar] || "Click Refresh angles to generate a suggestion.";
            const isOdd = pillars.length % 2 === 1 && i === pillars.length - 1;
            return (
              <div key={pillar}
                className={isOdd ? "md:col-span-2" : ""}
                style={{ background: "#fff", border: "0.5px solid #ECEAE5", borderRadius: 14, padding: 20 }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color.dot, display: "inline-block" }} />
                  <span className="text-[14px] font-semibold" style={{ color: "#0E0F10" }}>{pillar}</span>
                </div>
                <div className="text-[12px]" style={{ color: "#9A9896" }}>
                  {last ? `Last posted: ${relativeTime(last)}` : "Never posted"}
                </div>
                <div className="mt-1">
                  <span className="inline-block text-[10px] font-semibold"
                    style={{ background: badge.bg, color: badge.color, borderRadius: 4, padding: "2px 8px" }}>
                    {badge.label}
                  </span>
                </div>
                <p className="mt-3 italic" style={{ color: "#6B6860", fontSize: 12, lineHeight: 1.6 }}>{angle}</p>
                <button
                  onClick={() => navigate(`/app/social?tab=queue&pillar=${encodeURIComponent(pillar)}`)}
                  className="mt-3.5 text-[12px] font-semibold" style={{ color: "#E85A46" }}>
                  Write this post →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}