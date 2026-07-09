import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, CheckCircle2, RefreshCw } from "lucide-react";

// Lane 3 "Offer GTM" pre-chat flow: readiness gate + intake worksheet.
// No em-dashes and no contractions anywhere in the copy in this file.

export type OfferGateAnswers = {
  can_deliver: "yes" | "not_yet" | null;
  has_demand: "yes" | "not_yet" | null;
  is_priced: "yes" | "not_yet" | null;
};

export type OfferIntake = {
  offer_one_line: string;
  offer_deliverables: string;
  offer_price: string;
  offer_transformation: string;
  buyer_who: string;
  buyer_trigger: string;
  buyer_pain: string;
  buyer_tried: string;
  diff_why_you: string;
  diff_proof: string;
  diff_cost_of_inaction: string;
  goal_sell_number: string;
  goal_by_date: string;
  goal_revenue: string;
  warm_list: string;
};

export const emptyIntake: OfferIntake = {
  offer_one_line: "",
  offer_deliverables: "",
  offer_price: "",
  offer_transformation: "",
  buyer_who: "",
  buyer_trigger: "",
  buyer_pain: "",
  buyer_tried: "",
  diff_why_you: "",
  diff_proof: "",
  diff_cost_of_inaction: "",
  goal_sell_number: "",
  goal_by_date: "",
  goal_revenue: "",
  warm_list: "",
};

const GATE_QS: Array<{
  key: keyof OfferGateAnswers;
  question: string;
  helper: string;
  refineTitle: string;
  refineBody: string;
}> = [
  {
    key: "can_deliver",
    question: "Can you deliver it right now?",
    helper:
      "If someone paid you today, could you fulfill it this week without building something new first?",
    refineTitle: "Delivery readiness is the gate.",
    refineBody:
      "This is not a failure. It is the most useful thing you will learn today, because it tells you where the real work is. Tighten the scope until the very next version is something you could deliver this week without building anything new. You can always expand later.",
  },
  {
    key: "has_demand",
    question: "Has someone already paid for it, or told you they would?",
    helper:
      "Real demand, not polite interest. A past sale, a waitlist, a take my money comment.",
    refineTitle: "Demand is the gate.",
    refineBody:
      "This is not a failure. It is the most useful thing you will learn today, because it tells you where the real work is. Before we build a launch plan, we need one signal of real demand. Reach out to three people who fit the buyer and ask if they would pay for this today. Their answer is the input we need.",
  },
  {
    key: "is_priced",
    question: "Is it priced?",
    helper: "One clear price or price range. It depends is not a price yet.",
    refineTitle: "Pricing is the gate.",
    refineBody:
      "This is not a failure. It is the most useful thing you will learn today, because it tells you where the real work is. Set a price you can say out loud without flinching. It can be a range. You can adjust after the first three conversations. What matters is that the number exists.",
  },
];

