import { cn } from "@/lib/utils";
import logo from "@/assets/moxiemo-logo.png";
import mark from "@/assets/moxie-mark.png";
import markOnly from "@/assets/moxiemo-mark-only.png";
import wordmark from "@/assets/moxiemo-wordmark.png";

export function MoxieLogo({
  className,
  showWord = true,
  variant = "default",
}: {
  className?: string;
  showWord?: boolean;
  variant?: "default" | "light";
}) {
  const fullAlt = "MOXIEMO. One platform. Confident marketing.";
  if (!showWord) {
    return (
      <div className={cn("flex items-center", className)}>
        <img src={mark} alt={fullAlt} className="h-11 w-auto" />
      </div>
    );
  }
  if (variant === "light") {
    return (
      <div className={cn("flex items-center", className)} aria-label={fullAlt}>
        <img src={markOnly} alt="" className="h-11 w-auto" />
        <img
          src={wordmark}
          alt=""
          className="h-11 w-auto"
          style={{ filter: "brightness(0) invert(1)", opacity: 0.95 }}
        />
      </div>
    );
  }
  return (
    <div className={cn("flex items-center", className)} aria-label={fullAlt}>
      {/* Mobile: mark + wordmark only — tagline baked into full lockup is too small to read at header scale */}
      <img src={markOnly} alt="" className="h-9 w-auto sm:hidden" />
      <img src={wordmark} alt="" className="h-9 w-auto sm:hidden" />
      {/* Desktop: full lockup with tagline, scaled up for legibility */}
      <img src={logo} alt={fullAlt} className="hidden sm:block h-14 md:h-16 w-auto" />
    </div>
  );
}