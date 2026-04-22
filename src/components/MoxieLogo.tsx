import { cn } from "@/lib/utils";
import logo from "@/assets/moxie-logo.png";
import logoLight from "@/assets/moxie-logo-light.png";
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
        <img src={mark} alt="Moxie" className="h-8 w-auto" />
      </div>
    );
  }
  const src = variant === "light" ? logoLight : logo;
  return (
    <div className={cn("flex items-center", className)}>
      <img src={src} alt="Moxie" className="h-7 w-auto" />
    </div>
  );
}