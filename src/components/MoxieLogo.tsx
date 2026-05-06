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
  if (!showWord) {
    return (
      <div className={cn("flex items-center", className)}>
        <img src={mark} alt="MOXIEMO" className="h-11 w-auto" />
      </div>
    );
  }
  if (variant === "light") {
    return (
      <div className={cn("flex items-center", className)} aria-label="MOXIEMO">
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
    <div className={cn("flex items-center", className)}>
      <img src={logo} alt="MOXIEMO" className="h-11 w-auto" />
    </div>
  );
}