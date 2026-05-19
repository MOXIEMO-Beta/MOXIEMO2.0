import { useState } from "react";
import { MessageSquare, CheckCircle2 } from "lucide-react";
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
  { value: "confusing", label: "Something is confusing" },
  { value: "love", label: "I love this" },
  { value: "general", label: "General feedback" },
];

const DISCORD_URL = "https://discord.gg/BGRj8PxW";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a14.83 14.83 0 0 0-.617 1.265 18.27 18.27 0 0 0-5.881 0A14.81 14.81 0 0 0 9.443 3a19.74 19.74 0 0 0-3.76 1.369C2.34 9.36 1.44 14.22 1.89 19.005a19.95 19.95 0 0 0 6.073 3.059c.49-.66.926-1.36 1.302-2.093a12.99 12.99 0 0 1-2.052-.98c.172-.126.34-.258.503-.394 3.92 1.812 8.157 1.812 12.03 0 .165.136.333.268.504.394-.656.39-1.345.72-2.054.98.376.733.81 1.432 1.3 2.094a19.9 19.9 0 0 0 6.075-3.06c.527-5.59-.838-10.41-3.755-14.636ZM8.02 16.243c-1.183 0-2.157-1.086-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.334-.955 2.42-2.157 2.42Zm7.96 0c-1.183 0-2.157-1.086-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.334-.946 2.42-2.157 2.42Z" />
    </svg>
  );
}

export function FeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function resetAndClose() {
    setOpen(false);
    setTimeout(() => {
      setMessage("");
      setType("general");
      setSubmitted(false);
    }, 200);
  }

  async function handleSubmit() {
    if (!message.trim()) {
      toast.error("Please add a message");
      return;
    }
    setSubmitting(true);
    try {
      const page_url = typeof window !== "undefined" ? window.location.href : null;
      const { error } = await supabase.from("feedback").insert({
        user_id: user?.id ?? null,
        feedback_type: type,
        message: message.trim(),
        page_url,
      });
      if (error) throw error;
      // Send email notification (non-blocking failure)
      try {
        await supabase.functions.invoke("send-feedback-email", {
          body: { feedback_type: type, message: message.trim(), page_url },
        });
      } catch (e) {
        console.error("send-feedback-email failed", e);
      }
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message ?? "Couldn't send feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : resetAndClose())}>
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
        {submitted ? (
          <>
            <DialogHeader>
              <div className="flex flex-col items-center text-center space-y-3 pt-2">
                <CheckCircle2 className="h-12 w-12 text-[#E85D3A]" />
                <DialogTitle className="text-xl">Got it. Thank you.</DialogTitle>
                <DialogDescription>
                  We will review your feedback shortly. For faster support and to connect with
                  other founding members, join us in Discord.
                </DialogDescription>
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#E85D3A] hover:underline"
                >
                  <DiscordIcon className="h-4 w-4" />
                  Join Discord →
                </a>
              </div>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={resetAndClose} className="w-full sm:w-auto">
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Send feedback to MOXIEMO</DialogTitle>
              <DialogDescription>
                We read every message. For faster responses and community support, join our
                founding member Discord below.
              </DialogDescription>
            </DialogHeader>

            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-lg border border-[#FFD9D2] bg-[#FFF0EE] p-3 hover:bg-[#FFE6E1] transition-colors"
            >
              <DiscordIcon className="h-5 w-5 flex-shrink-0 text-[#E85D3A] mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  Join the Founding Member Discord — bug reports, feature requests, and direct
                  access to Karee.
                </p>
                <span className="mt-1 inline-block text-sm font-medium text-[#E85D3A]">
                  Join Discord →
                </span>
              </div>
            </a>

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
                <Label htmlFor="fb-message">Your message</Label>
                <Textarea
                  id="fb-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Be as specific as you can — what happened, what you expected, and what you were trying to do. Screenshots are welcome in Discord."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Prefer to talk? Find us in Discord at{" "}
                  <a
                    href={DISCORD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    discord.gg/BGRj8PxW
                  </a>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={resetAndClose} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Sending…" : "Send feedback →"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FeedbackButton;