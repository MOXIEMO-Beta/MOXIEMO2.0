import { useState } from "react";
import { useStrategyEditor } from "@/hooks/useStrategyEditor";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  items: string[];
  onChange: (next: string[]) => void;
  /** Tailwind classes applied to each chip */
  chipClassName?: string;
  /** When not editing, render each item via this fn (e.g. as a Badge). Defaults to chip. */
  renderItem?: (item: string, i: number) => React.ReactNode;
  placeholder?: string;
  emptyLabel?: string;
}

export function EditableList({ items, onChange, chipClassName, renderItem, placeholder = "Add item", emptyLabel = "None set" }: Props) {
  const { editing } = useStrategyEditor();
  const [draft, setDraft] = useState("");

  const list = items || [];

  if (!editing) {
    if (list.length === 0) return <span className="text-sm text-muted-foreground italic">{emptyLabel}</span>;
    return <>{list.map((it, i) => renderItem ? renderItem(it, i) : (
      <span key={i} className={cn("inline-block px-2.5 py-1 text-sm rounded-md bg-accent-soft text-accent mr-1.5 mb-1.5", chipClassName)}>{it}</span>
    ))}</>;
  }

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...list, v]);
    setDraft("");
  };
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {list.map((it, i) => (
        <span key={i} className={cn("group inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-md bg-accent-soft text-accent", chipClassName)}>
          {it}
          <button type="button" aria-label={`Remove ${it}`} onClick={() => remove(i)} className="opacity-60 hover:opacity-100 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={placeholder}
        className="text-sm bg-background/40 border border-dashed border-accent/50 rounded-md px-2 py-1 outline-none focus:border-accent focus:bg-background min-w-[120px]"
      />
      <button type="button" onClick={add} className="text-accent opacity-70 hover:opacity-100" aria-label="Add">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}