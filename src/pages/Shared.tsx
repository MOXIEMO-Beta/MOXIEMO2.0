import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const INK = "#0E0F10";
const MUTED = "#6B6860";
const FAINT = "#9A9896";
const BORDER = "#ECEAE5";
const CORAL = "#E85A46";
const BG = "#FAFAF7";

type Payload = {
  document_type: "strategy" | "brand-kit" | "brand-audit";
  created_at: string;
  document: any;
};

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-document`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default function Shared() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "unavailable"; reason: string }
    | { kind: "ready"; data: Payload }
  >({ kind: "loading" });

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await fetch(`${FUNCTIONS_URL}?token=${encodeURIComponent(token)}`, {
          method: "GET",
          headers: {
            apikey: ANON_KEY,
            Authorization: `Bearer ${ANON_KEY}`,
          },
        });
        if (r.status === 404 || r.status === 410) {
          setState({ kind: "unavailable", reason: r.status === 410 ? "revoked" : "not_found" });
          return;
        }
        if (!r.ok) {
          setState({ kind: "unavailable", reason: "error" });
          return;
        }
        const data = (await r.json()) as Payload;
        setState({ kind: "ready", data });
      } catch {
        setState({ kind: "unavailable", reason: "error" });
      }
    })();
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <header style={{ borderBottom: `1px solid ${BORDER}`, background: "#fff" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/" style={{ fontSize: 14, fontWeight: 700, color: INK, textDecoration: "none" }}>MOXIEMO</Link>
          <span style={{ fontSize: 11, color: FAINT, textTransform: "uppercase", letterSpacing: "0.08em" }}>Shared document · Read-only</span>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        {state.kind === "loading" && <CenterCard title="Loading…" body="Fetching this shared document." />}
        {state.kind === "unavailable" && (
          <CenterCard
            title="This link is no longer available"
            body={state.reason === "revoked"
              ? "The owner has revoked access to this document."
              : "We couldn't find a document for this link."}
          />
        )}
        {state.kind === "ready" && <SharedDocument payload={state.data} />}
      </main>
    </div>
  );
}

function CenterCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: INK }}>{title}</div>
      <div style={{ fontSize: 14, color: MUTED, marginTop: 8 }}>{body}</div>
    </div>
  );
}

function SharedDocument({ payload }: { payload: Payload }) {
  if (payload.document_type === "brand-audit") return <SharedAudit doc={payload.document} />;
  if (payload.document_type === "strategy") return <SharedStrategy doc={payload.document} />;
  return <SharedKit doc={payload.document} />;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 24, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: FAINT, letterSpacing: "0.08em", marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  if (!value) return null;
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: FAINT, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: INK, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{text}</div>
    </div>
  );
}

function SharedAudit({ doc }: { doc: any }) {
  const report = doc?.report ?? doc?.raw_report ?? null;
  const score = doc?.brand_audit_score ?? report?.overall_score ?? null;
  const domain = doc?.domain ?? report?.domain ?? "";
  const sections: any[] = Array.isArray(report?.sections) ? report.sections : [];
  return (
    <>
      <div style={{ background: INK, borderRadius: 14, padding: "24px 28px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#5A5855", letterSpacing: "0.1em" }}>Brand Audit</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginTop: 6 }}>{domain || "Brand audit report"}</div>
        {score !== null && <div style={{ fontSize: 14, color: "#9A9896", marginTop: 4 }}>Overall score: {score}/100</div>}
      </div>
      {sections.length > 0 ? sections.map((s, i) => (
        <Section key={i} label={s.name ?? `Section ${i + 1}`}>
          {s.score !== undefined && (
            <div style={{ fontSize: 20, fontWeight: 700, color: CORAL, marginBottom: 8 }}>{s.score}/100</div>
          )}
          <Field label="Finding" value={s.finding} />
          <Field label="Evidence" value={s.evidence} />
          <Field label="Recommendation" value={s.recommendation} />
        </Section>
      )) : (
        <Section label="Report">
          <Field label="Report" value={report} />
        </Section>
      )}
    </>
  );
}

function SharedStrategy({ doc }: { doc: any }) {
  return (
    <>
      <div style={{ background: INK, borderRadius: 14, padding: "24px 28px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#5A5855", letterSpacing: "0.1em" }}>Brand Strategy</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginTop: 6 }}>Full Brand Strategy</div>
      </div>
      <Section label="Positioning">
        <Field label="Positioning Statement" value={doc?.positioning_statement} />
        <Field label="Ideal Client" value={doc?.ideal_client} />
        <Field label="Pain Point" value={doc?.pain_point} />
        <Field label="Transformation" value={doc?.transformation} />
        <Field label="Anti-Positioning" value={doc?.anti_positioning} />
      </Section>
      <Section label="Voice">
        <Field label="Voice Attributes" value={doc?.voice_attributes} />
        <Field label="Archetype" value={doc?.archetype} />
      </Section>
      <Section label="Content">
        <Field label="Content Pillars" value={doc?.content_pillars} />
        <Field label="Content Themes" value={doc?.content_themes} />
        <Field label="Primary Channel" value={doc?.primary_channel} />
        <Field label="Posting Frequency" value={doc?.posting_frequency} />
      </Section>
      <Section label="Goals">
        <Field label="Business Goal" value={doc?.business_goal} />
        <Field label="Success Definition" value={doc?.success_definition} />
        <Field label="Time Capacity" value={doc?.time_capacity} />
      </Section>
    </>
  );
}

function SharedKit({ doc }: { doc: any }) {
  const profile = doc?.profile ?? {};
  const strategy = doc?.strategy ?? {};
  const brandName = strategy?.business_name || profile?.business_name || profile?.full_name || "Brand Kit";
  const colors: string[] = Array.isArray(profile?.brand_colors) ? profile.brand_colors : [];
  const fonts: string[] = Array.isArray(profile?.brand_fonts) ? profile.brand_fonts : [];
  return (
    <>
      <div style={{ background: INK, borderRadius: 14, padding: "24px 28px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#5A5855", letterSpacing: "0.1em" }}>MOXIEMO Brand Guide</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginTop: 6 }}>{brandName}</div>
        <div style={{ fontSize: 12, color: "#9A9896", marginTop: 4 }}>Voice · Visual Direction · Key Messages</div>
      </div>
      <Section label="Voice">
        <Field label="Positioning" value={strategy?.positioning_statement} />
        <Field label="Voice Attributes" value={strategy?.voice_attributes} />
        <Field label="Content Pillars" value={strategy?.content_pillars} />
      </Section>
      <Section label="Ideal Client">
        <Field label="Ideal Client" value={strategy?.ideal_client} />
        <Field label="Pain Point" value={strategy?.pain_point} />
        <Field label="Transformation" value={strategy?.transformation} />
      </Section>
      <Section label="Visual Direction">
        {profile?.brand_logo_url && (
          <div style={{ marginBottom: 16 }}>
            <img src={profile.brand_logo_url} alt="Logo" style={{ maxHeight: 60 }} />
          </div>
        )}
        {colors.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {colors.map((c, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ height: 52, background: c, borderRadius: 8, border: `1px solid ${BORDER}` }} />
                <div style={{ fontSize: 11, color: MUTED, marginTop: 4, textAlign: "center" }}>{String(c).toUpperCase()}</div>
              </div>
            ))}
          </div>
        )}
        {fonts.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {fonts.map((f) => (
              <span key={f} style={{ background: "#F0EFEC", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: INK }}>{f}</span>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}