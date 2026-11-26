import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const C = {
  coral: "#FF6B5C", navy: "#14243D", paper: "#F7F5F1",
  white: "#FFFFFF", ink: "#15171C", muted: "#6B6B6B",
  border: "#E8E4DD", warmPaper: "#F4F2ED", sage: "#BBC5A6",
};

const BUSINESS_TYPES = [
  "Service business",
  "Product business",
  "Consultant / freelancer",
  "Agency",
  "Creator / personal brand",
];

// Pre-launch: show upcoming live sessions
const SESSIONS = [
  { label: "December 2, 2026 — 11:00 AM CT",  value: "2026-12-02 11:00 CT" },
  { label: "December 4, 2026 — 2:00 PM CT",   value: "2026-12-04 14:00 CT" },
  { label: "December 9, 2026 — 10:00 AM CT",  value: "2026-12-09 10:00 CT" },
  { label: "December 11, 2026 — 1:00 PM CT",  value: "2026-12-11 13:00 CT" },
];

type Bubble = {
  id: number;
  text: string;
  reply: string;
  action?: "hold-spot" | "faq" | "loop" | "first100";
  hidden?: boolean;
};

const BUBBLES: Bubble[] = [
  // 1 — audit (hidden until block 3 ships)
  { id: 1, text: "Run a free brand audit", reply: "Let's take a look at how your brand is coming across right now.", action: undefined, hidden: true },
  // 2 — hold a spot
  { id: 2, text: "Hold a spot for me", reply: "Of course. Let me grab a few details so I can get you into a session.", action: "hold-spot" },
  // 3 — pick up where I left off (hidden pre-launch)
  { id: 3, text: "Pick up where I left off", reply: "Welcome back. Let's keep going.", action: undefined, hidden: true },
  // 4 — what happens next
  { id: 4, text: "What happens after I reserve?", reply: "You'll get a confirmation email with the session details. We'll walk through your business together on Zoom. No card needed — the session is free.", action: "hold-spot" },
  // 5 — FAQ
  { id: 5, text: "Common questions", reply: "Here are the ones I get the most.", action: "faq" },
  // 6 — the loop
  { id: 6, text: "Walk me through how it works", reply: "Here's the full picture — from first session to posts going out.", action: "loop" },
  // 7 — First 100
  { id: 7, text: "Tell me about the First 100", reply: "The First 100 is a founding group of business owners who are shaping MOXIEMO. If you get in, your price is locked for life.", action: "first100" },
];

const FAQ_ITEMS = [
  { q: "Is this for my industry?", a: "MOXIEMO works for any small business that sells a service, product, or expertise. If you need clients or customers, it is for you." },
  { q: "Do I need a marketing background?", a: "No. MOXIEMO is built for founders who are running the business and trying to do marketing too." },
  { q: "How long does the first session take?", a: "About 60 minutes. We go through your business, goals, and what marketing actually makes sense for you right now." },
  { q: "What is a founding seat?", a: "Founding seats are the first 100 spots. The price is locked for life and comes with direct input on the product." },
];

