import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { aiErrorMessage } from "@/lib/aiErrors";
import { toast } from "sonner";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ensureItemIds,
  persistItemIdBackfill,
  resolveCalendarDates,
  groupByWeek as groupResolvedByWeek,
  fetchOverrides,
  swapCalendarItems,
  type ResolvedCalendarItem,
  type CalendarOverride,
} from "@/lib/contentCalendar";
import {
  Calendar as CalendarIcon,
  Download,
  Sparkles,
  X,
  RefreshCw,
  Send,
  Linkedin,
  Instagram,
  Facebook,
  Mail,
  Twitter,
  FileText,
} from "lucide-react";

// ---------- Types ----------
type CalItem = {
  date?: string;
  day?: string;
  platform?: string;
  topic?: string;
  title?: string;
  theme?: string;
  pillar?: string;
  contentType?: string;
};

// ---------- Platform helpers ----------
function platformKey(p?: string): "linkedin" | "instagram" | "email" | "facebook" | "twitter" | "other" {
  const s = (p || "").toLowerCase();
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("instagram")) return "instagram";
  if (s.includes("email") || s.includes("newsletter")) return "email";
  if (s.includes("facebook")) return "facebook";
  if (s.includes("twitter") || s.includes("x /") || s.trim() === "x") return "twitter";
  return "other";
}

function PlatformIcon({ platform, size = 16 }: { platform?: string; size?: number }) {
  const k = platformKey(platform);
  const style = { width: size, height: size } as const;
  if (k === "linkedin") return <Linkedin style={style} fill="#0A66C2" color="#0A66C2" />;
  if (k === "instagram") return <Instagram style={style} color="#C13584" />;
  if (k === "email") return <Mail style={style} color="#E85A46" />;
  if (k === "facebook") return <Facebook style={style} fill="#1877F2" color="#1877F2" />;
  if (k === "twitter") return <Twitter style={style} color="#15171C" />;
  return <FileText style={style} color="#9A9896" />;
}

function fullPlatformLabel(p?: string): string {
  const k = platformKey(p);
  if (k === "linkedin") return "LinkedIn Post";
  if (k === "instagram") return "Instagram Caption";
  if (k === "email") return "Newsletter Section";
  if (k === "facebook") return "Facebook Post";
  if (k === "twitter") return "X / Twitter";
  return p || "LinkedIn Post";
}

function lengthHint(p?: string): string {
  const k = platformKey(p);
  if (k === "linkedin") return "Targeting 150–200 words — optimal for LinkedIn reach and saves";
  if (k === "instagram") return "Targeting 125 char hook + 300 char body — hook must land before 'more' cutoff";
  if (k === "email") return "Targeting 200–350 words — one topic, one CTA, scannable";
  if (k === "facebook") return "Targeting 40–80 words — concise posts get 3× the reach on Facebook";
  if (k === "twitter") return "Targeting 240–260 characters — just under the limit for quote-tweet room";
  return "Targeting platform-optimal length";
}

