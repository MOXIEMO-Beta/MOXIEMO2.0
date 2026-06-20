import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ZOOM_LINK = "https://scheduler.zoom.us/klmg-ltd/moxie-beta-kickoff";

const fontsHref =
  "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Newsreader:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "#fafaf6",
  border: "1px solid rgba(19,19,15,0.12)",
  borderRadius: 10,
  fontFamily: "'Hanken Grotesk', sans-serif",
  fontSize: 15,
  color: "#13130f",
  outline: "none",
  transition: "border-color .15s, background .15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10.5,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#8a877a",
  marginBottom: 7,
};

export default function Founding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // form state — preserves the exact join-waitlist contract
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [referral, setReferral] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<null | "already_registered" | "generic">(null);

  useEffect(() => {
    if (user) {
      toast.message("You already have a MOXIE account.");
      navigate("/app");
    }
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !email.trim() || !role) {
      setError("generic");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("join-waitlist", {
        body: {
          name: firstName.trim(),
          email: email.trim().toLowerCase(),
          role,
          website_url: website.trim() || null,
          company_name: company.trim() || null,
          referral_source: referral || null,
        },
      });
      let bodyError: string | undefined = (data as any)?.error;
      if (invokeError) {
        try {
          const ctx: any = (invokeError as any).context;
          if (ctx && typeof ctx.json === "function") {
            const parsed = await ctx.json();
            bodyError = parsed?.error ?? bodyError;
          } else if (ctx && typeof ctx.text === "function") {
            const txt = await ctx.text();
            try { bodyError = JSON.parse(txt)?.error ?? bodyError; } catch { bodyError = txt || bodyError; }
          }
        } catch { /* ignore */ }
      }
      if (typeof bodyError === "string" && bodyError.includes("already_registered")) {
        setError("already_registered");
        return;
      }
      if (invokeError) {
        setError("generic");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("generic");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: "#f4efe5", minHeight: "100vh" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={fontsHref} />
      <style>{`
        .fm-input:focus { border-color: #ef6f53 !important; background: #fff !important; }
        .fm-cta:hover { background: #d45e44 !important; }
        .fm-signin:hover { text-decoration: underline; }
      `}</style>

      <SiteHeader />

      <div style={{ position: "relative", fontFamily: "'Hanken Grotesk', sans-serif", WebkitFontSmoothing: "antialiased" as any }}>
        {/* GRAIN */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            opacity: 0.4,
            mixBlendMode: "multiply",
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%222%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.45%22/%3E%3C/svg%3E')",
            backgroundSize: "200px",
          }}
        />

        <main
          style={{
            padding: "72px 24px 100px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11.5,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#8a877a",
              marginBottom: 28,
              background: "rgba(239,111,83,0.09)",
              border: "1px solid rgba(239,111,83,0.22)",
              padding: "8px 18px",
              borderRadius: 999,
            }}
          >
            <span style={{ width: 6, height: 6, background: "#ef6f53", borderRadius: "50%", display: "inline-block" }} />
            PRIVATE BETA &nbsp;·&nbsp; LIMITED SPOTS
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "'Newsreader', serif",
              fontWeight: 600,
              fontSize: "clamp(42px,6vw,72px)",
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              margin: "0 0 20px",
              color: "#13130f",
              textAlign: "center",
            }}
          >
            Join as a Private Beta
            <br />
            <span style={{ fontWeight: 300, fontStyle: "italic", color: "#ef6f53" }}>Founding Member.</span>
          </h1>

          {/* Subhead */}
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.65,
              color: "#56544c",
              maxWidth: 520,
              margin: "0 0 52px",
              textAlign: "center",
              textWrap: "pretty" as any,
            }}
          >
            Join the private beta and get full platform access, free for as long as the private beta runs. We personally schedule a 1:1 kickoff call with every founding member before granting access.
          </p>

          {/* CARD */}
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 12px 56px -16px rgba(19,19,15,0.18)",
              border: "1px solid rgba(19,19,15,0.07)",
              width: "100%",
              maxWidth: 588,
            }}
          >
            {/* Coral header band */}
            <div style={{ background: "#ef6f53", padding: "26px 32px" }}>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.65)",
                  marginBottom: 10,
                }}
              >
                Private Beta Founding Member
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontFamily: "'Newsreader', serif", fontSize: 30, fontWeight: 600, color: "#fff", lineHeight: 1.15 }}>
                  Free during private beta.
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em" }}>
                  1:1 kickoff call included
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div style={{ padding: "22px 32px 20px", borderBottom: "1px solid rgba(19,19,15,0.07)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "Founding Member access, free for as long as private beta runs",
                  "Personal 1:1 kickoff call with Karee before you start",
                  "First access to new features before public release",
                  "Direct line to the team during your first 30 days",
                  "A direct offer to Beta 2.0 founding access at 50 percent off for life, before it opens to anyone else",
                ].map((perk) => (
                  <div key={perk} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" style={{ flex: "none", marginTop: 2 }}>
                      <path d="M3 8.5l3.5 3.5 7.5-8" stroke="#ef6f53" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: 14.5, color: "#3a382f", lineHeight: 1.4 }}>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* FORM / SUCCESS */}
            {!submitted ? (
              <div style={{ padding: "28px 32px 32px" }}>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>First name</label>
                      <input
                        className="fm-input"
                        style={inputStyle}
                        type="text"
                        name="firstName"
                        placeholder="Jane"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input
                        className="fm-input"
                        style={inputStyle}
                        type="email"
                        name="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>What best describes you?</label>
                    <select
                      className="fm-input"
                      style={inputStyle}
                      name="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    >
                      <option value="">Select one...</option>
                      <option value="Founder">Founder / CEO</option>
                      <option value="Consultant">Consultant</option>
                      <option value="Agency Owner">Agency Owner</option>
                      <option value="Executive or Business Coach">Executive or Business Coach</option>
                      <option value="Course Creator">Course Creator</option>
                      <option value="Service Business Owner">Service Business Owner</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={labelStyle}>
                        Company name <span style={{ opacity: 0.5, fontSize: 9.5 }}>(optional)</span>
                      </label>
                      <input
                        className="fm-input"
                        style={inputStyle}
                        type="text"
                        name="company"
                        placeholder="Acme Inc."
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>
                        Website <span style={{ opacity: 0.5, fontSize: 9.5 }}>(optional)</span>
                      </label>
                      <input
                        className="fm-input"
                        style={inputStyle}
                        type="url"
                        name="website"
                        placeholder="https://"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 28 }}>
                    <label style={labelStyle}>How did you hear about us?</label>
                    <select
                      className="fm-input"
                      style={inputStyle}
                      name="referral"
                      value={referral}
                      onChange={(e) => setReferral(e.target.value)}
                    >
                      <option value="">Select...</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Google search">Google search</option>
                      <option value="A friend or colleague">Referral from a friend</option>
                      <option value="Podcast">Podcast</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="fm-cta"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      width: "100%",
                      background: "#ef6f53",
                      color: "#fff",
                      fontFamily: "'Hanken Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      padding: "16px 24px",
                      borderRadius: 10,
                      border: "none",
                      cursor: submitting ? "wait" : "pointer",
                      marginBottom: 16,
                      opacity: submitting ? 0.7 : 1,
                      transition: "background .15s",
                    }}
                  >
                    {submitting ? "Joining..." : "Join the Founding Member waitlist"}
                    {!submitting && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  <div
                    style={{
                      textAlign: "center",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      color: "#9a9789",
                      marginBottom: 14,
                    }}
                  >
                    No credit card required &nbsp;·&nbsp; Free for as long as beta runs
                  </div>

                  {error === "already_registered" && (
                    <p style={{ fontSize: 13, textAlign: "center", color: "#56544c", background: "#faf6ef", border: "1px solid rgba(19,19,15,0.08)", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                      Looks like you're already on the list! Check your email for next steps, or{" "}
                      <Link to="/auth" style={{ color: "#ef6f53", fontWeight: 600 }}>sign in</Link>{" "}
                      if you already have access.
                    </p>
                  )}
                  {error === "generic" && (
                    <p style={{ fontSize: 13, textAlign: "center", color: "#b3402a", marginBottom: 12 }}>
                      Something went wrong. Please try again or email us at{" "}
                      <a href="mailto:questions@buildwithmoxiemo.com" style={{ color: "#ef6f53" }}>questions@buildwithmoxiemo.com</a>
                    </p>
                  )}

                  <div style={{ textAlign: "center", fontSize: 14, color: "#8a877a" }}>
                    Already have access?{" "}
                    <Link to="/auth" className="fm-signin" style={{ color: "#ef6f53", textDecoration: "none", fontWeight: 600 }}>
                      Sign in →
                    </Link>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ padding: "56px 32px", textAlign: "center" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 64,
                    height: 64,
                    background: "#fdf0eb",
                    borderRadius: "50%",
                    marginBottom: 24,
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M5 14l7 7 11-12" stroke="#ef6f53" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2
                  style={{
                    fontFamily: "'Newsreader', serif",
                    fontWeight: 600,
                    fontSize: 32,
                    lineHeight: 1.15,
                    letterSpacing: "-0.02em",
                    margin: "0 0 12px",
                    color: "#13130f",
                  }}
                >
                  You are in{firstName ? `, ${firstName.split(" ")[0]}` : ""}.
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.65, color: "#56544c", maxWidth: 380, margin: "0 auto 20px" }}>
                  Use the button below to book your personal 1:1 kickoff call with Karee. You will receive platform access after your call.
                </p>
                <a
                  href={ZOOM_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fm-cta"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    background: "#ef6f53",
                    color: "#fff",
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    padding: "14px 22px",
                    borderRadius: 10,
                    textDecoration: "none",
                    marginBottom: 24,
                    transition: "background .15s",
                  }}
                >
                  Schedule your kickoff call
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11.5,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#9a9789",
                  }}
                >
                  Spots are limited. Welcome to the founding round.
                </div>
              </div>
            )}
          </div>

          {/* Bottom note */}
          <p
            style={{
              marginTop: 28,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "#9a9789",
              textAlign: "center",
              maxWidth: 440,
              lineHeight: 1.6,
            }}
          >
            Access is by invitation only and is not guaranteed to remain open indefinitely. Founding Member access locks in 50% off Beta 2.0 pricing for life.
          </p>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}