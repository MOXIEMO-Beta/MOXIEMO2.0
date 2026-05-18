import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function UpgradeDialog() {
  const { upgradeOpen, closeUpgrade } = usePlan();
  const open = upgradeOpen !== null;

  const isFounding = upgradeOpen === "founding_member";
  const isFoundation = upgradeOpen === "foundation";

  const title = isFounding
    ? "You've used your 25 free generations this month"
    : isFoundation
    ? "You've used your 100 generations this month"
    : "Upgrade your plan";

  const body = isFounding
    ? "Your founding member access never expires and your count resets on the 1st. Upgrade to Foundation ($79/mo) for 100 generations per month, Facebook and Instagram publishing, and email provider sync."
    : isFoundation
    ? "Upgrade to Growth ($129/mo) for unlimited content creation and 5 publishing platforms."
    : "";

  const cta = isFounding ? "Upgrade to Foundation →" : "Upgrade to Growth →";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) closeUpgrade(); }}>
      <DialogContent className="sm:max-w-md border-border">
        <DialogHeader>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-coral-soft text-brand-coral">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="font-display text-2xl leading-tight">{title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
            {body}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="outline" onClick={closeUpgrade}>Maybe later</Button>
          <Button asChild className="bg-brand-coral text-white hover:bg-brand-coral/90">
            <Link to="/pricing" onClick={closeUpgrade}>{cta}</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}