import { cn } from "@/lib/utils";
import logo from "@/assets/moxiemo-logo.png";
import mark from "@/assets/moxie-mark.png";

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
        <img src={mark} alt="MOXIEMO" className="h-8 w-auto" />
      </div>
    );
  }
  return (
    <div className={cn("flex items-center", className)}>
      <img src={logo} alt="MOXIEMO" className="h-8 w-auto" />
    </div>
  );
}