function HoldSpotCard({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [biz, setBiz] = useState("");
  const [session, setSession] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) { toast.error("Enter a valid email."); return; }
    setSubmitting(true);
    try {
      const utm: Record<string, string> = {};
      const sp = new URLSearchParams(window.location.search);
      ["source","medium","campaign","content","term"].forEach((k) => { const v = sp.get(`utm_${k}`); if (v) utm[k] = v; });

      const { data, error } = await supabase.functions.invoke("reserve-spot", {
        body: {
          email,
          business_type: biz || null,
          session_picked: session || null,
          visitor_id: (window as Record<string, unknown>).__moxie_vid ?? null,
          utm,
        },
      });
      if (error || data?.error) throw new Error(data?.error ?? "Could not save your reservation.");
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" as const }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
        <p style={{ fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 700, fontSize: 16, color: C.ink, marginBottom: 6 }}>
          Spot reserved.
        </p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
          Check your inbox for a confirmation email. No card needed — this is a session reservation only. Founding seats open December 15.
        </p>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.coral, fontFamily: "'DM Sans Variable',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Back
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ paddingTop: 8 }}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: C.muted, display: "block", marginBottom: 6 }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          style={{ width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: 14, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", boxSizing: "border-box", background: C.white }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: C.muted, display: "block", marginBottom: 6 }}>
          Business type
        </label>
        <select
          value={biz}
          onChange={(e) => setBiz(e.target.value)}
          style={{ width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: 14, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", background: C.white, appearance: "none" as const }}
        >
          <option value="">Select your type</option>
          {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: C.muted, display: "block", marginBottom: 6 }}>
          Pick a session
        </label>
        <select
          value={session}
          onChange={(e) => setSession(e.target.value)}
          style={{ width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: 14, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", outline: "none", background: C.white, appearance: "none" as const }}
        >
          <option value="">Any session works</option>
          {SESSIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{ width: "100%", background: C.coral, color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
      >
        {submitting ? "Reserving…" : "Hold my spot →"}
      </button>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.muted, marginTop: 10, textAlign: "center" as const }}>
        No card. No charge. Just a session.
      </p>
    </form>
  );
}

export function MoxieChatCard() {
  const [activeReply, setActiveReply] = useState<Bubble | null>(null);
  const [showHoldSpot, setShowHoldSpot] = useState(false);

  const visibleBubbles = BUBBLES.filter((b) => !b.hidden);

  const handleBubble = (b: Bubble) => {
    setActiveReply(b);
    setShowHoldSpot(b.action === "hold-spot");
  };

  const reset = () => { setActiveReply(null); setShowHoldSpot(false); };

  return (
    <div
      role="region"
      aria-label="Chat with MOXIE"
      style={{
        background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 20,
        padding: 28, maxWidth: 420, width: "100%",
      }}
    >
      {/* MOXIE header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 800, fontSize: 16, color: "#fff" }}>M</span>
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 700, fontSize: 15, color: C.ink }}>MOXIE</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted }}>Your marketing partner</div>
        </div>
      </div>

      {/* MOXIE reply area */}
      {activeReply ? (
        <div>
          {/* MOXIE's reply */}
          <div
            aria-live="polite"
            style={{ background: C.warmPaper, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}
          >
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0 }}>
              {activeReply.reply}
            </p>
          </div>

          {/* Hold a spot form */}
          {showHoldSpot && <HoldSpotCard onClose={reset} />}

          {/* FAQ */}
          {activeReply.action === "faq" && (
            <div>
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 4 }}>{item.q}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{item.a}</div>
                </div>
              ))}
            </div>
          )}

          {/* The loop */}
          {activeReply.action === "loop" && (
            <div>
              {[
                ["1. Discovery", "60-minute session. MOXIE learns your business, goals, and audience."],
                ["2. Strategy", "MOXIE synthesizes a full marketing strategy just for you."],
                ["3. Content plan", "30 days of posts, generated and scheduled."],
                ["4. Approve and publish", "You approve each post. MOXIE publishes it."],
                ["5. Grow", "Track results. MOXIE reads the numbers and suggests what to do next."],
              ].map(([title, body], i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.coral, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 11, fontWeight: 800, color: "#fff" }}>{i + 1}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 13, fontWeight: 700, color: C.ink }}>{title}</div>
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* First 100 */}
          {activeReply.action === "first100" && (
            <div style={{ marginBottom: 12 }}>
              {[
                "Price locked for life — whatever you join at, that is your rate forever.",
                "Direct access to Karee and the team during the founding period.",
                "First to get every new feature as it ships.",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: C.coral, fontWeight: 800, fontSize: 16, lineHeight: 1 }}>→</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.ink, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
              <button
                onClick={() => handleBubble(BUBBLES[1])}
                style={{ width: "100%", background: C.coral, color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 8 }}
              >
                Hold a spot →
              </button>
            </div>
          )}

          {/* Back */}
          {!showHoldSpot && (
            <button
              onClick={reset}
              style={{ background: "transparent", border: "none", color: C.muted, fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: "pointer", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}
            >
              ← Back to questions
            </button>
          )}
        </div>
      ) : (
        <div>
          {/* Opening line */}
          <div style={{ background: C.warmPaper, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0 }}>
              Hi there. I'm MOXIE — the marketing partner inside MOXIEMO. What would you like to know?
            </p>
          </div>

          {/* Bubbles */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }} role="list">
            {visibleBubbles.map((b) => (
              <button
                key={b.id}
                onClick={() => handleBubble(b)}
                role="listitem"
                aria-label={b.text}
                style={{
                  minHeight: 44, padding: "10px 16px", borderRadius: 10,
                  border: `1.5px solid ${C.border}`, background: C.white,
                  fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: C.ink,
                  cursor: "pointer", textAlign: "left" as const,
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.coral; (e.currentTarget as HTMLButtonElement).style.background = C.warmPaper; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.background = C.white; }}
              >
                {b.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