export function OfferReadinessGate({
  value,
  onChange,
  onProceed,
  onSwitchOffer,
}: {
  value: OfferGateAnswers;
  onChange: (next: OfferGateAnswers) => void;
  onProceed: () => void;
  onSwitchOffer: () => void;
}) {
  const answered = GATE_QS.every((q) => value[q.key] !== null);
  const failing = GATE_QS.filter((q) => value[q.key] === "not_yet");
  const allYes = answered && failing.length === 0;

  function set(key: keyof OfferGateAnswers, v: "yes" | "not_yet") {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-10 py-10" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl border border-border bg-background p-6 lg:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Offer readiness check
            </span>
          </div>
          <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Three quick questions before we build the go to market
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            The launch plan is only as strong as the offer underneath it. Let us make sure the offer is ready.
          </p>

          <div className="space-y-5">
            {GATE_QS.map((q) => (
              <div key={q.key} className="rounded-xl border border-border p-4">
                <div className="font-medium text-sm">{q.question}</div>
                <div className="text-xs text-muted-foreground mt-1">{q.helper}</div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant={value[q.key] === "yes" ? "default" : "outline"}
                    onClick={() => set(q.key, "yes")}
                    className={value[q.key] === "yes" ? "bg-foreground text-background hover:bg-foreground/90" : ""}
                  >
                    Yes
                  </Button>
                  <Button
                    size="sm"
                    variant={value[q.key] === "not_yet" ? "default" : "outline"}
                    onClick={() => set(q.key, "not_yet")}
                    className={value[q.key] === "not_yet" ? "bg-foreground text-background hover:bg-foreground/90" : ""}
                  >
                    Not yet
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {answered && !allYes && (
            <div className="mt-6 space-y-4">
              {failing.map((q) => (
                <div key={q.key} className="rounded-xl border border-accent/40 bg-accent/5 p-4">
                  <div className="text-sm font-semibold text-foreground">{q.refineTitle}</div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{q.refineBody}</p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => set(q.key, "yes")}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> I have revised this. Mark as yes
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={onSwitchOffer}>
                  Switch to a different offer
                </Button>
                <Button
                  onClick={onProceed}
                  disabled
                  className="bg-foreground text-background disabled:opacity-40"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {allYes && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>The offer is ready. Let us capture the details.</span>
              </div>
              <Button onClick={onProceed} className="bg-foreground text-background hover:bg-foreground/90">
                Continue
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type Field = {
  key: keyof OfferIntake;
  label: string;
  helper: string;
  placeholder?: string;
  multiline?: boolean;
};

const SECTIONS: Array<{ title: string; fields: Field[] }> = [
  {
    title: "The offer",
    fields: [
      {
        key: "offer_one_line",
        label: "One sentence version of the offer",
        helper: "I help [who] do [what]. Keep it to one line.",
        placeholder: "I help operations leaders at Series A startups run a 90 day rev ops reset.",
      },
      {
        key: "offer_deliverables",
        label: "What the buyer gets",
        helper: "Deliverables and format. Sessions, documents, access, timeline.",
        multiline: true,
      },
      {
        key: "offer_price",
        label: "Price",
        helper: "One clear price or a range. Include tiers or payment plans if they exist.",
      },
      {
        key: "offer_transformation",
        label: "The transformation",
        helper: "Where the buyer is before this offer, and where they are after.",
        multiline: true,
      },
    ],
  },
  {
    title: "The buyer",
    fields: [
      {
        key: "buyer_who",
        label: "Who specifically is the buyer",
        helper: "Role, company stage, life stage. As specific as you can get.",
      },
      {
        key: "buyer_trigger",
        label: "The trigger moment",
        helper: "What is happening in their world right when they need this.",
        multiline: true,
      },
      {
        key: "buyer_pain",
        label: "The pain in their own words",
        helper: "How they describe the problem to a friend, not how you describe it in marketing.",
        multiline: true,
      },
      {
        key: "buyer_tried",
        label: "What they already tried that did not work",
        helper: "Tools, DIY, other providers. Why it fell short.",
        multiline: true,
      },
    ],
  },
  {
    title: "Why you",
    fields: [
      {
        key: "diff_why_you",
        label: "Why you, in a way a competitor cannot copy paste",
        helper: "Lived experience, proprietary method, access, track record.",
        multiline: true,
      },
      {
        key: "diff_proof",
        label: "Proof in hand",
        helper: "Case studies, past results, testimonials, credentials, screenshots.",
        multiline: true,
      },
      {
        key: "diff_cost_of_inaction",
        label: "The cost of not solving it",
        helper: "What it costs the buyer in money, time, relationships, or opportunity if they do nothing.",
        multiline: true,
      },
    ],
  },
  {
    title: "Revenue goal",
    fields: [
      {
        key: "goal_sell_number",
        label: "I want to sell this many",
        helper: "A number. Ten seats, three retainers, one keynote.",
        placeholder: "10",
      },
      {
        key: "goal_by_date",
        label: "By this date",
        helper: "A real date. Not soon. Not this quarter.",
        placeholder: "2026-09-30",
      },
      {
        key: "goal_revenue",
        label: "That equals this in revenue",
        helper: "The dollar amount that number represents.",
      },
      {
        key: "warm_list",
        label: "First 5 to 10 warm people to put this in front of this week",
        helper: "Names or handles. Anyone you already know who might want it or refer it.",
        multiline: true,
      },
    ],
  },
];

export function OfferIntakeForm({
  value,
  onChange,
  onSubmit,
  submitting,
}: {
  value: OfferIntake;
  onChange: (next: OfferIntake) => void;
  onSubmit: () => void;
  submitting?: boolean;
}) {
  const missing: string[] = [];
  if (!value.goal_sell_number.trim()) missing.push("sell number");
  if (!value.goal_by_date.trim()) missing.push("target date");

  function set<K extends keyof OfferIntake>(key: K, v: string) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-10 py-10" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl border border-border bg-background p-6 lg:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Offer intake
            </span>
          </div>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            The offer worksheet
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in what you know. If you completed the One Offer GTM Blueprint pre work, this maps one to one. You can move through it quickly.
          </p>

          <div className="space-y-8 mt-6">
            {SECTIONS.map((section) => (
              <div key={section.title} className="space-y-4">
                <div className="text-sm font-semibold text-foreground">{section.title}</div>
                {section.fields.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-sm font-medium">{f.label}</label>
                    <div className="text-xs text-muted-foreground">{f.helper}</div>
                    {f.multiline ? (
                      <Textarea
                        value={value[f.key]}
                        onChange={(e) => set(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="min-h-[90px]"
                      />
                    ) : (
                      <Input
                        value={value[f.key]}
                        onChange={(e) => set(f.key, e.target.value)}
                        placeholder={f.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border mt-8">
            <div className="text-xs text-muted-foreground">
              {missing.length > 0
                ? `Still needed: ${missing.join(" and ")}.`
                : "Ready to sharpen this with MOXIEMO."}
            </div>
            <Button
              onClick={onSubmit}
              disabled={submitting || missing.length > 0}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              Continue to review
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OfferGtmHoldingState() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="max-w-lg text-center rounded-2xl border border-border bg-background p-8 shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Nice work</span>
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          Your answers are locked in
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The full go to market strategy for this offer is the next thing we are building. We will notify you as soon as it is ready. In the meantime, your intake is saved.
        </p>
      </div>
    </div>
  );
}