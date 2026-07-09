import * as React from "react";

export function DropZone({
  onFile,
  accept,
  disabled,
  children,
  className,
  style,
  activeStyle,
  as: Tag = "div",
}: {
  onFile: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  activeStyle?: React.CSSProperties;
  as?: "div" | "label";
}) {
  const { isOver, dropProps } = useFileDrop({ onFile, accept, disabled });
  const merged = { ...style, ...(isOver ? activeStyle : {}) };
  return React.createElement(Tag as any, { ...dropProps, className, style: merged, "data-drop-active": isOver || undefined }, children);
}
import { useCallback, useState } from "react";

type Options = {
  onFile: (file: File) => void;
  accept?: string; // comma-separated mime prefixes or extensions, e.g. "image/,video/,.csv"
  disabled?: boolean;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
};

function matchesAccept(file: File, accept?: string) {
  if (!accept) return true;
  const parts = accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!parts.length) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return parts.some((p) => {
    if (p.startsWith(".")) return name.endsWith(p);
    if (p.endsWith("/*")) return type.startsWith(p.slice(0, -1));
    if (p.endsWith("/")) return type.startsWith(p);
    return type === p;
  });
}

/**
 * Shared drag-and-drop file handler. Returns props to spread on any container,
 * plus `isOver` state for hover styling. Handles preventDefault on both
 * dragover and drop (the classic missing-preventDefault-on-dragover bug that
 * causes the browser to navigate to the file instead of firing onDrop).
 */
export function useFileDrop({ onFile, onFiles, accept, disabled, multiple }: Options) {
  const [isOver, setIsOver] = useState(false);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    if (Array.from(e.dataTransfer?.types || []).includes("Files")) setIsOver(true);
  }, [disabled]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    try { e.dataTransfer.dropEffect = "copy"; } catch {}
    if (!isOver && Array.from(e.dataTransfer?.types || []).includes("Files")) setIsOver(true);
  }, [disabled, isOver]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  }, [disabled]);

  const onDrop = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    const files = Array.from(e.dataTransfer?.files || []);
    console.log("[useFileDrop] drop fired — files:", files.map((f) => ({ name: f.name, type: f.type, size: f.size })));
    if (!files.length) return;
    const accepted = files.filter((f) => matchesAccept(f, accept));
    if (!accepted.length) {
      console.warn("[useFileDrop] no files matched accept =", accept);
      return;
    }
    if (onFiles) onFiles(multiple ? accepted : accepted.slice(0, 1));
    if (onFile) onFile(accepted[0]);
  }, [accept, disabled, multiple, onFile, onFiles]);

  return {
    isOver,
    dropProps: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}
