import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  variant?: "fullscreen" | "section" | "inline";
  label?: string;
  className?: string;
}

export function PageLoader({ variant = "fullscreen", label, className }: PageLoaderProps) {
  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        {label && <span>{label}</span>}
      </span>
    );
  }

  if (variant === "section") {
    return (
      <div className={cn("flex items-center justify-center py-16", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("min-h-dvh flex items-center justify-center", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
