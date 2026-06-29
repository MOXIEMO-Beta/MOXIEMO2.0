import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CalendarTab from "./CalendarTab";

const PILLAR_PALETTE = [
  { dot: "#E85A46", tint: "#FEF1EE", border: "#F5C4B3", text: "#993C1D" },
  { dot: "#0C447C", tint: "#E6F1FB", border: "#B5D4F4", text: "#0C447C" },
  { dot: "#27500A", tint: "#EAF3DE", border: "#C0DD97", text: "#27500A" },
  { dot: "#633806", tint: "#FAEEDA", border: "#FAC775", text: "#633806" },
  { dot: "#3C3489", tint: "#EEEDFE", border: "#CECBF6", text: "#3C3489" },
];

type Props = {
  userId: string | null;
  onEditPost: (postId: string) => void;
  onCreateAtDate: (dateIso: string, pillar?: string) => void;
  onImportFromContent: () => void;
};

export default function CalendarTabWrapper(props: Props) {
  const navigate = useNavigate();
  const { userId } = props;
  const [pillars, setPillars] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [month] = useState(new Date());

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: strat } = await supabase
        .from("strategies")
        .select("content_pillars, enhanced_foundation")
        .eq("user_id", userId).maybeSingle();
      const ef = (strat as any)?.enhanced_foundation ?? {};
      const raw = ef?.contentPillars ?? (strat as any)?.content_pillars ?? [];
      const list: string[] = (Array.isArray(raw) ? raw : [])
        .map((p: any) => (typeof p === "string" ? p : p?.name ?? p?.title ?? ""))
        .filter(Boolean).slice(0, 5);
      setPillars(list);

      const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString();
      const { data: rows } = await supabase
        .from("social_posts")
        .select("pillar, scheduled_for")
        .eq("user_id", userId)
        .gte("scheduled_for", start)
        .lt("scheduled_for", end);
      const c: Record<string, number> = {};
      list.forEach((p) => { c[p] = 0; });
      (rows ?? []).forEach((r: any) => { if (r.pillar && c[r.pillar] != null) c[r.pillar] += 1; });
      setCounts(c);
    })();
  }, [userId, month]);

  const legend = useMemo(() => pillars.map((p, i) => ({ name: p, ...PILLAR_PALETTE[i % PILLAR_PALETTE.length] })), [pillars]);

  return (
    <div className="space-y-4">
      {legend.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {legend.map((p) => (
            <span key={p.name}
              className="text-[11px] font-medium"
              style={{
                background: p.tint, color: p.text,
                borderRadius: 20, padding: "3px 10px",
              }}>{p.name}</span>
          ))}
        </div>
      )}

      <CalendarTab {...props} />

      {legend.length > 0 && (
        <div className="mt-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] mb-2" style={{ color: "#9A9896" }}>
            Pillar coverage this month
          </div>
          <div>
            {legend.map((p) => {
              const n = counts[p.name] ?? 0;
              return (
                <div key={p.name} className="flex items-center gap-2.5 py-2"
                  style={{ borderBottom: "0.5px solid #ECEAE5" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.dot }} />
                  <span className="flex-1 text-[12px] font-medium" style={{ color: "#0E0F10" }}>{p.name}</span>
                  {n === 0 ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold"
                        style={{ background: "#FEF3C7", color: "#854F0B", borderRadius: 4, padding: "2px 8px" }}>
                        Gap
                      </span>
                      <button onClick={() => navigate(`/app/content?pillar=${encodeURIComponent(p.name)}`)}
                        className="text-[12px]" style={{ color: "#E85A46" }}>Create post →</button>
                    </div>
                  ) : (
                    <span className="text-[12px]" style={{ color: "#6B6860" }}>{n} posts</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}