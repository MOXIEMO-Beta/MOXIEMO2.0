import { cn } from "@/lib/utils";

const LOGO_HEADER = "/moxiemo-logo-header.png";   // 894×132 — header / sidebar
const LOGO_FULL   = "/moxiemo-logo-full.png";      // 3159×602 — full lockup if needed

export function MoxieLogo({
  className,
  variant = "default",
  size = "md",
}: {
  className?: string;
  variant?: "default" | "light";
  size?: "sm" | "md" | "lg";
}) {
  const heights: Record<string, string> = { sm: "h-7", md: "h-8", lg: "h-10" };
  const h = heights[size];
  const filter = variant === "light" ? "brightness(0) invert(1)" : undefined;
  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={LOGO_HEADER}
        alt="MOXIEMO"
        className={cn(h, "w-auto")}
        style={filter ? { filter } : undefined}
        draggable={false}
      />
    </div>
  );
}

export function MoxieMark({
  className,
  size = 32,
  variant = "default",
}: {
  className?: string;
  size?: number;
  variant?: "default" | "light" | "white";
}) {
  const filter =
    variant === "light" || variant === "white"
      ? "brightness(0) invert(1)"
      : undefined;
  return (
    <img
      src="/favicon.svg"
      alt="MOXIEMO"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={filter ? { filter } : undefined}
      draggable={false}
    />
  );
}