// ---------- Date helpers ----------
function parseDate(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function fmtCard(d: Date): string {
  const day = d.toLocaleDateString(undefined, { weekday: "short" });
  return `${day} · ${fmtShort(d)}`;
}

function downloadCsv(rows: ResolvedCalendarItem[]) {
  const headers = ["date", "platform", "topic", "pillar"] as const;
  const csv = [headers.join(",")]
    .concat(
      rows.map((r) =>
        headers
          .map((h) => {
            const v = h === "date" ? r.resolvedDate : (r as any)[h];
            return `"${(v ?? "").toString().replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `content-calendar-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Main component ----------
export default function ContentCalendarTab({ strategy }: { strategy: any }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkGenerationLimit, handleGenerationResponse } = usePlan();
  const ef = (strategy?.enhanced_foundation || {}) as any;
  const calRaw: CalItem[] = Array.isArray(ef.contentCalendar) ? ef.contentCalendar : [];

  // Ensure every item has a stable item_id (backfill on first load if missing).
  const { items: itemsWithIds, mutated } = useMemo(() => ensureItemIds(calRaw), [calRaw]);
  useEffect(() => {
    if (mutated && user?.id) {
      void persistItemIdBackfill(user.id, strategy, itemsWithIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutated, user?.id]);

  const [overrides, setOverrides] = useState<CalendarOverride[]>([]);
  const [overridesLoaded, setOverridesLoaded] = useState(false);
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const rows = await fetchOverrides(user.id);
      if (!cancelled) {
        setOverrides(rows);
        setOverridesLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  async function refetchOverrides() {
    if (!user?.id) return;
    const rows = await fetchOverrides(user.id);
    setOverrides(rows);
  }

  const calendar: (ResolvedCalendarItem & { _d: Date | null; _i: number })[] = useMemo(() => {
    const resolved = resolveCalendarDates(itemsWithIds, overrides);
    return [...resolved]
      .sort((a, b) => (a.resolvedDate || "").localeCompare(b.resolvedDate || ""))
      .map((it, i) => ({ ...it, _i: i, _d: parseDate(it.resolvedDate) }));
  }, [itemsWithIds, overrides]);

  const weeks = useMemo(() => {
    const out: { week: number; items: typeof calendar }[] = [];
    for (let i = 0; i < calendar.length; i += 7) {
      out.push({ week: Math.floor(i / 7) + 1, items: calendar.slice(i, i + 7) });
    }
    return out;
  }, [calendar]);

  const [moreExpanded, setMoreExpanded] = useState(false);
  const [openPost, setOpenPost] = useState<CalItem | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || !user?.id) return;
    const aId = String(active.id);
    const bId = String(over.id);
    if (aId === bId) return;
    const a = calendar.find((c) => c.item_id === aId);
    const b = calendar.find((c) => c.item_id === bId);
    if (!a || !b) return;
    // Optimistic swap
    const prev = overrides;
    const next = new Map(prev.map((o) => [o.item_id, o.override_date]));
    next.set(a.item_id, b.resolvedDate);
    next.set(b.item_id, a.resolvedDate);
    setOverrides(Array.from(next, ([item_id, override_date]) => ({ item_id, override_date })));
    setFlashIds(new Set([a.item_id, b.item_id]));
    setTimeout(() => setFlashIds(new Set()), 320);
    try {
      await swapCalendarItems(user.id, a, b);
      await refetchOverrides();
    } catch (e: any) {
      console.error(e);
      toast.error("Couldn't reorder", { description: e?.message });
      setOverrides(prev);
    }
  }

  if (calendar.length === 0) {
    return (
      <div style={{ padding: "28px 0" }}>
        <div
          className="mx-auto text-center"
          style={{
            border: "1px solid #ECEAE5",
            borderRadius: 14,
            padding: 56,
            maxWidth: 520,
          }}
        >
          <CalendarIcon size={32} color="#ECEAE5" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "#15171C", marginBottom: 6 }}>
            Your content calendar isn't ready yet
          </div>
          <div style={{ fontSize: 13, color: "#9A9896", marginBottom: 20 }}>
            Complete your strategy to unlock your 30-day content calendar.
          </div>
          <button
            onClick={() => navigate("/app/strategy")}
            style={{
              background: "#E85A46",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Go to Strategy →
          </button>
        </div>
      </div>
    );
  }

  const firstTwo = weeks.slice(0, 2);
  const lastTwo = weeks.slice(2);

  function weekRange(items: typeof calendar): string {
    const ds = items.map((i) => i._d).filter(Boolean) as Date[];
    if (ds.length === 0) return "";
    const a = ds[0];
    const b = ds[ds.length - 1];
    return `${fmtShort(a)} – ${fmtShort(b)}`;
  }

  function renderWeek(w: { week: number; items: typeof calendar }) {
    return (
      <div key={w.week} className="mb-8">
        <div className="flex items-center mb-3" style={{ gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "#9A9896" }}>
            WEEK {w.week}
          </span>
          <span style={{ fontSize: 11, color: "#9A9896" }}>{weekRange(w.items)}</span>
          <div style={{ flex: 1, height: 0.5, background: "#ECEAE5" }} />
          <span style={{ fontSize: 11, color: "#9A9896" }}>{w.items.length} posts</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          {w.items.map((it: any, i: number) => (
            <PostCard
              key={it.item_id}
              item={it}
              onOpen={() => setOpenPost(it)}
              isDragging={activeDragId === it.item_id}
              flash={flashIds.has(it.item_id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      autoScroll={{ threshold: { x: 0, y: 0.15 } }}
      onDragStart={(e: DragStartEvent) => setActiveDragId(String(e.active.id))}
      onDragCancel={() => setActiveDragId(null)}
      onDragEnd={handleDragEnd}
    >
    <div style={{ padding: "28px 0" }}>
      <div className="flex items-start justify-between" style={{ marginBottom: 24 }}>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#9A9896",
              marginBottom: 4,
            }}
            className="uppercase"
          >
            CONTENT
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#15171C", marginBottom: 3 }}>
            Content Calendar
          </h2>
          <p style={{ fontSize: 13, color: "#9A9896", margin: 0 }}>
            30 days from your strategy. Drag to reorder. Click any post to generate.
          </p>
        </div>
        <button
          onClick={() => downloadCsv(calendar)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            borderRadius: 8,
            padding: "6px 14px",
            border: "1px solid #ECEAE5",
            background: "#fff",
            color: "#15171C",
            cursor: "pointer",
          }}
        >
          <Download size={12} /> CSV
        </button>
      </div>

      {firstTwo.map(renderWeek)}

      {lastTwo.length > 0 && (
        <>
          {!moreExpanded ? (
            <button
              onClick={() => setMoreExpanded(true)}
              style={{
                background: "none",
                border: "none",
                color: "#E85A46",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              Show {lastTwo.reduce((acc, w) => acc + w.items.length, 0)} more ↓
            </button>
          ) : (
            <>
              {lastTwo.map(renderWeek)}
              <button
                onClick={() => setMoreExpanded(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#E85A46",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "4px 0",
                }}
              >
                Hide weeks 3 & 4 ↑
              </button>
            </>
          )}
        </>
      )}

      {openPost && (
        <GenerateModal
          item={openPost}
          strategy={strategy}
          user={user}
          onClose={() => setOpenPost(null)}
          checkGenerationLimit={checkGenerationLimit}
          handleGenerationResponse={handleGenerationResponse}
        />
      )}
    </div>
    </DndContext>
  );
}

// ---------- Post Card ----------
function PostCard({
  item,
  onOpen,
  isDragging,
  flash,
}: {
  item: any;
  onOpen: () => void;
  isDragging?: boolean;
  flash?: boolean;
}) {
  const title = item.topic || item.title || "Untitled post";
  const pillar = item.pillar || item.theme || "";
  const d = item._d as Date | null;
  const { attributes, listeners, setNodeRef: setDragRef, transform } = useDraggable({ id: item.item_id });
  const { isOver, setNodeRef: setDropRef } = useDroppable({ id: item.item_id });
  const setRef = (el: HTMLElement | null) => {
    setDragRef(el);
    setDropRef(el);
  };
  const style: React.CSSProperties = {
    background: flash ? "#FEF1EE" : "#fff",
    border: isOver ? "1.5px solid #E85A46" : "0.5px solid #ECEAE5",
    borderRadius: 14,
    padding: "14px 16px",
    cursor: isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0.4 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: flash ? "background 0.3s ease" : "border-color 0.15s, background 0.3s ease",
    touchAction: "none",
  };
  return (
    <div
      ref={setRef}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      style={style}
    >
      <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "#9A9896" }}>
          {d ? fmtCard(d) : item.day || ""}
        </span>
        <PlatformIcon platform={item.platform} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "#15171C", lineHeight: 1.4, marginBottom: 5 }}>
        {title}
      </div>
      {pillar && <div style={{ fontSize: 11, color: "#9A9896" }}>{pillar}</div>}
      <div style={{ marginTop: 10 }}>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 500,
            color: "#15171C",
            border: "1px solid #E85A46",
            borderRadius: 20,
            padding: "4px 10px",
            background: "transparent",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF1EE")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Sparkles size={11} /> Generate
        </span>
      </div>
    </div>
  );
}

// ---------- Generation Modal ----------
function GenerateModal({
  item,
  strategy,
  user,
  onClose,
  checkGenerationLimit,
  handleGenerationResponse,
}: {
  item: any;
  strategy: any;
  user: any;
  onClose: () => void;
  checkGenerationLimit: () => Promise<boolean>;
  handleGenerationResponse: (data: any, error: any) => boolean;
}) {
  const title = item.topic || item.title || "Untitled post";
  const pillar = item.pillar || item.theme || "";
  const platformLabel = fullPlatformLabel(item.platform);
  const effectiveDate: string | null = item.resolvedDate ?? item.date ?? null;
  const d = (item._d as Date | null) ?? parseDate(effectiveDate ?? undefined);
  const dateStr = d ? fmtCard(d) : item.day || "";

  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");

  const run = async () => {
    if (!(await checkGenerationLimit())) {
      onClose();
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          topic: title,
          platform: platformLabel,
          contentType: item.contentType || "My take / Opinion",
          strategy,
          slot: { scheduled_date: effectiveDate, pillar: pillar || null },
          calendarContext: { title, pillar, date: effectiveDate, item_id: item.item_id ?? null },
        },
      });
      if (handleGenerationResponse(data, error)) {
        onClose();
        return;
      }
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setBody(((data as any).body ?? "") as string);
    } catch (e: any) {
      console.error(e);
      toast.error(aiErrorMessage("content", e));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wordCount = useMemo(() => {
    const t = body.trim();
    return t ? t.split(/\s+/).length : 0;
  }, [body]);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(body);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy");
    }
  }

  async function saveDraft(status: "draft" | "scheduled" = "draft") {
    if (!user || !body) return;
    const { error } = await supabase.from("content_items").insert({
      user_id: user.id,
      platform: platformLabel,
      content_type: item.contentType || "My take / Opinion",
      topic: title,
      body,
      status,
      scheduled_for: status === "scheduled" ? effectiveDate : null,
    });
    if (error) {
      toast.error("Couldn't save", { description: error.message });
    } else {
      toast.success(status === "scheduled" ? "Scheduled" : "Saved to drafts");
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(14,15,16,0.48)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          width: 520,
          maxWidth: "94vw",
          border: "0.5px solid #ECEAE5",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between"
          style={{ padding: "16px 20px", borderBottom: "0.5px solid #ECEAE5", gap: 12 }}
        >
          <div className="flex" style={{ gap: 10, minWidth: 0, flex: 1 }}>
            <div style={{ paddingTop: 2 }}>
              <PlatformIcon platform={item.platform} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#15171C" }}>{title}</div>
              <div style={{ fontSize: 11, color: "#9A9896", marginTop: 2 }}>
                {platformLabel} · {dateStr}
                {pillar ? ` · ${pillar}` : ""}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#9A9896", cursor: "pointer", padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div
            style={{
              padding: "44px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: "2.5px solid #ECEAE5",
                borderTopColor: "#E85A46",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ fontSize: 13, color: "#9A9896" }}>
              Generating with your strategy and voice…
            </div>
            <div style={{ fontSize: 11, color: "#9A9896" }}>{lengthHint(item.platform)}</div>
          </div>
        ) : (
          <>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "0.5px solid #ECEAE5",
                maxHeight: 200,
                overflowY: "auto",
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 8 }}
              >
                <span
                  className="inline-flex items-center"
                  style={{ gap: 6, fontSize: 11, color: "#15171C" }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#22C55E",
                    }}
                  />
                  Generated
                </span>
                <span style={{ fontSize: 11, color: "#9A9896" }}>{wordCount} words</span>
              </div>
              <div style={{ fontSize: 13, color: "#15171C", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                {body}
              </div>
            </div>

            {pillar && (
              <div
                style={{
                  padding: "8px 20px",
                  background: "#F7F5F1",
                  borderBottom: "0.5px solid #ECEAE5",
                  fontSize: 11,
                  color: "#9A9896",
                }}
              >
                Pillar: {pillar} — written to reinforce this strategic bucket in your brand voice.
              </div>
            )}

            <div
              style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "Copy", onClick: copyText },
                  { label: "Save draft", onClick: () => saveDraft("draft") },
                  { label: "Schedule", onClick: () => saveDraft("scheduled") },
                ].map((b) => (
                  <button
                    key={b.label}
                    onClick={b.onClick}
                    style={{
                      border: "1px solid #E85A46",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      background: "transparent",
                      color: "#15171C",
                      padding: "8px 0",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF1EE")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => toast.info("Connect your platform in Settings to publish directly.")}
                style={{
                  width: "100%",
                  background: "#E85A46",
                  color: "#fff",
                  border: "none",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  padding: 11,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Send size={14} /> Publish now
              </button>
              <button
                onClick={() => void run()}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9A9896",
                  fontSize: 11,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <RefreshCw size={11} /> Regenerate
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}