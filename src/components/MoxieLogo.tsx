import { cn } from "@/lib/utils";

export function MoxieLogo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
        <div className="h-2.5 w-2.5 rounded-full bg-accent" />
        <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent/80" />
      </div>
      {showWord && <span className="font-display text-2xl text-foreground leading-none">moxie</span>}
    </div>
  );
}