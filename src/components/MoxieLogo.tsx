import { cn } from "@/lib/utils";
import logo from "@/assets/moxie-logo.png";

export function MoxieLogo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  if (!showWord) {
    // Icon-only: show just the M mark portion
    return (
      <div className={cn("flex items-center", className)}>
        <img src={logo} alt="Moxie" className="h-7 w-auto object-contain object-left" style={{ clipPath: "inset(0 70% 0 0)", marginRight: "-70%" }} />
      </div>
    );
  }
  return (
    <div className={cn("flex items-center", className)}>
      <img src={logo} alt="Moxie" className="h-8 w-auto" />
    </div>
  );
}