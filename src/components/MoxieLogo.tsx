import { cn } from "@/lib/utils";
import logo from "@/assets/moxie-logo.png";
import mark from "@/assets/moxie-mark.png";

export function MoxieLogo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  if (!showWord) {
    return (
      <div className={cn("flex items-center", className)}>
        <img src={mark} alt="Moxie" className="h-8 w-auto" />
      </div>
    );
  }
  return (
    <div className={cn("flex items-center", className)}>
      <img src={logo} alt="Moxie" className="h-7 w-auto" />
    </div>
  );
}