import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStrategyEditor } from "@/hooks/useStrategyEditor";
import { cn } from "@/lib/utils";

interface Props {
  value: string | undefined | null;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  /** Render value when not editing (lets parent control typography) */
  display?: (v: string) => ReactNode;
  ariaLabel?: string;
}

export function EditableField({ value, onChange, multiline, placeholder, className, display, ariaLabel }: Props) {
  const { editing } = useStrategyEditor();
  const [draft, setDraft] = useState<string>(value ?? "");
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  useEffect(() => { setDraft(value ?? ""); }, [value]);

  // Auto-resize textarea
  useEffect(() => {
    if (multiline && editing && ref.current instanceof HTMLTextAreaElement) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [draft, editing, multiline]);

  if (!editing) {
    const v = (value ?? "").toString();
    if (!v.trim()) {
      return <span className={cn("text-muted-foreground italic", className)}>{placeholder || "Not set"}</span>;
    }
    return <>{display ? display(v) : v}</>;
  }

  const commit = () => { if (draft !== (value ?? "")) onChange(draft); };

  const baseEditing = "w-full bg-background/40 border border-dashed border-accent/50 rounded-md px-2 py-1 outline-none focus:border-accent focus:bg-background transition-colors";

  if (multiline) {
    return (
      <textarea
        ref={(el) => (ref.current = el)}
        aria-label={ariaLabel}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        rows={1}
        className={cn(baseEditing, "resize-none leading-inherit", className)}
      />
    );
  }
  return (
    <input
      ref={(el) => (ref.current = el)}
      aria-label={ariaLabel}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
      className={cn(baseEditing, className)}
    />
  );
}