import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface StrategyEditorCtx {
  strategy: any;
  editing: boolean;
  setEditing: (v: boolean) => void;
  status: SaveStatus;
  lastSavedAt: Date | null;
  /** Update a top-level column (e.g. "positioning_statement") */
  setField: (key: string, value: any) => void;
  /** Update a nested path inside enhanced_foundation, e.g. ["brandArchetype","name"] */
  setEnhanced: (path: (string | number)[], value: any) => void;
  saveNow: () => Promise<void>;
  /** Merge a server-confirmed patch into local state without queuing another save. */
  applyServerPatch: (patch: Record<string, any>) => void;
}

const Ctx = createContext<StrategyEditorCtx | null>(null);

export function useStrategyEditor() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStrategyEditor must be used within StrategyEditorProvider");
  return v;
}

const TOP_LEVEL_COLUMNS = new Set([
  "positioning_statement",
  "ideal_client",
  "pain_point",
  "transformation",
  "voice_attributes",
  "anti_positioning",
  "content_pillars",
  "primary_channel",
  "posting_frequency",
  "success_definition",
  "business_goal",
  "time_capacity",
  "enhanced_foundation",
  "task_completion",
]);

function setIn(obj: any, path: (string | number)[], value: any): any {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const base = obj == null ? (typeof head === "number" ? [] : {}) : Array.isArray(obj) ? [...obj] : { ...obj };
  base[head as any] = setIn(base[head as any], rest, value);
  return base;
}

export function StrategyEditorProvider({
  initial,
  userId,
  children,
}: {
  initial: any;
  userId: string;
  children: ReactNode;
}) {
  const [strategy, setStrategy] = useState<any>(initial);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(initial?.updated_at ? new Date(initial.updated_at) : null);
  const dirtyRef = useRef<Record<string, any>>({});
  const timerRef = useRef<number | null>(null);

  // Reset state when a new initial loads
  useEffect(() => {
    setStrategy(initial);
    setLastSavedAt(initial?.updated_at ? new Date(initial.updated_at) : null);
  }, [initial?.id]);

  const flush = useCallback(async () => {
    const patch = dirtyRef.current;
    const keys = Object.keys(patch);
    if (keys.length === 0) return;
    dirtyRef.current = {};
    setStatus("saving");
    const { error } = await supabase.from("strategies").update(patch as never).eq("user_id", userId);
    if (error) {
      // Re-merge so we retry next save
      dirtyRef.current = { ...patch, ...dirtyRef.current };
      setStatus("error");
      toast.error("Couldn't save changes");
      return;
    }
    setStatus(Object.keys(dirtyRef.current).length > 0 ? "dirty" : "saved");
    setLastSavedAt(new Date());
  }, [userId]);

  const scheduleSave = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => { flush(); }, 1200);
  }, [flush]);

  const saveNow = useCallback(async () => {
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    await flush();
    if (Object.keys(dirtyRef.current).length === 0) toast.success("Strategy saved");
  }, [flush]);

  const applyServerPatch = useCallback((patch: Record<string, any>) => {
    setStrategy((prev: any) => ({ ...(prev || {}), ...patch }));
    setLastSavedAt(new Date());
    setStatus(Object.keys(dirtyRef.current).length > 0 ? "dirty" : "saved");
  }, []);

  const queueColumn = useCallback((key: string, value: any) => {
    if (!TOP_LEVEL_COLUMNS.has(key)) return;
    dirtyRef.current[key] = value;
    setStatus("dirty");
    scheduleSave();
  }, [scheduleSave]);

  const setField = useCallback((key: string, value: any) => {
    setStrategy((prev: any) => ({ ...prev, [key]: value }));
    queueColumn(key, value);
  }, [queueColumn]);

  const setEnhanced = useCallback((path: (string | number)[], value: any) => {
    setStrategy((prev: any) => {
      const nextEf = setIn(prev?.enhanced_foundation || {}, path, value);
      const next = { ...prev, enhanced_foundation: nextEf };
      dirtyRef.current["enhanced_foundation"] = nextEf;
      setStatus("dirty");
      scheduleSave();
      return next;
    });
  }, [scheduleSave]);

  // Warn before unload if unsaved
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === "dirty" || status === "saving") { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);

  const value = useMemo<StrategyEditorCtx>(() => ({
    strategy, editing, setEditing, status, lastSavedAt, setField, setEnhanced, saveNow, applyServerPatch,
  }), [strategy, editing, status, lastSavedAt, setField, setEnhanced, saveNow, applyServerPatch]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}