import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { RefineSectionDialog } from "./RefineSectionDialog";

export type RefineTarget = {
  /** Stable key used to bump strength scores. Reuse strength-card refineKey when one exists. */
  refineKey: string;
  /** Title shown as "Refine [label]". */
  label: string;
  /** One-sentence description of what this section contains. */
  description?: string;
  /** Current text shown in the CURRENT block. Arrays should be comma-joined. */
  currentValue: string;
  /** Build the Supabase patch from the new value. */
  buildPatch: (newValue: string) => Record<string, any>;
  /** Optional extra context passed to refine-section AI. */
  context?: any;
  /** Apply hook invoked after the patch is written, before strength recompute. */
  onApplied?: (newValue: string) => void;
};

type OpenFn = (t: RefineTarget) => void;

const Ctx = createContext<{ open: OpenFn } | null>(null);

export function useRefine() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRefine must be used within a RefineProvider");
  return v;
}

/** Helper to deep-set a path inside an object (used to patch enhanced_foundation). */
export function setInPath(obj: any, path: (string | number)[], value: any): any {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const base = obj == null ? (typeof head === "number" ? [] : {}) : Array.isArray(obj) ? [...obj] : { ...obj };
  base[head as any] = setInPath(base[head as any], rest, value);
  return base;
}

/** Apply a refinement, computing a strategy patch and writing it via the supplied apply fn. */
export function RefineProvider({
  children,
  apply,
  defaultContext,
}: {
  children: ReactNode;
  /** Persist a patch produced by buildPatch + recompute score. Mirrors MOX-87 onApply. */
  apply: (params: { refineKey: string; newValue: string; patch: Record<string, any> }) => Promise<void>;
  defaultContext?: any;
}) {
  const [openState, setOpenState] = useState(false);
  const [target, setTarget] = useState<RefineTarget | null>(null);

  const open: OpenFn = (t) => {
    setTarget(t);
    setOpenState(true);
  };

  const value = useMemo(() => ({ open }), []);

  return (
    <Ctx.Provider value={value}>
      {children}
      <RefineSectionDialog
        open={openState}
        onOpenChange={setOpenState}
        sectionKey={target?.refineKey || null}
        sectionLabel={target?.label}
        titleOverride={target ? `Refine ${target.label}` : undefined}
        descriptionOverride={target?.description}
        currentValue={target?.currentValue || ""}
        context={target?.context ?? defaultContext}
        onApply={async (newValue) => {
          if (!target) return;
          const patch = target.buildPatch(newValue);
          await apply({ refineKey: target.refineKey, newValue, patch });
          target.onApplied?.(newValue);
        }}
      />
    </Ctx.Provider>
  );
}

/**
 * Hover-revealed pencil that opens the Refine modal for a specific section.
 * Parent element must include `group relative` for hover + positioning to work.
 */
export function SectionPencil({ target, className }: { target: () => RefineTarget | null; className?: string }) {
  const { open } = useRefine();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        const t = target();
        if (t) open(t);
      }}
      aria-label="Refine this section"
      className={cn(
        "absolute top-3 right-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md",
        "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
        "text-foreground/40 hover:text-foreground/80 hover:bg-foreground/5",
        "transition-opacity duration-150",
        className,
      )}
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
}