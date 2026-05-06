import { useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const TYPES = [
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature request" },
  { value: "confusing", label: "Something's confusing" },
  { value: "general", label: "General feedback" },
];

export function FeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!message.trim()) {
      toast.error("Please add a message");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: user?.id ?? null,
        feedback_type: type,
        message: message.trim(),
        page_url: typeof window !== "undefined" ? window.location.href : null,
      });
      if (error) throw error;
      toast.success("Thanks for the feedback — we read every single one.");
      setMessage("");
      setType("general");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Couldn't send feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-full justify-start gap-2 text-muted-foreground"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm">Send feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>💬 Send feedback to MOXIEMO</DialogTitle>
          <DialogDescription>
            Help us make MOXIEMO better. We read every message.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>What type of feedback?</Label>
            <RadioGroup value={type} onValueChange={setType}>
              {TYPES.map((t) => (
                <div key={t.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={t.value} id={`fb-${t.value}`} />
                  <Label htmlFor={`fb-${t.value}`} className="font-normal cursor-pointer">
                    {t.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fb-message">Message</Label>
            <Textarea
              id="fb-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending…" : "Send feedback →"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FeedbackButton;