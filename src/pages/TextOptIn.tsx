import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const C = {
  coral: "#FF6B5C", navy: "#14243D", paper: "#F7F5F1",
  white: "#FFFFFF", ink: "#15171C", muted: "#6B6B6B",
  border: "#E8E4DD", warmPaper: "#F4F2ED",
};

export default function TextOptIn() {
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formatPhone = (v: string) => {
    // Strip non-digits, format as (XXX) XXX-XXXX
    const digits = v.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { toast.error("Please tick the consent checkbox to continue."); return; }
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) { toast.error("Please enter a valid 10-digit US phone number."); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("sms_consent").insert({
        phone: `+1${digits}`,
        consented: true,
        source: "/text",
        consented_at: new Date().toISOString(),
      } as any);
      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again or email hello@buildwithmoxiemo.com.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.paper, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ padding: "20px 32px", borderBottom: `1px solid ${C.border}`, background: C.white }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 800, fontSize: 20, color: C.navy }}>
            MOXIEMO
          </span>
        </Link>
      </header>

      {/* Body */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        {submitted ? (
          <div style={{ maxWidth: 480, textAlign: "center" as const }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✅</div>
            <h1 style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 28, fontWeight: 700, color: C.ink, marginBottom: 12 }}>
              You're in.
            </h1>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 16, color: C.muted, lineHeight: 1.6, marginBottom: 28 }}>
              You'll get a confirmation text shortly. Reply STOP at any time to opt out. Standard message and data rates may apply.
            </p>
            <Link
              to="/"
              style={{ background: C.coral, color: "#fff", padding: "14px 32px", borderRadius: 10, fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 700, fontSize: 15, textDecoration: "none" }}
            >
              Back to MOXIEMO
            </Link>
          </div>
        ) : (
          <div style={{ maxWidth: 480, width: "100%" }}>
            {/* Card */}
            <div style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: "40px 36px" }}>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 28, fontWeight: 700, color: C.ink, margin: "0 0 10px" }}>
                  Get texts from MOXIE
                </h1>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: C.muted, lineHeight: 1.6, margin: 0 }}>
                  MOXIE can text you post approval requests, weekly performance summaries, and reminders. One to five messages per week — stop any time.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontFamily: "'DM Sans Variable',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: C.muted, display: "block", marginBottom: 8 }}>
                    Mobile number (US)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(555) 000-0000"
                    required
                    style={{ width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: 16, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "13px 16px", outline: "none", boxSizing: "border-box", background: C.white }}
                  />
                </div>

                {/* Consent checkbox — NEVER pre-ticked */}
                <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <input
                    type="checkbox"
                    id="sms-consent"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ marginTop: 2, width: 18, height: 18, flexShrink: 0, cursor: "pointer", accentColor: C.coral }}
                  />
                  <label htmlFor="sms-consent" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.5, cursor: "pointer" }}>
                    I agree to receive recurring automated text messages from MOXIEMO at the number above. Consent is not a condition of purchase. Message and data rates may apply. Reply STOP to opt out, HELP for help. See our{" "}
                    <Link to="/privacy" style={{ color: C.coral }}>Privacy Policy</Link>{" "}and{" "}
                    <Link to="/terms" style={{ color: C.coral }}>Terms</Link>.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !agreed}
                  style={{
                    width: "100%", background: agreed ? C.coral : C.border, color: agreed ? "#fff" : C.muted,
                    border: "none", borderRadius: 10, padding: "15px 0",
                    fontFamily: "'DM Sans Variable',sans-serif", fontWeight: 700, fontSize: 15,
                    cursor: agreed ? "pointer" : "not-allowed", transition: "background 0.2s",
                  }}
                >
                  {submitting ? "Submitting…" : "Sign me up for MOXIE texts"}
                </button>
              </form>

              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.muted, lineHeight: 1.5, marginTop: 16, textAlign: "center" as const }}>
                KLMG US Ltd · 2727 San Felipe Rd., Suite 217, Houston, TX 77063<br />
                US numbers only · Standard rates may apply · Reply STOP to opt out
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ padding: "20px 32px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 24 }}>
        <Link to="/privacy" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted, textDecoration: "none" }}>Privacy Policy</Link>
        <Link to="/terms" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted, textDecoration: "none" }}>Terms</Link>
        <Link to="/" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted, textDecoration: "none" }}>buildwithmoxiemo.com</Link>
      </footer>
    </div>
  );
}
