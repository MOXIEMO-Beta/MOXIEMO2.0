import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";


type Tier = "foundation" | "growth" | "scale" | "unsure";
const ALLOWED: Tier[] = ["foundation", "growth", "scale", "unsure"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 9,
  border: "1px solid rgba(26,48,40,0.18)",
  background: "rgba(255,255,255,0.6)",
  fontFamily: "'DM Sans Variable', sans-serif",
  fontSize: 15,
  color: "#1a3028",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'JetBrains Mono Variable', monospace",
  fontSize: 10.5,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(26,48,40,0.5)",
  marginBottom: 7,
};

export default function Beta20Founding() {
  const [sp] = useSearchParams();
  const tierParam = (sp.get("tier") || "").toLowerCase();
  const initialTier: Tier = (ALLOWED as string[]).includes(tierParam) ? (tierParam as Tier) : "unsure";

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    email: "",
    role: "",
    company: "",
    website: "",
    plan: initialTier as string,
    referral: "",
  });

  useEffect(() => {
    document.title = "MOXIEMO | Built on strategy. Powered to execute.";
  }, []);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.email || !form.firstName) {
      setError("Please add your first name and email.");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("join-beta20-founding", {
        body: {
          firstName: form.firstName,
          email: form.email,
          role: form.role || null,
          company: form.company || null,
          website: form.website || null,
          tier: form.plan || "unsure",
          referral: form.referral || null,
          source: "pricing_page",
        },
      });
      if (fnErr) {
        const msg = (data as any)?.error || fnErr.message || "generic";
        if (msg === "already_registered") {
          setError("This email is already on the Beta 2.0 founding list.");
        } else {
          setError("Something went wrong. Please try again in a moment.");
        }
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  const tickerItems = useMemo(
    () => [
      "Founding seats are capped",
      "50% off, locked for life",
      "Once they are gone, they are gone",
      "No discount after founding seats fill",
      "Beta 2.0 launching soon",
    ],
    [],
  );

  return (
    <>
      <SiteHeader />
      <style>{`
        @keyframes mo-scroll { from { transform: translateX(0);} to { transform: translateX(-50%);} }
        .b20-wrap input::placeholder, .b20-wrap select { color: rgba(26,48,40,0.5); }
        .b20-wrap input:focus, .b20-wrap select:focus { border-color: #d4622a; background: #fff; }
        .b20-cta:hover { background: #b8521f !important; }
        @media (max-width: 900px) {
          .b20-grid { grid-template-columns: 1fr !important; }
          .b20-pane { padding: 48px 28px !important; }
          .b20-row2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div
        className="b20-wrap"
        style={{
          minHeight: "100vh",
          background: "#7bbfaa",
          fontFamily: "'DM Sans Variable', sans-serif",
          WebkitFontSmoothing: "antialiased",
          position: "relative",
        }}
      >
        {/* Crosshatch */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M0 24L24 0' stroke='rgba(0,60,40,0.07)' stroke-width='0.6'/%3E%3C/svg%3E\"),url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M24 24L0 0' stroke='rgba(0,60,40,0.035)' stroke-width='0.4'/%3E%3C/svg%3E\")",
            backgroundSize: "24px 24px,24px 24px",
          }}
        />
        {/* Grain */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 2,
            opacity: 0.55,
            mixBlendMode: "multiply",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
            backgroundSize: 200,
          }}
        />

        {/* Ticker */}
        <div style={{ background: "#d4622a", overflow: "hidden", padding: "10px 0", position: "relative", zIndex: 10 }}>
          <div
            style={{
              display: "inline-flex",
              whiteSpace: "nowrap",
              animation: "mo-scroll 28s linear infinite",
              fontFamily: "'JetBrains Mono Variable', monospace",
              fontSize: 11.5,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#fff",
              fontWeight: 500,
            }}
          >
            {[0, 1].map((g) => (
              <span key={g} style={{ display: "inline-flex", alignItems: "center" }}>
                {tickerItems.map((t, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                    <span style={{ padding: "0 28px" }}>{t}</span>
                    <span style={{ width: 5, height: 5, background: "rgba(255,255,255,0.55)", borderRadius: "50%", display: "inline-block" }} />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        <div
          className="b20-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            minHeight: "calc(100vh - 45px)",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* LEFT */}
          <div
            className="b20-pane"
            style={{
              padding: "72px 56px 80px",
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid rgba(26,48,40,0.12)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                fontFamily: "'JetBrains Mono Variable', monospace",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#1a3028",
                marginBottom: 32,
                background: "rgba(26,48,40,0.1)",
                border: "1px solid rgba(26,48,40,0.2)",
                padding: "8px 18px",
                borderRadius: 999,
                width: "fit-content",
              }}
            >
              <span style={{ width: 6, height: 6, background: "#d4622a", borderRadius: "50%", display: "inline-block" }} />
              BETA 2.0 FOUNDING MEMBER &nbsp;·&nbsp; SPOTS ARE CAPPED
            </div>

            <h1
              style={{
                fontFamily: "'Fraunces Variable', serif",
                fontWeight: 600,
                fontSize: "clamp(38px,4.2vw,60px)",
                lineHeight: 1.02,
                letterSpacing: "-0.025em",
                margin: "0 0 24px",
                color: "#1a3028",
              }}
            >
              Join as a Beta 2.0<br />
              <span
                style={{
                  fontWeight: 300,
                  fontStyle: "italic",
                  color: "#fff",
                  background: "#d4622a",
                  padding: "2px 10px 4px 6px",
                  display: "inline",
                  WebkitBoxDecorationBreak: "clone",
                  boxDecorationBreak: "clone",
                }}
              >
                Founding Member.
              </span>
            </h1>

            <p style={{ fontSize: 17, lineHeight: 1.72, color: "rgba(26,48,40,0.65)", margin: "0 0 44px", maxWidth: 420 }}>
              Lock in 50 percent off MOXIEMO, for life. Beta 2.0 founding access is limited to a capped number of seats. Once they are gone, new members pay standard pricing, with no discount.
            </p>

            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono Variable', monospace",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(26,48,40,0.4)",
                  marginBottom: 16,
                }}
              >
                Plan pricing at founding rate
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
                <TierRow name="Foundation" founding="$49.50" standard="$99/mo" />
                <TierRow name="Growth · Most Popular" founding="$74.50" standard="$149/mo" highlight />
                <TierRow name="Scale" founding="$124.50" standard="$249/mo" />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  background: "rgba(212,98,42,0.1)",
                  border: "1px solid rgba(212,98,42,0.2)",
                  borderRadius: 8,
                  padding: "13px 16px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flex: "none", marginTop: 1 }}>
                  <rect x="3" y="7" width="10" height="7" rx="2" stroke="#d4622a" strokeWidth="1.4" fill="none" />
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="#d4622a" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 13, color: "rgba(26,48,40,0.65)", lineHeight: 1.55 }}>
                  Your discounted rate stays locked in for as long as you remain a member, even as standard pricing increases.
                </span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(26,48,40,0.12)", paddingTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Full Beta 2.0 access: the autonomous loop, expanded publishing, and full ESP sync",
                "Group onboarding webinars and trainings to get you running fast",
                "First access to new features before public release",
              ].map((t) => (
                <div key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" style={{ flex: "none", marginTop: 2 }}>
                    <path d="M3 8.5l3.5 3.5 7.5-8" stroke="#1a3028" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 14.5, color: "rgba(26,48,40,0.7)", lineHeight: 1.45 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div
            className="b20-pane"
            style={{
              padding: "72px 56px 80px",
              display: "flex",
              flexDirection: "column",
              background: "rgba(0,0,0,0.06)",
            }}
          >
            {!submitted ? (
              <div>
                <div style={{ marginBottom: 32 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono Variable', monospace",
                      fontSize: 10,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "rgba(26,48,40,0.4)",
                      marginBottom: 10,
                    }}
                  >
                    Claim your founding seat
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Fraunces Variable', serif",
                      fontWeight: 500,
                      fontSize: 28,
                      lineHeight: 1.2,
                      letterSpacing: "-0.015em",
                      margin: 0,
                      color: "#1a3028",
                    }}
                  >
                    Tell us a little about you.
                  </h2>
                </div>

                <form onSubmit={onSubmit}>
                  <div className="b20-row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>First name</label>
                      <input style={inputStyle} type="text" placeholder="Jane" required value={form.firstName} onChange={update("firstName")} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input style={inputStyle} type="email" placeholder="you@company.com" required value={form.email} onChange={update("email")} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>What best describes you?</label>
                    <select style={inputStyle} required value={form.role} onChange={update("role")}>
                      <option value="">Select one...</option>
                      <option value="founder">Founder</option>
                      <option value="solopreneur">Solopreneur</option>
                      <option value="consultant">Consultant</option>
                      <option value="fractional">Fractional Executive</option>
                      <option value="agency">Agency Owner</option>
                      <option value="business-owner">Business Owner</option>
                      <option value="marketer">Marketer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="b20-row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>
                        Company <span style={{ opacity: 0.5, fontSize: 9.5 }}>(optional)</span>
                      </label>
                      <input style={inputStyle} type="text" placeholder="Acme Inc." value={form.company} onChange={update("company")} />
                    </div>
                    <div>
                      <label style={labelStyle}>
                        Website <span style={{ opacity: 0.5, fontSize: 9.5 }}>(optional)</span>
                      </label>
                      <input style={inputStyle} type="url" placeholder="https://" value={form.website} onChange={update("website")} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Which plan are you interested in?</label>
                    <select style={inputStyle} required value={form.plan} onChange={update("plan")}>
                      <option value="">Select a plan...</option>
                      <option value="foundation">Foundation — $49.50/mo (reg. $99)</option>
                      <option value="growth">Growth — $74.50/mo (reg. $149)</option>
                      <option value="scale">Scale — $124.50/mo (reg. $249)</option>
                      <option value="unsure">Not sure yet</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 28 }}>
                    <label style={labelStyle}>How did you hear about us?</label>
                    <select style={inputStyle} value={form.referral} onChange={update("referral")}>
                      <option value="">Select...</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="instagram">Instagram</option>
                      <option value="referral">A friend or colleague</option>
                      <option value="podcast">Podcast</option>
                      <option value="google">Google search</option>
                      <option value="event">An event</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {error && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: "rgba(212,98,42,0.12)",
                        border: "1px solid rgba(212,98,42,0.3)",
                        color: "#8a3a14",
                        fontSize: 13.5,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="b20-cta"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      width: "100%",
                      background: "#d4622a",
                      color: "#fff",
                      fontFamily: "'DM Sans Variable', sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      padding: "17px 24px",
                      borderRadius: 10,
                      border: "none",
                      cursor: submitting ? "not-allowed" : "pointer",
                      marginBottom: 16,
                      letterSpacing: "0.01em",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "Claiming your seat..." : "Claim Your Founding Seat"}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <div
                    style={{
                      textAlign: "center",
                      fontFamily: "'JetBrains Mono Variable', monospace",
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      color: "rgba(26,48,40,0.38)",
                      lineHeight: 1.55,
                    }}
                  >
                    Seats are capped &nbsp;·&nbsp; Price locks in at signup &nbsp;·&nbsp; No credit card required today
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 400 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: "rgba(212,98,42,0.12)",
                    border: "1.5px solid rgba(212,98,42,0.35)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 28,
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M5 14l7 7 11-12" stroke="#d4622a" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono Variable', monospace",
                    fontSize: 10.5,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#d4622a",
                    marginBottom: 14,
                  }}
                >
                  You are on the list
                </div>
                <h2
                  style={{
                    fontFamily: "'Fraunces Variable', serif",
                    fontWeight: 600,
                    fontSize: 36,
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    margin: "0 0 14px",
                    color: "#1a3028",
                  }}
                >
                  You are in the founding round.
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.65, color: "rgba(26,48,40,0.6)", maxWidth: 380, margin: "0 0 28px" }}>
                  You are on the list. We will reach out the moment Beta 2.0 founding access opens, before it is available to anyone else.
                </p>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono Variable', monospace",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    color: "rgba(26,48,40,0.3)",
                    textTransform: "uppercase",
                  }}
                >
                  Spots are limited. Welcome to the founding round.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}

function TierRow({ name, founding, standard, highlight }: { name: string; founding: string; standard: string; highlight?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: highlight ? "rgba(184,137,58,0.14)" : "rgba(255,255,255,0.28)",
        border: highlight ? "1px solid rgba(184,137,58,0.3)" : "1px solid rgba(26,48,40,0.1)",
        borderRadius: 10,
        padding: "13px 18px",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "'JetBrains Mono Variable', monospace",
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: highlight ? "#8a6620" : "rgba(26,48,40,0.45)",
            marginBottom: 3,
          }}
        >
          {name}
        </div>
        <div style={{ fontFamily: "'Fraunces Variable', serif", fontSize: 22, fontWeight: 700, color: "#1a3028", lineHeight: 1 }}>
          {founding}
          <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(26,48,40,0.45)", fontFamily: "'DM Sans Variable', sans-serif" }}>/mo</span>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "'JetBrains Mono Variable', monospace", fontSize: 11, color: "rgba(26,48,40,0.3)", textDecoration: "line-through", letterSpacing: "0.04em" }}>
          {standard}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono Variable', monospace", fontSize: 10, letterSpacing: "0.1em", color: "#b8893a", marginTop: 3 }}>
          50% OFF
        </div>
      </div>
    </div>
  );
}