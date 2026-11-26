import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

export function UpgradeDialog() {
  const { upgradeOpen, closeUpgrade } = usePlan();
  const [loading, setLoading] = useState(false);
  const open = upgradeOpen !== null;

  const isFounding  = upgradeOpen === "founding_member";
  const isFoundation = upgradeOpen === "foundation";

  const targetPlan = isFounding ? "foundation" : "growth";

  const title = isFounding
    ? "You've used your 25 AI generations this month"
    : isFoundation
    ? "You've used your 100 AI generations this month"
    : "Upgrade your plan";

  const body = isFounding
    ? "Upgrade to Foundation ($79/mo) for 100 generations per month, Facebook and Instagram publishing, and email provider sync."
    : isFoundation
    ? "Upgrade to Growth ($129/mo) for unlimited content creation and 5 publishing platforms."
    : "";

  const cta = isFounding ? "Upgrade to Foundation — $79/mo" : "Upgrade to Growth — $129/mo";

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: { plan: targetPlan },
      });
      if (error || data?.error) {
        toast.error(data?.error ?? "Could not start checkout. Please try again.");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          <Button variant="outline" onClick={closeUpgrade} disabled={loading}>Maybe later</Button>
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-brand-coral text-white hover:bg-brand-coral/90"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {cta}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}